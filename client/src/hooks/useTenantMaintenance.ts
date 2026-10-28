import { sessionFetch } from '../api/session';
import type { MaintenanceRequest } from '../types/types';
import { useTenantRecords } from './useTenantRecords';

async function loadMaintenance(id: string): Promise<MaintenanceRequest[]> {
    const response = await sessionFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/maintenance/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error('Maintenance read failed');
    return response.json();
}

export function useTenantMaintenance(tenantId: string | undefined) {
    return useTenantRecords(tenantId, loadMaintenance, 'Maintenance history could not be loaded. Please try again.');
}
