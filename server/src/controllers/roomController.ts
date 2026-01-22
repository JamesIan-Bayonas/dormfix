import type { Request, Response } from 'express'; // explicit type import
import { sql, poolPromise } from '../config/dbConfig.ts'; // .ts extension for ESM

export const assignUserToRoom = async (req: Request, res: Response) => {
    // 1. EXTRACT DATA
    // We need landlordId to ensure we don't assign a tenant to a room 
    // that belongs to a different landlord.
    const { tenantId, roomNumber, landlordId } = req.body;

    if (!tenantId || !roomNumber || !landlordId) {
        return res.status(400).json({ message: "Missing required fields (tenantId, roomNumber, landlordId)." });
    }

    try {
        const pool = await poolPromise;
        
        // 2. START TRANSACTION
        // We lock the DB so no one else can snag the last spot while we are checking.
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            // ---------------------------------------------------------
            // STEP A: CAPACITY CHECK (The Guard)
            // ---------------------------------------------------------
            // We need to check two things:
            // 1. Does the room exist and belong to this landlord?
            // 2. Is the room full?
            
            // Get Room Details
            const roomQuery = `
                SELECT Capacity 
                FROM Rooms 
                WHERE room_number = @RoomNumber AND landlord_id = @LandlordId
            `;
            
            request.input('RoomNumber', sql.VarChar, roomNumber);
            request.input('LandlordId', sql.VarChar, landlordId);
            
            const roomResult = await request.query(roomQuery);

            if (roomResult.recordset.length === 0) {
                throw new Error("Room does not exist or does not belong to you.");
            }

            const maxCapacity = roomResult.recordset[0].Capacity;

            // Get Current Occupancy
            // We count how many people are ALREADY in this room
            const countQuery = `
                SELECT COUNT(*) as CurrentCount 
                FROM dorm_assignments 
                WHERE room_number = @RoomNumber AND landlord_id = @LandlordId
            `;
            
            // We reuse the inputs we already set above
            const countResult = await request.query(countQuery);
            const currentOccupancy = countResult.recordset[0].CurrentCount;

            if (currentOccupancy >= maxCapacity) {
                throw new Error(`Room ${roomNumber} is fully occupied (${currentOccupancy}/${maxCapacity}).`);
            }

            // ---------------------------------------------------------
            // STEP B: THE STATE CHANGE (The Update)
            // ---------------------------------------------------------
            // We do NOT insert. We UPDATE the existing "Unassigned" row.
            // This prevents duplicate assignments for the same tenant.
            
            const assignQuery = `
                UPDATE dorm_assignments
                SET room_number = @RoomNumber, 
                    move_in_date = GETDATE()
                WHERE tenant_id = @TenantId
            `;
            
            request.input('TenantId', sql.VarChar, tenantId);
            
            const updateResult = await request.query(assignQuery);

            // Safety Check: Did the tenant actually exist?
            if (updateResult.rowsAffected[0] === 0) {
                // If 0 rows were updated, maybe the tenant doesn't exist 
                // or the 'dorm_assignments' row is missing (data corruption).
                // In that rare case, we might need to INSERT, but for now, let's warn.
                throw new Error("Tenant record not found. They might not be registered properly.");
            }

            // ---------------------------------------------------------
            // STEP C: COMMIT
            // ---------------------------------------------------------
            await transaction.commit();

            return res.status(200).json({ 
                success: true, 
                message: `Tenant successfully moved to Room ${roomNumber}.`,
                data: {
                    tenantId,
                    roomNumber,
                    newOccupancy: currentOccupancy + 1
                }
            });

        } catch (err: any) {
            // ROLLBACK on any error so we don't leave mess
            await transaction.rollback();
            console.error("Assignment Failed:", err);
            
            if (err.message.includes("fully occupied") || err.message.includes("does not exist")) {
                return res.status(409).json({ message: err.message });
            }
            return res.status(500).json({ message: "Transaction failed during assignment." });
        }

    } catch (error) {
        console.error("System Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};