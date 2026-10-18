import { requireSession } from '../middleware/session';
import { approved, approvedTenant, assignedTenant, selfParam, selfBody, bindBody, maintenanceOwner } from '../middleware/authorization';
import express from 'express';
import { submitMaintenance, getMaintenance, updateMaintenanceStatus } from '../controllers/maintenanceController';

const router = express.Router();
router.use(requireSession, approved);

router.post('/', approvedTenant, assignedTenant, selfBody('tenantId'), bindBody('tenantId'), submitMaintenance);             // matches POST /api/maintenance
router.get('/:userId', selfParam('userId'), getMaintenance);          // matches GET /api/maintenance/:userId
router.patch('/status/:id', maintenanceOwner, updateMaintenanceStatus); // matches PATCH /api/maintenance/status/:id

export default router;