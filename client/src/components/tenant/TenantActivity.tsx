import { Link } from 'react-router-dom';
import { ArrowRight, CircleAlert, CreditCard, Wrench } from 'lucide-react';
import type { MaintenanceRequest, Payment } from '../../types/types';
import type { TenantRecords } from '../../hooks/useTenantRecords';
import { overviewDate, tenantOverview } from '../../utils/tenantOverview';
import { parsePaymentRemarks, paymentStatus } from '../../utils/paymentPresentation';
import { maintenanceStatus, urgencyTone } from '../../utils/maintenancePresentation';
import { Button } from '../ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../ui/Feedback';
import { StatusBadge } from '../ui/StatusBadge';

interface Props {
    payments: TenantRecords<Payment>;
    maintenance: TenantRecords<MaintenanceRequest>;
}
const historyLink = (id?: string) => `/payments${id ? `?receipt=${encodeURIComponent(id)}` : ''}`;

export function TenantSummaries({ payments, maintenance }: Props) {
    const { recentPayment, sameDateCount, attentionPayment, active, pending, inProgress } = tenantOverview(payments.data, maintenance.data);
    const status = paymentStatus(recentPayment?.status);
    const reason = attentionPayment && (attentionPayment.rejectionReason || parsePaymentRemarks(attentionPayment.remarks).rejectionReason);
    return <div className="space-y-4">
        {!payments.loading && !payments.error && attentionPayment && <section aria-labelledby="tenant-attention-title" className="flex flex-wrap items-start gap-3 rounded-panel border border-warning/30 bg-warning-soft p-4 text-warning">
            <CircleAlert size={22} aria-hidden="true" className="mt-1 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1"><h2 id="tenant-attention-title" className="font-semibold">Your payment proof needs attention</h2><p className="whitespace-pre-wrap break-words text-sm">{reason || 'The landlord rejected this receipt without a recorded reason. Ask your landlord for clarification.'}</p></div>
            <Link to={historyLink(attentionPayment.id)} className="df-button df-button--secondary w-full sm:w-auto">Review submission<ArrowRight size={16} aria-hidden="true" /></Link>
        </section>}
        <div className="grid gap-4 sm:grid-cols-2">
            <section className="df-card min-w-0 space-y-3" aria-labelledby="tenant-payment-summary-title">
                <div className="flex items-center justify-between gap-3"><h2 id="tenant-payment-summary-title" className="df-section-title">Payment proof</h2><CreditCard size={20} className="shrink-0 text-primary" aria-hidden="true" /></div>
                {payments.loading ? <LoadingState>Loading payment summary…</LoadingState> : payments.error ? <ErrorState title="Payment summary unavailable" description={payments.error} action={<Button variant="secondary" onClick={payments.retry}>Retry payments</Button>} /> : recentPayment ? <>
                    <p className="text-2xl font-semibold tabular-nums">{Number(recentPayment.amount).toLocaleString(undefined, { style: 'currency', currency: 'PHP' })}</p>
                    <p className="text-sm text-muted">{recentPayment.paymentType} · Recorded {overviewDate(recentPayment.datePaid)}</p>
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    <p className="text-sm text-muted">{recentPayment.status === 'Rejected' ? 'Open payment history to review the rejection reason.' : status.detail}</p>
                    {sameDateCount > 1 && <p className="text-sm text-muted">{sameDateCount} receipts share the most recent recorded date. View history for all receipts.</p>}
                    <Link to={historyLink(recentPayment.id)} className="df-button df-button--quiet px-0">View payment history<ArrowRight size={16} aria-hidden="true" /></Link>
                </> : <><p className="text-lg font-semibold">No submissions yet</p><p className="text-sm text-muted">Your submitted receipts and review status will appear here.</p><Link to="/payments" className="df-button df-button--quiet px-0">View payment history<ArrowRight size={16} aria-hidden="true" /></Link></>}
            </section>
            <section className="df-card min-w-0 space-y-3" aria-labelledby="tenant-maintenance-summary-title">
                <div className="flex items-center justify-between gap-3"><h2 id="tenant-maintenance-summary-title" className="df-section-title">Active maintenance</h2><Wrench size={20} className="shrink-0 text-primary" aria-hidden="true" /></div>
                {maintenance.loading ? <LoadingState>Loading maintenance summary…</LoadingState> : maintenance.error ? <ErrorState title="Maintenance summary unavailable" description={maintenance.error} action={<Button variant="secondary" onClick={maintenance.retry}>Retry maintenance</Button>} /> : <>
                    <p className="text-2xl font-semibold tabular-nums">{active.length} {active.length === 1 ? 'request' : 'requests'}</p>
                    <p className="text-sm text-muted">{active.length ? `${pending} pending · ${inProgress} in progress` : 'No active maintenance requests.'}</p>
                    <p className="text-sm text-muted">{maintenance.data.length ? 'View the landlord’s recorded progress and your full request history.' : 'Reports will appear here after submission.'}</p>
                    <Link to="/maintenance" className="df-button df-button--quiet px-0">View all requests<ArrowRight size={16} aria-hidden="true" /></Link>
                </>}
            </section>
        </div>
    </div>;
}

