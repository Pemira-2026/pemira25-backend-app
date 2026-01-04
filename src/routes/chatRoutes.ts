import express from 'express';
import { getChatSessions, updateSessionStatus, getChatStats } from '../controllers/chatController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Protected by Admin Guard
router.get('/sessions', authenticateAdmin, getChatSessions);
router.get('/stats', authenticateAdmin, getChatStats);
router.patch('/sessions/:id/status', authenticateAdmin, updateSessionStatus);

export default router;
