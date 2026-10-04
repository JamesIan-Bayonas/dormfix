import { useAuth } from '../UserContext';
import { PaymentProofForm } from '../payments/PaymentProofForm';
import { paymentFormData, type ProofFields } from '../../utils/paymentSubmission';

interface Props { landlordId: string; onSuccess?: () => void; onBusyChange?: (busy: boolean) => void }

export function TenantPaymentForm({ landlordId, onSuccess, onBusyChange }: Props) {
    const { user } = useAuth();
    async function submit(fields: ProofFields) {
        if (!user?.id || !landlordId) throw new Error('Tenant or landlord details are unavailable.');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments`, {
            method: 'POST', body: paymentFormData(user.id, landlordId, fields),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'The receipt submission could not be confirmed.');
        return data;
    }
    return <PaymentProofForm onSubmit={submit} onDone={onSuccess} onBusyChange={onBusyChange} unavailable={!user?.id || !landlordId} />;
}
