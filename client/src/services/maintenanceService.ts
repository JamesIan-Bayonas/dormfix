import { apiClient } from '../api/client';
import type { LandlordMaintenanceRequest, MaintenanceRequest as BaseMaintenanceRequest } from '../types/types';

// For backward compatibility, re-export the base type
export type MaintenanceRequest = BaseMaintenanceRequest;

export const maintenanceService = {
    // 1. GET REQUESTS - Returns different types based on role
    getRequests: async (userId: string, role: 'landlord' | 'tenant'): Promise<LandlordMaintenanceRequest[]> => {
        const { data } = await apiClient.get<LandlordMaintenanceRequest[]>(`/api/maintenance/${userId}?role=${role}`);
        return data;
    },

    // ... rest of the file stays the same
    submitRequest: async (tenantId: string, issueType: string, description: string, urgency: string) => {
        const { data } = await apiClient.post('/api/maintenance', {
            tenantId,
            issueType,
            description,
            urgency
        });
        return data;
    },

    updateStatus: async (id: string, status: string) => {
        const { data } = await apiClient.patch(`/api/maintenance/status/${id}`, { status });
        return data;
    }
};