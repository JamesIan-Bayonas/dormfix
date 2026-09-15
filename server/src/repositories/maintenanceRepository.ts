// server/src/repositories/maintenanceRepository.ts
import { pool } from '../config/dbConfig';

export interface MaintenanceRecordInput {
    id: string;
    tenantId: string;
    issueType: string;
    description: string;
    urgency: string;
    notificationStatus?: string;
}

export interface TenantRoomContext {
    room_number: string;
    landlord_email: string;
    landlord_phone?: string | null;
}

export interface LandlordMaintenanceRecord {
    id: string;
    tenantId: string;
    issueType: string;
    description: string;
    urgency: string;
    status: string;
    dateSubmitted: Date | string;
    tenantName: string;
    roomNumber: string;
    notificationStatus?: string;
}

export interface TenantMaintenanceRecord {
    id: string;
    tenantId: string;
    issueType: string;
    description: string;
    urgency: string;
    status: string;
    dateSubmitted: Date | string;
    adminRemarks?: string;
    notificationStatus?: string;
}

export const maintenanceRepository = {
    // 1. Get room number, landlord email, and landlord phone context for a tenant
    getRoomContext: async (tenantId: string): Promise<TenantRoomContext | null> => {

    const result = await pool.query(`
            SELECT da.room_number, u.email AS landlord_email, u.phone_number AS landlord_phone
            FROM dorm_assignments da
            JOIN users u ON da.landlord_id = u.id
            WHERE da.tenant_id = $1
        `, [tenantId]);
    return result.rows[0] || null;
},

    // 2. Create a new maintenance request with notification telemetry
    create: async (data: MaintenanceRecordInput) => {

        await pool.query(`
                INSERT INTO maintenance_requests (id, tenant_id, issue_type, description, urgency, status, notification_status, date_submitted)
                VALUES ($1, $2, $3, $4, $5, 'Pending', $6, now())
            `, [data.id, data.tenantId, data.issueType, data.description, data.urgency, data.notificationStatus || 'Not Required']);
    },

    // 3. Get all maintenance requests for a landlord
    getByLandlord: async (landlordId: string): Promise<LandlordMaintenanceRecord[]> => {

        const result = await pool.query(`
                SELECT 
                    mr.id, 
                    mr.tenant_id as "tenantId",
                    mr.issue_type as "issueType", 
                    mr.description, 
                    mr.urgency, 
                    mr.status, 
                    mr.notification_status as "notificationStatus",
                    mr.date_submitted as "dateSubmitted",
                    COALESCE(u.name, 'Unknown Tenant') as "tenantName", 
                    COALESCE(da.room_number, 'N/A') as "roomNumber"
                FROM maintenance_requests mr
                INNER JOIN dorm_assignments da ON mr.tenant_id = da.tenant_id
                INNER JOIN users u ON mr.tenant_id = u.id
                WHERE da.landlord_id = $1
                ORDER BY 
                    CASE WHEN mr.urgency = 'Emergency' THEN 1 WHEN mr.urgency = 'High' THEN 2 ELSE 3 END,
                    mr.date_submitted DESC
            `, [landlordId]);
        return result.rows;
    },

    // 4. Get all maintenance requests for a tenant
    getByTenant: async (tenantId: string): Promise<TenantMaintenanceRecord[]> => {

        const result = await pool.query(`
                SELECT 
                    id, 
                    tenant_id as "tenantId",
                    issue_type as "issueType", 
                    description, 
                    urgency, 
                    status, 
                    notification_status as "notificationStatus",
                    date_submitted as "dateSubmitted", 
                    admin_remarks as "adminRemarks"
                FROM maintenance_requests 
                WHERE tenant_id = $1
                ORDER BY date_submitted DESC
            `, [tenantId]);
        return result.rows;
    },

    // 5. Update request status
    updateStatus: async (id: string, status: string) => {

        await pool.query(`UPDATE maintenance_requests SET status = $1 WHERE id = $2`, [status, id]);
    }
};