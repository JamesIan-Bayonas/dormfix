import React, { useState, useEffect } from 'react';
import { User, CheckCircle, XCircle, Home, Calendar } from 'lucide-react';
import { useAuth } from '../UserContext';

interface Tenant {
    id: string;
    name: string;
    email: string;
    roomNumber?: string; // Optional: might be null if unassigned
}

interface RoomSimple {
    room_number: string;
    capacity: number;
    currentOccupants: number;
}

interface ChecklistProps {
    onBack: () => void;
}

export const LandlordTenantChecklist: React.FC<ChecklistProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [rooms, setRooms] = useState<RoomSimple[]>([]);
    
    // Modal State
    const [isAssignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [selectedRoom, setSelectedRoom] = useState('');

    // 1. Fetch Tenants and Rooms
    useEffect(() => {
        if (user?.id) {
            // Fetch Tenants (Assuming you have a route for this, otherwise we mock/create it)
            // Ideally: GET /api/landlord/tenants/:id
            // For now, let's assume we are fetching users linked to this landlord
            fetch(`http://localhost:5000/api/landlord/tenants/${user.id}`) // *See Note Below
                .then(res => res.json())
                .then(setTenants)
                .catch(err => console.error("Failed to load tenants", err));

            // Fetch Rooms (Reusing the route we made in the previous step)
            fetch(`http://localhost:5000/api/landlord/rooms/${user.id}`)
                .then(res => res.json())
                .then(setRooms)
                .catch(err => console.error("Failed to load rooms", err));
        }
    }, [user?.id]);

    const handleAssign = async () => {
        if (!selectedTenant || !selectedRoom) return;

        try {
            const res = await fetch('http://localhost:5000/api/landlord/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: selectedTenant.id,
                    landlordId: user?.id,
                    roomNumber: selectedRoom,
                    moveInDate: new Date()
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Assigned successfully!");
                setAssignModalOpen(false);
                window.location.reload(); // Refresh to show changes
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Assignment failed.");
        }
    };

    const openAssignModal = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setAssignModalOpen(true);
        setSelectedRoom(''); // Reset selection
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={onBack} className="mb-6 text-sm text-slate-500 hover:text-indigo-600">
                    ← Back to Dashboard
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <User className="text-indigo-600" /> Tenant Directory
                        </h2>
                    </div>

                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Room Assignment</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {tenants.map(tenant => (
                                <tr key={tenant.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{tenant.name}</div>
                                        <div className="text-xs text-slate-500">{tenant.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tenant.roomNumber ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 gap-1">
                                                <Home size={12} /> Room {tenant.roomNumber}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                Unassigned
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {!tenant.roomNumber && (
                                            <button 
                                                onClick={() => openAssignModal(tenant)}
                                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium hover:underline"
                                            >
                                                Assign Room
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ASSIGNMENT MODAL */}
            {isAssignModalOpen && selectedTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Assign Room</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Select a room for <span className="font-semibold text-slate-800">{selectedTenant.name}</span>.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Available Rooms</label>
                                <select 
                                    className="w-full p-3 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={selectedRoom}
                                    onChange={(e) => setSelectedRoom(e.target.value)}
                                >
                                    <option value="">-- Select a Room --</option>
                                    {rooms.filter(r => r.currentOccupants < r.capacity).map(room => (
                                        <option key={room.room_number} value={room.room_number}>
                                            Room {room.room_number} ({room.capacity - room.currentOccupants} spots left)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setAssignModalOpen(false)}
                                    className="flex-1 py-2 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAssign}
                                    disabled={!selectedRoom}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};