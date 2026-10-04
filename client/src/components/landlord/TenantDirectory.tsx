import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useRecordAction } from '../../hooks/useRecordAction';
import { Button } from '../ui/Button';
import { FormField, Input, Select } from '../ui/FormField';
import { PageHeader, Panel } from '../ui/Layout';
import { Dialog } from '../ui/Dialog';
import { EmptyState, ErrorState, ErrorMessage, LoadingState } from '../ui/Feedback';
import { StatusBadge } from '../ui/StatusBadge';

export interface DirectoryTenant { id: string; name: string; email: string; phoneNumber?: string | null; isApproved: boolean; roomNumber?: string }
export interface AssignmentRoom { room_number: string; capacity: number; currentOccupants: number }
interface Props {
    tenants: DirectoryTenant[]; rooms: AssignmentRoom[]; loading: boolean; error: string | null;
    roomsLoading: boolean; roomsError: string | null; onRetry: () => void; onRetryRooms: () => void; onBack: () => void;
    onApprove: (id: string) => Promise<boolean>; onRemove: (id: string) => Promise<boolean>;
    onAssign: (id: string, roomNumber: string) => Promise<boolean>;
}
const assigned = (tenant: DirectoryTenant) => !!tenant.roomNumber && tenant.roomNumber !== 'Unassigned';
const groupOf = (tenant: DirectoryTenant) => !tenant.isApproved ? 'pending' : assigned(tenant) ? 'assigned' : 'unassigned';
const groups = [{ id: 'pending', title: 'Pending applications', detail: 'Approve access before assigning a room.', tone: 'info' as const },
    { id: 'unassigned', title: 'Approved — needs a room', detail: 'These tenants have access but still need a room assignment.', tone: 'warning' as const },
    { id: 'assigned', title: 'Assigned tenants', detail: 'Approved tenants with a room assignment.', tone: 'success' as const }];

