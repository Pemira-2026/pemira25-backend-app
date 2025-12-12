import { Router } from 'express';
import { getCandidates } from '../controllers/candidateController';

const router = Router();

router.get('/', getCandidates as any);

export default router;
