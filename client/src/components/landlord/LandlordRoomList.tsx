// client/src/components/landlord/LandlordRoomList.tsx
import React, { useState } from 'react';
import { Plus, Users, ArrowLeft, BedDouble } from 'lucide-react';
import { useAuth } from '../UserContext';
import { useRooms } from '../../hooks/useRooms';
import { AddRoomDialog } from './AddRoomDialog';
import { Button } from '../ui/Button';
import { ErrorState, EmptyState, LoadingState } from '../ui/Feedback';
import toast from 'react-hot-toast';

interface RoomListProps {
    onBack: () => void;
}

export const LandlordRoomList: React.FC<RoomListProps> = ({ onBack }) => {
    const { user } = useAuth();
    const { rooms, isLoading, error, addError, addRoom, refreshRooms } = useRooms(user?.id);

    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <div className="space-y-6 text-ink">
            <div className="space-y-6">
                
                {/* ELEGANT BACK NAVIGATION TRACK */}
                <button 
                    onClick={onBack} 
                    className="group flex items-center gap-2 text-xs font-bold text-[#5c6e4e] uppercase tracking-wider hover:text-[#425042] transition-colors outline-none"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Back to overview
                </button>

                {/* PAGE TYPOGRAPHY HEADER */}
                <div className="border-b border-gray-200/60 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="df-page-title mb-2">Rooms</h1>
                        <p className="text-slate-500 text-sm">Review room allocation metrics and maximum occupant capacity.</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-5 py-2.5 rounded-full bg-[#425042] hover:bg-[#344034] text-white text-sm font-medium flex items-center gap-2 shadow-sm transition-all shrink-0 self-start sm:self-auto"
                    >
                        <Plus size={16} /> Add room
                    </button>
                </div>

                {/* ACTIVE PROPERTY ROOMS LEDGER PANEL */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-transparent">
                        <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                            <BedDouble size={18} className="text-[#657655]" /> Room occupancy
                        </h2>
                        <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <span>Total Spots: <b className="text-slate-700 font-bold">{isLoading || error ? '—' : rooms.reduce((acc, r) => acc + r.capacity, 0)}</b></span>
                            <span className="h-3 w-px bg-gray-300"></span>
                            <span>Live Occupied: <b className="text-[#5c6e4e] font-bold">{isLoading || error ? '—' : rooms.reduce((acc, r) => acc + (r.currentOccupants || 0), 0)}</b></span>
                        </div>
                    </div>

                    {/* CARD ITEMS REPLACING PRAGMATIC BARE TABLE ROW TILES */}
                    <div className="p-6 space-y-3 max-h-[550px] overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <LoadingState>Loading rooms…</LoadingState>
                        ) : error ? (
                            <ErrorState title="Rooms could not be loaded" description={error} action={<Button variant="secondary" onClick={refreshRooms}>Try again</Button>} />
                        ) : rooms.length === 0 ? (
                            <EmptyState title="No rooms yet" description="Add a room before assigning tenants." action={<Button onClick={() => setIsModalOpen(true)}>Add room</Button>} />
                        ) : (
                            rooms.map((room) => {
                                const current = room.currentOccupants || 0;
                                const isFull = current >= room.capacity;
                                const percentFull = Math.round((current / room.capacity) * 100);

                                return (
                                    <div key={room.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#f8f9f5] hover:bg-[#f4f7f4] border border-gray-200/50 rounded-2xl transition-all">
                                        <div className="flex items-center gap-4 min-w-[120px]">
                                            <div className="h-10 w-10 rounded-full bg-white border border-gray-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                                {room.room_number.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800 text-sm">Unit {room.room_number}</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                                                    <Users size={12} /> {current} / {room.capacity} Spots Filled
                                                </div>
                                            </div>
                                        </div>

                                        {/* SCALABLE HORIZONTAL DENSITY METER */}
                                        <div className="flex-1 max-w-md hidden md:flex items-center gap-3">
                                            <div className="w-full bg-white border border-gray-200/60 h-2 rounded-full overflow-hidden shadow-inner">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-[#cc4747]' : 'bg-[#657655]'}`} 
                                                    style={{ width: `${percentFull}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-400 min-w-[36px] text-right">{percentFull}%</span>
                                        </div>
                                        
                                        {/* TONE-MATCHED SECTOR SYSTEM STATUS TAGS */}
                                        <div className="shrink-0 text-right sm:min-w-[110px]">
                                            {isFull ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">
                                                    Fully Booked
                                                </span>
                                            ) : current > 0 ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                                    Partial
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#e7efdb] text-[#5c6e4e] border border-[#d3e0c0]">
                                                    Available
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <AddRoomDialog open={isModalOpen} onClose={() => setIsModalOpen(false)} error={addError}
                onSave={async (roomNumber, capacity) => {
                    const saved = await addRoom(roomNumber, capacity);
                    if (saved) toast.success('Room added successfully.');
                    return saved;
                }} />
        </div>
    );
};
