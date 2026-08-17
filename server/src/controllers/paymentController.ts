// server/src/controllers/paymentController.ts
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { paymentRepository } from '../repositories/paymentRepository';
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

        const assignment = await paymentRepository.getTenantAssignment(tenantId);
        if (!assignment || !assignment.landlord_id) {
            res.status(404).json({ error: "Tenant not assigned to a landlord" });
            return;
        }

        if (!assignment.room_number || assignment.room_number === 'Unassigned') {
            res.status(403).json({ error: "Cannot submit payment: Room allocation is still pending with your landlord." });
            return;
        }

        const landlordId = assignment.landlord_id;
        const landlordEmail = assignment.landlord_email;

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
            if (landlordEmail) {
                await notificationService.sendLandlordAlert(
                    landlordEmail,
                    "Payment Anomaly Detected",
                    `A tenant just uploaded a receipt that failed the Zero-Trust audit.\nWarnings: ${anomalyFlags.join(', ')}`
                );
            }
        }

        const combinedRemarks = `[AI Audit: ${finalStatus}]\n` +
                                `[AI Extracted: ₱${aiAnalysis?.extracted_amount || 'N/A'}]\n` +
                                `[Ref No: ${aiAnalysis?.reference_number || 'N/A'}]\n` +
                                `[Warnings: ${anomalyFlags.length > 0 ? anomalyFlags.join(' | ') : 'None'}]\n\n` +
                                `Tenant Remarks: ${remarks || 'None'}`;

        await paymentRepository.create({
            id,
            tenantId,
            landlordId,
            amount: expectedAmount,
            paymentType,
            proofImage,
            remarks: combinedRemarks,
            status: finalStatus === 'Verified' ? 'Pending' : 'Anomalous',
            datePaid: new Date()
        });

        res.status(201).json({ 
            message: "Payment submitted successfully",
            status: finalStatus,
            warnings: anomalyFlags,
            aiAnalysis: aiAnalysis 
        });
    } catch (error) {
        console.error("Submit Payment Error:", error);
        res.status(500).json({ error: "Failed to submit payment" });
    }
};

export const getLandlordPayments = async (req: Request, res: Response) => {
    const { landlordId } = req.params;
    try {
        const records = await paymentRepository.getByLandlord(landlordId);
        res.json(records);
    } catch (error) {
        console.error("Get Landlord Payments Error:", error);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
};

export const getTenantHistory = async (req: Request, res: Response) => {
    const { tenantId } = req.params;
    try {
        const records = await paymentRepository.getByTenant(tenantId);
        res.json(records);
    } catch (error) {
        console.error("Get Tenant History Error:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
};
    
export const verifyPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, reason } = req.body; 

    try {
        const tenantEmail = await paymentRepository.getTenantEmailByPaymentId(id);
        const appendedRemarksUpdate = `\n[Landlord Verification Verdict: ${status}]${reason ? `\n[Rejection Reason: ${reason}]` : ''}`;

        await paymentRepository.verify(id, status, appendedRemarksUpdate);

        if (tenantEmail) {
            await notificationService.sendTenantUpdate(tenantEmail, status, reason);
        }

        res.json({ message: `Payment marked as ${status} and tenant notified.` });
    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ error: "Failed to update payment" });
    }
};