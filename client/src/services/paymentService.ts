import { apiClient } from '../api/client';
import type { Payment } from '../types/types';

export const paymentService = {
    getPayments: async (landlordId: string): Promise<Payment[]> => {
        return apiClient<Payment[]>(`/landlord/payments/${landlordId}`);
    },

    updateStatus: async (id: string, status: 'Verified' | 'Rejected'): Promise<void> => {
        return apiClient(`/payments/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }
};