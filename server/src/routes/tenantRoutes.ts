import { requireSession } from '../middleware/session';
import { landlordOnly, tenantOnly, selfParam, selfBody, bindBody, tenantOwner } from '../middleware/authorization';
import express from 'express';
import { 
    approveTenant, 
    rejectTenant, 
    getTenantDetails, 
    getLandlordTenants, 
    updateUserStatus,
    relinkTenant
} from '../controllers/tenantController';

const router = express.Router();
router.use(requireSession);

// Landlord Actions
router.patch('/landlord/approve/:tenantId', tenantOwner('params','tenantId'), approveTenant);
router.delete('/landlord/reject/:tenantId', tenantOwner('params','tenantId'), rejectTenant);
router.get('/landlord/tenants/:landlordId', landlordOnly, selfParam('landlordId'), getLandlordTenants);

// Tenant Actions
router.get('/tenant/details/:tenantId', tenantOnly, selfParam('tenantId'), getTenantDetails);
router.post('/tenant/relink', tenantOnly, selfBody('tenantId'), bindBody('tenantId'), relinkTenant);

// Generic Actions
router.patch('/users/:id/status', tenantOwner('params','id'), updateUserStatus);

export default router;