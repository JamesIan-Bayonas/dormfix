import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ArrowLeft } from 'lucide-react';
import type { Payment } from '../../types/types';
import { paymentStatus, isReviewable, receiptUrl } from '../../utils/paymentPresentation';
import { useRecordAction } from '../../hooks/useRecordAction';
import { PaymentDetails } from './PaymentDetails';
import { PageHeader, Panel } from '../ui/Layout';
import { FormField, Select, Textarea } from '../ui/FormField';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { ImageLightbox } from '../ui/ImageLightbox';
import { StatusBadge } from '../ui/StatusBadge';
import { ErrorState, ErrorMessage, EmptyState, LoadingState } from '../ui/Feedback';

interface Props {
    role: 'landlord' | 'tenant';
    payments: Payment[];
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onBack: () => void;
    onVerify?: (id: string, status: 'Verified' | 'Rejected', reason?: string) => Promise<boolean>;
    receiptBase?: string;
}
const currency = (amount: number) => Number(amount).toLocaleString(undefined, { style: 'currency', currency: 'PHP' });

export function PaymentLedger({ role, payments, loading, error, onRetry, onBack, onVerify, receiptBase = import.meta.env.VITE_API_URL || 'http://localhost:5000' }: Props) {
    const [filter, setFilter] = useState(role === 'landlord' ? 'review' : 'all');
    const [image, setImage] = useState<string | null>(null);
    const [rejection, setRejection] = useState<Payment | null>(null);
    const [reason, setReason] = useState('');
    const [notice, setNotice] = useState('');
    const noticeRef = useRef<HTMLParagraphElement>(null);
    useEffect(() => { if (notice) noticeRef.current?.focus(); }, [notice]);
    const action = useRecordAction();
    const visible = payments.filter(payment => filter === 'all' || (filter === 'review' ? isReviewable(payment.status) : payment.status === filter));
    const currentRejection = payments.find(payment => payment.id === rejection?.id);
    const rejectionAvailable = !!currentRejection && isReviewable(currentRejection.status) && !loading && !error;

    async function save(payment: Payment, status: 'Verified' | 'Rejected', rejectionReason?: string) {
        if (!onVerify) return;
        setNotice('');
        const saved = await action.run(payment.id, () => onVerify(payment.id, status, rejectionReason), 'The verdict could not be confirmed. Refresh records before retrying.');
        if (saved) {
            setNotice(`${payment.tenantName || 'Receipt'}: ${status === 'Verified' ? 'marked verified' : 'marked rejected'}.`);
            if (status === 'Rejected') { setRejection(null); setReason(''); }
        }
    }
    return <div className="space-y-6">
        <Button variant="quiet" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />Back to {role === 'landlord' ? 'overview' : 'home'}</Button>
        <PageHeader title={role === 'landlord' ? 'Payments' : 'Payment history'} description={role === 'landlord' ? 'Review submitted receipts and record your verdict. Receipt scans help review; they do not approve payments.' : 'Track submitted receipts and your landlord’s verdict. This history records proof submissions.'} />
        <p ref={noticeRef} tabIndex={-1} role="status" className="text-sm text-success">{notice}</p>
        <FormField id="payment-status-filter" label="Show receipts">
            {field => <Select {...field} value={filter} onChange={event => setFilter(event.target.value)}>
                <option value="review">Needs landlord review</option><option value="all">All receipts</option>
                <option value="Pending">Awaiting landlord review</option><option value="Anomalous">Needs review — scan warnings</option><option value="Verified">Verified by landlord</option><option value="Rejected">Rejected by landlord</option>
            </Select>}
        </FormField>
        {loading ? <LoadingState>Loading receipts…</LoadingState> : error ? <ErrorState title="Receipts unavailable" description={error} action={<Button variant="secondary" onClick={onRetry}>Try again</Button>} /> :
            payments.length === 0 ? <EmptyState title="No receipts yet" description={role === 'tenant' ? 'Submitted payment proof will appear here.' : 'Tenant payment proof will appear here after submission.'} /> :
                visible.length === 0 ? <EmptyState title="No receipts in this view" description="Choose another status to see the rest of the history." action={<Button variant="secondary" onClick={() => setFilter('all')}>Show all receipts</Button>} /> : <>
                    <p className="text-sm text-muted">{visible.length} of {payments.length} receipts</p>
                    <div className="space-y-4">{visible.map(payment => {
                        const status = paymentStatus(payment.status);
                        const date = new Date(payment.datePaid);
                        const proof = receiptUrl(payment.proofImage, receiptBase);
                        return <Panel key={payment.id} className="space-y-4 break-words" aria-label={`Receipt ${payment.id}`}>
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider pb-4">
                                <div className="min-w-0 space-y-1"><h2 className="df-section-title">{role === 'landlord' ? payment.tenantName || 'Tenant name unavailable' : payment.paymentType}</h2>
                                    {role === 'landlord' && <p className="text-sm text-muted">Room {payment.roomNumber || 'unavailable'} · {payment.paymentType}</p>}
                                    <p className="text-sm text-muted">Recorded on {Number.isFinite(date.getTime()) ? date.toLocaleDateString() : 'date unavailable'}</p>
                                </div>
                                <div className="space-y-2"><p className="text-xl font-semibold tabular-nums">{currency(payment.amount)}</p><StatusBadge tone={status.tone}>{status.label}</StatusBadge></div>
                            </div>
                            <p className="text-sm text-muted">{status.detail}</p>
                            <PaymentDetails payment={payment} />
                            {action.errors[payment.id] && <ErrorMessage>{action.errors[payment.id]} <Button variant="quiet" onClick={onRetry}>Refresh records</Button></ErrorMessage>}
                            <div className="flex flex-wrap items-center gap-3 border-t border-divider pt-4">
                                {proof ? <Button variant="secondary" onClick={() => setImage(proof)}><Eye size={18} aria-hidden="true" />View receipt</Button> : <p className="text-sm text-muted">No receipt image is available.</p>}
                                {role === 'landlord' && isReviewable(payment.status) && <>
                                    <Button variant="danger" disabled={action.busy[payment.id]} onClick={() => { setRejection(payment); setReason(''); action.clearError(payment.id); }}>Reject</Button>
                                    <Button loading={action.busy[payment.id]} loadingText="Saving verdict…" onClick={() => save(payment, 'Verified')}>Verify payment</Button>
                                </>}
                                {role === 'tenant' && payment.status === 'Rejected' && <Link to="/chat" className="df-button df-button--secondary">Ask landlord</Link>}
                            </div>
                            {role === 'tenant' && payment.status === 'Rejected' && <p className="text-sm text-muted">A new proof submission creates a separate record; it does not replace this receipt.</p>}
                        </Panel>;
                    })}</div>
                </>}
        <ImageLightbox src={image} onClose={() => setImage(null)} />
        <Dialog open={!!rejection} onClose={() => setRejection(null)} title="Reject payment proof?" busy={rejection ? action.busy[rejection.id] : false}>
            <p className="text-sm text-muted">{rejection?.tenantName || 'Tenant'} · {rejection && currency(rejection.amount)}. Explain what needs correcting; the tenant will see this reason in history.</p>
            <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (rejection && rejectionAvailable && reason.trim()) save(rejection, 'Rejected', reason.trim()); }}>
                <FormField id="receipt-rejection-reason" label="Reason for rejection" hint="Be specific about the receipt or payment information the tenant should check.">
                    {field => <Textarea {...field} required data-autofocus rows={4} value={reason} disabled={!!rejection && action.busy[rejection.id]} onChange={event => setReason(event.target.value)} />}
                </FormField>
                {rejection && action.errors[rejection.id] && <ErrorMessage>{action.errors[rejection.id]} <Button variant="quiet" onClick={onRetry}>Refresh records</Button></ErrorMessage>}
                {!rejectionAvailable && <p role="status" className="text-sm text-warning">{loading ? 'Refreshing the current verdict…' : 'This receipt is unavailable or no longer awaiting review. Check the loaded history before proceeding.'}</p>}
                <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" onClick={() => setRejection(null)} disabled={!!rejection && action.busy[rejection.id]}>Cancel</Button>
                    <Button type="submit" variant="danger" loading={!!rejection && action.busy[rejection.id]} loadingText="Saving verdict…" disabled={!reason.trim() || !rejectionAvailable}>Reject receipt</Button></div>
            </form>
        </Dialog>
    </div>;
}
