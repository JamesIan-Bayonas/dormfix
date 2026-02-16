import type { Request, Response } from 'express';
import { poolPromise } from '../config/dbConfig.ts';
import sql from 'mssql';
import crypto from 'crypto';

// 1. GET ROOMS (Landlord)
export const getRooms = async (req: Request, res: Response) => {
    const { landlordId } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('landlordId', sql.VarChar(36), landlordId)
            .query(`
                SELECT 
                    r.id, 
                    r.room_number, 
                    r.capacity,
                    (SELECT COUNT(*) 
                     FROM dorm_assignments da 
                     WHERE da.room_number = r.room_number 
                     AND da.landlord_id = r.landlord_id) as currentOccupants
                FROM rooms r
                WHERE r.landlord_id = @landlordId
                ORDER BY r.room_number ASC
            `);
        
        res.json(result.recordset);
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
        const pool = await poolPromise;
        
        // Check for duplicate room number for this landlord
        const check = await pool.request()
            .input('lid', sql.VarChar(36), landlordId)
            .input('rnum', sql.VarChar(50), roomNumber)
            .query("SELECT id FROM rooms WHERE landlord_id = @lid AND room_number = @rnum");

        if (check.recordset.length > 0) {
             res.status(400).json({ error: "Room number already exists" });
             return;
        }

        const id = crypto.randomUUID();
        
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('landlordId', sql.VarChar(36), landlordId)
            .input('roomNumber', sql.VarChar(50), roomNumber)
            .input('capacity', sql.Int, capacity || 1)
            .query(`
                INSERT INTO rooms (id, landlord_id, room_number, capacity)
                VALUES (@id, @landlordId, @roomNumber, @capacity)
            `);

        res.status(201).json({ message: "Room added successfully" });
    } catch (error) {
        console.error("Add Room Error:", error);
        res.status(500).json({ error: "Failed to add room" });
    }
};

// 3. ASSIGN TENANT (Transactional & Safe)
export const assignTenant = async (req: Request, res: Response) => {
    const { tenantId, landlordId, roomNumber, moveInDate } = req.body;

    if (!tenantId || !landlordId || !roomNumber) {
         res.status(400).json({ error: "Missing required fields" });
         return;
    }

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            // Check capacity
            const roomCheck = await transaction.request()
                .input('lid', sql.VarChar(36), landlordId)
                .input('rnum', sql.VarChar(50), roomNumber)
                .query(`SELECT capacity FROM rooms WHERE landlord_id = @lid AND room_number = @rnum`);

            if (roomCheck.recordset.length === 0) {
                throw new Error("Room does not exist.");
            }
            const capacity = roomCheck.recordset[0].capacity;

            const countCheck = await transaction.request()
                .input('lid', sql.VarChar(36), landlordId)
                .input('rnum', sql.VarChar(50), roomNumber)
                .query(`SELECT COUNT(*) as count FROM dorm_assignments WHERE landlord_id = @lid AND room_number = @rnum`);
            
            if (countCheck.recordset[0].count >= capacity) {
                throw new Error("Room is already at full capacity.");
            }

            // Create Assignment
            const id = crypto.randomUUID();
            await transaction.request()
                .input('id', sql.VarChar(36), id)
                .input('tenantId', sql.VarChar(36), tenantId)
                .input('landlordId', sql.VarChar(36), landlordId)
                .input('roomNumber', sql.VarChar(50), roomNumber)
                .input('moveInDate', sql.Date, moveInDate || new Date())
                .query(`
                    INSERT INTO dorm_assignments (id, tenant_id, landlord_id, room_number, move_in_date)
                    VALUES (@id, @tenantId, @landlordId, @roomNumber, @moveInDate)
                `);

            await transaction.commit();
            res.json({ message: "Tenant assigned successfully" });

        } catch (err: any) {
            await transaction.rollback();
            throw err;
        }

    } catch (error: any) {
        console.error("Assignment Error:", error);
        res.status(400).json({ error: error.message || "Failed to assign room" });
    }
};