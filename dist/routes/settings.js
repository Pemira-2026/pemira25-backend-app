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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminAuth_1 = require("../middleware/adminAuth");
const actionLogger_1 = require("../utils/actionLogger");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: System settings
 */
/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: System settings
 *       500:
 *         description: Internal Server Error
 */
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settings = yield db_1.db.select().from(schema_1.systemSettings).limit(1);
        if (settings.length === 0) {
            // Create default settings if not exists
            const defaultSettings = yield db_1.db.insert(schema_1.systemSettings).values({
                isVoteOpen: false,
                showAnnouncement: false
            }).returning();
            res.json(defaultSettings[0]);
            return;
        }
        res.json(settings[0]);
    }
    catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
// PUT /api/settings (Admin only)
router.put('/', authMiddleware_1.authenticateToken, adminAuth_1.requireSuperAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { isVoteOpen, startDate, endDate, announcementMessage, showAnnouncement } = req.body;
        const existing = yield db_1.db.select().from(schema_1.systemSettings).limit(1);
        if (existing.length === 0) {
            const newSettings = yield db_1.db.insert(schema_1.systemSettings).values({
                isVoteOpen,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                announcementMessage,
                showAnnouncement
            }).returning();
            res.json(newSettings[0]);
        }
        else {
            const updatedSettings = yield db_1.db.update(schema_1.systemSettings)
                .set({
                isVoteOpen,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                announcementMessage,
                showAnnouncement,
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.systemSettings.id, existing[0].id))
                .returning();
            // Log Activity
            yield (0, actionLogger_1.logAction)(req, "UPDATE_SETTINGS", "System Settings", `Updated settings. Vote Open: ${isVoteOpen}, Announcement: ${showAnnouncement}`);
            res.json(updatedSettings[0]);
        }
    }
    catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
exports.default = router;
