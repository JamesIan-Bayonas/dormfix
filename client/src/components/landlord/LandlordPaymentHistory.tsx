import { useAuth } from '../UserContext';
import { usePayments } from '../../hooks/usePayments';
import { PaymentLedger } from '../payments/PaymentLedger';

export function LandlordPaymentHistory({ onBack }: { onBack: () => void }) {
    const { user } = useAuth();
    const { payments, isLoading, error, refreshPayments, verifyPayment } = usePayments(user?.id);
    return <PaymentLedger role="landlord" payments={payments} loading={isLoading} error={error} onRetry={refreshPayments} onBack={onBack} onVerify={verifyPayment} />;
}
