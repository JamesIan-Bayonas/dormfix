import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import Route Modules
import authRoutes from './routes/authRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import paymentRoutes from './routes/paymentRoutes';
import roomRoutes from './routes/roomRoutes';
import ruleRoutes from './routes/ruleRoutes';
import uploadRoutes from './routes/uploadRoutes';
import tenantRoutes from './routes/tenantRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Exact production origin list (NO trailing slashes)
const allowedOrigins = [
    "http://localhost:5173",
    "https://dormfix-jamesian-bayonas-projects.vercel.app",
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, server-to-server, mobile)
        if (!origin) return callback(null, true);
        
        // Allow explicitly listed origins or any Vercel preview build (*.vercel.app)
        if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

// Global Middleware
app.use(express.json());    
app.use(cors(corsOptions));

// Static Files (Uploads)
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
app.use('/api', tenantRoutes);

// Wrapped HTTP layer for WebSocket bindings
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
        },
        methods: ["GET", "POST", "PATCH", "DELETE"],
        credentials: true
    }
});

// Real-Time WebSocket Lifecycle Engine
io.on('connection', (socket) => {
    console.log(`🔌 Real-Time Pipeline Open: Connection Verified for Socket ID [${socket.id}]`);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`🔒 Channel Routing: Socket [${socket.id}] joined isolated Chat Room [${roomId}]`);
    });

    socket.on('send_message', (data) => {
        const { roomId, senderId, role, text } = data;
        
        console.log(`📩 Message Packet Dispatched inside Room [${roomId}] from Role [${role}]`);
        
        io.to(roomId).emit('receive_message', {
            senderId,
            role,
            text,
            timestamp: new Date()
        });
    });

    socket.on('toggle_mute', (data) => {
        const { roomId, status } = data;
        io.to(roomId).emit('chat_error', {
            message: status ? "Communication capabilities restricted by property management." : "Communication capabilities restored."
        });
    });

    socket.on('disconnect', () => {
        console.log(`❌ Pipeline Terminated: Connection Closed for Socket ID [${socket.id}]`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});