export function TenantMaintenancePreview({ maintenance, assigned, housingReady }: { maintenance: TenantRecords<MaintenanceRequest>; assigned: boolean; housingReady: boolean }) {
    const { active } = tenantOverview([], maintenance.data);
    return <section className="df-card space-y-4" aria-labelledby="tenant-recent-requests-title">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="space-y-1"><h2 id="tenant-recent-requests-title" className="df-section-title">Your active requests</h2><p className="text-sm text-muted">Follow your reports and the landlord’s recorded progress.</p></div><Link to="/maintenance" className="df-button df-button--quiet">View all<ArrowRight size={16} aria-hidden="true" /></Link></div>
        {maintenance.loading ? <LoadingState>Loading maintenance requests…</LoadingState> : maintenance.error ? <ErrorState title="Requests unavailable" description={maintenance.error} action={<Button variant="secondary" onClick={maintenance.retry}>Retry requests</Button>} /> : !active.length ? <EmptyState
            title={maintenance.data.length ? 'No active requests' : assigned ? 'No maintenance requests yet' : housingReady ? 'Waiting for your room assignment' : 'No maintenance requests yet'}
            description={maintenance.data.length ? 'Your previous requests are available in the full history.' : assigned ? 'Something in your room needs attention? Start a report here.' : housingReady ? 'Message your landlord to ask about your room.' : 'Your reports will appear here after submission.'}
            action={maintenance.data.length ? <Link to="/maintenance" className="df-button df-button--secondary">View request history</Link> : assigned ? <Link to="/report" className="df-button df-button--primary">Report an issue</Link> : housingReady ? <Link to="/chat" className="df-button df-button--secondary">Message landlord</Link> : undefined} /> : <div className="divide-y divide-divider">{active.slice(0, 3).map(request => {
                const progress = maintenanceStatus(request.status);
                return <article key={request.id} className="space-y-3 py-4 first:pt-0 last:pb-0 break-words">
                    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 space-y-1"><h3 className="font-semibold">{request.issueType}</h3><p className="text-sm text-muted">Submitted {overviewDate(request.dateSubmitted)}</p></div><div className="flex flex-wrap gap-2"><StatusBadge tone={progress.tone}>{progress.label}</StatusBadge><StatusBadge tone={urgencyTone(request.urgency)}>Urgency: {request.urgency}</StatusBadge></div></div>
                    <p className="whitespace-pre-wrap text-sm">{request.description}</p>
                    {request.adminRemarks ? <p className="whitespace-pre-wrap text-sm text-muted"><span className="font-semibold">Landlord note: </span>{request.adminRemarks}</p> : <p className="text-sm text-muted">No landlord notes recorded yet.</p>}
                </article>;
            })}</div>}
    </section>;
}
