import express from 'express';
import { getRooms, addRoom, assignTenant } from '../controllers/roomController.ts';

const router = express.Router();

// Base path coming in is: /api/landlord

// GET ROOMS -> Final URL: /api/landlord/rooms/:landlordId
router.get('/rooms/:landlordId', getRooms); 

// ADD ROOM -> Final URL: /api/landlord/rooms
router.post('/rooms', addRoom);             

// ASSIGN TENANT -> Final URL: /api/landlord/assign
router.post('/assign', assignTenant);       

export default router;