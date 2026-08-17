// server/src/controllers/maintenanceController.ts
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { maintenanceRepository } from '../repositories/maintenanceRepository';
import { analyzeMaintenanceRequest } from '../services/aiService';
import { notificationService } from '../services/notificationService';

export const submitMaintenance = async (req: Request, res: Response) => {
    const { tenantId, issueType, description, urgency } = req.body;

    if (!tenantId || !issueType || !description || !urgency) {
         res.status(400).json({ error: "Missing required fields" });
         return;
    }

    try {
        const id = crypto.randomUUID();

        // STEP 1: ROOM CONTEXT & GUARD
        const assignment = await maintenanceRepository.getRoomContext(tenantId);
        const roomNumber = assignment?.room_number;
        const landlordEmail = assignment?.landlord_email;

        if (!roomNumber || roomNumber === 'Unassigned') {
            res.status(403).json({ error: "Cannot file maintenance tickets: No room currently assigned." });
            return;
        }

        // STEP 2: AI TRIAGE
        const aiMaintenanceVerdict = await analyzeMaintenanceRequest(description);
        let finalUrgency = urgency; 

        // STEP 3: THE NOTIFICATION LOOP
        if (aiMaintenanceVerdict && (aiMaintenanceVerdict.priority === 'Emergency' || aiMaintenanceVerdict.priority === 'High')) {
            finalUrgency = aiMaintenanceVerdict.priority; 

            await notificationService.sendEmergencySMS(
                `ALERT [${aiMaintenanceVerdict.priority}]: Room ${roomNumber} reports ${aiMaintenanceVerdict.category}. Summary: ${aiMaintenanceVerdict.landlord_summary}`
            );
            
            if (landlordEmail) {
                await notificationService.sendLandlordAlert(
                    landlordEmail,
                    `URGENT: ${aiMaintenanceVerdict.priority} Maintenance Required`,
                    `Room: ${roomNumber}\nCategory: ${aiMaintenanceVerdict.category}\nAI Summary: ${aiMaintenanceVerdict.landlord_summary}\n\nTenant Description: ${description}`
                );
            }
        }

        // STEP 4: DATABASE PERSISTENCE
        await maintenanceRepository.create({
            id,
            tenantId,
            issueType,
            description,
            urgency: finalUrgency
        });

        res.status(201).json({ 
            message: "Request submitted successfully",
            aiReply: aiMaintenanceVerdict?.tenant_auto_reply || null 
        });
    } catch (error) {
        console.error("Maintenance Submit Error:", error);
        res.status(500).json({ error: "Failed to submit request" });
    }
};

export const getMaintenance = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = req.query;

    try {
        if (role === 'landlord') {
            const records = await maintenanceRepository.getByLandlord(userId);
            res.json(records);
        } else {
            const records = await maintenanceRepository.getByTenant(userId);
            res.json(records);
        }
    } catch (error) {
        console.error("Fetch Maintenance Error:", error);
        res.status(500).json({ error: "Failed to fetch requests" });
    }
};

export const updateMaintenanceStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Rejected'];
    if (!validStatuses.includes(status)) {
         res.status(400).json({ error: "Invalid status value" });
         return;
    }

    try {
        await maintenanceRepository.updateStatus(id, status);
        res.json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ error: "Failed to update status" });
    }
};