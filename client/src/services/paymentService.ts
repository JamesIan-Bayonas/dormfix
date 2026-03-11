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
    // 1. GET LANDLORD PAYMENTS (Updated URL)
    getLandlordPayments: async (landlordId: string): Promise<Payment[]> => {
        // Matches server/src/routes/paymentRoutes.ts: router.get('/landlord/:landlordId', ...)
        const { data } = await apiClient.get<Payment[]>(`/api/payments/landlord/${landlordId}`);
        return data;
    },

    // 2. GET TENANT HISTORY (Updated URL)
    getMyPayments: async (tenantId: string): Promise<Payment[]> => {
        // Matches router.get('/history/:tenantId', ...)
        const { data } = await apiClient.get<Payment[]>(`/api/payments/history/${tenantId}`);
        return data;
    },

    // 3. SUBMIT PAYMENT (Already Fixed in Form, but good to have here)
    submitPayment: async (formData: FormData) => {
        // Matches router.post('/', ...)
        const { data } = await apiClient.post('/api/payments', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    // 4. VERIFY PAYMENT (Updated URL)
    verifyPayment: async (id: string, status: 'Verified' | 'Rejected', reason?: string) => {
        // Matches router.patch('/:id/verify', ...)
        const { data } = await apiClient.patch(`/api/payments/${id}/verify`, { status, reason });
        return data;
    }
};