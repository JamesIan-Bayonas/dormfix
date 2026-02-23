import { Request, Response } from 'express';
import { analyzeMaintenanceRequest } from '../services/aiService';
import { sql } from '../config/dbConfig'; 

export const submitMaintenanceTicket = async (req: Request, res: Response) => {
    try {
        const { tenantId, roomId, message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message cannot be empty." });
        }

        // 1. Send the raw message to our local Ollama AI
        const aiTriage = await analyzeMaintenanceRequest(message);

        if (!aiTriage) {
            return res.status(500).json({ error: "AI failed to process the request." });
        }

        // 2. Save the structured data to the SQL Database
        // Now your database is incredibly organized!
        await sql.query(`
            INSERT INTO MaintenanceTickets (tenant_id, room_id, raw_message, category, priority, landlord_summary, status, created_at) 
            VALUES (
                ${tenantId}, 
                '${roomId}', 
                '${message.replace(/'/g, "''")}', 
                '${aiTriage.category}', 
                '${aiTriage.priority}', 
                '${aiTriage.landlord_summary.replace(/'/g, "''")}',
                'Open',
                GETDATE()
            )
        `);

        // 3. Return the AI's friendly reply back to the React frontend
        // so the tenant sees it instantly on their screen.
        res.status(200).json({ 
            success: true,
            ticketDetails: {
                category: aiTriage.category,
                priority: aiTriage.priority
            },
            autoReply: aiTriage.tenant_auto_reply 
        });

    } catch (error) {
        console.error("Ticket Submission Error:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};