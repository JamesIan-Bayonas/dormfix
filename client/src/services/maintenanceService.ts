import { apiClient } from '../api/client';
import type { MaintenanceStatus, LandlordMaintenanceRequest } from '../types/types';

export const maintenanceService = {
    // Fetch requests (supports both landlord and tenant via the 'role' param)
    getRequests: async (userId: string, role: 'landlord' | 'tenant'): Promise<LandlordMaintenanceRequest[]> => {
        return apiClient<LandlordMaintenanceRequest[]>(`/maintenance/${userId}?role=${role}`);
    },

    // Update the status of a request
    updateStatus: async (id: string, status: MaintenanceStatus): Promise<{ message: string }> => {
        return apiClient<{ message: string }>(`/maintenance/status/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }
};