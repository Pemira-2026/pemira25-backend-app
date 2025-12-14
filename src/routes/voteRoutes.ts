import { Router } from 'express';
import { vote, getVoteStatus, getStats, getResults } from '../controllers/voteController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticateToken as any, vote as any);
router.get('/status', authenticateToken as any, getVoteStatus as any);
router.get('/stats', getStats as any); // Public
router.get('/stats', getStats as any); // Public
router.get('/results', getResults as any); // Public

import { authenticateAdmin, requireSuperAdmin } from '../middleware/adminAuth';
import { manualVote, getRecentActivity, deleteVote } from '../controllers/voteController';

// Offline/Manual Vote (Admin Only)
router.post('/offline', authenticateAdmin, manualVote as any);
router.get('/activity', authenticateAdmin, getRecentActivity as any); // Protected
router.delete('/:id', authenticateAdmin, requireSuperAdmin, deleteVote as any); // Super Admin Only, with 1 min check

export default router;
