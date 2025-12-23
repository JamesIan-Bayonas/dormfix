import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { paymentRepository } from '../repositories/paymentRepository';

// 1. SUBMIT PAYMENT
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
        const paymentId = randomUUID();
        // CALL THE REPOSITORY
        await paymentRepository.create({
            paymentId, tenantId, landlordId, amount, paymentType, proofImage, datePaid, remarks: remarks || ''
        });

        res.status(201).json({ success: true, message: "Payment submitted successfully." });
    } catch (error: any) {
        console.error("Payment Submission Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// 2. GET PAYMENTS (Landlord)
export const getPayments = async (req: Request, res: Response) => {
    const { landlordId } = req.params;
    try {
        const data = await paymentRepository.getByLandlord(landlordId);
        res.json(data);
    } catch (error: any) {
        console.error("Fetch Payments Error:", error);
        res.status(500).json({ message: "Failed to load payments" });
    }
};

// 3. UPDATE STATUS
export const updatePaymentStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await paymentRepository.updateStatus(id, status);
        res.json({ message: "Status updated successfully" });
    } catch (error: any) {
        console.error("Update Payment Error:", error);
        res.status(500).json({ message: "Failed to update status" });
    }
};

// 4. GET TENANT HISTORY
export const getTenantPayments = async (req: Request, res: Response) => {
    const { tenantId } = req.params;
    try {
        const data = await paymentRepository.getByTenant(tenantId);
        res.json(data);
    } catch (error: any) {
        console.error("Fetch Tenant Payments Error:", error);
        res.status(500).json({ message: "Failed to load history" });
    }
};