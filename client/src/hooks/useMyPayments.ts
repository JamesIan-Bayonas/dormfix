import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/paymentService';
import type { Payment } from '../types/types';

export const useMyPayments = (tenantId: string | undefined) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPayments = useCallback(async () => {
        if (!tenantId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const data = await paymentService.getMyPayments(tenantId);
            setPayments(data);
            setError(null);
        } catch (err) {
            console.error("Failed to load payment history", err);
            setError('Payment history could not be loaded. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    return { payments, isLoading, error, refresh: fetchPayments };
};
