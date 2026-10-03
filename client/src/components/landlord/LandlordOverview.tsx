import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import type { Room, Payment, LandlordMaintenanceRequest } from '../../types/types';
import { summarizeOverview, filterOverviewRooms, overviewActivity } from '../../utils/overview';
import type { OverviewTenant } from '../../utils/overview';
import type { RoomDetailData } from './RoomDetailDrawer';
import { PageHeader, Panel } from '../ui/Layout';
import { Button } from '../ui/Button';
import { FormField, Input } from '../ui/FormField';
import { EmptyState, ErrorMessage, ErrorState, LoadingState } from '../ui/Feedback';
import { StatusBadge } from '../ui/StatusBadge';

interface Resource<T> { data: T[]; loading: boolean; error: string | null; retry: () => void }
interface Props {
    rooms: Resource<Room>;
    tenants: Resource<OverviewTenant>;
    payments: Resource<Payment>;
    maintenance: Resource<LandlordMaintenanceRequest>;
    roomDetails: RoomDetailData[];
    onOpenRoom: (id: string) => void;
}

function ResourceContent({ resource, children }: { resource: Pick<Resource<unknown>, 'loading' | 'error' | 'retry'>; children: ReactNode }) {
    if (resource.loading) return <p role="status" className="text-sm text-muted">Loading…</p>;
    if (resource.error) return <div className="space-y-2"><ErrorMessage>{resource.error}</ErrorMessage><Button variant="quiet" onClick={resource.retry}>Try again</Button></div>;
    return <>{children}</>;
}

