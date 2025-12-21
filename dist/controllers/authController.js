"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = exports.me = exports.manualOtpRequest = exports.resetOtpLimit = exports.verifyOtp = exports.requestOtp = exports.logout = exports.adminLogin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const mail_1 = require("../config/mail");
const emailQueue_1 = require("../queue/emailQueue");
const rateLimiter_1 = require("../utils/rateLimiter");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const actionLogger_1 = require("../utils/actionLogger");
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';
const adminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }
    try {
        const userRes = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        const user = userRes[0];
        // Check if user exists and is authorized (not a voter)
        if (!user || user.role === 'voter') {
            return res.status(401).json({ message: 'Invalid credentials or access denied' });
        }
        if (!user.password) {
            return res.status(401).json({ message: 'Account not configured for password login.' });
        }
        const validPass = yield bcryptjs_1.default.compare(password, user.password);
        if (!validPass) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
        // Set HttpOnly Cookie
        // Log action
        yield (0, actionLogger_1.logAction)(req, 'ADMIN_LOGIN', `Admin: ${user.name}`);
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: true, // Always true for cross-site (None)
            sameSite: 'none', // Required for cross-site (different Vercel domains)
            maxAge: 24 * 60 * 60 * 1000 // 24h
        });
        res.json({
            token,
            user: { id: user.id, email: user.email, role: user.role, name: user.name }
        });
    }
    catch (error) {
        console.error('Login error', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.adminLogin = adminLogin;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, actionLogger_1.logAction)(req, 'ADMIN_LOGOUT');
    res.clearCookie('admin_token');
    res.json({ message: 'Logged out' });
});
exports.logout = logout;
// Zod Schemas
const RequestOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format").refine((email) => email.endsWith("@student.nurulfikri.ac.id"), "Email harus menggunakan domain @student.nurulfikri.ac.id")
});
const VerifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format").refine((email) => email.endsWith("@student.nurulfikri.ac.id"), "Email harus menggunakan domain @student.nurulfikri.ac.id"),
    otp: zod_1.z.string().regex(/^\d{6}$/, "OTP must be 6 digits")
});
const requestOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = RequestOtpSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: validation.error.issues.map(i => i.message)
        });
    }
    const { email } = validation.data;
    try {
        // Check if user exists with this email
        const userResult = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        const user = userResult[0];
        if (!user) {
            return res.status(404).json({ message: 'Email tidak terdaftar dalam DPT (Daftar Pemilih Tetap)' });
        }
        if (user.hasVoted) {
            return res.status(403).json({ message: 'Anda sudah menggunakan hak pilih anda.' });
        }
        // Redis Rate Limiting (Max 3 requests per hour)
        const limitKey = `otp_limit:${email}`;
        const limitCheck = yield (0, rateLimiter_1.checkRateLimit)(limitKey, 3, 3600);
        if (!limitCheck.allowed) {
            return res.status(429).json({
                message: 'Batasan request OTP tercapai. Silakan hubungi IT Support.'
            });
        }
        // Redis Cooldown (1 request per 60 seconds)
        const cooldownKey = `otp_cooldown:${email}`;
        const cooldownCheck = yield (0, rateLimiter_1.checkRateLimit)(cooldownKey, 1, 60);
        if (!cooldownCheck.allowed) {
            return res.status(429).json({
                message: `Mohon tunggu ${cooldownCheck.ttl} detik sebelum mengirim ulang.`
            });
        }
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
        yield db_1.db.insert(schema_1.otpCodes).values({
            email,
            code: otp,
            expiresAt,
            createdAt: now
        });
        // Send Email Async via Queue
        yield (0, emailQueue_1.addOtpEmailJob)(email, otp, user.name || undefined);
        // if (!emailSent) {
        //      console.log(`[DEV ONLY] OTP for ${email}: ${otp}`);
        // }
        yield (0, actionLogger_1.logAction)(req, 'OTP_REQUEST', `Email: ${email}`);
        res.json({ message: 'OTP telah dikirim ke email anda' });
    }
    catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.requestOtp = requestOtp;
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = VerifyOtpSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: validation.error.issues.map(i => i.message)
        });
    }
    const { email, otp } = validation.data;
    try {
        // Find valid OTP
        const validOtps = yield db_1.db.select().from(schema_1.otpCodes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.otpCodes.email, email), (0, drizzle_orm_1.eq)(schema_1.otpCodes.code, otp), (0, drizzle_orm_1.gt)(schema_1.otpCodes.expiresAt, new Date())));
        if (validOtps.length === 0) {
            return res.status(400).json({ message: 'Kode OTP tidak valid atau sudah kadaluarsa' });
        }
        // Invalidate OTP (delete it)
        yield db_1.db.delete(schema_1.otpCodes).where((0, drizzle_orm_1.eq)(schema_1.otpCodes.email, email));
        // Get User - we know they exist from requestOtp, but let's be safe
        const userResult = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        const user = userResult[0];
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Generate Token
        const token = jsonwebtoken_1.default.sign({ id: user.id, nim: user.nim, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
        yield (0, actionLogger_1.logAction)(req, 'VOTE_LOGIN', `Voter: ${user.name} (${user.nim})`);
        res.json({
            token,
            user: {
                id: user.id,
                nim: user.nim,
                role: user.role,
                has_voted: user.hasVoted
            }
        });
    }
    catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.verifyOtp = verifyOtp;
const resetOtpLimit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ResetSchema = zod_1.z.object({
        email: zod_1.z.string().email("Invalid email format")
    });
    const validation = ResetSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: validation.error.issues.map(i => i.message)
        });
    }
    const { email } = validation.data;
    try {
        // Delete all OTP history for this email
        yield db_1.db.delete(schema_1.otpCodes).where((0, drizzle_orm_1.eq)(schema_1.otpCodes.email, email));
        res.json({ message: `Limit OTP untuk email ${email} berhasil di-reset. User bisa request OTP lagi.` });
        // ...
    }
    catch (error) {
        console.error('Reset limit error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.resetOtpLimit = resetOtpLimit;
const manualOtpRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { identifier } = req.body; // email or nim
    if (!identifier) {
        return res.status(400).json({ message: 'Identifier (Email or NIM) is required' });
    }
    try {
        // Find user by Email OR NIM
        const userRes = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, identifier), (0, drizzle_orm_1.eq)(schema_1.users.nim, identifier)));
        if (userRes.length === 0) {
            return res.status(404).json({ message: 'Student not found found' });
        }
        const user = userRes[0];
        const email = user.email;
        if (!email) {
            return res.status(400).json({ message: 'Student does not have an email registered' });
        }
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for manual
        // Save OTP
        yield db_1.db.insert(schema_1.otpCodes).values({
            email,
            code: otp,
            expiresAt
        });
        // Send Email
        const emailSent = yield (0, mail_1.sendOtpEmail)(email, otp, user.name || undefined);
        yield (0, actionLogger_1.logAction)(req, 'MANUAL_OTP', `Target: ${user.name} (${user.nim})`);
        res.json({
            message: `OTP manually triggered for ${user.name} (${email})`,
        });
    }
    catch (error) {
        console.error('Manual OTP Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
exports.manualOtpRequest = manualOtpRequest;
const me = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Req.user populated by middleware
    const userData = req.user;
    if (!userData)
        return res.status(401).json({ message: 'Not authenticated' });
    try {
        const userRes = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userData.id));
        const user = userRes[0];
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            nim: user.nim
        });
    }
    catch (error) {
        console.error('Me endpoint error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.me = me;
const seedAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = 'hi@oktaa.my.id';
    const password = 'oktaganteng12';
    try {
        // Check if exists
        const existing = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (existing.length > 0) {
            const hashed = yield bcryptjs_1.default.hash(password, 10);
            yield db_1.db.update(schema_1.users).set({ password: hashed, role: 'super_admin' }).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
            return res.json({ message: 'Admin seeded (updated)' });
        }
        const hashed = yield bcryptjs_1.default.hash(password, 10);
        yield db_1.db.insert(schema_1.users).values({
            nim: 'admin001',
            email,
            name: 'Super Admin',
            role: 'super_admin',
            password: hashed
        });
        res.json({ message: 'Admin seeded successfully. Email: hi@oktaa.my.id, Pass: oktaganteng12' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Seed failed', error: error.message, stack: error.stack });
    }
});
exports.seedAdmin = seedAdmin;