export function TenantDirectory({ tenants, rooms, loading, error, roomsLoading, roomsError, onRetry, onRetryRooms, onBack, onApprove, onRemove, onAssign }: Props) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [assignment, setAssignment] = useState<DirectoryTenant | null>(null);
    const [room, setRoom] = useState('');
    const [removal, setRemoval] = useState<DirectoryTenant | null>(null);
    const [notice, setNotice] = useState('');
    const noticeRef = useRef<HTMLParagraphElement>(null);
    const action = useRecordAction();
    useEffect(() => { if (notice) noticeRef.current?.focus(); }, [notice]);
    const normalized = query.trim().toLowerCase();
    const visible = tenants.filter(tenant => (filter === 'all' || groupOf(tenant) === filter) && `${tenant.name} ${tenant.email} ${tenant.roomNumber || ''}`.toLowerCase().includes(normalized));
    const availableRooms = rooms.filter(item => item.currentOccupants < item.capacity);
    const currentAssignment = tenants.find(tenant => tenant.id === assignment?.id);
    const canAssign = !!currentAssignment?.isApproved && !assigned(currentAssignment) && !loading && !error && !roomsLoading && !roomsError;
    const canRemove = tenants.some(tenant => tenant.id === removal?.id) && !loading && !error;

    async function approve(tenant: DirectoryTenant) {
        setNotice('');
        if (await action.run(tenant.id, () => onApprove(tenant.id), 'Approval could not be confirmed. Refresh records before retrying.')) setNotice(`${tenant.name} approved. Assign a room next.`);
    }
    async function assign() {
        if (!assignment || !canAssign || !room || !availableRooms.some(item => item.room_number === room)) return;
        setNotice('');
        if (await action.run(assignment.id, () => onAssign(assignment.id, room), 'Room assignment could not be confirmed. Refresh records before retrying.')) {
            setNotice(`${assignment.name} assigned to room ${room}.`); setAssignment(null); setRoom('');
        }
    }
    async function remove() {
        if (!removal || !canRemove) return;
        setNotice('');
        if (await action.run(removal.id, () => onRemove(removal.id), 'Removal could not be confirmed. Refresh records before retrying.')) { setNotice(`${removal.name} removed from this dormitory.`); setRemoval(null); }
    }
    return <div className="space-y-6">
        <Button variant="quiet" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />Back to overview</Button>
        <PageHeader title="Tenants" description="Review applications, assign rooms, and manage current tenants." />
        <p ref={noticeRef} tabIndex={-1} role="status" className="text-sm text-success">{notice}</p>
        <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Find tenant" hint="Search by name, email, or room.">{field => <Input {...field} type="search" leadingIcon={<Search size={18} />} value={query} onChange={event => setQuery(event.target.value)} />}</FormField>
            <FormField label="Show tenants">{field => <Select {...field} value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All tenants</option>{groups.map(group => <option key={group.id} value={group.id}>{group.title}</option>)}</Select>}</FormField>
        </div>
        {loading ? <LoadingState>Loading tenants…</LoadingState> : error ? <ErrorState title="Tenants unavailable" description={error} action={<Button variant="secondary" onClick={onRetry}>Try again</Button>} /> : !tenants.length ? <EmptyState title="No tenant applications yet" description="Tenants will appear here after applying with your dorm code." /> : !visible.length ? <EmptyState title="No matching tenants" description="Try another search or show all tenants." action={<Button variant="secondary" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</Button>} /> : groups.map(group => {
            const members = visible.filter(tenant => groupOf(tenant) === group.id);
            return members.length > 0 && <section key={group.id} className="space-y-3" aria-labelledby={`tenant-group-${group.id}`}>
                <div className="flex flex-wrap items-center gap-3"><h2 id={`tenant-group-${group.id}`} className="df-section-title">{group.title}</h2><StatusBadge tone={group.tone}>{members.length} {members.length === 1 ? 'tenant' : 'tenants'}</StatusBadge></div>
                <p className="text-sm text-muted">{group.detail}</p>
                {members.map(tenant => <Panel key={tenant.id} className="space-y-3 break-words" aria-label={`Tenant ${tenant.name}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 space-y-1"><h3 className="font-semibold">{tenant.name}</h3><p className="break-all text-sm text-muted">{tenant.email}</p>{tenant.phoneNumber && <p className="text-sm text-muted">{tenant.phoneNumber}</p>}{tenant.isApproved && <p className="text-sm">{assigned(tenant) ? `Room ${tenant.roomNumber}` : 'Room unassigned'}</p>}</div>
                        <div className="flex flex-wrap gap-3">
                            {!tenant.isApproved ? <Button loading={action.busy[tenant.id]} loadingText="Saving…" onClick={() => approve(tenant)}>Approve access</Button> : !assigned(tenant) && <Button disabled={action.busy[tenant.id]} onClick={() => { setAssignment(tenant); setRoom(''); action.clearError(tenant.id); }}>Assign room</Button>}
                            <Button variant="danger" disabled={action.busy[tenant.id]} onClick={() => { setRemoval(tenant); action.clearError(tenant.id); }}>{tenant.isApproved ? 'Remove tenant' : 'Reject application'}</Button>
                        </div>
                    </div>
                    {action.errors[tenant.id] && <ErrorMessage>{action.errors[tenant.id]} <Button variant="quiet" onClick={onRetry}>Refresh records</Button></ErrorMessage>}
                </Panel>)}
            </section>;
        })}
        <Dialog open={!!assignment} onClose={() => setAssignment(null)} title="Assign room" busy={assignment ? action.busy[assignment.id] : false}>
            <p className="text-sm text-muted">Choose a room for {assignment?.name}. Availability is checked again when you assign.</p>
            {roomsError && <ErrorMessage>{roomsError} <Button variant="quiet" onClick={onRetryRooms}>Refresh room availability</Button></ErrorMessage>}
            <form className="space-y-4" onSubmit={event => { event.preventDefault(); assign(); }}>
                <FormField label="Available room">{field => <Select {...field} data-autofocus required disabled={!canAssign || (!!assignment && action.busy[assignment.id])} value={room} onChange={event => setRoom(event.target.value)}>
                    <option value="">Choose a room</option>{room && !availableRooms.some(item => item.room_number === room) && <option value={room} disabled>Room {room} — no longer available</option>}
                    {availableRooms.map(item => <option key={item.room_number} value={item.room_number}>Room {item.room_number} ({item.capacity - item.currentOccupants} {item.capacity - item.currentOccupants === 1 ? 'place' : 'places'} available)</option>)}
                </Select>}</FormField>
                {roomsLoading && <p role="status" className="text-sm text-info">Refreshing room availability…</p>}
                {!roomsLoading && !roomsError && !availableRooms.length && <p className="text-sm text-muted">No rooms have available capacity. Check the Rooms page before assigning.</p>}
                {(!currentAssignment || !currentAssignment.isApproved || assigned(currentAssignment)) && <p role="status" className="text-sm text-warning">This tenant is unavailable or no longer awaiting assignment. Refresh records.</p>}
                {assignment && action.errors[assignment.id] && <ErrorMessage>{action.errors[assignment.id]} <Button variant="quiet" onClick={onRetryRooms}>Refresh room availability</Button></ErrorMessage>}
                <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" onClick={() => setAssignment(null)} disabled={!!assignment && action.busy[assignment.id]}>Cancel</Button><Button type="submit" loading={!!assignment && action.busy[assignment.id]} loadingText="Assigning…" disabled={!canAssign || !room || !availableRooms.some(item => item.room_number === room)}>Assign room</Button></div>
            </form>
        </Dialog>
        <Dialog open={!!removal} onClose={() => setRemoval(null)} title={removal?.isApproved ? 'Remove tenant?' : 'Reject application?'} busy={removal ? action.busy[removal.id] : false}>
            <div className="space-y-3 text-sm text-muted"><p>This removes <strong>{removal?.name}</strong> from this dormitory and resets their approval.</p><p className="font-semibold text-error">Their room assignment, payment records, and maintenance requests will be deleted. These records cannot be restored through DormFix.</p><p>Their user account will remain. They can apply again with a dorm code.</p></div>
            {removal && action.errors[removal.id] && <ErrorMessage>{action.errors[removal.id]} <Button variant="quiet" onClick={onRetry}>Refresh records</Button></ErrorMessage>}
            {!canRemove && <p role="status" className="text-sm text-warning">Check the loaded tenant list before proceeding.</p>}
            <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" data-autofocus disabled={!!removal && action.busy[removal.id]} onClick={() => setRemoval(null)}>Cancel</Button><Button variant="danger" disabled={!canRemove} loading={!!removal && action.busy[removal.id]} loadingText="Saving…" onClick={remove}>{removal?.isApproved ? 'Remove tenant' : 'Reject application'}</Button></div>
        </Dialog>
    </div>;
}
