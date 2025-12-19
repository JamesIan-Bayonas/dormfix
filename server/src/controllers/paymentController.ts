import type { Request, Response } from 'express';
import { sql, poolPromise } from '../dbConfig.ts';
import { randomUUID } from 'crypto';

// 1. SUBMIT PAYMENT (Tenant)
export const submitPayment = async (req: Request, res: Response) => {
    const { tenantId, landlordId, amount, paymentType, datePaid, remarks } = req.body;
    const proofImage = req.file ? `/uploads/${req.file.filename}` : null;

    if (!tenantId || !landlordId || !amount || !paymentType || !datePaid) {
        return res.status(400).json({ message: "Missing required fields." });
    }
    if (!proofImage) {
        return res.status(400).json({ message: "Payment rejected: Proof of payment image is required." });
    }

    try {
        const pool = await poolPromise;
        const paymentId = randomUUID();
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
        request.input('Remarks', sql.NVarChar, remarks || ''); 

        await request.query(query);

        res.status(201).json({ success: true, message: "Payment submitted successfully." });
    } catch (error: any) {
        console.error("Payment Submission Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// 2. GET PAYMENTS (Landlord)
export const getPayments = async (req: any, res: Response) => {
    const { landlordId } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('LandlordId', sql.VarChar, landlordId)
            .query(`
                SELECT 
                    p.id, p.amount, p.payment_type as paymentType, p.date_paid as datePaid, 
                    p.status, p.proof_image as proofImage, p.remarks,
                    u.name as tenantName, da.room_number as roomNumber
                FROM payments p
                JOIN users u ON p.tenant_id = u.id
                LEFT JOIN dorm_assignments da ON p.tenant_id = da.tenant_id
                WHERE p.landlord_id = @LandlordId
                ORDER BY CASE WHEN p.status = 'Pending' THEN 1 ELSE 2 END, p.date_paid DESC
            `);
        res.json(result.recordset);
    } catch (error: any) {
        console.error("Fetch Payments Error:", error);
        res.status(500).json({ message: "Failed to load payments" });
    }
};

// 3. UPDATE STATUS (Approve/Reject)
export const updatePaymentStatus = async (req: any, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('Id', sql.VarChar, id)
            .input('Status', sql.VarChar, status)
            .query("UPDATE payments SET status = @Status WHERE id = @Id");
        res.json({ message: "Status updated successfully" });
    } catch (error: any) {
        console.error("Update Payment Error:", error);
        res.status(500).json({ message: "Failed to update status" });
    }
};

// 4. GET TENANT PAYMENT HISTORY (New)
export const getTenantPayments = async (req: any, res: Response) => {
    const { tenantId } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('TenantId', sql.VarChar, tenantId)
            .query(`
                SELECT 
                    p.id, 
                    p.amount, 
                    p.payment_type as paymentType, 
                    p.date_paid as datePaid, 
                    p.status, 
                    p.proof_image as proofImage, 
                    p.remarks,
                    u.name as landlordName 
                FROM payments p
                JOIN users u ON p.landlord_id = u.id 
                WHERE p.tenant_id = @TenantId
                ORDER BY p.date_paid DESC
            `);

        res.json(result.recordset);
    } catch (error: any) {
        console.error("Fetch Tenant Payments Error:", error);
        res.status(500).json({ message: "Failed to load history" });
    }
};