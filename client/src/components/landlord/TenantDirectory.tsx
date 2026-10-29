import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Search, DoorOpen, UserRoundMinus, ShieldAlert, Users } from 'lucide-react';
import { useRecordAction } from '../../hooks/useRecordAction';
import { Button } from '../ui/Button';
import { FormField, Input, Select } from '../ui/FormField';
import { PageHeader, SectionHeader } from '../ui/Layout';
import { Dialog } from '../ui/Dialog';
import { EmptyState, ErrorState, ErrorMessage, LoadingState } from '../ui/Feedback';

export interface DirectoryTenant { id: string; name: string; email: string; phoneNumber?: string | null; isApproved: boolean; roomNumber?: string }
export interface AssignmentRoom { room_number: string; capacity: number; currentOccupants: number }
interface Props {
    tenants: DirectoryTenant[]; rooms: AssignmentRoom[]; loading: boolean; error: string | null;
    roomsLoading: boolean; roomsError: string | null; onRetry: () => void; onRetryRooms: () => void; onBack: () => void;
    onApprove: (id: string) => Promise<boolean>; onRemove: (id: string) => Promise<boolean>;
    onAssign: (id: string, roomNumber: string) => Promise<boolean>;
}
const assigned = (tenant: DirectoryTenant) => !!tenant.roomNumber && tenant.roomNumber !== 'Unassigned';
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'T';
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
        if (await action.run(tenant.id, () => onApprove(tenant.id), 'Approval could not be confirmed. Refresh records before retrying.', 'Tenant access approved. Assign a room next.')) setNotice(`${tenant.name} approved. Assign a room next.`);
    }
    async function assign() {
        if (!assignment || !canAssign || !room || !availableRooms.some(item => item.room_number === room)) return;
        setNotice('');
        if (await action.run(assignment.id, () => onAssign(assignment.id, room), 'Room assignment could not be confirmed. Refresh records before retrying.', `Tenant assigned to room ${room}.`)) {
            setNotice(`${assignment.name} assigned to room ${room}.`); setAssignment(null); setRoom('');
        }
    }
    async function remove() {
        if (!removal || !canRemove) return;
        setNotice('');
        if (await action.run(removal.id, () => onRemove(removal.id), 'Removal could not be confirmed. Refresh records before retrying.', removal.isApproved ? 'Tenant removed from this dormitory.' : 'Application rejected.')) { setNotice(`${removal.name} removed from this dormitory.`); setRemoval(null); }
    }
    return <div className="space-y-6">
        <Button variant="quiet" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />Back to overview</Button>
        <PageHeader title="Tenants" description="Review applications, assign rooms, and manage current tenants." />
        <p ref={noticeRef} tabIndex={-1} role="status" className={notice ? 'text-sm text-success' : 'sr-only'}>{notice}</p>
        <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Find tenant" hint="Search by name, email, or room.">{field => <Input {...field} type="search" leadingIcon={<Search size={18} />} value={query} onChange={event => setQuery(event.target.value)} />}</FormField>
            <FormField label="Show tenants">{field => <Select {...field} value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All tenants</option>{groups.map(group => <option key={group.id} value={group.id}>{group.title}</option>)}</Select>}</FormField>
        </div>
        {loading ? <LoadingState>Loading tenants…</LoadingState> : error ? <ErrorState title="Tenants unavailable" description={error} action={<Button variant="secondary" onClick={onRetry}>Try again</Button>} /> : !tenants.length ? <EmptyState title="No tenant applications yet" description="Tenants will appear here after applying with your dorm code." /> : !visible.length ? <EmptyState title="No matching tenants" description="Try another search or show all tenants." action={<Button variant="secondary" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</Button>} /> : groups.map(group => {
            const members = visible.filter(tenant => groupOf(tenant) === group.id);
        return members.length > 0 && <section key={group.id} className="space-y-3" aria-labelledby={`tenant-group-${group.id}`}>
                <SectionHeader
                    id={`tenant-group-${group.id}`}
                    title={group.title}
                    count={members.length}
                />
                <p className="text-sm text-muted">{group.detail}</p>
                <div className="overflow-hidden rounded-2xl border border-divider bg-surface">
                <div className="hidden grid-cols-[minmax(0,1fr)_10rem_21rem] items-center gap-6 border-b border-divider bg-surface-muted px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted xl:grid" aria-hidden="true"><span>Tenant / contact</span><span>Room / status</span><span className="text-right">Actions</span></div>
                <ul className="divide-y divide-divider">
                {members.map(tenant => <li key={tenant.id} className="space-y-3 p-4 sm:px-5 sm:py-5" aria-label={`Tenant ${tenant.name}`}>
                    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_10rem_21rem] xl:items-center xl:gap-6">
                        <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-primary" aria-hidden="true">{initials(tenant.name)}</span>
                            <div className="min-w-0 space-y-1"><h3 className="break-words font-semibold">{tenant.name}</h3><p className="break-all text-sm text-muted">{tenant.email}</p>{tenant.phoneNumber && <p className="break-words text-sm text-muted">{tenant.phoneNumber}</p>}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 xl:flex-col xl:items-start">
                            {assigned(tenant) && <span className="inline-flex max-w-full items-center gap-2 rounded-lg bg-surface-muted px-2.5 py-1 text-sm font-medium"><DoorOpen size={15} className="shrink-0 text-muted" aria-hidden="true" /><span className="break-all">Room {tenant.roomNumber}</span></span>}
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted"><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${group.id === 'assigned' ? 'bg-success' : group.id === 'pending' ? 'bg-info' : 'bg-warning'}`} />{group.id === 'assigned' ? 'Assigned' : group.id === 'pending' ? 'Awaiting approval' : 'Needs a room'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                            {!tenant.isApproved ? <Button loading={action.busy[tenant.id]} loadingText="Saving…" onClick={() => approve(tenant)}>Approve access</Button> : !assigned(tenant) && <Button disabled={action.busy[tenant.id]} onClick={() => { setAssignment(tenant); setRoom(''); action.clearError(tenant.id); }}>Assign room</Button>}
                            <Button variant="quiet" aria-label={`${tenant.isApproved ? 'Remove tenant' : 'Reject application'}: ${tenant.name}`} disabled={action.busy[tenant.id]} onClick={() => { setRemoval(tenant); action.clearError(tenant.id); }}><UserRoundMinus size={17} aria-hidden="true" />{tenant.isApproved ? 'Remove tenant' : 'Reject application'}</Button>
                        </div>
                    </div>
                    {action.errors[tenant.id] && <ErrorMessage>{action.errors[tenant.id]} <Button variant="quiet" onClick={onRetry}>Refresh records</Button></ErrorMessage>}
                </li>)}
                </ul>
                </div>
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
        <Dialog open={!!removal} onClose={() => setRemoval(null)} title={removal?.isApproved ? 'Remove tenant?' : 'Reject application?'} description="Review the details before you confirm." busy={removal ? action.busy[removal.id] : false}>
            <div className="flex min-w-0 items-start gap-3 rounded-xl border border-divider bg-canvas p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-primary" aria-hidden="true">{initials(removal?.name || '')}</span>
                <div className="min-w-0 space-y-1"><p className="break-words font-semibold">{removal?.name}</p><p className="break-all text-sm text-muted">{removal?.email}</p>{removal && assigned(removal) && <p className="break-all text-sm text-muted">Room {removal.roomNumber}</p>}</div>
            </div>
            <div className="rounded-xl border border-error/20 bg-error-soft p-4 text-sm">
                <div className="flex items-start gap-2"><ShieldAlert size={20} className="shrink-0 text-error" aria-hidden="true" /><div className="min-w-0 space-y-2"><h3 className="font-semibold text-error">This cannot be undone in DormFix</h3><p className="leading-relaxed text-ink">The tenant will be removed from this dormitory and their approval will be reset.</p><p className="text-ink">The following will be deleted:</p><ul className="list-disc space-y-1 pl-5 text-ink"><li>Their room assignment</li><li>Their payment records for this dormitory</li><li>Their maintenance requests</li></ul></div></div>
            </div>
            <p className="flex items-start gap-2 text-sm leading-relaxed text-muted"><Users size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><span>Their user account stays active. They can apply again using a dorm code.</span></p>
            {removal && action.errors[removal.id] && <ErrorMessage>{action.errors[removal.id]} <Button variant="quiet" onClick={onRetry}>Refresh records</Button></ErrorMessage>}
            {!canRemove && <p role="status" className="text-sm text-warning">Check the loaded tenant list before proceeding.</p>}
            <div className="flex flex-wrap justify-end gap-3 border-t border-divider pt-4"><Button variant="secondary" data-autofocus disabled={!!removal && action.busy[removal.id]} onClick={() => setRemoval(null)}>Cancel</Button><Button variant="danger" disabled={!canRemove} loading={!!removal && action.busy[removal.id]} loadingText="Saving…" onClick={remove}>{removal?.isApproved ? 'Remove tenant' : 'Reject application'}</Button></div>
        </Dialog>
    </div>;
}
