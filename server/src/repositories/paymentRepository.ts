// server/src/repositories/paymentRepository.ts
import { sql, poolPromise } from '../config/dbConfig';

export interface PaymentRecordInput {
    id?: string;
    paymentId?: string;
    tenantId: string;
    landlordId: string;
    amount: number;
    paymentType: string;
    proofImage: string;
    datePaid: Date | string;
    remarks?: string;
    status?: string;
}

export interface TenantAssignmentRecord {
    landlord_id: string;
    room_number: string;
    landlord_email: string;
}

export const paymentRepository = {
    // 1. Create a new payment
    create: async (paymentData: PaymentRecordInput) => {
        const pool = await poolPromise;
        const query = `
            INSERT INTO payments 
            (id, tenant_id, landlord_id, amount, payment_type, proof_image, date_paid, remarks, status)
            VALUES 
            (@Id, @TenantId, @LandlordId, @Amount, @PaymentType, @ProofImage, @DatePaid, @Remarks, @Status)
        `;
        const request = new sql.Request(pool);
        request.input('Id', sql.VarChar(36), paymentData.id || paymentData.paymentId);
        request.input('TenantId', sql.VarChar(36), paymentData.tenantId);
        request.input('LandlordId', sql.VarChar(36), paymentData.landlordId);
        request.input('Amount', sql.Decimal(10, 2), paymentData.amount);
        request.input('PaymentType', sql.VarChar(50), paymentData.paymentType);
        request.input('ProofImage', sql.VarChar(255), paymentData.proofImage);
        request.input('DatePaid', sql.Date, paymentData.datePaid);
        request.input('Remarks', sql.NVarChar(sql.MAX), paymentData.remarks || null);
        request.input('Status', sql.VarChar(20), paymentData.status || 'Pending');

        await request.query(query);
    },

    // 2. Get payments for a Landlord
    getByLandlord: async (landlordId: string) => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('LandlordId', sql.VarChar(36), landlordId)
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
        return result.recordset;
    },

    // 3. Get payments for a Tenant
    getByTenant: async (tenantId: string) => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('TenantId', sql.VarChar(36), tenantId)
            .query(`
                SELECT 
                    p.id, p.amount, p.payment_type as paymentType, p.date_paid as datePaid, 
                    p.status, p.proof_image as proofImage, p.remarks,
                    u.name as landlordName 
                FROM payments p
                JOIN users u ON p.landlord_id = u.id 
                WHERE p.tenant_id = @TenantId
                ORDER BY p.date_paid DESC
            `);
        return result.recordset;
    },

    // 4. Update status
    updateStatus: async (id: string, status: string) => {
        const pool = await poolPromise;
        await pool.request()
            .input('Id', sql.VarChar(36), id)
            .input('Status', sql.VarChar(20), status)
            .query("UPDATE payments SET status = @Status WHERE id = @Id");
    },

    // 5. Get Tenant Assignment and Landlord Details for Payment Verification
    getTenantAssignment: async (tenantId: string): Promise<TenantAssignmentRecord | null> => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('tid', sql.VarChar(36), tenantId)
            .query(`
                SELECT da.landlord_id, da.room_number, u.email AS landlord_email 
                FROM dorm_assignments da
                JOIN users u ON da.landlord_id = u.id
                WHERE da.tenant_id = @tid
            `);
        return result.recordset[0] || null;
    },

    // 6. Get Tenant Email by Payment ID
    getTenantEmailByPaymentId: async (paymentId: string): Promise<string | null> => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('pid', sql.VarChar(36), paymentId)
            .query(`
                SELECT u.email 
                FROM payments p 
                JOIN users u ON p.tenant_id = u.id 
                WHERE p.id = @pid
            `);
        return result.recordset[0]?.email || null;
    },

    // 7. Verify and append remarks to a Payment
    verify: async (id: string, status: string, appendedRemarks: string) => {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('status', sql.VarChar(20), status)
            .input('appendedText', sql.NVarChar(sql.MAX), appendedRemarks)
            .query(`
                UPDATE payments 
                SET status = @status, remarks = CONCAT(remarks, @appendedText) 
                WHERE id = @id
            `);
    }
};