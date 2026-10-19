import { requireSession } from '../middleware/session';
import { approved, permit } from '../middleware/authorization';
import { conversationFor, canSeePresence } from '../services/chatAccess';
import express from 'express';
import { getChatHistory, getUserPresence } from '../controllers/chatController';

const router = express.Router();
router.use(requireSession, approved);

router.get('/history/:roomId', permit(async (req, actor) => !!await conversationFor(actor, req.params.roomId)), getChatHistory);
router.get('/presence/:userId', permit((req, actor) => canSeePresence(actor, req.params.userId)), getUserPresence);

export default router;