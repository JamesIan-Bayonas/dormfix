// LandlordTenantChecklist.tsx
import React, { useState, useEffect } from 'react';
import { User, CheckCircle, XCircle, Home, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../UserContext';

interface Tenant {
    id: string;
    name: string;
    email: string;
    isApproved: boolean;
    roomNumber?: string;
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

    useEffect(() => {
        if (user?.id) refreshData();
    }, [user?.id]);

    const refreshData = () => {
        fetch(`http://localhost:5000/api/landlord/tenants/${user?.id}`)
            .then(res => res.json())
            .then(data => setTenants(data))
            .catch(err => console.error("Failed to load tenants", err));

        fetch(`http://localhost:5000/api/landlord/rooms/${user?.id}`)
            .then(res => res.json())
            .then(setRooms)
            .catch(err => console.error("Failed to load rooms", err));
    };

    const handleStatusUpdate = async (tenantId: string, status: 'approved' | 'rejected') => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/${tenantId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isApproved: status === 'approved' })
            });
            if (res.ok) refreshData();
            else alert("Failed to update status");
        } catch (error) {
            console.error(error);
        }
    };

    const handleAssign = async () => {
        if (!selectedTenant || !selectedRoom) return;

        try {
            const res = await fetch('http://localhost:5000/api/assign-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: selectedTenant.id,
                    landlordId: user?.id,
                    roomNumber: selectedRoom
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                alert("Assigned successfully!");
                setAssignModalOpen(false);
                setSelectedTenant(null);
                setSelectedRoom('');
                refreshData(); 
            } else {
                alert(data.message || "Failed to assign room.");
            }
        } catch (error) {
            console.error(error);
            alert("Assignment failed.");
        }
    };

    const openAssignModal = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setAssignModalOpen(true);
        setSelectedRoom('');
    };

    // --- LOGIC FIX: Helper function to check if tenant is truly assigned ---
    // If it is null, empty, OR literally the word 'Unassigned', they are homeless.
    const hasRoom = (t: Tenant) => {
        return t.roomNumber && t.roomNumber !== 'Unassigned';
    };

    const pendingTenants = tenants.filter(t => !t.isApproved);
    const activeTenants = tenants.filter(t => t.isApproved);

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={onBack} className="mb-6 text-sm text-slate-500 hover:text-indigo-600 font-medium">
                    ← Back to Dashboard
                </button>

                {/* PENDING APPROVALS */}
                {pendingTenants.length > 0 && (
                    <div className="mb-8 bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
                        <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
                            <AlertCircle className="text-orange-600" size={20} />
                            <h2 className="text-lg font-bold text-orange-900">Pending Applications</h2>
                            <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                {pendingTenants.length}
                            </span>
                        </div>
                        <div className="divide-y divide-orange-100">
                            {pendingTenants.map(tenant => (
                                <div key={tenant.id} className="p-4 flex items-center justify-between hover:bg-orange-50/50 transition-colors">
                                    <div>
                                        <div className="font-bold text-slate-800">{tenant.name}</div>
                                        <div className="text-sm text-slate-500">{tenant.email}</div>
                                        <div className="text-xs text-orange-600 font-medium mt-1">Awaiting approval</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleStatusUpdate(tenant.id, 'approved')} className="p-2 bg-green-100 text-green-700 rounded-lg font-bold flex items-center gap-1 text-sm"><CheckCircle size={16} /> Approve</button>
                                        <button onClick={() => handleStatusUpdate(tenant.id, 'rejected')} className="p-2 bg-red-100 text-red-700 rounded-lg font-bold flex items-center gap-1 text-sm"><XCircle size={16} /> Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TENANT DIRECTORY */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><User className="text-indigo-600" /> Tenant Directory</h2>
                        <span className="text-xs text-slate-500 font-medium">{activeTenants.length} Active Tenants</span>
                    </div>

                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {activeTenants.map(tenant => (
                                <tr key={tenant.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{tenant.name}</div>
                                        <div className="text-sm text-slate-500">{tenant.email}</div>
                                    </td>
                                    
                                    {/* STATUS COLUMN FIX */}
                                    <td className="px-6 py-4">
                                        {hasRoom(tenant) ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 gap-1">
                                                <Home size={12} /> Room {tenant.roomNumber}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 gap-1">
                                                <UserPlus size={12} /> Needs Room
                                            </span>
                                        )}
                                    </td>

                                    {/* ACTION COLUMN FIX */}
                                    <td className="px-6 py-4 text-right">
                                        {!hasRoom(tenant) && (
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

            {/* MODAL */}
            {isAssignModalOpen && selectedTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Assign Room</h3>
                        <p className="text-sm text-slate-500 mb-6">Select a room for <span className="font-semibold text-slate-800">{selectedTenant.name}</span>.</p>
                        <div className="space-y-4">
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
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setAssignModalOpen(false)} className="flex-1 py-2 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                                <button onClick={handleAssign} disabled={!selectedRoom} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};