// 1. Correct the import to use the Named Export
import { apiClient } from '../api/client';

export const paymentService = {
    
    // Submit Payment (FormData)
    create: async (formData: FormData) => {
        return apiClient<any>('/payments/submit', {
            method: 'POST',
            body: formData,
            headers: {
            } 
        });
    },

    // Get Payments (Landlord)
    getByLandlord: async (landlordId: string) => {
        return apiClient<any>(`/landlord/payments/${landlordId}`);
    },

    // Update Status (Landlord)
    updateStatus: async (id: string, status: string, rejectionReason?: string) => {
        return apiClient<any>(`/payments/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, rejectionReason })
        });
    },

    // Get Payment History
    getByTenant: async (tenantId: string) => {
        return apiClient<any>(`/tenant/payments/${tenantId}`);
    }
};