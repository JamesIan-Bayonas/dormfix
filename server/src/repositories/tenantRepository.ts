// server/src/repositories/tenantRepository.ts
import { pool, withTransaction } from '../config/dbConfig';
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

        await pool.query(`UPDATE users SET is_approved = true WHERE id = $1`, [tenantId]);
    },

    // 2. Reject and Unlink Tenant Transaction
    rejectTenantTransaction: async (tenantId: string) => {
        await withTransaction(async client => {
            await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [tenantId]);
            await client.query('DELETE FROM payments WHERE tenant_id = $1', [tenantId]);
            await client.query('DELETE FROM maintenance_requests WHERE tenant_id = $1', [tenantId]);
            await client.query('DELETE FROM dorm_assignments WHERE tenant_id = $1', [tenantId]);
            await client.query('UPDATE users SET is_approved = false WHERE id = $1', [tenantId]);
        });
    },
    // 3. Get Tenant Housing Details with Landlord Phone
    getHousingDetails: async (tenantId: string): Promise<TenantHousingDetails | null> => {

        const result = await pool.query(`
                SELECT 
                    da.landlord_id AS "landlordId",
                    u.name AS "landlordName", 
                    u.email AS "landlordEmail",
                    u.phone_number AS "landlordPhone",
                    da.room_number AS "roomNumber", 
                    (da.move_in_date::timestamp AT TIME ZONE 'UTC') AS "moveInDate"
                FROM dorm_assignments da
                JOIN users u ON da.landlord_id = u.id
                WHERE da.tenant_id = $1
            `, [tenantId]);
        return result.rows[0] || null;
    },

    // 4. Re-link Tenant to Landlord Transaction
    relinkTransaction: async (tenantId: string, landlordCode: string) => {
        await withTransaction(async client => {
            await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [tenantId]);
            const landlord = await client.query(
                "SELECT id FROM users WHERE dorm_fix_id = $1 AND role = 'landlord'", [landlordCode]);
            if (!landlord.rows.length) throw new Error('Invalid Landlord Code. No matching landlord found.');
            await client.query(`INSERT INTO dorm_assignments
                (id, tenant_id, landlord_id, room_number, move_in_date)
                VALUES ($1, $2, $3, 'Unassigned', CURRENT_DATE)`,
                [crypto.randomUUID(), tenantId, landlord.rows[0].id]);
        });
    },
    // 5. Get all tenants belonging to a Landlord with Phone Numbers
    getByLandlord: async (landlordId: string): Promise<LandlordTenantRecord[]> => {

        const result = await pool.query(`
                SELECT 
                    u.id, 
                    u.name, 
                    u.email,
                    u.phone_number AS "phoneNumber",
                    u.is_approved AS "isApproved",
                    u.created_at AS "createdAt",
                    da.room_number AS "roomNumber"
                FROM users u
                INNER JOIN dorm_assignments da ON u.id = da.tenant_id
                WHERE u.role = 'tenant' AND da.landlord_id = $1
            `, [landlordId]);
        return result.rows;
    },

    // 6. Update User Approval Status
    updateApprovalStatus: async (id: string, isApproved: boolean) => {

        await pool.query(`UPDATE users SET is_approved = $1 WHERE id = $2`, [Boolean(isApproved ? 1 : 0), id]);
    }
};