import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { MaintenanceRequest } from '../../types/types';
import { filterMaintenanceQueue, issueTypes, maintenanceStatus, maintenanceStatuses, urgencyLevels, urgencyTone } from '../../utils/maintenancePresentation';
import type { MaintenanceFilters } from '../../utils/maintenancePresentation';
import { Button } from '../ui/Button';
import { FormField, Input, Select } from '../ui/FormField';
import { EmptyState, ErrorState, LoadingState } from '../ui/Feedback';
import { StatusBadge } from '../ui/StatusBadge';

type Request = MaintenanceRequest & { tenantName?: string; roomNumber?: string };
interface Props {
    role?: 'landlord' | 'tenant'; emptyAction?: ReactNode;
    requests: Request[]; loading: boolean; error: string | null; onRetry: () => void;
    onOpen: (request: Request) => void; busy: Record<string, boolean>;
}
const defaults: MaintenanceFilters = { query: '', status: 'active', urgency: 'all', issue: 'all', from: '', to: '', sort: 'urgency' };

export function MaintenanceRequestList({ requests, loading, error, onRetry, onOpen, busy, role = 'landlord', emptyAction }: Props) {
    const [filters, setFilters] = useState({ ...defaults, ...(role === 'tenant' ? { status: 'all', sort: 'newest' } : {}) });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(role === 'tenant' ? 5 : 10);
    const invalidRange = !!filters.from && !!filters.to && filters.from > filters.to;
    const filtered = invalidRange ? [] : filterMaintenanceQueue(requests, filters);
    // Keep optimistic updates visible until the server confirms or rolls back.
    const matches = [...filtered, ...requests.filter(request => busy[request.id] && !filtered.includes(request))];
    const pages = Math.max(1, Math.ceil(matches.length / pageSize));
    const currentPage = Math.min(page, pages);
    const start = (currentPage - 1) * pageSize;
    const visible = matches.slice(start, start + pageSize);
    const active = requests.filter(request => request.status === 'Pending' || request.status === 'In Progress');
    const summary = [
        { label: 'Total requests', count: requests.length },
        { label: 'Active requests', count: active.length },
        { label: 'High / emergency', count: active.filter(request => request.urgency === 'High' || request.urgency === 'Emergency').length },
        { label: 'Completed', count: requests.filter(request => request.status === 'Completed').length },
    ];
    function update(key: keyof MaintenanceFilters, value: string) { setFilters(current => ({ ...current, [key]: value })); setPage(1); }
    function clear() { setFilters({ ...defaults, status: 'all', sort: role === 'tenant' ? 'newest' : 'urgency' }); setPage(1); }

    return <div className="space-y-5">
        {role === 'landlord' && <section aria-label="Maintenance summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {summary.map(item => <div key={item.label} className="df-panel !p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{loading || error ? '—' : item.count}</p></div>)}
        </section>}
        <section aria-labelledby="maintenance-list-title" className="df-panel space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 id="maintenance-list-title" className="df-section-title">Maintenance requests</h2><p className="mt-1 text-sm text-muted">Select Details to read the full issue and landlord notes.</p></div>
                <div className="flex flex-wrap gap-2"><Button variant="quiet" onClick={onRetry} disabled={loading}>Refresh requests</Button><Button variant="quiet" onClick={clear}>Clear filters</Button></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <FormField id="maintenance-search" label="Find request">{field => <Input {...field} type="search" placeholder={role === 'tenant' ? 'Search issue or description' : 'Tenant, room, issue, or description'} leadingIcon={<Search size={17} />} value={filters.query} onChange={event => update('query', event.target.value)} />}</FormField>
                <FormField id="maintenance-status" label="Show requests">{field => <Select {...field} value={filters.status} onChange={event => update('status', event.target.value)}><option value="active">Active requests</option><option value="all">All requests</option>{maintenanceStatuses.map(status => <option key={status} value={status}>{maintenanceStatus(status).label}</option>)}</Select>}</FormField>
                <FormField id="maintenance-urgency" label="Urgency">{field => <Select {...field} value={filters.urgency} onChange={event => update('urgency', event.target.value)}><option value="all">All urgency levels</option>{urgencyLevels.map(urgency => <option key={urgency}>{urgency}</option>)}</Select>}</FormField>
            </div>
            <div className="flex items-start gap-3">
                <details className="group min-w-0 flex-1">
                    <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-primary"><ChevronDown size={16} aria-hidden="true" className="transition-transform group-open:rotate-180" />More filters &amp; sorting{(filters.issue !== 'all' || filters.from || filters.to || filters.sort !== (role === 'tenant' ? 'newest' : 'urgency')) && ' (applied)'}</summary>
                    <div className="grid gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-4">
                        <FormField id="maintenance-issue" label="Issue type">{field => <Select {...field} value={filters.issue} onChange={event => update('issue', event.target.value)}><option value="all">All issue types</option>{issueTypes.map(issue => <option key={issue}>{issue}</option>)}</Select>}</FormField>
                        <FormField id="maintenance-from" label="Submitted from">{field => <Input {...field} type="date" value={filters.from} onChange={event => update('from', event.target.value)} />}</FormField>
                        <FormField id="maintenance-to" label="Submitted to" error={invalidRange ? 'End date must be on or after the start date.' : undefined}>{field => <Input {...field} type="date" value={filters.to} onChange={event => update('to', event.target.value)} />}</FormField>
                        <FormField id="maintenance-sort" label="Sort by">{field => <Select {...field} value={filters.sort} onChange={event => update('sort', event.target.value)}><option value="urgency">Most urgent first</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option></Select>}</FormField>
                    </div>
                </details>
            </div>
            {loading ? <LoadingState>Loading maintenance requests…</LoadingState> : error ? <ErrorState title="Maintenance requests unavailable" description={error} action={<Button variant="secondary" onClick={onRetry}>Try again</Button>} />
                : !requests.length ? <EmptyState title="No maintenance requests yet" description={role === 'tenant' ? 'Use Report an issue when something in your room needs attention.' : 'Tenant reports will appear here after submission.'} action={emptyAction} />
                    : invalidRange ? <p role="status" className="text-sm text-muted">Correct the date range to see matching requests.</p>
                        : !matches.length ? <EmptyState title="No matching requests" description="Try another search or clear the filters to see all requests." action={<Button variant="secondary" onClick={clear}>Show all requests</Button>} /> : <>
                            <p role="status" className="text-sm text-muted">Showing {start + 1}–{Math.min(start + pageSize, matches.length)} of {matches.length} matching requests <span className="text-xs">· {requests.length} total</span></p>
                            <nav aria-label="Maintenance pagination" className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2"><label htmlFor="maintenance-page-size" className="text-sm text-muted">Per page</label><Select id="maintenance-page-size" className="!w-20" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>{(role === 'tenant' ? [5, 10, 20] : [10, 20, 50]).map(size => <option key={size}>{size}</option>)}</Select></div>
                                <div className="flex items-center gap-2"><Button variant="secondary" aria-label="Previous requests page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></Button><span className="text-sm text-muted">Page {currentPage} of {pages}</span><Button variant="secondary" aria-label="Next requests page" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></Button></div>
                            </nav>
                            <div role="table" aria-label="Maintenance requests" className={`df-maintenance-table${role === 'tenant' ? ' df-maintenance-table--tenant' : ''}`}>
                                <div role="rowgroup" className="df-maintenance-table-head"><div role="row" className="df-maintenance-row">{(role === 'tenant' ? ['Issue', 'Submitted', 'Urgency', 'Progress', 'Details'] : ['Tenant / room', 'Issue', 'Submitted', 'Urgency', 'Progress', 'Details']).map(label => <span role="columnheader" key={label}>{label}</span>)}</div></div>
                                <div role="rowgroup" className="divide-y divide-divider">
                                    {visible.map(request => {
                                        const progress = maintenanceStatus(request.status), date = new Date(request.dateSubmitted);
                                        return <div key={request.id} role="row" aria-busy={busy[request.id] || undefined} className="df-maintenance-row df-maintenance-row--item" onClick={event => { event.currentTarget.querySelector<HTMLButtonElement>('button')?.focus(); onOpen(request); }}>
                                            {role === 'landlord' && <div role="cell" className="df-maintenance-person"><span className="block font-semibold">{request.tenantName || 'Tenant name unavailable'}</span><span className="block text-xs text-muted">Room {request.roomNumber || 'unavailable'}</span></div>}
                                            <div role="cell" className="df-maintenance-issue font-medium">{request.issueType}</div>
                                            <div role="cell" className="df-maintenance-date text-xs text-muted"><span className="lg:hidden">Submitted </span>{Number.isFinite(date.getTime()) ? <time dateTime={request.dateSubmitted}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time> : 'Date unavailable'}</div>
                                            <div role="cell" className="df-maintenance-urgency"><StatusBadge tone={urgencyTone(request.urgency)}>Urgency: {request.urgency}</StatusBadge></div>
                                            <div role="cell" className="df-maintenance-progress"><StatusBadge tone={progress.tone}>{busy[request.id] ? 'Saving…' : progress.label}</StatusBadge></div>
                                            <div role="cell" className="df-maintenance-open"><Button variant="quiet" aria-label={`Open ${request.issueType} request ${request.id}${role === 'landlord' ? ` for ${request.tenantName || 'tenant'}` : ''}`} onClick={event => { event.stopPropagation(); onOpen(request); }}>Details <ArrowRight size={15} aria-hidden="true" /></Button></div>
                                        </div>;
                                    })}
                                </div>
                            </div>
                        </>}
        </section>
    </div>;
}
