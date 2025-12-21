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
const express_1 = require("express");
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const adminAuth_1 = require("../middleware/adminAuth");
const bcrypt_1 = __importDefault(require("bcrypt"));
const actionLogger_1 = require("../utils/actionLogger");
const router = (0, express_1.Router)();
router.use(adminAuth_1.authenticateAdmin, adminAuth_1.requireSuperAdmin);
router.get('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.db.select().from(schema_1.users);
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
router.patch('/users/:id/role', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { role, password } = req.body; // 'voter', 'panitia', 'super_admin'
    if (!['voter', 'panitia', 'super_admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    try {
        const updateData = { role };
        // If password is provided (e.g. promoting a student to admin), hash and set it
        if (password) {
            const salt = yield bcrypt_1.default.genSalt(10);
            updateData.password = yield bcrypt_1.default.hash(password, salt);
        }
        const [updatedUser] = yield db_1.db.update(schema_1.users)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(updatedUser);
        const actionType = role === 'panitia' ? 'PROMOTE_COMMITTEE' : (role === 'voter' ? 'DEMOTE_COMMITTEE' : 'UPDATE_ROLE');
        yield (0, actionLogger_1.logAction)(req, actionType, `User: ${updatedUser.name} (${updatedUser.nim}), To: ${role}`);
    }
    catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
}));
// Get Action Logs (Super Admin Only)
router.get('/logs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 50, search, action } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const conditions = [];
        if (search) {
            const searchStr = `%${search}%`;
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.actionLogs.actorName, searchStr), (0, drizzle_orm_1.ilike)(schema_1.actionLogs.target, searchStr), (0, drizzle_orm_1.ilike)(schema_1.actionLogs.details, searchStr)));
        }
        if (action && action !== 'ALL') {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.actionLogs.action, String(action)));
        }
        const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
        const logs = yield db_1.db.select()
            .from(schema_1.actionLogs)
            .where(whereClause)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.actionLogs.timestamp))
            .limit(Number(limit))
            .offset(offset);
        const totalRes = yield db_1.db.select({ count: schema_1.actionLogs.id })
            .from(schema_1.actionLogs)
            .where(whereClause);
        const total = totalRes.length;
        res.json({
            data: logs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total
            }
        });
    }
    catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
exports.default = router;
