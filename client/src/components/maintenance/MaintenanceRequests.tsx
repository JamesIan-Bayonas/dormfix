import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { MaintenanceRequest, MaintenanceStatus } from '../../types/types';
import { maintenanceStatus, nextMaintenanceStatus, urgencyTone } from '../../utils/maintenancePresentation';
import { useRecordAction } from '../../hooks/useRecordAction';
import { Button } from '../ui/Button';
import { EmptyState, ErrorMessage } from '../ui/Feedback';
import { PageHeader } from '../ui/Layout';
import { StatusBadge } from '../ui/StatusBadge';
import { Drawer } from '../ui/Dialog';
import { MaintenanceRequestList } from './MaintenanceRequestList';

type Request = MaintenanceRequest & { tenantName?: string; roomNumber?: string };
interface Props {
    role: 'landlord' | 'tenant'; requests: Request[]; loading: boolean; error: string | null; onRetry: () => void;
    onChangeStatus?: (id: string, status: MaintenanceStatus) => Promise<boolean>;
    standalone?: boolean;
    emptyAction?: ReactNode;
}
export function MaintenanceRequests({ role, requests, loading, error, onRetry, onChangeStatus, standalone = false, emptyAction }: Props) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selected = requests.find(request => request.id === selectedId);
    const [notice, setNotice] = useState('');
    const noticeRef = useRef<HTMLParagraphElement>(null);
    const action = useRecordAction();
    const Heading = role === 'landlord' ? 'h3' : standalone ? 'h2' : 'h3';
    const DetailHeading = role === 'landlord' ? 'h4' : standalone ? 'h3' : 'h4';
    useEffect(() => { if (notice) noticeRef.current?.focus(); }, [notice]);
    async function change(request: Request) {
        const current = requests.find(record => record.id === request.id);
        const next = current ? nextMaintenanceStatus(current.status) : null;
        if (!next || !onChangeStatus || loading || error) return;
        setNotice('');
        if (await action.run(request.id, () => onChangeStatus(request.id, next), 'The status change could not be confirmed. Refresh requests before retrying.')) {
            setNotice(`${request.issueType}${request.roomNumber ? ` · Room ${request.roomNumber}` : ''}: ${maintenanceStatus(next).label.toLowerCase()}.`);
        }
    }
    function renderRequest(request: Request) {
        const progress = maintenanceStatus(request.status);
        const date = new Date(request.dateSubmitted);
        const next = nextMaintenanceStatus(request.status);
        return <div key={request.id} aria-label={`Request ${request.id}`} aria-busy={action.busy[request.id] || undefined} className="space-y-4 break-words">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1"><Heading className="df-section-title">{request.issueType}</Heading>{role === 'landlord' && <p className="text-sm">{request.tenantName || 'Tenant name unavailable'} · Room {request.roomNumber || 'unavailable'}</p>}<p className="text-sm text-muted">Submitted {Number.isFinite(date.getTime()) ? date.toLocaleDateString() : 'date unavailable'}</p></div>
                <div className="flex flex-wrap gap-2"><StatusBadge tone={progress.tone}>{progress.label}</StatusBadge><StatusBadge tone={urgencyTone(request.urgency)}>Urgency: {request.urgency}</StatusBadge></div>
            </div>
            <div className="space-y-2"><DetailHeading className="text-sm font-semibold">Issue description</DetailHeading><p className="whitespace-pre-wrap text-sm leading-relaxed">{request.description}</p></div>
            {request.adminRemarks && <div className="space-y-2 rounded-control border border-divider bg-surface-muted p-4"><DetailHeading className="text-sm font-semibold">Landlord notes</DetailHeading><p className="whitespace-pre-wrap text-sm leading-relaxed">{request.adminRemarks}</p></div>}
            {request.status === 'Rejected' && !request.adminRemarks && <p className="text-sm text-muted">No explanation is recorded. Contact your landlord for clarification.</p>}
            {action.busy[request.id] && <p role="status" className="text-sm text-info">Saving the status change. The displayed update is awaiting confirmation.</p>}
            {action.errors[request.id] && <ErrorMessage>{action.errors[request.id]} <Button variant="quiet" onClick={onRetry}>Refresh requests</Button></ErrorMessage>}
            {role === 'landlord' && (next || action.busy[request.id]) && <div className="border-t border-divider pt-4"><Button disabled={loading || !!error || !onChangeStatus} loading={action.busy[request.id]} loadingText="Saving progress…" onClick={() => change(request)}>{next === 'Completed' ? 'Mark completed' : 'Mark in progress'}</Button></div>}
        </div>;
    }
    return <section className="space-y-5" aria-label={role === 'landlord' ? 'Maintenance queue' : 'Your maintenance requests'}>
        {role === 'landlord' ? <PageHeader title="Maintenance" description="Review full request details and update progress. Urgency and progress are separate." /> : standalone ? <PageHeader title="Maintenance" description="Follow your reports and the landlord’s recorded progress." /> : <div className="space-y-2"><h2 className="df-section-title">Maintenance requests</h2><p className="text-sm text-muted">Follow your reports and the landlord’s recorded progress.</p></div>}
        <p ref={selectedId ? undefined : noticeRef} tabIndex={-1} role="status" className={notice && !selectedId ? 'text-sm text-success' : 'sr-only'}>{selectedId ? '' : notice}</p>
        <MaintenanceRequestList role={role} requests={requests} loading={loading} error={error} onRetry={onRetry} busy={action.busy} emptyAction={emptyAction}
            onOpen={request => { setSelectedId(request.id); setNotice(''); }} />
        <Drawer open={selectedId !== null} onClose={() => setSelectedId(null)} title="Request details" busy={selectedId ? !!action.busy[selectedId] : false}>
            {notice && <p ref={noticeRef} tabIndex={-1} role="status" className="text-sm text-success">{notice}</p>}
            {loading && <p role="status" className="text-sm text-muted">Refreshing request details…</p>}
            {error && <ErrorMessage>Request details could not be refreshed. <Button variant="quiet" onClick={onRetry}>Try again</Button></ErrorMessage>}
            {selected ? renderRequest(selected) : <EmptyState title="Request unavailable" description="This request is no longer in the loaded records. Close this panel and refresh the list." />}
        </Drawer>
    </section>;
}
