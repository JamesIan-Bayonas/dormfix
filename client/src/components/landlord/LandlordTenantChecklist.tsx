import { Dialog, ConfirmationDialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { FormField, Select } from '../ui/FormField';
import { ErrorState, ErrorMessage, LoadingState } from '../ui/Feedback';
// client/src/components/landlord/LandlordTenantChecklist.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { User, Home, AlertCircle, UserPlus, ArrowLeft, Mail, UserX, Phone } from 'lucide-react';
import { useAuth } from '../UserContext';

interface Tenant {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string | null;
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

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [roomsError, setRoomsError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionBusy, setActionBusy] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [removalTenant, setRemovalTenant] = useState<Tenant | null>(null);
    const [removalError, setRemovalError] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    const refreshData = useCallback(async () => {
        if (!user?.id) return;
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        setIsLoadingData(true);
        const results = await Promise.allSettled([
            fetch(`${API_URL}/api/landlord/tenants/${user.id}`).then(async res => {
                if (!res.ok) throw new Error('Tenant list could not be loaded.');
                const data = await res.json();
                if (!Array.isArray(data)) throw new Error('Tenant list could not be loaded.');
                setTenants(data); setLoadError(null);
            }),
            fetch(`${API_URL}/api/landlord/rooms/${user.id}`).then(async res => {
                if (!res.ok) throw new Error('Rooms could not be loaded.');
                const data = await res.json();
                if (!Array.isArray(data)) throw new Error('Rooms could not be loaded.');
                setRooms(data); setRoomsError(null);
            })
        ]);
        if (results[0].status === 'rejected') setLoadError('Tenant list could not be loaded. Please try again.');
        if (results[1].status === 'rejected') setRoomsError('Rooms could not be loaded. Please try again before assigning a room.');
        setIsLoadingData(false);
    }, [user?.id]);

    useEffect(() => { refreshData(); }, [refreshData]);

    const handleApprove = async (tenantId: string) => {
        if (actionBusy) return;
        setActionBusy(true); setActionError(null);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/landlord/approve/${tenantId}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error('Failed to approve tenant.');
            await refreshData();
        } catch { setActionError('Approval could not be saved. Please try again.'); }
        finally { setActionBusy(false); }
    };

    const handleReject = async () => {
        if (!removalTenant || isRemoving) return;
        setIsRemoving(true); setRemovalError(null);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/landlord/reject/${removalTenant.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to remove tenant.');
            setRemovalTenant(null);
            await refreshData();
        } catch { setRemovalError('The tenant could not be removed. Please try again.'); }
        finally { setIsRemoving(false); }
    };

    const handleAssign = async () => {
        if (!selectedTenant || !selectedRoom || isAssigning || roomsError) return;
        setIsAssigning(true); setAssignError(null);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/landlord/assign`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: selectedTenant.id, landlordId: user?.id, roomNumber: selectedRoom })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || 'Failed to assign room.');
            setAssignModalOpen(false); setSelectedTenant(null); setSelectedRoom('');
            await refreshData();
        } catch (err) { setAssignError(err instanceof Error ? err.message : 'Assignment failed. Please try again.'); }
        finally { setIsAssigning(false); }
    };

    const openAssignModal = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setAssignModalOpen(true);
        setSelectedRoom('');
        setAssignError(null);
    };

    const hasRoom = (t: Tenant) => {
        return t.roomNumber && t.roomNumber !== 'Unassigned';
    };

    const pendingTenants = tenants.filter(t => !t.isApproved);
    const activeTenants = tenants.filter(t => t.isApproved);

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
                <div className="border-b border-gray-200/60 pb-4">
                    <h1 tabIndex={-1} data-focus-fallback className="df-page-title mb-2">Tenants</h1>
                    <p className="text-slate-500 text-sm">Manage pending member verifications, room allocations, and active boarders.</p>
                </div>

                {actionError && <ErrorMessage>{actionError}</ErrorMessage>}
                {isLoadingData ? <LoadingState>Loading tenants…</LoadingState> : loadError ? (
                    <ErrorState title="Tenants could not be loaded" description={loadError} action={<Button variant="secondary" onClick={refreshData}>Try again</Button>} />
                ) : <>
                {/* PENDING REGISTER APPLICATIONS */}
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
                                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Mail size={12} className="text-slate-400" /> {tenant.email}
                                            </span>
                                            {tenant.phoneNumber && (
                                                <span className="flex items-center gap-1 font-mono text-slate-600">
                                                    <Phone size={11} className="text-slate-400" /> {tenant.phoneNumber}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button 
                                            onClick={() => { setRemovalTenant(tenant); setRemovalError(null); }} disabled={actionBusy || isRemoving}
                                            className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 transition-colors"
                                        >
                                            Reject
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(tenant.id)} disabled={actionBusy || isRemoving}
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
                                            <div className="text-xs text-slate-400 mt-0.5 font-medium flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                                                <span>{tenant.email}</span>
                                                {tenant.phoneNumber && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1 font-mono text-slate-500">
                                                            <Phone size={10} className="text-slate-400" /> {tenant.phoneNumber}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
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
                                                onClick={() => { setRemovalTenant(tenant); setRemovalError(null); }} disabled={actionBusy || isRemoving}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                                                aria-label={`Remove ${tenant.name}`} title="Remove tenant"
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
                </>}
            </div>

            <Dialog open={isAssignModalOpen && !!selectedTenant} onClose={() => setAssignModalOpen(false)} title="Assign room" busy={isAssigning}>
                <p className="text-sm text-muted">Choose a room for {selectedTenant?.name}.</p>
                {roomsError ? <ErrorState title="Room availability unavailable" description={roomsError} action={<Button variant="secondary" onClick={refreshData}>Try again</Button>} /> : <>
                    <FormField id="assign-room" label="Available room">
                        {(field) => <Select {...field} disabled={isAssigning || isLoadingData} value={selectedRoom} onChange={(event) => setSelectedRoom(event.target.value)}>
                            <option value="">Choose a room</option>
                            {rooms.filter(room => room.currentOccupants < room.capacity).map(room => <option key={room.room_number} value={room.room_number}>Room {room.room_number} ({room.capacity - room.currentOccupants} places available)</option>)}
                        </Select>}
                    </FormField>
                    {!isLoadingData && !rooms.some(room => room.currentOccupants < room.capacity) && <p className="text-sm text-muted">No rooms currently have available capacity.</p>}
                </>}
                {assignError && <ErrorMessage>{assignError}</ErrorMessage>}
                <div className="flex flex-wrap justify-end gap-3">
                    <Button variant="secondary" disabled={isAssigning} onClick={() => setAssignModalOpen(false)}>Cancel</Button>
                    <Button loading={isAssigning} loadingText="Assigning…" disabled={!selectedRoom || !!roomsError || isLoadingData} onClick={handleAssign}>Assign room</Button>
                </div>
            </Dialog>
            <ConfirmationDialog open={!!removalTenant} onClose={() => setRemovalTenant(null)} onConfirm={handleReject}
                title={removalTenant?.isApproved ? 'Remove tenant?' : 'Reject application?'}
                confirmLabel={removalTenant?.isApproved ? 'Remove tenant' : 'Reject application'} busy={isRemoving} error={removalError}>
                <p>This removes <strong>{removalTenant?.name}</strong> from this dormitory and resets their approval.</p>
                <p className="mt-3 font-semibold text-error">Their room assignment, payment records, and maintenance requests will be deleted. These records cannot be restored through DormFix.</p>
                <p className="mt-3">Their user account will remain. They can apply again with a dorm code.</p>
            </ConfirmationDialog>
        </div>
    );
};
