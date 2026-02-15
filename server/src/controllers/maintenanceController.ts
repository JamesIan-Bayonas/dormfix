import type { Request, Response } from 'express';
import { poolPromise } from '../config/dbConfig.ts';
import sql from 'mssql';
import crypto from 'crypto';

// 1. SUBMIT REQUEST
export const submitMaintenance = async (req: Request, res: Response) => {
    const { tenantId, issueType, description, urgency } = req.body;

    if (!tenantId || !issueType || !description || !urgency) {
         res.status(400).json({ error: "Missing required fields" });
         return;
    }

    try {
        const id = crypto.randomUUID();
        const pool = await poolPromise;
        
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('tenantId', sql.VarChar(36), tenantId)
            .input('issueType', sql.VarChar(50), issueType)
            .input('description', sql.VarChar(sql.MAX), description)
            .input('urgency', sql.VarChar(20), urgency)
            .query(`
                INSERT INTO maintenance_requests (id, tenant_id, issue_type, description, urgency)
                VALUES (@id, @tenantId, @issueType, @description, @urgency)
            `);

        res.status(201).json({ message: "Request submitted successfully" });
    } catch (error) {
        console.error("Maintenance Submit Error:", error);
        res.status(500).json({ error: "Failed to submit request" });
    }
};

// 2. FETCH REQUESTS (Landlord & Tenant Logic)
export const getMaintenance = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = req.query;

    try {
        let query = '';
        const pool = await poolPromise;
        const request = pool.request().input('userId', sql.VarChar, userId);

        if (role === 'landlord') {
            query = `
                SELECT 
                    mr.id, mr.issue_type as issueType, mr.description, mr.urgency, mr.status, mr.date_submitted as dateSubmitted,
                    u.name as tenantName, da.room_number as roomNumber
                FROM maintenance_requests mr
                JOIN dorm_assignments da ON mr.tenant_id = da.tenant_id
                JOIN users u ON mr.tenant_id = u.id
                WHERE da.landlord_id = @userId
                ORDER BY 
                    CASE WHEN mr.urgency = 'Emergency' THEN 1 WHEN mr.urgency = 'High' THEN 2 ELSE 3 END,
                    mr.date_submitted DESC
            `;
        } else {
            query = `
                SELECT 
                    id, issue_type as issueType, description, urgency, status, date_submitted as dateSubmitted, admin_remarks as adminRemarks
                FROM maintenance_requests 
                WHERE tenant_id = @userId
                ORDER BY date_submitted DESC
            `;
        }

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error("Fetch Maintenance Error:", error);
        res.status(500).json({ error: "Failed to fetch requests" });
    }
};

// 3. UPDATE STATUS
export const updateMaintenanceStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Rejected'];
    if (!validStatuses.includes(status)) {
         res.status(400).json({ error: "Invalid status value" });
         return;
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('status', sql.VarChar(20), status)
            .query(`UPDATE maintenance_requests SET status = @status WHERE id = @id`);

        res.json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ error: "Failed to update status" });
    }
};