export function LandlordOverview({ rooms, tenants, payments, maintenance, roomDetails, onOpenRoom }: Props) {
    const [query, setQuery] = useState('');
    const stats = summarizeOverview(rooms.data, tenants.data, payments.data, maintenance.data);
    const roomResources = [rooms, tenants, maintenance];
    const roomLoading = roomResources.some(resource => resource.loading);
    const roomError = roomResources.find(resource => resource.error)?.error;
    const filteredRooms = filterOverviewRooms(roomDetails, query);
    const activityResources = [tenants, payments, maintenance];
    const activityPartial = activityResources.some(resource => resource.error || resource.loading);
    const activity = overviewActivity(
        tenants.loading || tenants.error ? [] : tenants.data,
        payments.loading || payments.error ? [] : payments.data,
        maintenance.loading || maintenance.error ? [] : maintenance.data,
    );
    const attention = [
        { title: 'Applications', count: stats.pendingApplicants, detail: 'Awaiting approval', to: '/tenants', resource: tenants },
        { title: 'Room assignments', count: stats.unassignedTenants, detail: 'Approved tenants without a room', to: '/tenants', resource: tenants },
        { title: 'Payment review', count: stats.receiptsToReview, detail: 'Pending and anomalous receipts', to: '/payments', resource: payments },
        { title: 'Maintenance', count: stats.activeRequests, detail: `${stats.urgentRequests} high or emergency urgency`, to: '/maintenance', resource: maintenance },
    ];
    return <div className="space-y-6">
        <PageHeader title="Overview" description="Review outstanding work, room availability, and recent records." />
        <section aria-labelledby="attention-title" className="space-y-3">
            <h2 id="attention-title" className="df-section-title">Needs attention</h2>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {attention.map(item => <Panel key={item.title} className="space-y-3">
                    <h3 className="font-semibold">{item.title}</h3>
                    <ResourceContent resource={item.resource}>
                        <p className="text-3xl font-semibold tabular-nums">{item.count}</p>
                        <p className="text-sm text-muted">{item.detail}</p>
                        <Link to={item.to} className="df-button df-button--secondary">Open {item.title.toLowerCase()}<ArrowRight size={16} aria-hidden="true" /></Link>
                    </ResourceContent>
                </Panel>)}
            </div>
        </section>
        <section aria-label="Workspace summary" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <Panel className="space-y-2"><h2 className="text-sm font-semibold">Rooms</h2><ResourceContent resource={rooms}>
                <p className="text-2xl font-semibold tabular-nums">{rooms.data.length}</p><p className="text-sm text-muted">{stats.availablePlaces} available places</p>
            </ResourceContent></Panel>
            <Panel className="space-y-2"><h2 className="text-sm font-semibold">Room occupancy</h2><ResourceContent resource={rooms}>
                <p className="text-2xl font-semibold tabular-nums">{stats.occupiedPlaces} <span className="text-base text-muted">/ {stats.totalCapacity} places</span></p><p className="text-sm text-muted">Based on room assignments</p>
            </ResourceContent></Panel>
            <Panel className="space-y-2"><h2 className="text-sm font-semibold">Assigned tenants</h2><ResourceContent resource={tenants}>
                <p className="text-2xl font-semibold tabular-nums">{stats.assignedTenants}</p><p className="text-sm text-muted">Approved and assigned to a room</p>
            </ResourceContent></Panel>
            <Panel className="space-y-2"><h2 className="text-sm font-semibold">Verified receipts this month</h2><ResourceContent resource={payments}>
                <p className="break-words text-2xl font-semibold tabular-nums">₱{stats.verifiedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="text-sm text-muted">Verified amount in payment records</p>
            </ResourceContent></Panel>
        </section>
        <div className="grid items-start gap-6 xl:grid-cols-2">
            <Panel className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="df-section-title">Room status</h2><Link to="/rooms" className="df-button df-button--quiet">All rooms</Link></div>
                <FormField id="overview-room-filter" label="Find a room or assigned tenant" hint="Filters room status on this page.">
                    {field => <Input {...field} leadingIcon={<Search size={18} />} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Room name or tenant name" />}
                </FormField>
                {query && filteredRooms.length > 0 && <Button variant="quiet" onClick={() => setQuery('')}>Clear filter</Button>}
                {roomLoading ? <LoadingState>Loading room status…</LoadingState> : roomError ? <ErrorState title="Room details unavailable" description={roomError} action={<Button variant="secondary" onClick={() => roomResources.forEach(resource => resource.retry())}>Try again</Button>} /> : roomDetails.length === 0 ?
                    <EmptyState title="No rooms yet" description="Create rooms to start assigning tenants." action={<Link to="/rooms" className="df-button df-button--primary">Open rooms</Link>} /> : filteredRooms.length === 0 ?
                    <EmptyState title="No matching rooms" description="Try a different room or tenant name." action={<Button variant="secondary" onClick={() => setQuery('')}>Clear filter</Button>} /> : <>
                        <p role="status" className="text-sm text-muted">{filteredRooms.length} of {roomDetails.length} rooms shown</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {filteredRooms.map(room => <button key={room.id} type="button" onClick={() => onOpenRoom(room.id)}
                                className="min-w-0 space-y-3 rounded-control border border-divider bg-surface p-4 text-left hover:bg-surface-muted active:bg-surface-muted">
                                <span className="block break-words font-semibold">Room {room.room_number}</span>
                                <span className="block text-sm text-muted">{room.currentOccupants} / {room.capacity} places occupied</span>
                                <span className="flex flex-wrap gap-2"><StatusBadge tone="neutral">{room.currentOccupants === 0 ? 'Vacant' : room.currentOccupants >= room.capacity ? 'Full' : 'Available'}</StatusBadge>
                                    {room.hasIssue && <StatusBadge tone={room.isCritical ? 'error' : 'warning'}>
                                        {room.isCritical ? 'Urgent maintenance' : 'Active maintenance'}</StatusBadge>}</span>
                            </button>)}
                        </div>
                    </>}
            </Panel>
            <Panel className="space-y-4">
                <h2 className="df-section-title">Recent activity</h2>
                <p className="text-sm text-muted">Latest dated records from the loaded data. Refresh a section to check for updates.</p>
                {activityPartial && <p className="text-sm text-warning">Some activity sources are loading or unavailable. Only available records are shown.</p>}
                {activity.length === 0 ? <EmptyState title={activityPartial ? 'Activity is not yet available' : 'No dated activity yet'} description={activityPartial ? 'Use the section retry actions above if loading fails.' : 'New applications, receipts, and requests will appear here after they are loaded.'} /> :
                    <ul className="divide-y divide-divider">{activity.map(entry => <li key={entry.id}>
                        <Link to={entry.path} className="flex min-h-11 items-start justify-between gap-3 rounded-control py-3 hover:bg-surface-muted">
                            <span className="min-w-0 space-y-1"><span className="block break-words text-sm font-semibold">{entry.title}</span><span className="block text-sm text-muted">{entry.status}</span></span>
                            <time dateTime={entry.date} className="shrink-0 text-sm text-muted">{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>
                        </Link>
                    </li>)}</ul>}
            </Panel>
        </div>
    </div>;
}
