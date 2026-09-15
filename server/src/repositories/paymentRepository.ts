// server/src/repositories/paymentRepository.ts
import { pool, toDateOnly } from '../config/dbConfig';

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
        await pool.query(`INSERT INTO payments
            (id, tenant_id, landlord_id, amount, payment_type, proof_image, date_paid, remarks, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9)`,
            [paymentData.id || paymentData.paymentId, paymentData.tenantId, paymentData.landlordId,
             paymentData.amount, paymentData.paymentType, paymentData.proofImage,
             toDateOnly(paymentData.datePaid), paymentData.remarks || null, paymentData.status || 'Pending']);
    },
    // 2. Get payments for a Landlord
    getByLandlord: async (landlordId: string) => {

        const result = await pool.query(`
                SELECT 
                    p.id, p.amount::double precision AS amount, p.payment_type as "paymentType", (p.date_paid::timestamp AT TIME ZONE 'UTC') as "datePaid", 
                    p.status, p.proof_image as "proofImage", p.remarks,
                    u.name as "tenantName", da.room_number as "roomNumber"
                FROM payments p
                JOIN users u ON p.tenant_id = u.id
                LEFT JOIN dorm_assignments da ON p.tenant_id = da.tenant_id
                WHERE p.landlord_id = $1
                ORDER BY CASE WHEN p.status = 'Pending' THEN 1 ELSE 2 END, p.date_paid DESC
            `, [landlordId]);
        return result.rows;
    },

    // 3. Get payments for a Tenant
    getByTenant: async (tenantId: string) => {

        const result = await pool.query(`
                SELECT 
                    p.id, p.amount::double precision AS amount, p.payment_type as "paymentType", (p.date_paid::timestamp AT TIME ZONE 'UTC') as "datePaid", 
                    p.status, p.proof_image as "proofImage", p.remarks,
                    u.name as "landlordName" 
                FROM payments p
                JOIN users u ON p.landlord_id = u.id 
                WHERE p.tenant_id = $1
                ORDER BY p.date_paid DESC
            `, [tenantId]);
        return result.rows;
    },

    // 4. Update status
    updateStatus: async (id: string, status: string) => {

        await pool.query(`UPDATE payments SET status = $1 WHERE id = $2`, [status, id]);
    },

    // 5. Get Tenant Assignment and Landlord Details for Payment Verification
    getTenantAssignment: async (tenantId: string): Promise<TenantAssignmentRecord | null> => {

    const result = await pool.query(`
            SELECT da.landlord_id, da.room_number, u.email AS landlord_email 
            FROM dorm_assignments da
            JOIN users u ON da.landlord_id = u.id
            WHERE da.tenant_id = $1
        `, [tenantId]);
    return result.rows[0] || null;
},

    // 6. Get Tenant Email by Payment ID
    getTenantEmailByPaymentId: async (paymentId: string): Promise<string | null> => {

        const result = await pool.query(`
                SELECT u.email 
                FROM payments p 
                JOIN users u ON p.tenant_id = u.id 
                WHERE p.id = $1
            `, [paymentId]);
        return result.rows[0]?.email || null;
    },

    // 7. Verify and append remarks to a Payment
    verify: async (id: string, status: string, appendedRemarks: string) => {

        await pool.query(`
                UPDATE payments 
                SET status = $1, remarks = CONCAT(remarks, $2::text) 
                WHERE id = $3
            `, [status, appendedRemarks, id]);
    }
};
