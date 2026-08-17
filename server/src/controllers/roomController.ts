// server/src/controllers/roomController.ts
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { roomRepository } from '../repositories/roomRepository';

// 1. GET ROOMS (Landlord)
export const getRooms = async (req: Request, res: Response) => {
    const { landlordId } = req.params;

    try {
        const rooms = await roomRepository.getByLandlord(landlordId);
        res.json(rooms);
    } catch (error) {
        console.error("Fetch Rooms Error:", error);
        res.status(500).json({ error: "Failed to fetch rooms" });
    }
};

// 2. ADD ROOM
export const addRoom = async (req: Request, res: Response) => {
    const { landlordId, roomNumber, capacity } = req.body;

    if (!landlordId || !roomNumber) {
         res.status(400).json({ error: "Missing required fields" });
         return;
    }

    try {
        const existingRoom = await roomRepository.findRoom(landlordId, roomNumber);

        if (existingRoom) {
             res.status(400).json({ error: "Room number already exists" });
             return;
        }

        const id = crypto.randomUUID();
        await roomRepository.create(id, landlordId, roomNumber, capacity || 1);

        res.status(201).json({ message: "Room added successfully" });
    } catch (error) {
        console.error("Add Room Error:", error);
        res.status(500).json({ error: "Failed to add room" });
    }
};

// 3. ASSIGN TENANT (Transactional, Upsert & Safe)
export const assignTenant = async (req: Request, res: Response) => {
    const { tenantId, landlordId, roomNumber, moveInDate } = req.body;

    if (!tenantId || !landlordId || !roomNumber) {
         res.status(400).json({ error: "Missing required fields" });
         return;
    }

    try {
        await roomRepository.assignTenantTransaction(tenantId, landlordId, roomNumber, moveInDate);
        res.json({ message: "Tenant assigned successfully" });
    } catch (error: any) {
        console.error("Assignment Error:", error);
        res.status(400).json({ error: error.message || "Failed to assign room" });
    }
};