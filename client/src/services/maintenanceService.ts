import api from '../api/client';
import type { MaintenanceStatus, LandlordMaintenanceRequest } from '../types/types';

export const maintenanceService = {
    // Fetch requests supports both landlords and tenants
    getRequests: async (userId: string, role: 'landlord' | 'tenant'): Promise<LandlordMaintenanceRequest[]> => {
        const response = await api.get(`/maintenance/${userId}?role=${role}`);
        return response.data;
    },

    // Update the status of a request
    updateStatus: async (id: string, status: MaintenanceStatus): Promise<{ message: string }> => {
        const response = await api.patch(`/maintenance/status/${id}`, { status });
        return response.data;
    }
};