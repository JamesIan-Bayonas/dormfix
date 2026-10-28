import { paymentService } from '../services/paymentService';
import { useTenantRecords } from './useTenantRecords';

export const useMyPayments = (tenantId: string | undefined) => {
    const records = useTenantRecords(tenantId, paymentService.getMyPayments, 'Payment history could not be loaded. Please try again.');
    return { payments: records.data, isLoading: records.loading, error: records.error, refresh: records.retry };
};
