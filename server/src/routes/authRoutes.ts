// server/src/routes/authRoutes.ts
import express from 'express';
import { selfParam } from '../middleware/authorization';
import { requireSession, revokeSession } from '../middleware/session';
import { login, register, updateUserProfile } from '../controllers/authController';

const router = express.Router();
router.post('/logout', requireSession, revokeSession);

router.post('/login', login);
router.post('/register', register);
router.patch('/profile/:id', requireSession, selfParam('id'), updateUserProfile);

export default router;
