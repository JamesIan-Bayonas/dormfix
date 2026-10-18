import { requireSession } from '../middleware/session';
import { approved, approvedTenant, assignedTenant, landlordOnly, selfParam, paymentOwner } from '../middleware/authorization';
import { paymentIdentity } from '../middleware/privateFiles';
import express from 'express';
import { upload } from '../middleware/uploadMiddleware'; // Import your Multer config
import { 
    processTenantPayment,
    getLandlordPayments, 
    getTenantHistory, 
    verifyPayment 
} from '../controllers/paymentController'; 

const router = express.Router();
router.use(requireSession, approved);

// Define routes

// AI & ZERO TRUST ROUTE
// 1. upload.single('proof') -> Multer grabs the GCash image and saves it to the /uploads folder.
// 2. processTenantPayment -> Runs Tesseract OCR, asks Ollama for structured data, audits it against the DB, and saves the verdict.
router.post('/', approvedTenant, assignedTenant, upload.single('proof'), paymentIdentity, processTenantPayment);

// --- STANDARD DASHBOARD ROUTES ---
router.get('/landlord/:landlordId', landlordOnly, selfParam('landlordId'), getLandlordPayments);

router.get('/history/:tenantId', approvedTenant, selfParam('tenantId'), getTenantHistory);

router.patch('/:id/verify', paymentOwner, verifyPayment);


export default router;