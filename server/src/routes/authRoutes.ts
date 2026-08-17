// server/src/routes/authRoutes.ts
import express from 'express';
import { login, register, updateUserProfile } from '../controllers/authController';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.patch('/profile/:id', updateUserProfile);

export default router;