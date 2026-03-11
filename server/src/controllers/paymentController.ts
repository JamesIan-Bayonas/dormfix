import type { Request, Response } from 'express';
import { poolPromise } from '../config/dbConfig.ts';
import sql from 'mssql';
import crypto from 'crypto';
import { analyzePaymentImage } from '../services/aiService.ts';
import { notificationService } from '../services/notificationService.ts';

interface MulterFile {
    filename: string;
    path: string;
    originalname: string;
    mimetype: string;
    size: number;
}

export const processTenantPayment = async (req: Request & { file?: MulterFile }, res: Response) => {
    const file = req.file;
    const { tenantId, amount, paymentType, remarks } = req.body;

    if (!file || !tenantId || !amount || !paymentType) {
         res.status(400).json({ error: "Missing required fields or proof of payment" });
         return;
    }

    try {
        const id = crypto.randomUUID();
        const proofImage = `/uploads/${file.filename}`;
        
        const pool = await poolPromise;

        // 1. Get Landlord ID
        const landlordResult = await pool.request()
            .input('tid', sql.VarChar(36), tenantId)
            .query(`SELECT landlord_id FROM dorm_assignments WHERE tenant_id = @tid`);
        
        const landlordId = landlordResult.recordset[0]?.landlord_id;
        if (!landlordId) throw new Error("Tenant not assigned to a landlord");

        // 2. RUN AI ANALYSIS
        console.log("AI is analyzing payment...");
        const aiAnalysis = await analyzePaymentImage(file.path);
        
        // 3. ZERO TRUST ANOMALY LOGIC
        let finalStatus = 'Verified'; 
        let anomalyFlags: string[] = [];
        const expectedAmount = parseFloat(amount); // The amount the tenant typed in the form

        if (aiAnalysis) {
            // DEFENSE A: Date Check (Older than 7 days?)
            if (aiAnalysis.extracted_date) {
                const receiptDate = new Date(aiAnalysis.extracted_date);
                const currentDate = new Date();
                const diffInDays = (currentDate.getTime() - receiptDate.getTime()) / (1000 * 3600 * 24);
                
                if (diffInDays > 7) {
                    finalStatus = 'Anomalous';
                    anomalyFlags.push(`DATE WARNING: Receipt is ${Math.round(diffInDays)} days old.`);
                }
            }

            // DEFENSE B: Amount Check (Does the AI reading match what the tenant typed?)
            if (aiAnalysis.extracted_amount && aiAnalysis.extracted_amount !== expectedAmount) {
                finalStatus = 'Anomalous';
                anomalyFlags.push(`AMOUNT WARNING: Form says ₱${expectedAmount}, but AI read ₱${aiAnalysis.extracted_amount}.`);
            }
        } else {
            finalStatus = 'Anomalous';
            anomalyFlags.push("SYSTEM WARNING: AI failed to read the document clearly.");
        }

        if (finalStatus === 'Anomalous') {
            // TRIGGER: Tell the landlord immediately that the AI found a problem
            await notificationService.sendLandlordAlert(
                "Payment Anomaly Detected",
                `A tenant just uploaded a receipt that failed the Zero-Trust audit.\n\n` +
                `Detected Warnings: ${anomalyFlags.join(', ')}\n` +
                `Please log in to the Landlord Dashboard to review the document.`
            );
        }

        // Format the notes for the database so the landlord can see exactly what happened
        const combinedRemarks = `[AI Audit: ${finalStatus}]\n` +
                                `[AI Extracted: ₱${aiAnalysis?.extracted_amount || 'N/A'}]\n` +
                                `[Ref No: ${aiAnalysis?.reference_number || 'N/A'}]\n` +
                                `[Warnings: ${anomalyFlags.length > 0 ? anomalyFlags.join(' | ') : 'None'}]\n\n` +
                                `Tenant Remarks: ${remarks || 'None'}`;

        // 4. SAVE TO MSSQL DATABASE
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            await transaction.request()
                .input('id', sql.VarChar(36), id)
                .input('tid', sql.VarChar(36), tenantId)
                .input('lid', sql.VarChar(36), landlordId)
                .input('amount', sql.Decimal(10, 2), expectedAmount)
                .input('type', sql.VarChar(50), paymentType)
                .input('proof', sql.VarChar(255), proofImage)
                .input('remarks', sql.NVarChar(sql.MAX), combinedRemarks)
                // If Verified, set to 'Pending' landlord approval. If Anomalous, flag it directly.
                .input('status', sql.VarChar(20), finalStatus === 'Verified' ? 'Pending' : 'Anomalous') 
                .query(`
                    INSERT INTO payments (id, tenant_id, landlord_id, amount, payment_type, proof_image, remarks, status, date_paid, created_at)
                    VALUES (@id, @tid, @lid, @amount, @type, @proof, @remarks, @status, GETDATE(), GETDATE())
                `);

            await transaction.commit();
            
            // 5. SEND VERDICT TO REACT FRONTEND
            res.status(201).json({ 
                message: "Payment submitted successfully",
                status: finalStatus,
                warnings: anomalyFlags,
                aiAnalysis: aiAnalysis 
            });

        } catch (err: any) {
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
    const { status, reason } = req.body; 

    try {
        const pool = await poolPromise;
        
        // 1. Get the tenant's email before updating the record
        const tenantInfo = await pool.request()
            .input('pid', sql.VarChar(36), id)
            .query(`SELECT u.email FROM payments p JOIN users u ON p.tenant_id = u.id WHERE p.id = @pid`);
        
        const tenantEmail = tenantInfo.recordset[0]?.email;

        // 2. Perform the database update
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('status', sql.VarChar(20), status)
            .input('reason', sql.NVarChar(sql.MAX), reason || null)
            .query(`UPDATE payments SET status = @status, rejection_reason = @reason WHERE id = @id`);

        // 3. TRIGGER: Notify the tenant of the final result
        if (tenantEmail) {
            await notificationService.sendTenantUpdate(tenantEmail, status, reason);
        }

        res.json({ message: `Payment marked as ${status} and tenant notified.` });
    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ error: "Failed to update payment" });
    }
};