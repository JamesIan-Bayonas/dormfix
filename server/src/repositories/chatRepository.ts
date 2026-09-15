// server/src/repositories/chatRepository.ts
import { pool } from '../config/dbConfig';

export interface ChatMessageRecord {
    id: string;
    roomId: string;
    senderId: string;
    recipientId: string;
    senderRole: string;
    text: string;
    timestamp: Date | string;
}

export interface UserPresenceRecord {
    id: string;
    name: string;
    lastSeen: Date | string | null;
}

export const chatRepository = {
    // 1. Get chat history by room ID
    getHistoryByRoom: async (roomId: string): Promise<ChatMessageRecord[]> => {

        const result = await pool.query(`
                SELECT 
                    id, 
                    room_id AS "roomId", 
                    sender_id AS "senderId", 
                    recipient_id AS "recipientId", 
                    sender_role AS "senderRole", 
                    text, 
                    created_at AS timestamp
                FROM chat_messages
                WHERE room_id = $1
                ORDER BY created_at ASC
            `, [roomId]);
        return result.rows;
    },

    // 2. Get user presence and last seen by user ID
    getUserPresence: async (userId: string): Promise<UserPresenceRecord | null> => {

        const result = await pool.query(`
                SELECT id, name, last_seen AS "lastSeen"
                FROM users
                WHERE id = $1
            `, [userId]);
        return result.rows[0] || null;
    },

    // 3. Persist incoming chat message
    saveMessage: async (
        id: string,
        roomId: string,
        senderId: string,
        recipientId: string,
        role: string,
        text: string
    ) => {

        await pool.query(`
                INSERT INTO chat_messages (id, room_id, sender_id, recipient_id, sender_role, text, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, now())
            `, [id, roomId, senderId, recipientId, role, text]);
    },

    // 4. Update user last seen timestamp
    updateUserLastSeen: async (userId: string) => {

        await pool.query(`UPDATE users SET last_seen = now() WHERE id = $1`, [userId]);
    }
};