import { Router } from 'express';
import {
     requestOtp,
     verifyOtp,
     resetOtpLimit,
     manualOtpRequest,
     adminLogin,
     logout,
     me,
     seedAdmin
} from '../controllers/authController';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

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
router.post('/admin-login', adminLogin as any);

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
router.post('/logout', logout as any);

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
router.get('/me', authenticateAdmin, me as any);

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
router.post('/seed', seedAdmin as any);

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
router.post('/otp-request', requestOtp as any);

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
router.post('/otp-verify', verifyOtp as any);

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
router.post('/reset-otp-limit', resetOtpLimit as any);

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
router.post('/manual-otp', authenticateAdmin, manualOtpRequest as any);

export default router;
