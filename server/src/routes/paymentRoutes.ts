import express from 'express';
import { upload } from '../middleware/uploadMiddleware.ts'; // Import your Multer config
import { 
    submitPayment, 
    getLandlordPayments, 
    getTenantHistory, 
    verifyPayment 
} from '../controllers/paymentController.ts'; // Note .ts extension

const router = express.Router();

// Define routes
// The middleware 'upload.single("proof")' handles the file logic before the controller runs
router.post('/', upload.single('proof'), submitPayment);

router.get('/landlord/:landlordId', getLandlordPayments);

router.get('/history/:tenantId', getTenantHistory);

router.patch('/:id/verify', verifyPayment);


export default router;