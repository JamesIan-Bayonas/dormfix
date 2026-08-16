import express from 'express';
import { submitMaintenance, getMaintenance, updateMaintenanceStatus } from '../controllers/maintenanceController';

const router = express.Router();

router.post('/', submitMaintenance);             // matches POST /api/maintenance
router.get('/:userId', getMaintenance);          // matches GET /api/maintenance/:userId
router.patch('/status/:id', updateMaintenanceStatus); // matches PATCH /api/maintenance/status/:id

export default router;