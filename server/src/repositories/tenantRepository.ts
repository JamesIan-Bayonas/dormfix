// server/src/repositories/tenantRepository.ts
import { sql, poolPromise } from '../config/dbConfig';
import crypto from 'crypto';

export interface TenantHousingDetails {
    landlordId: string;
    landlordName: string;
    landlordEmail: string;
    landlordPhone?: string | null;
    roomNumber: string;
    moveInDate: Date | string;
}

export interface LandlordTenantRecord {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string | null;
    isApproved: boolean;
    createdAt: Date | string;
    roomNumber: string;
}

export const tenantRepository = {
    // 1. Approve Tenant
    approve: async (tenantId: string) => {
        const pool = await poolPromise;
        await pool.request()
            .input('tenantId', sql.VarChar(36), tenantId)
            .query(`UPDATE users SET is_approved = 1 WHERE id = @tenantId`);
    },

    // 2. Reject and Unlink Tenant Transaction
    rejectTenantTransaction: async (tenantId: string) => {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            request.input('tenantId', sql.VarChar(36), tenantId);

            await request.query('DELETE FROM payments WHERE tenant_id = @tenantId');
            await request.query('DELETE FROM maintenance_requests WHERE tenant_id = @tenantId');
            await request.query('DELETE FROM dorm_assignments WHERE tenant_id = @tenantId');
            await request.query('UPDATE users SET is_approved = 0 WHERE id = @tenantId');

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    // 3. Get Tenant Housing Details with Landlord Phone
    getHousingDetails: async (tenantId: string): Promise<TenantHousingDetails | null> => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('tenantId', sql.VarChar(36), tenantId)
            .query(`
                SELECT 
                    da.landlord_id AS landlordId,
                    u.name AS landlordName, 
                    u.email AS landlordEmail,
                    u.phone_number AS landlordPhone,
                    da.room_number AS roomNumber, 
                    da.move_in_date AS moveInDate
                FROM dorm_assignments da
                JOIN users u ON da.landlord_id = u.id
                WHERE da.tenant_id = @tenantId
            `);
        return result.recordset[0] || null;
    },

    // 4. Re-link Tenant to Landlord Transaction
    relinkTransaction: async (tenantId: string, landlordCode: string) => {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const landlordCheck = new sql.Request(transaction);
            const landlordResult = await landlordCheck.input('code', sql.VarChar(50), landlordCode)
                .query("SELECT id FROM users WHERE dorm_fix_id = @code AND role = 'landlord'");

            if (landlordResult.recordset.length === 0) {
                throw new Error("Invalid Landlord Code. No matching landlord found.");
            }

            const landlordId = landlordResult.recordset[0].id;
            const assignmentId = crypto.randomUUID();

            const assignRequest = new sql.Request(transaction);
            await assignRequest
                .input('id', sql.VarChar(36), assignmentId)
                .input('tenantId', sql.VarChar(36), tenantId)
                .input('landlordId', sql.VarChar(36), landlordId)
                .query(`
                    INSERT INTO dorm_assignments (id, tenant_id, landlord_id, room_number, move_in_date, created_at)
                    VALUES (@id, @tenantId, @landlordId, 'Unassigned', GETDATE(), GETDATE())
                `);

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    // 5. Get all tenants belonging to a Landlord with Phone Numbers
    getByLandlord: async (landlordId: string): Promise<LandlordTenantRecord[]> => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('lid', sql.VarChar(36), landlordId) 
            .query(`
                SELECT 
                    u.id, 
                    u.name, 
                    u.email,
                    u.phone_number AS phoneNumber,
                    u.is_approved AS isApproved,
                    u.created_at AS createdAt,
                    da.room_number AS roomNumber
                FROM users u
                INNER JOIN dorm_assignments da ON u.id = da.tenant_id
                WHERE u.role = 'tenant' AND da.landlord_id = @lid
            `);
        return result.recordset;
    },

    // 6. Update User Approval Status
    updateApprovalStatus: async (id: string, isApproved: boolean) => {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('isApproved', sql.Bit, isApproved ? 1 : 0) 
            .query(`UPDATE users SET is_approved = @isApproved WHERE id = @id`);
    }
};