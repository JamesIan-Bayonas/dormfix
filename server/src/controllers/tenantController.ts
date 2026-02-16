import type { Request, Response } from 'express';
import { poolPromise } from '../config/dbConfig.ts';
import sql from 'mssql';

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

// 2. REJECT TENANT
export const rejectTenant = async (req: Request, res: Response) => {
    const { tenantId } = req.params;

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            // First, delete the link to the dorm
            await request.input('tenantId', sql.VarChar(36), tenantId)
                         .query('DELETE FROM dorm_assignments WHERE tenant_id = @tenantId');

            // Then, delete the user account itself
            await request.query('DELETE FROM users WHERE id = @tenantId');

            await transaction.commit();
            res.json({ message: "Tenant rejected and removed successfully" });

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
             res.status(404).json({ error: "Assignment not found" });
             return;
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Fetch Housing Details Error:", error);
        res.status(500).json({ error: "Failed to fetch details" });
    }
};

// 4. GET ALL TENANTS FOR LANDLORD
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

// 5. UPDATE USER STATUS (Generic)
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