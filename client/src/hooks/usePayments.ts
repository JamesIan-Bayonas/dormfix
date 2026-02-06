import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/paymentService';
import type { Payment } from '../types/types';

export const usePayments = (landlordId: string | undefined) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPayments = useCallback(async () => {
        if (!landlordId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            // 🟢 FIXED: Changed 'getPayments' to 'getByLandlord' to match your Service
            const data = await paymentService.getByLandlord(landlordId);
            setPayments(data);
        } catch (error) {
            console.error("Failed to load payments", error);
        } finally {
            setIsLoading(false);
        }
    }, [landlordId]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const verifyPayment = async (id: string, status: 'Verified' | 'Rejected', reason?: string) => {
        // Optimistic Update
        setPayments(prev => prev.map(p => p.id === id ? { ...p, status } : p));
        try {
            await paymentService.updateStatus(id, status, reason);
        } catch (error) {
            alert("Failed to update status");
            fetchPayments(); // Revert on error
        }
    };

    return { payments, isLoading, verifyPayment, refresh: fetchPayments };
};