// server/src/repositories/roomRepository.ts
import { sql, poolPromise } from '../config/dbConfig';
import crypto from 'crypto';

export interface RoomRecord {
    id: string;
    room_number: string;
    capacity: number;
    currentOccupants: number;
}

export const roomRepository = {
    // 1. Get all rooms with occupancy count for a landlord
    getByLandlord: async (landlordId: string): Promise<RoomRecord[]> => {
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
        return result.recordset;
    },

    // 2. Find room by landlord ID and room number
    findRoom: async (landlordId: string, roomNumber: string) => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('lid', sql.VarChar(36), landlordId)
            .input('rnum', sql.VarChar(50), roomNumber)
            .query("SELECT id, capacity FROM rooms WHERE landlord_id = @lid AND room_number = @rnum");
        return result.recordset[0] || null;
    },

    // 3. Create a room record
    create: async (id: string, landlordId: string, roomNumber: string, capacity: number) => {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('landlordId', sql.VarChar(36), landlordId)
            .input('roomNumber', sql.VarChar(50), roomNumber)
            .input('capacity', sql.Int, capacity)
            .query(`
                INSERT INTO rooms (id, landlord_id, room_number, capacity)
                VALUES (@id, @landlordId, @roomNumber, @capacity)
            `);
    },

    // 4. Atomically verify capacity and assign tenant to room
    assignTenantTransaction: async (tenantId: string, landlordId: string, roomNumber: string, moveInDate?: string | Date) => {
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
                .input('tenantId', sql.VarChar(36), tenantId)
                .query(`
                    SELECT COUNT(*) as count 
                    FROM dorm_assignments 
                    WHERE landlord_id = @lid AND room_number = @rnum AND tenant_id != @tenantId
                `);
            
            if (countCheck.recordset[0].count >= capacity) {
                throw new Error("Room is already at full capacity.");
            }

            // Check if tenant already has an assignment row
            const existingAssign = await transaction.request()
                .input('tenantId', sql.VarChar(36), tenantId)
                .input('landlordId', sql.VarChar(36), landlordId)
                .query(`SELECT id FROM dorm_assignments WHERE tenant_id = @tenantId AND landlord_id = @landlordId`);

            if (existingAssign.recordset.length > 0) {
                // Update existing record (Removes 'Unassigned' state cleanly)
                await transaction.request()
                    .input('tenantId', sql.VarChar(36), tenantId)
                    .input('landlordId', sql.VarChar(36), landlordId)
                    .input('roomNumber', sql.VarChar(50), roomNumber)
                    .input('moveInDate', sql.Date, moveInDate || new Date())
                    .query(`
                        UPDATE dorm_assignments 
                        SET room_number = @roomNumber, move_in_date = @moveInDate
                        WHERE tenant_id = @tenantId AND landlord_id = @landlordId
                    `);
            } else {
                // Insert only if no previous record exists
                const id = crypto.randomUUID();
                await transaction.request()
                    .input('id', sql.VarChar(36), id)
                    .input('tenantId', sql.VarChar(36), tenantId)
                    .input('landlordId', sql.VarChar(36), landlordId)
                    .input('roomNumber', sql.VarChar(50), roomNumber)
                    .input('moveInDate', sql.Date, moveInDate || new Date())
                    .query(`
                        INSERT INTO dorm_assignments (id, tenant_id, landlord_id, room_number, move_in_date, created_at)
                        VALUES (@id, @tenantId, @landlordId, @roomNumber, @moveInDate, GETDATE())
                    `);
            }

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
};