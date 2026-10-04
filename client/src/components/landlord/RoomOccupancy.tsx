import type { Room } from '../../types/types';
import { StatusBadge } from '../ui/StatusBadge';
export function RoomOccupancy({ rooms }: { rooms: Room[] }) {
    return <section aria-label="Room occupancy" className="space-y-4 rounded-panel border border-divider bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="df-section-title">Room occupancy</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted"><p>Total capacity: <strong className="text-ink">{rooms.reduce((total, room) => total + room.capacity, 0)}</strong></p><p>Occupied: <strong className="text-ink">{rooms.reduce((total, room) => total + (room.currentOccupants || 0), 0)}</strong></p></div></div>
        <ul className="space-y-3">{rooms.map(room => {
            const current = room.currentOccupants || 0;
            const full = current >= room.capacity;
            return <li key={room.id} className="flex flex-col gap-3 rounded-control border border-divider bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><h3 className="break-words font-semibold">Room {room.room_number}</h3><p className="mt-1 text-sm text-muted">{current} of {room.capacity} spaces occupied</p></div>
                <StatusBadge tone={full ? 'neutral' : 'info'}>{full ? 'Full' : 'Space available'}</StatusBadge>
            </li>;
        })}</ul>
    </section>;
}
