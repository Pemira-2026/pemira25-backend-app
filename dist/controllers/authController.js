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
exports.resetOtpLimit = exports.verifyOtp = exports.requestOtp = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const mail_1 = require("../config/mail");
const zod_1 = require("zod");
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';
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
        // Rate Limiting Logic
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentOtps = yield db_1.db.select().from(schema_1.otpCodes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.otpCodes.email, email), (0, drizzle_orm_1.gt)(schema_1.otpCodes.createdAt, oneHourAgo)));
        // 1. Strict Limit Check (Max 3 requests per hour)
        if (recentOtps.length >= 3) {
            return res.status(429).json({
                message: 'Batasan request OTP tercapai. Silakan hubungi IT Support.'
            });
        }
        // 2. Cooldown Check (60 seconds)
        if (recentOtps.length > 0) {
            // Get the latest OTP
            const latestOtp = recentOtps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
            const timeDiff = Date.now() - latestOtp.createdAt.getTime();
            if (timeDiff < 60000) {
                const remainingSeconds = Math.ceil((60000 - timeDiff) / 1000);
                return res.status(429).json({
                    message: `Mohon tunggu ${remainingSeconds} detik sebelum mengirim ulang.`
                });
            }
        }
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        // Save OTP to DB
        yield db_1.db.insert(schema_1.otpCodes).values({
            email,
            code: otp,
            expiresAt
        });
        // Send Email
        const emailSent = yield (0, mail_1.sendOtpEmail)(email, otp, user.name || undefined);
        if (!emailSent) {
            console.log(`[DEV ONLY] OTP for ${email}: ${otp}`);
        }
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
        const token = jsonwebtoken_1.default.sign({ id: user.id, nim: user.nim, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
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
    }
    catch (error) {
        console.error('Reset limit error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.resetOtpLimit = resetOtpLimit;
