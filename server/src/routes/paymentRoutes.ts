import express from 'express';
import { upload } from '../middleware/uploadMiddleware.ts'; // Import your Multer config
import { 
    processTenantPayment,
    getLandlordPayments, 
    getTenantHistory, 
    verifyPayment 
} from '../controllers/paymentController.ts'; 

const router = express.Router();

// Define routes

// AI & ZERO TRUST ROUTE
// 1. upload.single('proof') -> Multer grabs the GCash image and saves it to the /uploads folder.
// 2. processTenantPayment -> Runs Tesseract OCR, asks Ollama for structured data, audits it against the DB, and saves the verdict.
router.post('/', upload.single('proof'), processTenantPayment);

// --- STANDARD DASHBOARD ROUTES ---
router.get('/landlord/:landlordId', getLandlordPayments);

router.get('/history/:tenantId', getTenantHistory);

router.patch('/:id/verify', verifyPayment);


export default router;