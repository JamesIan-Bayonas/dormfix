// LandLordRoomList.tsx
import React, { useState } from 'react';
import { Plus, Users, X } from 'lucide-react';
import { useAuth } from '../UserContext';
import { useRooms } from '../../hooks/useRooms'; 

interface RoomListProps {
    onBack: () => void;
}

export const LandlordRoomList: React.FC<RoomListProps> = ({ onBack }) => {
    const { user } = useAuth();
    
    // 2. USE THE HOOK: delegating all "thinking" to the Logic Layer
    // We instantly get the data (rooms) and the action (addRoom)
    const { rooms, isLoading, addRoom } = useRooms(user?.id);

    // Local UI state (Modals/Form inputs) stays here because it's specific to the View
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRoomNum, setNewRoomNum] = useState('');
    const [newCapacity, setNewCapacity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 3. CLEAN HANDLER: The UI just calls the function, it doesn't care about API status codes
    const handleAddRoomSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const success = await addRoom(newRoomNum, newCapacity);
        
        if (success) {
            setIsModalOpen(false);
            setNewRoomNum('');
            setNewCapacity(1);
            alert("Room added successfully!");
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={onBack} className="text-sm text-slate-500 hover:text-indigo-600 mb-4 font-medium">
                    ← Back to Dashboard
                </button>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Property Rooms</h1>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Add Room
                    </button>
                </div>

                {/* ROOM LIST TABLE */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <div className="text-sm text-slate-500">
                            {/* We handle the simple math here, or you could even move this to the hook if complex */}
                            Total Capacity: <b>{rooms.reduce((acc, r) => acc + r.capacity, 0)}</b>
                        </div>
                        <div className="text-sm text-slate-500">
                            Occupied: <b>{rooms.reduce((acc, r) => acc + (r.currentOccupants || 0), 0)}</b>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading rooms...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Room Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Occupancy</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {rooms.map((room) => {
                                    const current = room.currentOccupants || 0;
                                    const isFull = current >= room.capacity;
                                    return (
                                        <tr key={room.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                                {room.room_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isFull ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Occupied
                                                    </span>
                                                ) : current > 0 ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Partial
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Available
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 flex items-center gap-1">
                                                <Users size={14} />
                                                {current} / {room.capacity}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ADD ROOM MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Add New Room</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleAddRoomSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Room Number / Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g. 305-B"
                                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                                    value={newRoomNum}
                                    onChange={e => setNewRoomNum(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Capacity (Max Tenants)</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    required 
                                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                                    value={newCapacity}
                                    onChange={e => setNewCapacity(parseInt(e.target.value))}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Room'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};