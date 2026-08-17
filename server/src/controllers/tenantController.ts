// server/src/controllers/tenantController.ts
import type { Request, Response } from 'express';
import { tenantRepository } from '../repositories/tenantRepository';

// 1. APPROVE TENANT
export const approveTenant = async (req: Request, res: Response) => {
    const { tenantId } = req.params;

    try {
        await tenantRepository.approve(tenantId);
        res.json({ message: "Tenant approved successfully" });
    } catch (error) {
        console.error("Approval Error:", error);
        res.status(500).json({ error: "Failed to approve tenant" });
    }
};

// 2. REJECT / UNLINK TENANT (Soft Rejection - Preserves User Account)
export const rejectTenant = async (req: Request, res: Response) => {
    const { tenantId } = req.params;

    try {
        await tenantRepository.rejectTenantTransaction(tenantId);
        res.json({ message: "Tenant application rejected successfully" });
    } catch (error) {
        console.error("Reject Error:", error);
        res.status(500).json({ error: "Failed to reject tenant" });
    }
};

// 3. GET TENANT HOUSING DETAILS
export const getTenantDetails = async (req: Request, res: Response) => {
    const { tenantId } = req.params;

    try {
        const details = await tenantRepository.getHousingDetails(tenantId);

        if (!details) {
             res.status(404).json({ error: "Assignment not found", isUnlinked: true });
             return;
        }

        res.json(details);
    } catch (error) {
        console.error("Fetch Housing Details Error:", error);
        res.status(500).json({ error: "Failed to fetch details" });
    }
};

// 4. RE-LINK TO NEW LANDLORD (For rejected or unassigned tenants)
export const relinkTenant = async (req: Request, res: Response) => {
    const { tenantId, landlordCode } = req.body;

    if (!tenantId || !landlordCode) {
        res.status(400).json({ error: "Tenant ID and Landlord Code are required." });
        return;
    }

    try {
        await tenantRepository.relinkTransaction(tenantId, landlordCode);
        res.status(200).json({ message: "Re-linked successfully. Awaiting approval." });
    } catch (error: any) {
        console.error("Relink Error:", error.message);
        res.status(400).json({ error: error.message || "Failed to link landlord." });
    }
};

// 5. GET ALL TENANTS FOR LANDLORD
export const getLandlordTenants = async (req: Request, res: Response) => {
    const { landlordId } = req.params;
    try {
        const tenants = await tenantRepository.getByLandlord(landlordId);
        res.json(tenants);
    } catch (err) {
        console.error("Fetch Tenants Error:", err); 
        res.status(500).json({ error: "Failed to fetch tenants" });
    }
};

// 6. UPDATE USER STATUS (Generic)
export const updateUserStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isApproved } = req.body; 

    try {
        await tenantRepository.updateApprovalStatus(id, isApproved === true);
        res.json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ error: "Failed to update status" });
    }
};