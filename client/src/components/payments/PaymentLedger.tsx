import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ArrowLeft } from 'lucide-react';
import type { Payment } from '../../types/types';
import { paymentStatus, isReviewable, receiptUrl } from '../../utils/paymentPresentation';
import { useRecordAction } from '../../hooks/useRecordAction';
import { PaymentDetails } from './PaymentDetails';
import { PageHeader } from '../ui/Layout';
import { FormField, Textarea } from '../ui/FormField';
import { Button } from '../ui/Button';
import { Dialog, Drawer } from '../ui/Dialog';
import { PaymentReceiptList } from './PaymentReceiptList';
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
    initialReceiptId?: string | null;
}
const currency = (amount: number) => Number(amount).toLocaleString(undefined, { style: 'currency', currency: 'PHP' });

export function PaymentLedger({ role, payments, loading, error, onRetry, onBack, onVerify, initialReceiptId, receiptBase = import.meta.env.VITE_API_URL || 'http://localhost:5000' }: Props) {
    const [selectedId, setSelectedId] = useState<string | null>(initialReceiptId || null);
    const selected = payments.find(payment => payment.id === selectedId);
    const workspace = useRef<HTMLDivElement>(null);
    const detailHeading = useRef<HTMLHeadingElement>(null);
    const previousReceipt = useRef<string | null>(null);
    useEffect(() => {
        if (role !== 'tenant') return;
        if (selectedId !== null) {
            detailHeading.current?.focus({ preventScroll: true });
            detailHeading.current?.scrollIntoView({ block: 'start' });
        } else if (previousReceipt.current !== null) {
            const button = [...(workspace.current?.querySelectorAll<HTMLButtonElement>('[data-receipt-id]') || [])].find(item => item.dataset.receiptId === previousReceipt.current);
            const target = button || workspace.current?.querySelector<HTMLElement>('#receipt-list-title');
            target?.focus({ preventScroll: true });
            target?.scrollIntoView({ block: 'nearest' });
        }
        previousReceipt.current = selectedId;
    }, [selectedId, role]);
    const [image, setImage] = useState<string | null>(null);
    const [rejection, setRejection] = useState<Payment | null>(null);
    const [reason, setReason] = useState('');
    const [notice, setNotice] = useState('');
    const noticeRef = useRef<HTMLParagraphElement>(null);
    useEffect(() => { if (notice) noticeRef.current?.focus(); }, [notice]);
    const action = useRecordAction();
    const currentRejection = payments.find(payment => payment.id === rejection?.id);
    const rejectionAvailable = !!currentRejection && isReviewable(currentRejection.status) && !loading && !error;

    async function save(payment: Payment, status: 'Verified' | 'Rejected', rejectionReason?: string) {
        const current = payments.find(record => record.id === payment.id);
        if (!onVerify || loading || error || !current || !isReviewable(current.status)) return;
        setNotice('');
        const saved = await action.run(payment.id, () => onVerify(payment.id, status, rejectionReason), 'The verdict could not be confirmed. Refresh records before retrying.', status === 'Verified' ? 'Payment marked verified.' : 'Payment marked rejected.');
        if (saved) {
            setNotice(`${payment.tenantName || 'Receipt'}: ${status === 'Verified' ? 'marked verified' : 'marked rejected'}.`);
            if (status === 'Rejected') { setRejection(null); setReason(''); }
        }
    }
    function renderReceipt(payment: Payment) {
        const status = paymentStatus(payment.status);
        const date = new Date(payment.datePaid);
        const proof = receiptUrl(payment.proofImage, receiptBase);
        return <div key={payment.id} className="space-y-4 break-words" aria-label={`Receipt ${payment.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider pb-4">
                <div className="min-w-0 space-y-1"><h2 className="df-section-title">{role === 'landlord' ? payment.tenantName || 'Tenant name unavailable' : payment.paymentType === 'Electric' ? 'Electricity' : payment.paymentType}</h2>
                    {role === 'landlord' && <p className="text-sm text-muted">Room {payment.roomNumber || 'unavailable'} · {payment.paymentType}</p>}
                    <p className="text-sm text-muted">Recorded on {Number.isFinite(date.getTime()) ? date.toLocaleDateString() : 'date unavailable'}</p>
                </div>
                <div className="space-y-2 text-right"><p className="text-xl font-semibold tabular-nums">{currency(payment.amount)}</p><StatusBadge tone={status.tone}>{status.label}</StatusBadge></div>
            </div>
            <p className="text-sm text-muted">{status.detail}</p>
            <PaymentDetails payment={payment} />
            {action.errors[payment.id] && <ErrorMessage>{action.errors[payment.id]} <Button variant="quiet" onClick={onRetry}>Refresh records</Button></ErrorMessage>}
            <div className="flex flex-wrap items-center gap-3 border-t border-divider pt-4">
                {proof ? <Button variant="secondary" onClick={() => setImage(proof)}><Eye size={18} aria-hidden="true" />View receipt</Button> : <p className="text-sm text-muted">No receipt image is available.</p>}
                {role === 'landlord' && isReviewable(payment.status) && <>
                    <Button variant="danger" disabled={action.busy[payment.id] || loading || !!error || !onVerify} onClick={() => { setRejection(payment); setReason(''); action.clearError(payment.id); }}>Reject</Button>
                    <Button disabled={loading || !!error || !onVerify} loading={action.busy[payment.id]} loadingText="Saving verdict…" onClick={() => save(payment, 'Verified')}>Verify payment</Button>
                </>}
                {role === 'tenant' && payment.status === 'Rejected' && <Link to="/chat" className="df-button df-button--secondary">Ask landlord</Link>}
            </div>
            {role === 'tenant' && payment.status === 'Rejected' && <p className="text-sm text-muted">A new proof submission creates a separate record; it does not replace this receipt.</p>}
        </div>;
    }
    return <div ref={workspace} className="space-y-6">
        <Button variant="quiet" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />Back to {role === 'landlord' ? 'overview' : 'home'}</Button>
        <PageHeader title={role === 'landlord' ? 'Payments' : 'Payment history'} description={role === 'landlord' ? 'Review submitted receipts and record your verdict. Receipt scans help review; they do not approve payments.' : 'Track submitted receipts and your landlord’s verdict. This history records proof submissions.'} />
        <p ref={selectedId ? undefined : noticeRef} tabIndex={-1} role="status" className={notice && !selectedId ? "text-sm text-success" : "sr-only"}>{selectedId ? '' : notice}</p>
        <PaymentReceiptList key={role} role={role} payments={payments} loading={loading} error={error} onRetry={onRetry}
            onOpen={payment => { setSelectedId(payment.id); setNotice(''); action.clearError(payment.id); }}
            detail={role === 'tenant' && selectedId !== null ? <>
                <Button variant="quiet" onClick={() => setSelectedId(null)}><ArrowLeft size={18} aria-hidden="true" />Back to receipts</Button>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider pb-4">
                    <h2 ref={detailHeading} tabIndex={-1} id="receipt-detail-title" className="df-section-title">Payment proof details</h2>
                    <Button variant="quiet" onClick={onRetry} disabled={loading}>Refresh records</Button>
                </div>
                {loading ? <LoadingState>Loading receipt details…</LoadingState> : error ? <ErrorState title="Receipt unavailable" description={error} action={<Button variant="secondary" onClick={onRetry}>Retry receipt</Button>} /> : selected ? renderReceipt(selected) : <EmptyState title="Receipt unavailable" description="This receipt is not in the loaded history. Use Back to receipts to review your other receipts." />}
            </> : undefined} />
        {role === 'landlord' && <Drawer open={selectedId !== null} onClose={() => setSelectedId(null)} title="Receipt details" busy={selectedId ? !!action.busy[selectedId] : false}>
            {notice && <p ref={noticeRef} tabIndex={-1} role="status" className="text-sm text-success">{notice}</p>}
            {loading && <p role="status" className="text-sm text-muted">Refreshing receipt details…</p>}
            {error && <ErrorMessage>Receipt details could not be refreshed. <Button variant="quiet" onClick={onRetry}>Try again</Button></ErrorMessage>}
            {selected ? renderReceipt(selected) : <EmptyState title="Receipt unavailable" description="This receipt is no longer in the loaded records. Close this panel and refresh the list." />}
        </Drawer>}
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
