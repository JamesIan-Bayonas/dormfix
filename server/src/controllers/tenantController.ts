import type { Request, Response } from 'express';
import { poolPromise } from '../config/dbConfig';
import sql from 'mssql';
import crypto from 'crypto';

// 1. APPROVE TENANT
export const approveTenant = async (req: Request, res: Response) => {
    const { tenantId } = req.params;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('tenantId', sql.VarChar, tenantId)
            .query(`UPDATE users SET is_approved = 1 WHERE id = @tenantId`);
        
        res.json({ message: "Tenant approved successfully" });
    } catch (error) {
        console.error("Approval Error:", error);
        res.status(500).json({ error: "Failed to approve tenant" });
    }
};

// 2. REJECT / UNLINK TENANT (Soft Rejection - Preserves User Account)
export const rejectTenant = async (req: Request, res: Response) => {
    const { tenantId } = req.params;

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            request.input('tenantId', sql.VarChar(36), tenantId);

            // Clean up child payment records and maintenance requests for this application
            await request.query('DELETE FROM payments WHERE tenant_id = @tenantId');
            await request.query('DELETE FROM maintenance_requests WHERE tenant_id = @tenantId');

            // Remove the dorm link to place tenant in unlinked/rejected state
            await request.query('DELETE FROM dorm_assignments WHERE tenant_id = @tenantId');

            // Reset approval flag
            await request.query('UPDATE users SET is_approved = 0 WHERE id = @tenantId');

            await transaction.commit();
            res.json({ message: "Tenant application rejected successfully" });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error("Reject Error:", error);
        res.status(500).json({ error: "Failed to reject tenant" });
    }
};

// 3. GET TENANT HOUSING DETAILS
export const getTenantDetails = async (req: Request, res: Response) => {
    const { tenantId } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('tenantId', sql.VarChar(36), tenantId)
            .query(`
                SELECT 
                    da.landlord_id AS landlordId,
                    u.name AS landlordName, 
                    u.email AS landlordEmail, 
                    da.room_number AS roomNumber, 
                    da.move_in_date AS moveInDate
                FROM dorm_assignments da
                JOIN users u ON da.landlord_id = u.id
                WHERE da.tenant_id = @tenantId
            `);

        if (result.recordset.length === 0) {
             res.status(404).json({ error: "Assignment not found", isUnlinked: true });
             return;
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Fetch Housing Details Error:", error);
        res.status(500).json({ error: "Failed to fetch details" });
    }
};

// 4. RE-LINK TO NEW LANDLORD (For rejected or unassigned tenants)
export const relinkTenant = async (req: Request, res: Response) => {
    const { tenantId, landlordCode } = req.body;

    if (!tenantId || !landlordCode) {
        res.status(400).json({ error: "Tenant ID and Landlord Code are required." });
        return;
    }

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const landlordCheck = new sql.Request(transaction);
            const landlordResult = await landlordCheck.input('code', sql.VarChar, landlordCode)
                .query("SELECT id FROM users WHERE dorm_fix_id = @code AND role = 'landlord'");

            if (landlordResult.recordset.length === 0) {
                throw new Error("Invalid Landlord Code. No matching landlord found.");
            }

            const landlordId = landlordResult.recordset[0].id;
            const assignmentId = crypto.randomUUID();

            const assignRequest = new sql.Request(transaction);
            await assignRequest
                .input('id', sql.VarChar, assignmentId)
                .input('tenantId', sql.VarChar, tenantId)
                .input('landlordId', sql.VarChar, landlordId)
                .query(`
                    INSERT INTO dorm_assignments (id, tenant_id, landlord_id, room_number, move_in_date, created_at)
                    VALUES (@id, @tenantId, @landlordId, 'Unassigned', GETDATE(), GETDATE())
                `);

            await transaction.commit();
            res.status(200).json({ message: "Re-linked successfully. Awaiting approval." });

        } catch (err: any) {
            await transaction.rollback();
            throw err;
        }

    } catch (error: any) {
        console.error("Relink Error:", error.message);
        res.status(400).json({ error: error.message || "Failed to link landlord." });
    }
};

// 5. GET ALL TENANTS FOR LANDLORD
export const getLandlordTenants = async (req: Request, res: Response) => {
    const { landlordId } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('lid', sql.VarChar(36), landlordId) 
            .query(`
                SELECT 
                    u.id, 
                    u.name, 
                    u.email, 
                    u.is_approved as isApproved,
                    u.created_at as createdAt,
                    da.room_number as roomNumber
                FROM users u
                INNER JOIN dorm_assignments da ON u.id = da.tenant_id
                WHERE u.role = 'tenant' AND da.landlord_id = @lid
            `);
        
        res.json(result.recordset);
    } catch (err) {
        console.error("Fetch Tenants Error:", err); 
        res.status(500).json({ error: "Failed to fetch tenants" });
    }
};

// 6. UPDATE USER STATUS (Generic)
export const updateUserStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isApproved } = req.body; 

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('isApproved', sql.Bit, isApproved === true ? 1 : 0) 
            .query(`UPDATE users SET is_approved = @isApproved WHERE id = @id`);

        res.json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ error: "Failed to update status" });
    }
};