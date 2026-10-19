import { sessionFetch } from '../../api/session';
import React, { useState } from 'react';
import { LogOut, Key, ArrowRight } from 'lucide-react';
import { useAuth } from '../UserContext';
import { notify } from '../../utils/notify';
import { Button } from '../ui/Button';
import { FormField, Input } from '../ui/FormField';
import { ErrorMessage } from '../ui/Feedback';
import { StatusBadge } from '../ui/StatusBadge';
import { AppearanceHeader } from '../ui/AppearanceHeader';

interface Props { onRelinkSuccess: () => void }

export const RejectedAccess: React.FC<Props> = ({ onRelinkSuccess }) => {
    const { user, logout } = useAuth();
    const [landlordCode, setLandlordCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRelink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !landlordCode.trim()) return;
        setIsSubmitting(true);
        setError(null);
        const toastId = notify.loading('Submitting dormitory application…');
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await sessionFetch(`${API_URL}/api/tenant/relink`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: user.id, landlordCode: landlordCode.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to re-link property code.');
            notify.success('Dormitory application submitted', { id: toastId, description: 'Your application is awaiting approval.' });
            onRelinkSuccess();
        } catch (err: unknown) {
            const message = err instanceof Error && err.message ? err.message : 'An unexpected error occurred.';
            setError(message); notify.error('Application could not be submitted', { id: toastId, description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-dvh items-center justify-center bg-canvas p-4 sm:p-6">
            <div className="df-attention-card df-attention-card--error w-full max-w-form space-y-6">
                <AppearanceHeader />
                <StatusBadge tone="neutral">Dormitory link unavailable</StatusBadge>
                <div className="space-y-3">
                    <h1 className="df-page-title">Connect to your dormitory</h1>
                    <p className="text-base leading-relaxed text-muted">
                        Hello <span className="font-semibold text-ink">{user?.name}</span>. We could not confirm an active dormitory link for your account.
                    </p>
                    <p className="text-sm leading-relaxed text-muted">If your request was declined or removed, ask your landlord for the correct code to apply again. If this is unexpected, sign out and try signing in again.</p>
                </div>
                <form onSubmit={handleRelink} className="space-y-4" aria-busy={isSubmitting}>
                    <FormField id="relink-code" label="Landlord / dorm code" hint="Use the code provided by your landlord.">
                        {(field) => <Input {...field} name="landlordCode" required className="font-mono" leadingIcon={<Key size={18} />}
                            value={landlordCode} onChange={(e) => setLandlordCode(e.target.value)} placeholder="#8821" />}
                    </FormField>
                    {error && <ErrorMessage>{error}</ErrorMessage>}
                    <Button type="submit" loading={isSubmitting} loadingText="Applying…" disabled={!landlordCode.trim()} className="w-full">
                        Apply with code <ArrowRight size={18} aria-hidden="true" />
                    </Button>
                </form>
                <div className="border-t border-divider pt-4">
                    <Button variant="quiet" onClick={logout} className="w-full"><LogOut size={18} aria-hidden="true" />Sign out</Button>
                </div>
            </div>
        </main>
    );
};
