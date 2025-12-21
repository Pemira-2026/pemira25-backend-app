"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = exports.authenticateAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';
const authenticateAdmin = (req, res, next) => {
    let token = req.cookies.admin_token;
    if (!token) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Forbidden: Invalid token' });
        }
        // Role Check
        if (decoded.role === 'voter') {
            return res.status(403).json({ error: 'Forbidden: Voters cannot access admin area' });
        }
        req.user = decoded;
        next();
    });
};
exports.authenticateAdmin = authenticateAdmin;
const requireSuperAdmin = (req, res, next) => {
    var _a;
    const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
    if (role !== 'super_admin') {
        return res.status(403).json({ error: 'Forbidden: Requires Super Admin' });
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
