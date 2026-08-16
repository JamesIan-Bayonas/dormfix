import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';
import { poolPromise } from './config/dbConfig';
import sql from 'mssql';

// Import Route Modules
import authRoutes from './routes/authRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import paymentRoutes from './routes/paymentRoutes';
import roomRoutes from './routes/roomRoutes';
import ruleRoutes from './routes/ruleRoutes';
import uploadRoutes from './routes/uploadRoutes';
import tenantRoutes from './routes/tenantRoutes';
import chatRoutes from './routes/chatRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    "http://localhost:5173",
    "https://dormfix-jamesian-bayonas-projects.vercel.app",
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
        if (isLocalhost || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(express.json());    
app.use(cors(corsOptions));

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Route Mounting
app.use('/api', authRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/landlord', roomRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', tenantRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
        },
        methods: ["GET", "POST", "PATCH", "DELETE"],
        credentials: true
    }
});

// Presence State: userId -> socketId
const onlineUsers = new Map<string, string>();
const socketToUser = new Map<string, string>();

io.on('connection', (socket) => {
    // 1. User Registration on Initial Entry
    socket.on('register_user', async (userId: string) => {
        if (!userId) return;

        onlineUsers.set(userId, socket.id);
        socketToUser.set(socket.id, userId);

        try {
            const pool = await poolPromise;
            await pool.request()
                .input('uid', sql.VarChar(36), userId)
                .query(`UPDATE users SET last_seen = GETDATE() WHERE id = @uid`);
        } catch (err) {
            console.error("Failed to update user login last_seen", err);
        }

        // Broadcast presence change to all clients
        io.emit('user_presence_update', {
            userId,
            isOnline: true,
            lastSeen: new Date()
        });
    });

    // 2. Query specific presence states
    socket.on('check_presence', (userId: string) => {
        const isOnline = onlineUsers.has(userId);
        socket.emit('presence_status', { userId, isOnline });
    });

    // 3. Join Dedicated Chat Room
    socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
    });

    // 4. Send and Persist Message
    socket.on('send_message', async (data) => {
        const { roomId, senderId, recipientId, role, text } = data;
        if (!text || !senderId || !roomId) return;

        const messageId = crypto.randomUUID();
        const timestamp = new Date();

        try {
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.VarChar(36), messageId)
                .input('roomId', sql.VarChar(100), roomId)
                .input('senderId', sql.VarChar(36), senderId)
                .input('recipientId', sql.VarChar(36), recipientId || senderId)
                .input('role', sql.VarChar(20), role)
                .input('text', sql.NVarChar(sql.MAX), text)
                .query(`
                    INSERT INTO chat_messages (id, room_id, sender_id, recipient_id, sender_role, text, created_at)
                    VALUES (@id, @roomId, @senderId, @recipientId, @role, @text, GETDATE())
                `);
        } catch (err) {
            console.error("Failed to persist message:", err);
        }

        io.to(roomId).emit('receive_message', {
            id: messageId,
            senderId,
            role,
            text,
            timestamp
        });
    });

    // 5. Moderation Controls
    socket.on('toggle_mute', (data) => {
        const { roomId, status } = data;
        io.to(roomId).emit('chat_error', {
            message: status ? "Communication capabilities restricted by property management." : "Communication capabilities restored."
        });
    });

    // 6. Handle Disconnect & Record Last Seen
    socket.on('disconnect', async () => {
        const userId = socketToUser.get(socket.id);
        if (userId) {
            onlineUsers.delete(userId);
            socketToUser.delete(socket.id);

            const now = new Date();
            try {
                const pool = await poolPromise;
                await pool.request()
                    .input('uid', sql.VarChar(36), userId)
                    .query(`UPDATE users SET last_seen = GETDATE() WHERE id = @uid`);
            } catch (err) {
                console.error("Failed to update last_seen on disconnect", err);
            }

            io.emit('user_presence_update', {
                userId,
                isOnline: false,
                lastSeen: now
            });
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});