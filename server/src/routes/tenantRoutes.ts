import express from 'express';
import { 
    approveTenant, 
    rejectTenant, 
    getTenantDetails, 
    getLandlordTenants, 
    updateUserStatus 
} from '../controllers/tenantController';

const router = express.Router();

// Landlord Actions
router.patch('/landlord/approve/:tenantId', approveTenant);

router.delete('/landlord/reject/:tenantId', rejectTenant);

router.get('/landlord/tenants/:landlordId', getLandlordTenants);

// Tenant Actions
router.get('/tenant/details/:tenantId', getTenantDetails);

// Generic Actions
router.patch('/users/:id/status', updateUserStatus);


export default router;