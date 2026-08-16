import type { Request, Response } from 'express';
import { poolPromise } from '../config/dbConfig';
import sql from 'mssql';
import crypto from 'crypto';
import { analyzePaymentImage } from '../services/aiService';
import { notificationService } from '../services/notificationService';

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

        const assignmentResult = await pool.request()
            .input('tid', sql.VarChar(36), tenantId)
            .query(`SELECT landlord_id, room_number FROM dorm_assignments WHERE tenant_id = @tid`);
        
        const assignment = assignmentResult.recordset[0];
        if (!assignment || !assignment.landlord_id) {
            res.status(404).json({ error: "Tenant not assigned to a landlord" });
            return;
        }

        if (!assignment.room_number || assignment.room_number === 'Unassigned') {
            res.status(403).json({ error: "Cannot submit payment: Room allocation is still pending with your landlord." });
            return;
        }

        const landlordId = assignment.landlord_id;

        console.log("AI is analyzing payment...");
        const aiAnalysis = await analyzePaymentImage(file.path);
        
        let finalStatus = 'Verified'; 
        let anomalyFlags: string[] = [];
        const expectedAmount = parseFloat(amount);

        if (aiAnalysis) {
            if (aiAnalysis.extracted_date) {
                const receiptDate = new Date(aiAnalysis.extracted_date);
                const currentDate = new Date();
                const diffInDays = (currentDate.getTime() - receiptDate.getTime()) / (1000 * 3600 * 24);
                if (diffInDays > 7) {
                    finalStatus = 'Anomalous';
                    anomalyFlags.push(`DATE WARNING: Receipt is ${Math.round(diffInDays)} days old.`);
                }
            }
            if (aiAnalysis.extracted_amount && aiAnalysis.extracted_amount !== expectedAmount) {
                finalStatus = 'Anomalous';
                anomalyFlags.push(`AMOUNT WARNING: Form says ₱${expectedAmount}, but AI read ₱${aiAnalysis.extracted_amount}.`);
            }
        } else {
            finalStatus = 'Anomalous';
            anomalyFlags.push("SYSTEM WARNING: AI failed to read the document clearly.");
        }

        if (finalStatus === 'Anomalous') {
            await notificationService.sendLandlordAlert(
                "Payment Anomaly Detected",
                `A tenant just uploaded a receipt that failed the Zero-Trust audit.\nWarnings: ${anomalyFlags.join(', ')}`
            );
        }

        const combinedRemarks = `[AI Audit: ${finalStatus}]\n` +
                                `[AI Extracted: ₱${aiAnalysis?.extracted_amount || 'N/A'}]\n` +
                                `[Ref No: ${aiAnalysis?.reference_number || 'N/A'}]\n` +
                                `[Warnings: ${anomalyFlags.length > 0 ? anomalyFlags.join(' | ') : 'None'}]\n\n` +
                                `Tenant Remarks: ${remarks || 'None'}`;

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
                .input('status', sql.VarChar(20), finalStatus === 'Verified' ? 'Pending' : 'Anomalous') 
                .query(`
                    INSERT INTO payments (id, tenant_id, landlord_id, amount, payment_type, proof_image, remarks, status, date_paid, created_at)
                    VALUES (@id, @tid, @lid, @amount, @type, @proof, @remarks, @status, GETDATE(), GETDATE())
                `);

            await transaction.commit();
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

export const getLandlordPayments = async (req: Request, res: Response) => {
    const { landlordId } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('lid', sql.VarChar(36), landlordId)
            .query(`
                SELECT 
                    p.id, p.amount, p.status, p.date_paid as datePaid, p.payment_type as paymentType, 
                    p.proof_image as proofImage, p.remarks,
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

export const getTenantHistory = async (req: Request, res: Response) => {
    const { tenantId } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('tid', sql.VarChar(36), tenantId)
            .query(`
                SELECT id, amount, status, date_paid as datePaid, payment_type as paymentType, 
                       proof_image as proofImage, remarks
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
    
export const verifyPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, reason } = req.body; 

    try {
        const pool = await poolPromise;
        const tenantInfo = await pool.request()
            .input('pid', sql.VarChar(36), id)
            .query(`SELECT u.email FROM payments p JOIN users u ON p.tenant_id = u.id WHERE p.id = @pid`);
        
        const tenantEmail = tenantInfo.recordset[0]?.email;
        const appendedRemarksUpdate = `\n[Landlord Verification Verdict: ${status}]${reason ? `\n[Rejection Reason: ${reason}]` : ''}`;

        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('status', sql.VarChar(20), status)
            .input('appendedText', sql.NVarChar(sql.MAX), appendedRemarksUpdate)
            .query(`UPDATE payments SET status = @status, remarks = CONCAT(remarks, @appendedText) WHERE id = @id`);

        if (tenantEmail) {
            await notificationService.sendTenantUpdate(tenantEmail, status, reason);
        }

        res.json({ message: `Payment marked as ${status} and tenant notified.` });
    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ error: "Failed to update payment" });
    }
};