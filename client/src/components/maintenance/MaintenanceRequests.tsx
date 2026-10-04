import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import type { MaintenanceRequest, MaintenanceStatus } from '../../types/types';
import { filterMaintenance, maintenanceStatus, maintenanceStatuses, nextMaintenanceStatus, urgencyLevels, urgencyTone } from '../../utils/maintenancePresentation';
import { useRecordAction } from '../../hooks/useRecordAction';
import { Button } from '../ui/Button';
import { FormField, Input, Select } from '../ui/FormField';
import { EmptyState, ErrorMessage, ErrorState, LoadingState } from '../ui/Feedback';
import { PageHeader, Panel } from '../ui/Layout';
import { StatusBadge } from '../ui/StatusBadge';

type Request = MaintenanceRequest & { tenantName?: string; roomNumber?: string };
interface Props {
    role: 'landlord' | 'tenant'; requests: Request[]; loading: boolean; error: string | null; onRetry: () => void;
    onChangeStatus?: (id: string, status: MaintenanceStatus) => Promise<boolean>;
}
export function MaintenanceRequests({ role, requests, loading, error, onRetry, onChangeStatus }: Props) {
    const [status, setStatus] = useState(role === 'landlord' ? 'active' : 'all');
    const [urgency, setUrgency] = useState('all');
    const [query, setQuery] = useState('');
    const [notice, setNotice] = useState('');
    const noticeRef = useRef<HTMLParagraphElement>(null);
    const action = useRecordAction();
    const Heading = role === 'landlord' ? 'h2' : 'h3';
    const DetailHeading = role === 'landlord' ? 'h3' : 'h4';
    useEffect(() => { if (notice) noticeRef.current?.focus(); }, [notice]);
    const filtered = filterMaintenance(requests, status, urgency, query);
    // An optimistic status change must not hide its pending feedback in a filtered view.
    const visible = requests.filter(request => filtered.includes(request) || action.busy[request.id]);
    async function change(request: Request) {
        const next = nextMaintenanceStatus(request.status);
        if (!next || !onChangeStatus) return;
        setNotice('');
        if (await action.run(request.id, () => onChangeStatus(request.id, next), 'The status change could not be confirmed. Refresh requests before retrying.')) {
            setNotice(`${request.issueType}${request.roomNumber ? ` · Room ${request.roomNumber}` : ''}: ${maintenanceStatus(next).label.toLowerCase()}.`);
        }
    }
    return <section className="space-y-5" aria-label={role === 'landlord' ? 'Maintenance queue' : 'Your maintenance requests'}>
        {role === 'landlord' ? <PageHeader title="Maintenance" description="Review full request details and update progress. Urgency and progress are separate." /> : <div className="space-y-2"><h2 className="df-section-title">Maintenance requests</h2><p className="text-sm text-muted">Follow your reports and the landlord’s recorded progress.</p></div>}
        <p ref={noticeRef} tabIndex={-1} role="status" className="text-sm text-success">{notice}</p>
        <div className={`grid gap-4 sm:grid-cols-2 ${role === 'landlord' ? 'xl:grid-cols-3' : ''}`}>
            {role === 'landlord' && <FormField label="Find request" hint="Search tenant, room, issue, or description.">{field => <Input {...field} type="search" leadingIcon={<Search size={18} />} value={query} onChange={event => setQuery(event.target.value)} />}</FormField>}
            <FormField label="Show requests">{field => <Select {...field} value={status} onChange={event => setStatus(event.target.value)}><option value="active">Active requests</option><option value="all">All requests</option>{maintenanceStatuses.map(value => <option key={value} value={value}>{maintenanceStatus(value).label}</option>)}</Select>}</FormField>
            <FormField label="Urgency">{field => <Select {...field} value={urgency} onChange={event => setUrgency(event.target.value)}><option value="all">All urgency levels</option>{urgencyLevels.map(value => <option key={value}>{value}</option>)}</Select>}</FormField>
        </div>
        {loading ? <LoadingState>Loading maintenance requests…</LoadingState> : error ? <ErrorState title="Maintenance requests unavailable" description={error} action={<Button variant="secondary" onClick={onRetry}>Try again</Button>} /> : !requests.length ? <EmptyState title="No maintenance requests yet" description={role === 'landlord' ? 'Tenant reports will appear here after submission.' : 'Use Report an issue when something in your room needs attention.'} /> : !visible.length ? <EmptyState title="No matching requests" description="Try a different status or urgency, or clear the filters." action={<Button variant="secondary" onClick={() => { setStatus('all'); setUrgency('all'); setQuery(''); }}>Clear filters</Button>} /> : <>
            <p className="text-sm text-muted">{visible.length} of {requests.length} requests{Object.values(action.busy).some(Boolean) ? ' · Saving updates remain visible' : ''}</p>
            {visible.map(request => {
                const progress = maintenanceStatus(request.status);
                const date = new Date(request.dateSubmitted);
                const next = nextMaintenanceStatus(request.status);
                return <Panel key={request.id} aria-label={`Request ${request.id}`} aria-busy={action.busy[request.id] || undefined} className="space-y-4 break-words">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1"><Heading className="df-section-title">{request.issueType}</Heading>{role === 'landlord' && <p className="text-sm">{request.tenantName || 'Tenant name unavailable'} · Room {request.roomNumber || 'unavailable'}</p>}<p className="text-sm text-muted">Submitted {Number.isFinite(date.getTime()) ? date.toLocaleDateString() : 'date unavailable'}</p></div>
                        <div className="flex flex-wrap gap-2"><StatusBadge tone={progress.tone}>{progress.label}</StatusBadge><StatusBadge tone={urgencyTone(request.urgency)}>Urgency: {request.urgency}</StatusBadge></div>
                    </div>
                    <div className="space-y-2"><DetailHeading className="text-sm font-semibold">Issue description</DetailHeading><p className="whitespace-pre-wrap text-sm leading-relaxed">{request.description}</p></div>
                    {request.adminRemarks && <div className="space-y-2 rounded-control border border-divider bg-surface-muted p-4"><DetailHeading className="text-sm font-semibold">Landlord notes</DetailHeading><p className="whitespace-pre-wrap text-sm leading-relaxed">{request.adminRemarks}</p></div>}
                    {request.status === 'Rejected' && !request.adminRemarks && <p className="text-sm text-muted">No explanation is recorded. Contact your landlord for clarification.</p>}
                    {action.busy[request.id] && <p role="status" className="text-sm text-info">Saving the status change. The displayed update is awaiting confirmation.</p>}
                    {action.errors[request.id] && <ErrorMessage>{action.errors[request.id]} <Button variant="quiet" onClick={onRetry}>Refresh requests</Button></ErrorMessage>}
                    {role === 'landlord' && (next || action.busy[request.id]) && <div className="border-t border-divider pt-4"><Button loading={action.busy[request.id]} loadingText="Saving progress…" onClick={() => change(request)}>{next === 'Completed' ? 'Mark completed' : 'Mark in progress'}</Button></div>}
                </Panel>;
            })}
        </>}
    </section>;
}
