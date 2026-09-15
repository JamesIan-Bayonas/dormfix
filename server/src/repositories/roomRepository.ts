// server/src/repositories/roomRepository.ts
import { pool, withTransaction, toDateOnly } from '../config/dbConfig';
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

        const result = await pool.query(`
                SELECT 
                    r.id, 
                    r.room_number, 
                    r.capacity,
                    (SELECT COUNT(*)::integer 
                     FROM dorm_assignments da 
                     WHERE da.room_number = r.room_number 
                     AND da.landlord_id = r.landlord_id) as "currentOccupants"
                FROM rooms r
                WHERE r.landlord_id = $1
                ORDER BY r.room_number ASC
            `, [landlordId]);
        return result.rows;
    },

    // 2. Find room by landlord ID and room number
    findRoom: async (landlordId: string, roomNumber: string) => {

        const result = await pool.query(`SELECT id, capacity FROM rooms WHERE landlord_id = $1 AND room_number = $2`, [landlordId, roomNumber]);
        return result.rows[0] || null;
    },

    // 3. Create a room record
    create: async (id: string, landlordId: string, roomNumber: string, capacity: number) => {

        await pool.query(`
                INSERT INTO rooms (id, landlord_id, room_number, capacity)
                VALUES ($1, $2, $3, $4)
            `, [id, landlordId, roomNumber, capacity]);
    },

    // 4. Atomically verify capacity and assign tenant to room
    assignTenantTransaction: async (tenantId: string, landlordId: string, roomNumber: string, moveInDate?: string | Date) => {
        await withTransaction(async client => {
            // Serialize assignments for this tenant and capacity checks for this room.
            const tenant = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [tenantId]);
            if (!tenant.rows.length) throw new Error('Tenant does not exist.');
            const room = await client.query(`SELECT capacity FROM rooms
                WHERE landlord_id = $1 AND room_number = $2 FOR UPDATE`, [landlordId, roomNumber]);
            if (!room.rows.length) throw new Error('Room does not exist.');
            if (room.rows.length !== 1) throw new Error('Duplicate room records must be resolved before assignment.');
            const capacity = room.rows[0].capacity;
            if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Room capacity is invalid.');
            const occupied = await client.query(`SELECT COUNT(*)::integer AS count FROM dorm_assignments
                WHERE landlord_id = $1 AND room_number = $2 AND tenant_id != $3`,
                [landlordId, roomNumber, tenantId]);
            if (occupied.rows[0].count >= capacity) throw new Error('Room is already at full capacity.');
            const existing = await client.query(`SELECT id FROM dorm_assignments
                WHERE tenant_id = $1 AND landlord_id = $2`, [tenantId, landlordId]);
            if (existing.rows.length > 1) throw new Error('Duplicate tenant assignments must be resolved before assignment.');
            const date = moveInDate ? toDateOnly(moveInDate) : null;
            if (existing.rows.length) {
                await client.query(`UPDATE dorm_assignments
                    SET room_number = $3, move_in_date = COALESCE($4::date, CURRENT_DATE)
                    WHERE tenant_id = $1 AND landlord_id = $2`, [tenantId, landlordId, roomNumber, date]);
            } else {
                await client.query(`INSERT INTO dorm_assignments
                    (id, tenant_id, landlord_id, room_number, move_in_date)
                    VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE))`,
                    [crypto.randomUUID(), tenantId, landlordId, roomNumber, date]);
            }
        });
    },
};