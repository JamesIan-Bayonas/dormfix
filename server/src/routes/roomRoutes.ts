import { requireSession } from '../middleware/session';
import { landlordOnly, selfParam, selfBody, bindBody, tenantOwner } from '../middleware/authorization';
import express from 'express';
import { getRooms, addRoom, assignTenant } from '../controllers/roomController';

const router = express.Router();
router.use(requireSession, landlordOnly);

// Base path coming in is: /api/landlord

// GET ROOMS -> Final URL: /api/landlord/rooms/:landlordId
router.get('/rooms/:landlordId', selfParam('landlordId'), getRooms);

// ADD ROOM -> Final URL: /api/landlord/rooms
router.post('/rooms', selfBody('landlordId'), bindBody('landlordId'), addRoom);

// ASSIGN TENANT -> Final URL: /api/landlord/assign
router.post('/assign', selfBody('landlordId'), bindBody('landlordId'), tenantOwner('body','tenantId'), assignTenant);

export default router;