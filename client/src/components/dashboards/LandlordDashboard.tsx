import { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../UserContext';
import { useRooms } from '../../hooks/useRooms';
import { useMaintenance } from '../../hooks/useMaintenance';
import { usePayments } from '../../hooks/usePayments';
import type { OverviewTenant } from '../../utils/overview';
import { WorkspaceShell } from '../ui/WorkspaceShell';
import { LandlordOverview } from '../landlord/LandlordOverview';
import { LandlordMaintenanceList } from '../landlord/LandlordMaintenanceList';
import { LandlordTenantChecklist } from '../landlord/LandlordTenantChecklist';
import { LandlordRoomList } from '../landlord/LandlordRoomList';
import { LandlordPaymentHistory } from '../landlord/LandlordPaymentHistory';
import { LandlordChat } from '../landlord/LandlordChat';
import { RoomDetailDrawer } from '../landlord/RoomDetailDrawer';
import { LandlordRules } from '../landlord/LandlordRules';

export function LandlordDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { rooms, isLoading: roomsLoading, error: roomsError, refreshRooms } = useRooms(user?.id);
    const { requests, isLoading: maintenanceLoading, error: maintenanceError, refresh: refreshMaintenance, changeStatus } = useMaintenance(user?.id, 'landlord');
    const { payments, isLoading: paymentsLoading, error: paymentsError, refreshPayments, verifyPayment } = usePayments(user?.id);
    const [tenants, setTenants] = useState<OverviewTenant[]>([]);
    const [isLoadingTenants, setIsLoadingTenants] = useState(true);
    const [tenantError, setTenantError] = useState<string | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    const loadTenants = useCallback(async () => {
        if (!user?.id) return;
        setIsLoadingTenants(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/landlord/tenants/${user.id}`);
            if (!res.ok) throw new Error('Tenant list unavailable');
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error('Tenant list unavailable');
            setTenants(data); setTenantError(null);
        } catch { setTenantError('The tenant list could not be loaded. Please try again.'); }
        finally { setIsLoadingTenants(false); }
    }, [user?.id]);
    useEffect(() => { loadTenants(); }, [loadTenants]);

    const roomDetails = useMemo(() => rooms.map(room => {
        const occupants = tenants.filter(tenant => tenant.isApproved && tenant.roomNumber === room.room_number);
        const activeIssues = requests.filter(request => request.roomNumber === room.room_number && (request.status === 'Pending' || request.status === 'In Progress'));
        return {
            ...room, occupants, activeIssues,
            // Payment responses lack tenant IDs. Do not associate receipts by names.
            paymentStatusAvailable: false,
            occupantPaymentStatus: occupants.map(tenant => ({ ...tenant, status: '', hasPendingPayment: false })),
            hasIssue: activeIssues.length > 0,
            isCritical: activeIssues.some(issue => issue.urgency === 'High' || issue.urgency === 'Emergency'),
            status: (room.currentOccupants === 0 ? 'vacant' : activeIssues.length > 0 ? 'maintenance' : 'occupied') as 'vacant' | 'occupied' | 'maintenance',
        };
    }), [rooms, tenants, requests]);
    const selectedRoom = roomDetails.find(room => room.id === selectedRoomId) ?? null;

    if (!user) return null;
    return <WorkspaceShell role="landlord" user={user} onLogout={logout}>
        <Routes>
            <Route path="/" element={<LandlordOverview
                rooms={{ data: rooms, loading: roomsLoading, error: roomsError, retry: refreshRooms }}
                tenants={{ data: tenants, loading: isLoadingTenants, error: tenantError, retry: loadTenants }}
                payments={{ data: payments, loading: paymentsLoading, error: paymentsError, retry: refreshPayments }}
                maintenance={{ data: requests, loading: maintenanceLoading, error: maintenanceError, retry: refreshMaintenance }}
                roomDetails={roomDetails} onOpenRoom={setSelectedRoomId} />} />
            <Route path="/tenants" element={<LandlordTenantChecklist onBack={() => navigate('/')} />} />
            <Route path="/rooms" element={<LandlordRoomList onBack={() => navigate('/')} />} />
            <Route path="/maintenance" element={<LandlordMaintenanceList />} />
            <Route path="/payments" element={<LandlordPaymentHistory onBack={() => navigate('/')} />} />
            <Route path="/rules" element={<LandlordRules />} />
            <Route path="/chat" element={<LandlordChat />} />
        </Routes>
        <RoomDetailDrawer isOpen={!!selectedRoomId} onClose={() => setSelectedRoomId(null)} roomData={selectedRoom}
            onVerifyPayment={verifyPayment} onResolveIssue={id => changeStatus(id, 'Completed')} />
    </WorkspaceShell>;
}
