// server/src/repositories/maintenanceRepository.ts
import { sql, poolPromise } from '../config/dbConfig';

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
        const pool = await poolPromise;
        const result = await pool.request()
            .input('tid', sql.VarChar(36), tenantId)
            .query(`
                SELECT da.room_number, u.email AS landlord_email, u.phone_number AS landlord_phone
                FROM dorm_assignments da
                JOIN users u ON da.landlord_id = u.id
                WHERE da.tenant_id = @tid
            `);
        return result.recordset[0] || null;
    },

    // 2. Create a new maintenance request with notification telemetry
    create: async (data: MaintenanceRecordInput) => {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar(36), data.id)
            .input('tenantId', sql.VarChar(36), data.tenantId)
            .input('issueType', sql.VarChar(50), data.issueType)
            .input('description', sql.NVarChar(sql.MAX), data.description)
            .input('urgency', sql.VarChar(20), data.urgency)
            .input('notificationStatus', sql.VarChar(50), data.notificationStatus || 'Not Required')
            .query(`
                INSERT INTO maintenance_requests (id, tenant_id, issue_type, description, urgency, status, notification_status, date_submitted)
                VALUES (@id, @tenantId, @issueType, @description, @urgency, 'Pending', @notificationStatus, GETDATE())
            `);
    },

    // 3. Get all maintenance requests for a landlord
    getByLandlord: async (landlordId: string): Promise<LandlordMaintenanceRecord[]> => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.VarChar(36), landlordId)
            .query(`
                SELECT 
                    mr.id, 
                    mr.tenant_id as tenantId,
                    mr.issue_type as issueType, 
                    mr.description, 
                    mr.urgency, 
                    mr.status, 
                    mr.notification_status as notificationStatus,
                    mr.date_submitted as dateSubmitted,
                    ISNULL(u.name, 'Unknown Tenant') as tenantName, 
                    ISNULL(da.room_number, 'N/A') as roomNumber
                FROM maintenance_requests mr
                INNER JOIN dorm_assignments da ON mr.tenant_id = da.tenant_id
                INNER JOIN users u ON mr.tenant_id = u.id
                WHERE da.landlord_id = @userId
                ORDER BY 
                    CASE WHEN mr.urgency = 'Emergency' THEN 1 WHEN mr.urgency = 'High' THEN 2 ELSE 3 END,
                    mr.date_submitted DESC
            `);
        return result.recordset;
    },

    // 4. Get all maintenance requests for a tenant
    getByTenant: async (tenantId: string): Promise<TenantMaintenanceRecord[]> => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.VarChar(36), tenantId)
            .query(`
                SELECT 
                    id, 
                    tenant_id as tenantId,
                    issue_type as issueType, 
                    description, 
                    urgency, 
                    status, 
                    notification_status as notificationStatus,
                    date_submitted as dateSubmitted, 
                    admin_remarks as adminRemarks
                FROM maintenance_requests 
                WHERE tenant_id = @userId
                ORDER BY date_submitted DESC
            `);
        return result.recordset;
    },

    // 5. Update request status
    updateStatus: async (id: string, status: string) => {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('status', sql.VarChar(20), status)
            .query(`UPDATE maintenance_requests SET status = @status WHERE id = @id`);
    }
};