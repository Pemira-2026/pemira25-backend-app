"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const adminAuth_1 = require("../middleware/adminAuth");
const upload_1 = require("../middleware/upload");
const XLSX = __importStar(require("xlsx"));
const actionLogger_1 = require("../utils/actionLogger");
const router = (0, express_1.Router)();
// Allow both Super Admin and Panitia for general routes
router.use(adminAuth_1.authenticateAdmin);
// ... (Import route logic is fine) ...
router.post('/import', upload_1.upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // ... import logic ...
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        let successCount = 0;
        let errorCount = 0;
        for (const row of data) {
            const nim = row['NIM'] || row['nim'];
            const name = row['Name'] || row['name'];
            const email = row['Email'] || row['email'];
            if (!nim) {
                errorCount++;
                continue;
            }
            try {
                const existing = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.nim, String(nim)));
                if (existing.length > 0) {
                    yield db_1.db.update(schema_1.users).set({
                        name: name || existing[0].name,
                        email: email || existing[0].email,
                        deletedAt: null // Restore if re-importing a soft deleted user
                    }).where((0, drizzle_orm_1.eq)(schema_1.users.nim, String(nim)));
                }
                else {
                    yield db_1.db.insert(schema_1.users).values({
                        nim: String(nim),
                        name: name || '',
                        email: email || null,
                        role: 'voter',
                        hasVoted: false
                    });
                }
                successCount++;
            }
            catch (err) {
                console.error(`Failed to process NIM ${nim}`, err);
                errorCount++;
            }
        }
        res.json({
            message: 'Import processed',
            total: data.length,
            success: successCount,
            errors: errorCount
        });
        yield (0, actionLogger_1.logAction)(req, 'IMPORT_STUDENTS', `Total: ${data.length}, Success: ${successCount}, Errors: ${errorCount}`);
    }
    catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Failed to process import file' });
    }
}));
// Create single student
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nim, name, email } = req.body;
    if (!nim || !name) {
        return res.status(400).json({ message: 'NIM and Name are required' });
    }
    try {
        // Check existing
        const existing = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.nim, String(nim)));
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Mahasiswa dengan NIM tersebut sudah ada (mungkin terhapus/soft deleted).' });
        }
        yield db_1.db.insert(schema_1.users).values({
            nim: String(nim),
            name,
            email: email || null,
            role: 'voter',
            hasVoted: false
        });
        res.status(201).json({ message: 'Mahasiswa berhasil ditambahkan' });
        yield (0, actionLogger_1.logAction)(req, 'CREATE_STUDENT', `NIM: ${nim}, Name: ${name}`);
    }
    catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ message: 'Gagal menambahkan mahasiswa' });
    }
}));
// Import students from Excel
// Get students (voters)
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, page = 1, limit = 50, includeDeleted } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const shouldIncludeDeleted = includeDeleted === 'true';
        // Note: Logic simplified for filtering. 
        // Ideally fetch only non-deleted unless requested
        const allStudents = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.role, 'voter'));
        // Manual filtering + Soft Delete Check
        const filtered = allStudents.filter(u => {
            var _a, _b, _c;
            return (shouldIncludeDeleted || u.deletedAt === null) && // Exclude soft deleted unless requested
                (!search ||
                    ((_a = u.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(String(search).toLowerCase())) ||
                    ((_b = u.nim) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(String(search).toLowerCase())) ||
                    ((_c = u.email) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(String(search).toLowerCase())));
        });
        const paginated = filtered.slice(offset, offset + Number(limit));
        res.json({
            data: paginated,
            total: filtered.length,
            page: Number(page),
            totalPages: Math.ceil(filtered.length / Number(limit))
        });
    }
    catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
// Mark student as attended
router.post('/mark-attendance', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nim } = req.body;
    if (!nim)
        return res.status(400).json({ message: 'NIM is required' });
    try {
        const userRes = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.nim, String(nim)));
        if (userRes.length === 0)
            return res.status(404).json({ message: 'Student not found' });
        const user = userRes[0];
        if (user.hasVoted)
            return res.status(400).json({ message: 'Student is already marked as voted' });
        if (user.deletedAt)
            return res.status(400).json({ message: 'Student is deleted' });
        yield db_1.db.update(schema_1.users)
            .set({ hasVoted: true, votedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        res.json({ message: `Student ${nim} marked as present/voted` });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to mark attendance' });
    }
}));
// Soft Delete Student (Super Admin Only)
router.delete('/:id', adminAuth_1.requireSuperAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield db_1.db.update(schema_1.users)
            .set({ deletedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        res.json({ message: 'Student deleted (soft)' });
        yield (0, actionLogger_1.logAction)(req, 'DELETE_STUDENT', `ID: ${id}`);
    }
    catch (error) {
        console.error('Delete error', error);
        res.status(500).json({ message: 'Failed to delete student' });
    }
}));
// Restore Student (Super Admin Only)
router.post('/:id/restore', adminAuth_1.requireSuperAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield db_1.db.update(schema_1.users)
            .set({ deletedAt: null })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        res.json({ message: 'Student restored successfully' });
        yield (0, actionLogger_1.logAction)(req, 'RESTORE_STUDENT', `ID: ${id}`);
    }
    catch (error) {
        console.error('Restore error', error);
        res.status(500).json({ message: 'Failed to restore student' });
    }
}));
// Permanent Delete Student (Super Admin Only)
router.delete('/:id/permanent', adminAuth_1.requireSuperAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        res.json({ message: 'Student deleted permanently' });
        yield (0, actionLogger_1.logAction)(req, 'PERMANENT_DELETE_STUDENT', `ID: ${id}`);
    }
    catch (error) {
        console.error('Permanent delete error', error);
        res.status(500).json({ message: 'Failed to permanently delete student' });
    }
}));
exports.default = router;
