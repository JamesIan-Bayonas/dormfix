import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import New Route Modules
import authRoutes from './routes/authRoutes.ts';
import maintenanceRoutes from './routes/maintenanceRoutes.ts';
import paymentRoutes from './routes/paymentRoutes.ts';
import roomRoutes from './routes/roomRoutes.ts';
import ruleRoutes from './routes/ruleRoutes.ts';
import uploadRoutes from './routes/uploadRoutes.ts';
import tenantRoutes from './routes/tenantRoutes.ts'; // NEW

// ESM Directory Fix
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

// Auth: /api/login, /api/register
app.use('/api', authRoutes);

// Maintenance: /api/maintenance/...
app.use('/api/maintenance', maintenanceRoutes);

// Payments: /api/payments/...
app.use('/api/payments', paymentRoutes);

// Rooms: /api/landlord/rooms...
app.use('/api/landlord', roomRoutes);

// Rules: /api/rules/...
app.use('/api/rules', ruleRoutes);

// Uploads: /api/upload
app.use('/api/upload', uploadRoutes);

// Tenant Management: /api/landlord/approve..., /api/tenant/details...
// We mount this at '/api' because the router file handles the specific sub-paths
app.use('/api', tenantRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});