import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, UserRoundPlus, KeyRound, ReceiptText, Wrench } from 'lucide-react';
import type { Room, Payment, LandlordMaintenanceRequest } from '../../types/types';
import { summarizeOverview, filterOverviewRooms, overviewActivity } from '../../utils/overview';
import type { OverviewTenant } from '../../utils/overview';
import type { RoomDetailData } from './RoomDetailDrawer';
import { PageHeader, SectionHeader } from '../ui/Layout';
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

/** Derive activity type from the id prefix set in overviewActivity(). */
function activityType(id: string): 'payment' | 'request' | 'tenant' {
    if (id.startsWith('payment-')) return 'payment';
    if (id.startsWith('request-')) return 'request';
    return 'tenant';
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
        { title: 'Applications', icon: UserRoundPlus, count: stats.pendingApplicants, detail: 'Awaiting approval', action: 'Review applications', to: '/tenants', resource: tenants },
        { title: 'Room assignments', icon: KeyRound, count: stats.unassignedTenants, detail: 'Approved tenants without a room', action: 'Assign rooms', to: '/tenants', resource: tenants },
        { title: 'Payment review', icon: ReceiptText, count: stats.receiptsToReview, detail: 'Pending and anomalous receipts', action: 'Review receipts', to: '/payments', resource: payments },
        { title: 'Maintenance', icon: Wrench, count: stats.activeRequests, detail: stats.urgentRequests > 0 ? `${stats.urgentRequests} high or emergency urgency` : stats.activeRequests > 0 ? 'Routine maintenance requests' : 'No open requests', action: 'View requests', to: '/maintenance', resource: maintenance },
    ];

    const attentionCount = attention.reduce((total, item) => total + (item.resource.loading || item.resource.error ? 0 : item.count), 0);
    const occupancyPercent = stats.totalCapacity > 0 ? Math.min(100, Math.round(stats.occupiedPlaces / stats.totalCapacity * 100)) : 0;
    const orderedAttention = [...attention].sort((a, b) => {
        const priority = (item: typeof a) => item.resource.loading || item.resource.error ? 1
            : item.title === 'Maintenance' && stats.urgentRequests > 0 ? 3 : item.count > 0 ? 2 : 0;
        return priority(b) - priority(a);
    });
    const summary = [
        { label: 'Total rooms', value: rooms.data.length, detail: `${stats.totalCapacity} beds in your dorm`, resource: rooms },
        { label: 'Occupied beds', value: `${stats.occupiedPlaces} / ${stats.totalCapacity}`, detail: 'Based on room assignments', resource: rooms },
        { label: 'Available beds', value: stats.availablePlaces, detail: 'Ready for room assignments', resource: rooms },
        { label: 'Verified this month', value: `₱${stats.verifiedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, detail: 'Verified payment receipts', resource: payments },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Overview" description="Your dorm at a glance. Keep track of rooms, payments, and work that needs you." />
            <section aria-label="Workspace summary" className="df-overview-summary">
                {summary.map(item => (
                    <div key={item.label} className="df-overview-stat">
                        <span className="df-kpi-label">{item.label}</span>
                        <ResourceContent resource={item.resource}>
                            <span className="df-overview-value">{item.value}</span>
                            <span className="df-kpi-sub">{item.detail}</span>
                        </ResourceContent>
                    </div>
                ))}
            </section>
            <div className="df-overview-work">
                <section aria-labelledby="attention-title" className="df-panel space-y-4">
                    <div>
                        <SectionHeader id="attention-title" title="Needs attention" count={attentionCount} />
                        <p className="mt-1 text-sm text-muted">Pending work, with the most pressing items first.</p>
                    </div>
                    <ul className="divide-y divide-divider">
                        {orderedAttention.map(({ icon: Icon, ...item }) => {
                            const ready = !item.resource.loading && !item.resource.error;
                            const hasWork = ready && item.count > 0;
                            const urgent = item.title === 'Maintenance' && stats.urgentRequests > 0;
                            return (
                                <li key={item.title} className={`df-overview-task${hasWork ? ' df-overview-task--pending' : ''}`}>
                                    <span className="df-task-icon"><Icon size={18} aria-hidden="true" /></span>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold">{item.title}</h3>
                                        <ResourceContent resource={item.resource}>
                                            <p className="mt-0.5 text-sm text-muted">{item.detail}</p>
                                        </ResourceContent>
                                    </div>
                                    {ready && <>
                                        <span className="df-overview-task-count"><StatusBadge tone={hasWork ? urgent ? 'error' : 'warning' : 'neutral'}>{item.count} {item.title === 'Maintenance' ? 'active' : 'pending'}</StatusBadge></span>
                                        <Link to={item.to} className="df-overview-task-action">
                                            {hasWork ? item.action : 'View'}
                                            {!hasWork && <span className="sr-only"> {item.title.toLowerCase()}</span>}
                                            <ArrowRight size={15} className="shrink-0" aria-hidden="true" />
                                        </Link>
                                    </>}
                                </li>
                            );
                        })}
                    </ul>
                </section>
                <section aria-labelledby="occupancy-title" className="df-panel flex flex-col gap-5">
                    <SectionHeader id="occupancy-title" title="Occupancy" action={<Link to="/rooms" className="df-task-link">View rooms <ArrowRight size={15} aria-hidden="true" /></Link>} />
                    <ResourceContent resource={rooms}>
                        <div>
                            <p className="df-overview-occupancy-value">{occupancyPercent}<span className="text-2xl">%</span></p>
                            <p className="mt-1 text-sm text-muted">{stats.occupiedPlaces} of {stats.totalCapacity} beds occupied</p>
                        </div>
                        <div>
                            <div role="progressbar" aria-label="Bed occupancy" aria-valuemin={0} aria-valuemax={100} aria-valuenow={occupancyPercent} aria-valuetext={`${stats.occupiedPlaces} of ${stats.totalCapacity} beds occupied`} className="df-overview-progress">
                                <span style={{ width: `${occupancyPercent}%` }} />
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-muted"><span>0%</span><span>100%</span></div>
                        </div>
                        <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-divider pt-4">
                            <div><dt className="text-sm text-muted">Occupied</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{stats.occupiedPlaces}</dd></div>
                            <div><dt className="text-sm text-muted">Available</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{stats.availablePlaces}</dd></div>
                        </dl>
                        {stats.totalCapacity === 0 && <p className="text-sm text-muted">Add rooms and bed capacity to start tracking occupancy.</p>}
                    </ResourceContent>
                </section>
            </div>
            {/* ── Room status + Recent activity ── */}
            <div className="grid items-start gap-6 xl:grid-cols-2">
                {/* Room status */}
                <section aria-labelledby="room-status-title" className="df-card space-y-4">
                    <SectionHeader
                        id="room-status-title"
                        title="Room status"
                        count={roomLoading || roomError ? undefined : roomDetails.length}
                        action={<Link to="/rooms" className="df-button df-button--quiet text-sm">All rooms</Link>}
                    />
                    <FormField id="overview-room-filter" label="Find a room or assigned tenant" hint="Filters room status on this page.">
                        {field => <Input {...field} leadingIcon={<Search size={18} />} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Room name or tenant name" />}
                    </FormField>
                    {query && filteredRooms.length > 0 && (
                        <Button variant="quiet" onClick={() => setQuery('')}>Clear filter</Button>
                    )}
                    {roomLoading ? (
                        <LoadingState>Loading room status…</LoadingState>
                    ) : roomError ? (
                        <ErrorState
                            title="Room details unavailable"
                            description={roomError}
                            action={<Button variant="secondary" onClick={() => roomResources.forEach(r => r.retry())}>Try again</Button>}
                        />
                    ) : roomDetails.length === 0 ? (
                        <EmptyState title="No rooms yet" description="Create rooms to start assigning tenants." action={<Link to="/rooms" className="df-button df-button--primary">Open rooms</Link>} />
                    ) : filteredRooms.length === 0 ? (
                        <EmptyState title="No matching rooms" description="Try a different room or tenant name." action={<Button variant="secondary" onClick={() => setQuery('')}>Clear filter</Button>} />
                    ) : (
                        <>
                            <p role="status" className="text-sm text-muted">{filteredRooms.length} of {roomDetails.length} rooms shown</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {filteredRooms.map(room => {
                                    const occupancyPct = room.capacity > 0 ? room.currentOccupants / room.capacity : 0;
                                    return (
                                        <button
                                            key={room.id}
                                            type="button"
                                            onClick={() => onOpenRoom(room.id)}
                                            className="min-w-0 space-y-3 rounded-control border border-control-border bg-surface p-4 text-left transition-colors hover:bg-surface-muted active:bg-surface-muted"
                                        >
                                            <span className="block break-words font-semibold">Room {room.room_number}</span>
                                            {/* Micro occupancy bar */}
                                            <span className="block" aria-hidden="true">
                                                <span className="mb-1 block text-xs text-muted">{room.currentOccupants} / {room.capacity} places</span>
                                                <span className="block h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                                                    <span
                                                        className="block h-full rounded-full bg-primary transition-all duration-500"
                                                        style={{ width: `${Math.round(occupancyPct * 100)}%` }}
                                                    />
                                                </span>
                                            </span>
                                            <span className="sr-only">{room.currentOccupants} of {room.capacity} places occupied</span>
                                            <span className="flex flex-wrap gap-2">
                                                <StatusBadge tone="neutral">
                                                    {room.currentOccupants === 0 ? 'Vacant' : room.currentOccupants >= room.capacity ? 'Full' : 'Available'}
                                                </StatusBadge>
                                                {room.hasIssue && (
                                                    <StatusBadge tone={room.isCritical ? 'error' : 'warning'}>
                                                        {room.isCritical ? 'Urgent maintenance' : 'Active maintenance'}
                                                    </StatusBadge>
                                                )}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>

                {/* Recent activity */}
                <section aria-labelledby="activity-title" className="df-card space-y-4">
                    <SectionHeader
                        id="activity-title"
                        title="Recent activity"
                        count={activity.length > 0 ? activity.length : undefined}
                    />
                    <p className="text-sm text-muted">
                        Latest dated records from the loaded data. Refresh a section to check for updates.
                    </p>
                    {activityPartial && (
                        <p className="text-sm text-warning">
                            Some activity sources are loading or unavailable. Only available records are shown.
                        </p>
                    )}
                    {activity.length === 0 ? (
                        <EmptyState
                            title={activityPartial ? 'Activity is not yet available' : 'No dated activity yet'}
                            description={activityPartial ? 'Use the section retry actions above if loading fails.' : 'New applications, receipts, and requests will appear here after they are loaded.'}
                        />
                    ) : (
                        <ul className="divide-y divide-divider">
                            {activity.map(entry => {
                                const type = activityType(entry.id);
                                return (
                                    <li key={entry.id}>
                                        <Link
                                            to={entry.path}
                                            className={`df-activity-entry df-activity-entry--${type}`}
                                        >
                                            <span className="min-w-0 space-y-1">
                                                <span className="block break-words text-sm font-semibold">{entry.title}</span>
                                                <span className="block text-sm text-muted">{entry.status}</span>
                                            </span>
                                            <time dateTime={entry.date} className="shrink-0 text-sm text-muted">
                                                {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </time>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
