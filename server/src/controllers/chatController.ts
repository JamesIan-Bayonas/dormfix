import type { Request, Response } from 'express';
import { poolPromise } from '../config/dbConfig';
import sql from 'mssql';

// 1. GET CHAT HISTORY BY ROOM
export const getChatHistory = async (req: Request, res: Response) => {
    const { roomId } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('roomId', sql.VarChar(100), roomId)
            .query(`
                SELECT 
                    id, 
                    room_id AS roomId, 
                    sender_id AS senderId, 
                    recipient_id AS recipientId, 
                    sender_role AS senderRole, 
                    text, 
                    created_at AS timestamp
                FROM chat_messages
                WHERE room_id = @roomId
                ORDER BY created_at ASC
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error("Fetch Chat History Error:", error);
        res.status(500).json({ error: "Failed to load chat history" });
    }
};

// 2. GET USER PRESENCE & LAST SEEN
export const getUserPresence = async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.VarChar(36), userId)
            .query(`
                SELECT id, name, last_seen AS lastSeen
                FROM users
                WHERE id = @userId
            `);

        if (result.recordset.length === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Fetch User Presence Error:", error);
        res.status(500).json({ error: "Failed to fetch user presence" });
    }
};