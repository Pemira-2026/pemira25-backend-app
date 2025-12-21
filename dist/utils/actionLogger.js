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
exports.logAction = void 0;
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const logAction = (req, action, target, details) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        yield db_1.db.insert(schema_1.actionLogs).values({
            actorId: (user === null || user === void 0 ? void 0 : user.id) || null,
            actorName: (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.nim) || (user === null || user === void 0 ? void 0 : user.email) || 'System/Guest',
            action,
            target: target || null,
            details: details || null,
            ipAddress: Array.isArray(ip) ? ip[0] : ip || 'Unknown',
            userAgent: userAgent || null,
        });
    }
    catch (error) {
        console.error("Failed to log action:", error);
    }
});
exports.logAction = logAction;
