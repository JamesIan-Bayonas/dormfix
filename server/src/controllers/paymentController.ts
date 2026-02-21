import type { Request, Response } from 'express';
import { poolPromise } from '../config/dbConfig.ts';
import sql from 'mssql';
import crypto from 'crypto';
import { analyzePaymentImage } from '../services/aiService.ts';

interface MulterFile {
    filename: string;
    path: string;
    originalname: string;
    mimetype: string;
    size: number;
}

export const submitPayment = async (req: Request & { file?: MulterFile }, res: Response) => {
    const file = req.file;
    const { tenantId, amount, paymentType, roomNumber, remarks } = req.body;

    if (!file || !tenantId || !amount || !paymentType) {
         res.status(400).json({ error: "Missing required fields or proof of payment" });
         return;
    }

    try {
        const id = crypto.randomUUID();
        const proofImage = `/uploads/${file.filename}`;
        
        //  START AI INTEGRATION SECTION
        console.log("AI is analyzing payment...");
        
        // Run the AI analysis on the file path
        // note: file.path is the full path on your disk (e.g., C:/.../uploads/image.jpg)
        const aiAnalysis = await analyzePaymentImage(file.path);
        
        console.log(" AI Result:", aiAnalysis);
        
        // Prepare the remarks to save in the database
        // We take the user's remarks and append the AI's findings
        let finalRemarks = remarks || '';
        
        if (aiAnalysis) {
            // Append a readable summary of the AI findings
            const aiNote = `[AI Verified: ${aiAnalysis.is_valid_receipt ? 'YES' : 'NO'}] ` +
                           `[Extracted Amount: ${aiAnalysis.extracted_amount}] ` +
                           `[Ref: ${aiAnalysis.reference_number}]`;
            
            finalRemarks = finalRemarks ? `${finalRemarks}\n\n${aiNote}` : aiNote;
        }

        //  END AI INTEGRATION SECTION

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const landlordResult = await transaction.request()
                .input('tid', sql.VarChar(36), tenantId)
                .query(`SELECT landlord_id FROM dorm_assignments WHERE tenant_id = @tid`);
            
            const landlordId = landlordResult.recordset[0]?.landlord_id;

            if (!landlordId) throw new Error("Tenant not assigned to a landlord");

            await transaction.request()
                .input('id', sql.VarChar(36), id)
                .input('tid', sql.VarChar(36), tenantId)
                .input('lid', sql.VarChar(36), landlordId)
                .input('amount', sql.Decimal(10, 2), amount)
                .input('type', sql.VarChar(50), paymentType)
                .input('proof', sql.VarChar(255), proofImage)
                
                // UPDATED: Use 'finalRemarks' instead of just 'remarks'
                .input('remarks', sql.NVarChar(sql.MAX), finalRemarks) 
                
                .query(`
                    INSERT INTO payments (id, tenant_id, landlord_id, amount, payment_type, proof_image, remarks, status, date_paid, created_at)
                    VALUES (@id, @tid, @lid, @amount, @type, @proof, @remarks, 'Pending', GETDATE(), GETDATE())
                `);

            await transaction.commit();
            res.status(201).json({ 
                message: "Payment submitted successfully",
                // Optional: Send AI result back to frontend immediately so user sees it
                aiAnalysis: aiAnalysis 
            });

        } catch (err: unknown) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error("Submit Payment Error:", error);
        res.status(500).json({ error: "Failed to submit payment" });
    }
};

// 2. GET PAYMENTS (Landlord View)
export const getLandlordPayments = async (req: Request, res: Response) => {
    const { landlordId } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('lid', sql.VarChar(36), landlordId)
            .query(`
                SELECT 
                    p.id, p.amount, p.status, p.date_paid as datePaid, p.payment_type as paymentType, 
                    p.proof_image as proofImage, p.remarks, p.rejection_reason as rejectionReason,
                    u.name as tenantName, da.room_number as roomNumber
                FROM payments p
                JOIN users u ON p.tenant_id = u.id
                LEFT JOIN dorm_assignments da ON p.tenant_id = da.tenant_id
                WHERE p.landlord_id = @lid
                ORDER BY p.date_paid DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Get Landlord Payments Error:", error);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
};

// 3. GET HISTORY (Tenant View)
export const getTenantHistory = async (req: Request, res: Response) => {
    const { tenantId } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('tid', sql.VarChar(36), tenantId)
            .query(`
                SELECT id, amount, status, date_paid as datePaid, payment_type as paymentType, 
                       proof_image as proofImage, remarks, rejection_reason as rejectionReason
                FROM payments 
                WHERE tenant_id = @tid 
                ORDER BY date_paid DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Get Tenant History Error:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
};
    
// 4. VERIFY PAYMENT (Landlord Action)
export const verifyPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, reason } = req.body; // Status: 'Verified' or 'Rejected'

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('status', sql.VarChar(20), status)
            .input('reason', sql.NVarChar(sql.MAX), reason || null)
            .query(`
                UPDATE payments 
                SET status = @status, rejection_reason = @reason 
                WHERE id = @id
            `);
        res.json({ message: `Payment marked as ${status}` });
    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ error: "Failed to update payment status" });
    }
};