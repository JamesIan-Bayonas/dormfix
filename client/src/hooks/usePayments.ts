import { useState, useEffect, useCallback } from 'react';
import { paymentService, type Payment } from '../services/paymentService';

export const usePayments = (landlordId: string | undefined) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPayments = useCallback(async () => {
        if (!landlordId) return;
        try {
            setIsLoading(true);
            const data = await paymentService.getLandlordPayments(landlordId);
            setPayments(data);
            setError(null);
        } catch (err) {
            console.error("Failed to load payments", err);
            setError("Failed to load payment records.");
        } finally {
            setIsLoading(false);
        }
    }, [landlordId]);

    // Initial Load
    useEffect(() => {
        if (landlordId) {
            fetchPayments();
        }
    }, [landlordId, fetchPayments]);

    // Action: Verify Payment
    const verifyPayment = async (id: string, status: 'Verified' | 'Rejected', reason?: string) => {
        try {
            await paymentService.verifyPayment(id, status, reason);
            // Optimistic Update (Instant Feedback)
            setPayments(current => current.map(p => 
                p.id === id ? { ...p, status, rejectionReason: reason } : p
            ));
            return true;
        } catch (err) {
            console.error("Verification failed", err);
            return false;
        }
    };

    return { payments, isLoading, error, refreshPayments: fetchPayments, verifyPayment };
};