import { Router } from 'express';
import { login, register } from '../controllers/authController';

const router = Router();

router.post('/login', login as any); // Type assertion to bypass Express specific types issue if strictly typed
router.post('/register', register as any);

export default router;
