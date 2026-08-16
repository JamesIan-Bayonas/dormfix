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

// Landlord Actions
router.patch('/landlord/approve/:tenantId', approveTenant);
router.delete('/landlord/reject/:tenantId', rejectTenant);
router.get('/landlord/tenants/:landlordId', getLandlordTenants);

// Tenant Actions
router.get('/tenant/details/:tenantId', getTenantDetails);
router.post('/tenant/relink', relinkTenant);

// Generic Actions
router.patch('/users/:id/status', updateUserStatus);

export default router;