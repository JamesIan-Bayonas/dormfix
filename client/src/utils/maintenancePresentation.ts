import type { MaintenanceRequest, MaintenanceStatus } from '../types/types';

export const issueTypes = ['Plumbing', 'Electrical', 'Appliance', 'Structural', 'Other'] as const;
export const urgencyLevels = ['Low', 'Medium', 'High', 'Emergency'] as const;
export const maintenanceStatuses = ['Pending', 'In Progress', 'Completed', 'Rejected'] as const;

export function maintenanceStatus(status: string) {
    switch (status) {
        case 'Pending': return { label: 'Awaiting review', tone: 'info' as const };
        case 'In Progress': return { label: 'In progress', tone: 'warning' as const };
        case 'Completed': return { label: 'Completed', tone: 'success' as const };
        case 'Rejected': return { label: 'Rejected', tone: 'error' as const };
        default: return { label: 'Status unavailable', tone: 'neutral' as const };
    }
}
export function urgencyTone(urgency: string) {
    return urgency === 'Emergency' ? 'error' as const : urgency === 'High' ? 'warning' as const : 'neutral' as const;
}
export function nextMaintenanceStatus(status: string): MaintenanceStatus | null {
    return status === 'Pending' ? 'In Progress' : status === 'In Progress' ? 'Completed' : null;
}
export function filterMaintenance<T extends MaintenanceRequest & { tenantName?: string; roomNumber?: string }>(requests: T[], status: string, urgency: string, query = '') {
    const normalized = query.trim().toLowerCase();
    return requests.filter(request => (status === 'all' || (status === 'active' ? request.status === 'Pending' || request.status === 'In Progress' : request.status === status)) &&
        (urgency === 'all' || request.urgency === urgency) && `${request.issueType} ${request.description} ${request.tenantName || ''} ${request.roomNumber || ''}`.toLowerCase().includes(normalized));
}
/* Roll back this record's status only; concurrent changes to other records must survive. */
export function replaceMaintenanceStatus<T extends MaintenanceRequest>(requests: T[], id: string, status: MaintenanceStatus) {
    return requests.map(request => request.id === id ? { ...request, status } : request);
}
export interface MaintenanceFields { issueType: string; urgency: string; description: string }
export function maintenanceBody(tenantId: string, fields: MaintenanceFields) {
    return { tenantId, issueType: fields.issueType, urgency: fields.urgency, description: fields.description };
}
