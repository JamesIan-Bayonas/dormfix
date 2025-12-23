import { Router } from 'express';
import { submitPayment, getPayments, updatePaymentStatus, getTenantPayments } from '../controllers/paymentController';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.post('/submit', upload.single('proofImage'), submitPayment);
router.get('/landlord/:landlordId', getPayments);
router.get('/tenant/:tenantId', getTenantPayments);
router.patch('/:id/status', updatePaymentStatus);

export default router;