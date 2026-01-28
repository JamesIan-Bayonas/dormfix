import api from '../api/client';

export const paymentService = {
    
    // Submit Payment
    create: async (formData: FormData) => {
        const response = await api.post('/payments/submit', formData);
        return response.data;
    },

    // Get Payments (Landlord)
    getByLandlord: async (landlordId: string) => {
        const response = await api.get(`/landlord/payments/${landlordId}`);
        return response.data;
    },

    // Update Status (Landlord)
    updateStatus: async (id: string, status: string, rejectionReason?: string) => {
        const response = await api.patch(`/payments/${id}/status`, { status, rejectionReason });
        return response.data;
    },

    // Get Payment History
    getByTenant: async (tenantId: string) => {
        const response = await api.get(`/tenant/payments/${tenantId}`);
        return response.data;
    }
};