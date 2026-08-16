import express from 'express';
import { getChatHistory, getUserPresence } from '../controllers/chatController';

const router = express.Router();

router.get('/history/:roomId', getChatHistory);
router.get('/presence/:userId', getUserPresence);

export default router;