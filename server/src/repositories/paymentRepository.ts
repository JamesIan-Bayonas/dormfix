import { sql, poolPromise } from '../dbConfig';

export const paymentRepository = {
    // 1. Create a new payment
    create: async (paymentData: any) => {
        const pool = await poolPromise;
        const query = `
            INSERT INTO payments 
            (id, tenant_id, landlord_id, amount, payment_type, proof_image, date_paid, remarks, status)
            VALUES 
            (@Id, @TenantId, @LandlordId, @Amount, @PaymentType, @ProofImage, @DatePaid, @Remarks, 'Pending')
        `;
        const request = new sql.Request(pool);
        request.input('Id', sql.VarChar, paymentData.paymentId);
        request.input('TenantId', sql.VarChar, paymentData.tenantId);
        request.input('LandlordId', sql.VarChar, paymentData.landlordId);
        request.input('Amount', sql.Decimal(10, 2), paymentData.amount);
        request.input('PaymentType', sql.VarChar, paymentData.paymentType);
        request.input('ProofImage', sql.VarChar, paymentData.proofImage);
        request.input('DatePaid', sql.Date, paymentData.datePaid);
        request.input('Remarks', sql.NVarChar, paymentData.remarks);

        await request.query(query);
    },

    // 2. Get payments for a Landlord
    getByLandlord: async (landlordId: string) => {
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
        return result.recordset;
    },

    // 3. Get payments for a Tenant
    getByTenant: async (tenantId: string) => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('TenantId', sql.VarChar, tenantId)
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
            .input('Id', sql.VarChar, id)
            .input('Status', sql.VarChar, status)
            .query("UPDATE payments SET status = @Status WHERE id = @Id");
    }
};