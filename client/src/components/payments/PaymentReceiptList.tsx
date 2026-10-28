import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { Payment } from '../../types/types';
import { filterPaymentReceipts, isReviewable, paymentStatus } from '../../utils/paymentPresentation';
import type { ReceiptFilters } from '../../utils/paymentPresentation';
import { FormField, Input, Select } from '../ui/FormField';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../ui/Feedback';

interface Props {
    role?: 'landlord' | 'tenant';
    payments: Payment[];
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onOpen: (payment: Payment) => void;
    detail?: ReactNode;
}

const initialFilters: ReceiptFilters = { query: '', status: 'review', type: 'all', from: '', to: '', sort: 'newest' };
const currency = (amount: number) => Number(amount).toLocaleString(undefined, { style: 'currency', currency: 'PHP' });

export function PaymentReceiptList({ role = 'landlord', payments, loading, error, onRetry, onOpen, detail }: Props) {
    const tenant = role === 'tenant';
    const listHeading = useRef<HTMLHeadingElement>(null);
    const [filters, setFilters] = useState({ ...initialFilters, status: tenant ? 'all' : 'review' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(tenant ? 5 : 10);
    const invalidRange = !!filters.from && !!filters.to && filters.from > filters.to;
    const filtered = invalidRange ? [] : filterPaymentReceipts(payments, filters);
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const start = (currentPage - 1) * pageSize;
    const visible = filtered.slice(start, start + pageSize);
    const types = [...new Set([...(tenant ? ['Rent', 'Water', 'Electric', 'Maintenance', 'Deposit'] : []), ...payments.map(payment => payment.paymentType).filter(Boolean)])].sort();
    function update(key: keyof ReceiptFilters, value: string) {
        setFilters(current => ({ ...current, [key]: value }));
        setPage(1);
    }
    function clearFilters() { setFilters({ ...initialFilters, status: 'all' }); setPage(1); }
    function turnPageFromBottom(nextPage: number) {
        setPage(nextPage);
        requestAnimationFrame(() => { listHeading.current?.focus({ preventScroll: true }); listHeading.current?.scrollIntoView({ block: 'start' }); });
    }
    const summaries = [
        { label: 'Total receipts', count: payments.length },
        { label: 'Needs review', count: payments.filter(payment => isReviewable(payment.status)).length },
        { label: 'Verified', count: payments.filter(payment => payment.status === 'Verified').length },
        { label: 'Rejected', count: payments.filter(payment => payment.status === 'Rejected').length },
    ];

    return <div className="space-y-5">
        <section aria-label="Receipt summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {summaries.map(item => <div key={item.label} className="df-panel !p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{loading || error ? '—' : item.count}</p>
            </div>)}
        </section>
        <section aria-labelledby={detail ? 'receipt-detail-title' : 'receipt-list-title'} className="df-panel space-y-4">
            {detail || <>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 ref={listHeading} tabIndex={-1} id="receipt-list-title" className="df-section-title">{tenant ? 'Your receipts' : 'Payment receipts'}</h2><p className="mt-1 text-sm text-muted">{tenant ? 'Browse summaries. Open Details for notes, scan warnings, and the receipt image.' : 'Select a receipt to see its details and review it.'}</p></div>
                <Button variant="quiet" onClick={onRetry} disabled={loading}>Refresh records</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
                <FormField id="receipt-search" label="Search receipts">
                    {field => <Input {...field} leadingIcon={<Search size={17} />} type="search" placeholder={tenant ? 'Receipt reference or record ID' : 'Tenant, room, or receipt reference'} value={filters.query} onChange={event => update('query', event.target.value)} />}
                </FormField>
                <FormField id="payment-status-filter" label="Status">
                    {field => <Select {...field} value={filters.status} onChange={event => update('status', event.target.value)}>
                        <option value="review">Needs landlord review</option><option value="all">All receipts</option>
                        <option value="Pending">Awaiting landlord review</option><option value="Anomalous">Needs review — scan warnings</option>
                        <option value="Verified">Verified by landlord</option><option value="Rejected">Rejected by landlord</option>
                    </Select>}
                </FormField>
                <FormField id="receipt-type-filter" label="Payment type">
                    {field => <Select {...field} value={filters.type} onChange={event => update('type', event.target.value)}><option value="all">All types</option>{types.map(type => <option key={type} value={type}>{type === 'Electric' ? 'Electricity' : type}</option>)}</Select>}
                </FormField>
            </div>
            <div className="flex items-start gap-3">
                <details className="group min-w-0 flex-1">
                    <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-primary"><ChevronDown size={16} aria-hidden="true" className="transition-transform group-open:rotate-180" />Date range &amp; sorting{(filters.from || filters.to || filters.sort !== 'newest') && ' (applied)'}</summary>
                    <div className="grid items-start gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-3">
                        <FormField id="receipt-date-from" label="Recorded from">
                            {field => <Input {...field} type="date" value={filters.from} onChange={event => update('from', event.target.value)} />}
                        </FormField>
                        <FormField id="receipt-date-to" label="Recorded to" error={invalidRange ? 'End date must be on or after the start date.' : undefined}>
                            {field => <Input {...field} type="date" value={filters.to} onChange={event => update('to', event.target.value)} />}
                        </FormField>
                        <FormField id="receipt-sort" label="Sort by">
                            {field => <Select {...field} value={filters.sort} onChange={event => update('sort', event.target.value)}>
                                <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount-high">Amount: high to low</option><option value="amount-low">Amount: low to high</option>
                            </Select>}
                        </FormField>
                    </div>
                </details>
                <Button variant="quiet" onClick={clearFilters}>Clear filters</Button>
            </div>
            {loading ? <LoadingState>Loading receipts…</LoadingState> : error ? <ErrorState title="Receipts unavailable" description={error} action={<Button variant="secondary" onClick={onRetry}>Try again</Button>} />
                : payments.length === 0 ? <EmptyState title="No receipts yet" description={tenant ? 'Your submitted payment proof will appear here.' : 'Tenant payment proof will appear here after submission.'} />
                    : invalidRange ? <p role="status" className="text-sm text-muted">Correct the date range to see matching receipts.</p>
                        : filtered.length === 0 ? <EmptyState title="No matching receipts" description={tenant ? 'Try another reference, status, payment type, or date range.' : 'Try another tenant, room, status, payment type, or date range.'} action={<Button variant="secondary" onClick={clearFilters}>Show all receipts</Button>} /> : <>
                            <p role="status" className="text-sm text-muted">Showing {start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length} matching receipts <span className="text-xs">· {payments.length} total</span></p>
                            <nav aria-label="Receipt pagination" className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2"><label htmlFor="receipt-page-size" className="text-sm text-muted">Per page</label><Select id="receipt-page-size" className="!w-20" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>{(tenant ? [5, 10, 20] : [10, 20, 50]).map(size => <option key={size}>{size}</option>)}</Select></div>
                                <div className="flex items-center gap-2"><Button variant="secondary" aria-label="Previous receipts page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></Button><span className="text-sm text-muted">Page {currentPage} of {pageCount}</span><Button variant="secondary" aria-label="Next receipts page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></Button></div>
                            </nav>
                            <div className={`df-receipt-table ${tenant ? 'df-receipt-table--tenant' : ''}`} role="table" aria-label="Payment receipts">
                                <div role="rowgroup" className="df-receipt-table-head"><div role="row" className="df-receipt-row">
                                    {(tenant ? ['Payment', 'Recorded', 'Amount', 'Status', 'Details'] : ['Tenant / room', 'Payment', 'Recorded', 'Amount', 'Status', 'Details']).map(label => <span role="columnheader" key={label}>{label}</span>)}
                                </div></div>
                                <div role="rowgroup" className="divide-y divide-divider">
                                    {visible.map(payment => {
                                        const status = paymentStatus(payment.status);
                                        const date = new Date(payment.datePaid);
                                        return <div role="row" key={payment.id} className="df-receipt-row df-receipt-row--item" onClick={event => { event.currentTarget.querySelector<HTMLButtonElement>('button')?.focus(); onOpen(payment); }}>
                                            {!tenant && <div role="cell" className="df-receipt-person"><span className="block font-semibold">{payment.tenantName || 'Tenant name unavailable'}</span><span className="block text-xs text-muted">Room {payment.roomNumber || 'unavailable'}</span></div>}
                                            <div role="cell" className={tenant ? 'df-receipt-person font-semibold' : 'df-receipt-type text-muted'}>{payment.paymentType === 'Electric' ? 'Electricity' : payment.paymentType}</div>
                                            <div role="cell" className="df-receipt-date text-muted"><span className="sm:hidden">Recorded </span>{Number.isFinite(date.getTime()) ? <time dateTime={payment.datePaid}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time> : 'Date unavailable'}</div>
                                            <div role="cell" className="df-receipt-amount font-semibold tabular-nums">{currency(payment.amount)}</div>
                                            <div role="cell" className="df-receipt-status"><StatusBadge tone={status.tone}>{status.label}</StatusBadge></div>
                                            <div role="cell" className="df-receipt-open"><Button data-receipt-id={payment.id} variant="quiet" aria-label={tenant ? `Open ${payment.paymentType === 'Electric' ? 'Electricity' : payment.paymentType} receipt ${payment.id}` : `Open receipt ${payment.id} for ${payment.tenantName || 'tenant'}`} onClick={event => { event.stopPropagation(); onOpen(payment); }}>Details <ArrowRight size={15} aria-hidden="true" /></Button></div>
                                        </div>;
                                    })}
                                </div>
                            </div>
                            {tenant && pageCount > 1 && <nav aria-label="Receipt pagination below results" className="flex flex-wrap items-center justify-between gap-2 border-t border-divider pt-4">
                                <Button variant="secondary" aria-label="Previous receipts page (bottom)" disabled={currentPage === 1} onClick={() => turnPageFromBottom(currentPage - 1)}><ChevronLeft size={16} aria-hidden="true" />Previous</Button>
                                <span className="text-sm text-muted">{currentPage} / {pageCount}</span>
                                <Button variant="secondary" aria-label="Next receipts page (bottom)" disabled={currentPage === pageCount} onClick={() => turnPageFromBottom(currentPage + 1)}>Next<ChevronRight size={16} aria-hidden="true" /></Button>
                            </nav>}
                        </>}
            </>}
        </section>
    </div>;
}
