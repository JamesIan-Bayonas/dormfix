import type { Request, Response } from 'express';
// Navigate UP one level (..) to find dbConfig
import { sql, poolPromise } from '../dbConfig.ts'; 

export const assignUserToRoom = async (req: Request, res: Response) => {
    // 1. EXTRACT DATA
    const { userId, roomId, tenantId } = req.body;

    if (!userId || !roomId || !tenantId) {
        return res.status(400).json({ message: "Missing required fields (userId, roomId, tenantId)." });
    }

    try {
        const pool = await poolPromise;
        
        // 2. START TRANSACTION
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            // 3. VALIDATION QUERY
            // Checks: Existence + Tenant Ownership + Real Capacity
            const validationQuery = `
                SELECT 
                    r.Id, 
                    r.MaxCapacity,
                    (SELECT COUNT(*) FROM Users u WHERE u.RoomId = r.Id) as RealOccupancy
                FROM Rooms r
                WHERE r.Id = @RoomId AND r.TenantId = @TenantId
            `;

            request.input('RoomId', sql.Int, roomId);
            request.input('TenantId', sql.Int, tenantId); 
            request.input('UserId', sql.Int, userId);

            const validationResult = await request.query(validationQuery);

            if (validationResult.recordset.length === 0) {
                // This is the specific fix for your "disappearing" bug
                throw new Error("Room not found or does not belong to this tenant.");
            }

            const roomData = validationResult.recordset[0];

            if (roomData.RealOccupancy >= roomData.MaxCapacity) {
                throw new Error("Room is fully occupied.");
            }

            // 4. EXECUTION
            const updateQuery = `
                UPDATE Users 
                SET RoomId = @RoomId 
                WHERE Id = @UserId
            `;

            await request.query(updateQuery);

            // 5. COMMIT
            await transaction.commit();

            return res.status(200).json({ 
                success: true, 
                message: "User successfully assigned.",
                newOccupancy: roomData.RealOccupancy + 1
            });

        } catch (err: any) {
            await transaction.rollback();
            console.error("Assignment Failed:", err);
            
            if (err.message.includes("fully occupied") || err.message.includes("not found")) {
                return res.status(409).json({ message: err.message });
            }
            return res.status(500).json({ message: "Transaction failed." });
        }

    } catch (error) {
        console.error("System Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};