// client/src/components/landlord/LandlordTenantChecklist.tsx
import React, { useState, useEffect } from 'react';
import { User, Home, AlertCircle, UserPlus, ArrowLeft, Mail, UserX } from 'lucide-react';
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
    
    // Modal Allocation State
    const [isAssignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [selectedRoom, setSelectedRoom] = useState('');

    useEffect(() => {
        if (user?.id) refreshData();
    }, [user?.id]);

    const refreshData = () => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        fetch(`${API_URL}/api/landlord/tenants/${user?.id}`)
            .then(res => res.json())
            .then(data => setTenants(data))
            .catch(err => console.error("Failed to load tenants", err));

        fetch(`${API_URL}/api/landlord/rooms/${user?.id}`)
            .then(res => res.json())
            .then(setRooms)
            .catch(err => console.error("Failed to load rooms", err));
    };

    const handleApprove = async (tenantId: string) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/landlord/approve/${tenantId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) refreshData();
            else alert("Failed to approve tenant.");
        } catch (error) {
            console.error(error);
        }
    };

    const handleReject = async (tenantId: string) => {
        if (!confirm("Are you sure you want to reject and remove this tenant?")) return;
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/landlord/reject/${tenantId}`, {
                method: 'DELETE'
            });
            if (res.ok) refreshData();
            else alert("Failed to reject tenant.");
        } catch (error) {
            console.error(error);
        }
    };

    const handleAssign = async () => {
        if (!selectedTenant || !selectedRoom) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/landlord/assign`, {
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
                setAssignModalOpen(false);
                setSelectedTenant(null);
                setSelectedRoom('');
                refreshData(); 
            } else {
                alert(data.error || data.message || "Failed to assign room.");
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

    const hasRoom = (t: Tenant) => {
        return t.roomNumber && t.roomNumber !== 'Unassigned';
    };

    const pendingTenants = tenants.filter(t => !t.isApproved);
    const activeTenants = tenants.filter(t => t.isApproved);

    return (
        <div className="min-h-screen bg-[#f8f9f5] p-4 sm:p-8 animate-fade-in text-slate-800">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* ELEGANT BACK NAVIGATION TRACK */}
                <button 
                    onClick={onBack} 
                    className="group flex items-center gap-2 text-xs font-bold text-[#5c6e4e] uppercase tracking-wider hover:text-[#425042] transition-colors outline-none"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
                </button>

                {/* PAGE TYPOGRAPHY HEADER */}
                <div className="border-b border-gray-200/60 pb-4">
                    <h1 className="text-4xl font-serif text-slate-800 mb-1">Tenant Records</h1>
                    <p className="text-slate-500 text-sm">Manage pending member verifications, room allocations, and active boarders.</p>
                </div>

                {/* PENDING REGISTER APPLICATIONS (Muted Warning Theme) */}
                {pendingTenants.length > 0 && (
                    <div className="bg-[#fef9eb] rounded-2xl border border-[#f5ead0] overflow-hidden shadow-xs">
                        <div className="px-6 py-4 border-b border-[#eecfba]/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="text-[#b97a26]" size={16} />
                                <h2 className="text-sm font-bold text-[#5c4b22] uppercase tracking-wider">Awaiting Verification</h2>
                            </div>
                            <span className="bg-[#fdf2e3] text-[#b97a26] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                {pendingTenants.length} Pending
                            </span>
                        </div>
                        <div className="divide-y divide-[#f5ead0]/40">
                            {pendingTenants.map(tenant => (
                                <div key={tenant.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40">
                                    <div>
                                        <div className="font-semibold text-slate-800">{tenant.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <Mail size={12} className="text-slate-400" /> {tenant.email}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button 
                                            onClick={() => handleReject(tenant.id)} 
                                            className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 transition-colors"
                                        >
                                            Reject
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(tenant.id)} 
                                            className="px-4 py-2 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                                        >
                                            Approve Access
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ACTIVE TENANTS DIRECTORY PANEL */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-transparent">
                        <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                            <User size={18} className="text-[#657655]" /> Member Directory
                        </h2>
                        <span className="px-3 py-1 bg-[#e7efdb] text-[#5c6e4e] text-[10px] font-bold rounded-full uppercase tracking-wider">
                            {activeTenants.length} Boarders Live
                        </span>
                    </div>

                    {/* SOFT CARD LIST */}
                    <div className="p-6 space-y-3 max-h-[550px] overflow-y-auto custom-scrollbar">
                        {activeTenants.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-sm font-medium">No active boarders currently logged in repository.</div>
                        ) : (
                            activeTenants.map(tenant => (
                                <div key={tenant.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#f8f9f5] hover:bg-[#f4f7f4] border border-gray-200/50 rounded-2xl transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-white border border-gray-200 text-slate-600 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                            {tenant.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-800 text-sm">{tenant.name}</div>
                                            <div className="text-xs text-slate-400 mt-0.5 font-medium">{tenant.email}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                        {/* TONE-MATCHED BADGES & ACTIONS */}
                                        <div>
                                            {hasRoom(tenant) ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#e7efdb] text-[#5c6e4e] gap-1.5 border border-[#d3e0c0]">
                                                    <Home size={12} /> Unit {tenant.roomNumber}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-amber-700 gap-1.5 border border-orange-100">
                                                    <UserPlus size={12} /> Unassigned
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!hasRoom(tenant) && (
                                                <button 
                                                    onClick={() => openAssignModal(tenant)}
                                                    className="px-3 py-1.5 bg-white border border-gray-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
                                                >
                                                    Assign Unit
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleReject(tenant.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                                                title="Revoke and Remove Tenant"
                                            >
                                                <UserX size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ASSIGN UNIT MODAL VIEW CONFIG */}
            {isAssignModalOpen && selectedTenant && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-gray-100 animate-in zoom-in-95 duration-150">
                        <h3 className="text-md font-bold text-slate-800 mb-1">Allocate Dormitory Spot</h3>
                        <p className="text-xs text-slate-400 font-medium mb-6">Select an open space configuration for <span className="font-semibold text-slate-700">{selectedTenant.name}</span>.</p>
                        <div className="space-y-4">
                            <select 
                                className="w-full p-3 border border-gray-200 rounded-xl bg-[#f8f9f5] text-xs text-slate-700 font-medium outline-none focus:ring-1 focus:ring-[#425042] transition-all"
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                            >
                                <option value="">-- Choose Unit Reference --</option>
                                {rooms.filter(r => r.currentOccupants < r.capacity).map(room => (
                                    <option key={room.room_number} value={room.room_number}>
                                        Unit {room.room_number} ({room.capacity - room.currentOccupants} slots remaining)
                                    </option>
                                ))}
                            </select>
                            <div className="flex gap-2 pt-2">
                                <button 
                                    onClick={() => setAssignModalOpen(false)} 
                                    className="flex-1 py-2 bg-gray-50 border border-gray-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAssign} 
                                    disabled={!selectedRoom} 
                                    className="flex-1 py-2 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Confirm Unit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};