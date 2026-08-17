// client/src/services/paymentService.ts
import { apiClient } from '../api/client';

export interface Payment {
    id: string;
    amount: number;
    paymentType: string;
    datePaid: string;
    status: 'Pending' | 'Verified' | 'Rejected' | 'Anomalous';
    proofImage: string;
    remarks?: string;
    tenantName?: string; 
    roomNumber?: string;
    rejectionReason?: string;
}

export const paymentService = {
    // 1. GET LANDLORD PAYMENTS
    getLandlordPayments: async (landlordId: string): Promise<Payment[]> => {
        const { data } = await apiClient.get<Payment[]>(`/api/payments/landlord/${landlordId}`);
        return data;
    },

    // 2. GET TENANT HISTORY
    getMyPayments: async (tenantId: string): Promise<Payment[]> => {
        const { data } = await apiClient.get<Payment[]>(`/api/payments/history/${tenantId}`);
        return data;
    },

    // 3. SUBMIT PAYMENT
    submitPayment: async (formData: FormData) => {
        const { data } = await apiClient.post('/api/payments', formData);
        return data;
    },

    // 4. VERIFY PAYMENT
    verifyPayment: async (id: string, status: 'Verified' | 'Rejected', reason?: string) => {
        const { data } = await apiClient.patch(`/api/payments/${id}/verify`, { status, reason });
        return data;
    }
};