// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http'; // 🛡️ Wrapped HTTP layer for WebSocket bindings
import { Server } from 'socket.io';   // 🛡️ Socket.io integration engine

// Import Route Modules
import authRoutes from './routes/authRoutes.ts';
import maintenanceRoutes from './routes/maintenanceRoutes.ts';
import paymentRoutes from './routes/paymentRoutes.ts';
import roomRoutes from './routes/roomRoutes.ts';
import ruleRoutes from './routes/ruleRoutes.ts';
import uploadRoutes from './routes/uploadRoutes.ts';
import tenantRoutes from './routes/tenantRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = 5000;

// Global Middleware
app.use(express.json());    
app.use(cors());

// Static Files (Uploads)
const uploadDir = path.join(__dirname, '../uploads');
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

// 🛡️ INTERCEPT AND RE-ROUTE EXPRESS VIA SERVER WRAPPER
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // Allow connection links from Vite server
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
});

// 🤖 CORE REAL-TIME WEBSOCKET ROUTING LIFECYCLE ENGINE
io.on('connection', (socket) => {
    console.log(`🔌 Real-Time Pipeline Open: Connection Verified for Socket ID [${socket.id}]`);

    // Tenant and Landlord Client Room Isolation Binding
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`🔒 Channel Routing: Socket [${socket.id}] joined isolated Chat Room [${roomId}]`);
    });

    // Message Packet Interception & Broadcast Loop
    socket.on('send_message', (data) => {
        const { roomId, senderId, role, text } = data;
        
        console.log(`📩 Message Packet Dispatched inside Room [${roomId}] from Role [${role}]`);
        
        // Broadcast packet back to everyone connected to the current isolated room instance
        io.to(roomId).emit('receive_message', {
            senderId,
            role,
            text,
            timestamp: new Date()
        });
    });

    // Administrative Client Restriction Handlers
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

// Start Wrapped HTTP Server Instance instead of raw Express listener
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});