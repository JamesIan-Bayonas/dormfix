import { useAuth } from '../UserContext';
import { useMyPayments } from '../../hooks/useMyPayments';
import { PaymentLedger } from '../payments/PaymentLedger';

export function TenantPaymentHistory({ onBack }: { onBack: () => void }) {
    const { user } = useAuth();
    const { payments, isLoading, error, refresh } = useMyPayments(user?.id);
    return <PaymentLedger role="tenant" payments={payments} loading={isLoading} error={error} onRetry={refresh} onBack={onBack} />;
}
