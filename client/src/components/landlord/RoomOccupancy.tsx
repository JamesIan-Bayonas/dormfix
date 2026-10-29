import type { Room } from '../../types/types';
import { StatusBadge } from '../ui/StatusBadge';
import { OccupancyRing } from '../ui/OccupancyRing';
import { SectionHeader } from '../ui/Layout';

export function RoomOccupancy({ rooms }: { rooms: Room[] }) {
    const totalCapacity = rooms.reduce((total, room) => total + room.capacity, 0);
    const totalOccupied = rooms.reduce((total, room) => total + (room.currentOccupants || 0), 0);
    const availablePlaces = totalCapacity - totalOccupied;

    return (
        <section aria-labelledby="room-occupancy-title" className="space-y-6">
            {/* Header row: title + aggregate stats */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <SectionHeader
                    id="room-occupancy-title"
                    title="Room occupancy"
                    count={rooms.length}
                />
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                    <span><strong className="text-ink tabular-nums">{totalCapacity}</strong> total places</span>
                    <span><strong className="text-ink tabular-nums">{totalOccupied}</strong> occupied</span>
                    <span><strong className="text-ink tabular-nums">{availablePlaces}</strong> available</span>
                </div>
            </div>

            {/* Occupancy ring summary + room cards grid */}
            <div className="grid items-start gap-6 xl:grid-cols-[auto_1fr]">
                {/* Donut ring — visible at xl+ */}
                <div className="hidden xl:block">
                    <OccupancyRing occupied={totalOccupied} total={totalCapacity} size={140} strokeWidth={14} />
                </div>

                {/* Room grid */}
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
                    {rooms.map(room => {
                        const current = room.currentOccupants || 0;
                        const pct = room.capacity > 0 ? Math.round((current / room.capacity) * 100) : 0;
                        const isFull = current >= room.capacity;
                        const isEmpty = current === 0;

                        const barColor = isFull
                            ? 'bg-error'
                            : pct >= 70
                                ? 'bg-warning'
                                : 'bg-primary';

                        const tone = isFull ? 'error' : isEmpty ? 'neutral' : 'success';
                        const label = isFull ? 'Full' : isEmpty ? 'Vacant' : 'Available';

                        return (
                            <li
                                key={room.id}
                                className="df-card space-y-3 p-4"
                                aria-label={`Room ${room.room_number}`}
                            >
                                {/* Room number + badge row */}
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="break-words font-semibold">Room {room.room_number}</h3>
                                    <StatusBadge tone={tone}>{label}</StatusBadge>
                                </div>

                                {/* Occupancy bar */}
                                <div aria-hidden="true" className="space-y-1">
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted">{current} of {room.capacity} places occupied</p>
                                </div>
                                {/* Screen-reader text */}
                                <span className="sr-only">{current} of {room.capacity} places occupied. {label}.</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
