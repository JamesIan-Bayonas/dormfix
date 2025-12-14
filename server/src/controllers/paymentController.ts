import type { Request, Response } from 'express';
import { sql, poolPromise } from '../dbConfig.ts';
import { randomUUID } from 'crypto';

export const submitPayment = async (req: Request, res: Response) => {
    // 1. EXTRACT DATA FROM FORM
    const { tenantId, landlordId, amount, paymentType, datePaid, remarks } = req.body;
    
    // 2. CHECK FOR FILE (The "Proof")
    // Multer puts the file info in 'req.file'
    const proofImage = req.file ? `/uploads/${req.file.filename}` : null;

    if (!tenantId || !landlordId || !amount || !paymentType || !datePaid) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    if (!proofImage) {
        return res.status(400).json({ message: "Payment rejected: Proof of payment image is required." });
    }

    try {
        const pool = await poolPromise;
        
        // 3. GENERATE ID
        const paymentId = randomUUID();

        // 4. INSERT INTO DATABASE
        const query = `
            INSERT INTO payments 
            (id, tenant_id, landlord_id, amount, payment_type, proof_image, date_paid, remarks, status)
            VALUES 
            (@Id, @TenantId, @LandlordId, @Amount, @PaymentType, @ProofImage, @DatePaid, @Remarks, 'Pending')
        `;
        
        const request = new sql.Request(pool);
        request.input('Id', sql.VarChar, paymentId);
        request.input('TenantId', sql.VarChar, tenantId);
        request.input('LandlordId', sql.VarChar, landlordId);
        request.input('Amount', sql.Decimal(10, 2), amount);
        request.input('PaymentType', sql.VarChar, paymentType);
        request.input('ProofImage', sql.VarChar, proofImage);
        request.input('DatePaid', sql.Date, datePaid);
        request.input('Remarks', sql.NVarChar, remarks || ''); // Handle optional remarks

        await request.query(query);

        res.status(201).json({ 
            success: true, 
            message: "Payment submitted successfully. Awaiting landlord verification.",
            data: { paymentId, proofImage }
        });

    } catch (error: any) {
        console.error("Payment Submission Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};