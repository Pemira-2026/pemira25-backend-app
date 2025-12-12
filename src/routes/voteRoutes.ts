import { Router } from 'express';
import { vote, getVoteStatus, getStats, getResults } from '../controllers/voteController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticateToken as any, vote as any);
router.get('/status', authenticateToken as any, getVoteStatus as any);
router.get('/stats', getStats as any); // Public
router.get('/results', getResults as any); // Public

export default router;
