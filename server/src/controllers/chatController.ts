// server/src/controllers/chatController.ts
import type { Request, Response } from 'express';
import { chatRepository } from '../repositories/chatRepository';

// 1. GET CHAT HISTORY BY ROOM
export const getChatHistory = async (req: Request, res: Response) => {
    const { roomId } = req.params;
    try {
        const history = await chatRepository.getHistoryByRoom(roomId);
        res.json(history);
    } catch (error) {
        console.error("Fetch Chat History Error:", error);
        res.status(500).json({ error: "Failed to load chat history" });
    }
};

// 2. GET USER PRESENCE & LAST SEEN
export const getUserPresence = async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const presence = await chatRepository.getUserPresence(userId);

        if (!presence) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.json(presence);
    } catch (error) {
        console.error("Fetch User Presence Error:", error);
        res.status(500).json({ error: "Failed to fetch user presence" });
    }
};