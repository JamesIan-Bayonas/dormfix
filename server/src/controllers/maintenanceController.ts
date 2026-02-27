import type { Request, Response } from 'express';
import { poolPromise } from '../config/dbConfig.ts';
import sql from 'mssql';
import crypto from 'crypto';

// 🛡️ MUST ADD THESE IMPORTS
import { analyzeMaintenanceRequest } from '../services/aiService.ts';
import { notificationService } from '../services/notificationService.ts';

// 1. SUBMIT REQUEST
export const submitMaintenance = async (req: Request, res: Response) => {
    // We extract 'description' from the request body
    const { tenantId, issueType, description, urgency } = req.body;

    if (!tenantId || !issueType || !description || !urgency) {
         res.status(400).json({ error: "Missing required fields" });
         return;
    }

    try {
        const id = crypto.randomUUID();
        const pool = await poolPromise;

        // 🛡️ STEP 1: FETCH THE ROOM NUMBER (Fixes 'roomNumber' error)
        const roomResult = await pool.request()
            .input('tid', sql.VarChar(36), tenantId)
            .query(`SELECT room_number FROM dorm_assignments WHERE tenant_id = @tid`);
        
        const roomNumber = roomResult.recordset[0]?.room_number || 'Unknown Room';

        // 🛡️ STEP 2: RUN AI ANALYSIS (Fixes 'tenantMessage' error by using 'description')
        console.log("🤖 AI is analyzing maintenance request...");
        const aiMaintenanceVerdict = await analyzeMaintenanceRequest(description);
        
        let finalUrgency = urgency; // Default to what the tenant selected

        if (aiMaintenanceVerdict) {
            // If AI detects a crisis, upgrade the urgency and send alerts
            if (aiMaintenanceVerdict.priority === 'Emergency') {
                finalUrgency = 'Emergency';

                // TRIGGER: Immediate alerts to the Landlord
                await notificationService.sendEmergencySMS(
                    `EMERGENCY TICKET: Room ${roomNumber} reports ${aiMaintenanceVerdict.category}. Summary: ${aiMaintenanceVerdict.landlord_summary}`
                );
                
                await notificationService.sendLandlordAlert(
                    "URGENT: Emergency Maintenance Required",
                    `Room: ${roomNumber}\nCategory: ${aiMaintenanceVerdict.category}\nDescription: ${description}`
                );
            }
        }

        // 🛡️ STEP 3: SAVE TO DATABASE
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('tenantId', sql.VarChar(36), tenantId)
            .input('issueType', sql.VarChar(50), issueType)
            .input('description', sql.VarChar(sql.MAX), description)
            .input('urgency', sql.VarChar(20), finalUrgency) // Use the AI-upgraded urgency
            .query(`
                INSERT INTO maintenance_requests (id, tenant_id, issue_type, description, urgency)
                VALUES (@id, @tenantId, @issueType, @description, @urgency)
            `);

        res.status(201).json({ 
            message: "Request submitted successfully",
            aiReply: aiMaintenanceVerdict?.tenant_auto_reply || null 
        });
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
                    mr.id, 
                    mr.tenant_id as tenantId,
                    mr.issue_type as issueType, 
                    mr.description, 
                    mr.urgency, 
                    mr.status, 
                    mr.date_submitted as dateSubmitted,
                    ISNULL(u.name, 'Unknown Tenant') as tenantName, 
                    ISNULL(da.room_number, 'N/A') as roomNumber
                FROM maintenance_requests mr
                INNER JOIN dorm_assignments da ON mr.tenant_id = da.tenant_id
                INNER JOIN users u ON mr.tenant_id = u.id
                WHERE da.landlord_id = @userId
                ORDER BY 
                    CASE WHEN mr.urgency = 'Emergency' THEN 1 WHEN mr.urgency = 'High' THEN 2 ELSE 3 END,
                    mr.date_submitted DESC
            `;
        } else {
            query = `
                SELECT 
                    id, 
                    tenant_id as tenantId, -- <--- Added here too for consistency
                    issue_type as issueType, 
                    description, 
                    urgency, 
                    status, 
                    date_submitted as dateSubmitted, 
                    admin_remarks as adminRemarks
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
