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

router.post('/admin-login', adminLogin as any);
router.post('/logout', logout as any);
router.get('/me', authenticateAdmin, me as any);
router.post('/seed', seedAdmin as any);

router.post('/otp-request', requestOtp as any);
router.post('/otp-verify', verifyOtp as any);
router.post('/reset-otp-limit', resetOtpLimit as any);
router.post('/manual-otp', authenticateAdmin, manualOtpRequest as any);

export default router;
