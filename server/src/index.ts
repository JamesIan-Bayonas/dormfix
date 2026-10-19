// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { configureSecureSockets } from './services/secureSockets';
import { requireSession } from './middleware/session';
import { approved } from './middleware/authorization';
import { privateFile } from './middleware/privateFiles';
import { chatRepository } from './repositories/chatRepository';
import { pool } from './config/dbConfig';

// Import Route Modules
import authRoutes from './routes/authRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import paymentRoutes from './routes/paymentRoutes';
import roomRoutes from './routes/roomRoutes';
import ruleRoutes from './routes/ruleRoutes';
import uploadRoutes from './routes/uploadRoutes';
import tenantRoutes from './routes/tenantRoutes';
import chatRoutes from './routes/chatRoutes';
import announcementRoutes from './routes/announcementRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
        if (isLocalhost || allowedOrigins.includes(origin)) {
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

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.get('/uploads/:filename', requireSession, approved, privateFile);

// Route Mounting
app.use('/api', authRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/landlord', roomRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api', tenantRoutes);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: error.message.startsWith('Choose a ') || error.message === 'File too large' ? error.message : 'The request could not be processed.' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
        },
        methods: ["GET", "POST", "PATCH", "DELETE"],
        credentials: true
    }
});

configureSecureSockets(io);

async function start() {
    try {
        await pool.query('SELECT 1');
        httpServer.listen(PORT, () => {
            console.log(`DormFix API connected to PostgreSQL and listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('PostgreSQL startup check failed:', error instanceof Error ? error.message : 'Unknown error');
        await pool.end();
        process.exitCode = 1;
    }
}

void start();

let shuttingDown = false;
async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    io.close(async () => {
        await pool.end();
        clearTimeout(timeout);
    });
}
process.on('SIGTERM', () => { void shutdown(); });
process.on('SIGINT', () => { void shutdown(); });
