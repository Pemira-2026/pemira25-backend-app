"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const adminAuth_1 = require("../middleware/adminAuth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and OTP management
 */
/**
 * @swagger
 * /api/auth/admin-login:
 *   post:
 *     summary: Login for Admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/admin-login', authController_1.adminLogin);
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout Admin
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authController_1.logout);
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged-in admin
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current admin details
 *       401:
 *         description: Unauthorized
 */
router.get('/me', adminAuth_1.authenticateAdmin, authController_1.me);
/**
 * @swagger
 * /api/auth/seed:
 *   post:
 *     summary: Seed initial admin account
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Admin seeded
 */
router.post('/seed', authController_1.seedAdmin);
/**
 * @swagger
 * /api/auth/otp-request:
 *   post:
 *     summary: Request OTP for student voting
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: Email not found
 */
router.post('/otp-request', authController_1.requestOtp);
/**
 * @swagger
 * /api/auth/otp-verify:
 *   post:
 *     summary: Verify OTP for student voting
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified, token returned
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/otp-verify', authController_1.verifyOtp);
/**
 * @swagger
 * /api/auth/reset-otp-limit:
 *   post:
 *     summary: Reset OTP limit for a specific email
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP limit reset
 */
router.post('/reset-otp-limit', authController_1.resetOtpLimit);
/**
 * @swagger
 * /api/auth/manual-otp:
 *   post:
 *     summary: Manually generate OTP (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Manual OTP generated
 */
router.post('/manual-otp', adminAuth_1.authenticateAdmin, authController_1.manualOtpRequest);
exports.default = router;
