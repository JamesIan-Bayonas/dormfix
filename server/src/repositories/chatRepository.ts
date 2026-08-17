// server/src/repositories/chatRepository.ts
import { sql, poolPromise } from '../config/dbConfig';

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
        return result.recordset;
    },

    // 2. Get user presence and last seen by user ID
    getUserPresence: async (userId: string): Promise<UserPresenceRecord | null> => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.VarChar(36), userId)
            .query(`
                SELECT id, name, last_seen AS lastSeen
                FROM users
                WHERE id = @userId
            `);
        return result.recordset[0] || null;
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
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('roomId', sql.VarChar(100), roomId)
            .input('senderId', sql.VarChar(36), senderId)
            .input('recipientId', sql.VarChar(36), recipientId)
            .input('role', sql.VarChar(20), role)
            .input('text', sql.NVarChar(sql.MAX), text)
            .query(`
                INSERT INTO chat_messages (id, room_id, sender_id, recipient_id, sender_role, text, created_at)
                VALUES (@id, @roomId, @senderId, @recipientId, @role, @text, GETDATE())
            `);
    },

    // 4. Update user last seen timestamp
    updateUserLastSeen: async (userId: string) => {
        const pool = await poolPromise;
        await pool.request()
            .input('uid', sql.VarChar(36), userId)
            .query(`UPDATE users SET last_seen = GETDATE() WHERE id = @uid`);
    }
};