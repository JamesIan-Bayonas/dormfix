import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../UserContext';
import { TenantDirectory, type DirectoryTenant, type AssignmentRoom } from './TenantDirectory';

export function LandlordTenantChecklist({ onBack }: { onBack: () => void }) {
    const { user } = useAuth();
    const [tenants, setTenants] = useState<DirectoryTenant[]>([]);
    const [rooms, setRooms] = useState<AssignmentRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roomsLoading, setRoomsLoading] = useState(true);
    const [roomsError, setRoomsError] = useState<string | null>(null);
    const roomRead = useRef(0);
    const tenantRead = useRef(0);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const refreshRooms = useCallback(async () => {
        if (!user?.id) { setRoomsLoading(false); return; }
        const read = ++roomRead.current;
        setRoomsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/landlord/rooms/${user.id}`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error();
            if (read === roomRead.current) { setRooms(data); setRoomsError(null); }
        } catch {
            if (read === roomRead.current) setRoomsError('Room availability could not be loaded. Refresh before assigning.');
        } finally { if (read === roomRead.current) setRoomsLoading(false); }
    }, [API_URL, user?.id]);

    const refreshTenants = useCallback(async () => {
        if (!user?.id) { setLoading(false); return; }
        const read = ++tenantRead.current;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/landlord/tenants/${user.id}`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error();
            if (read === tenantRead.current) { setTenants(data); setError(null); }
        } catch { if (read === tenantRead.current) setError('Tenant list could not be loaded. Please try again.'); }
        finally { if (read === tenantRead.current) setLoading(false); }
    }, [API_URL, user?.id]);

    const refresh = useCallback(() => { void refreshTenants(); void refreshRooms(); }, [refreshTenants, refreshRooms]);
    useEffect(() => { refresh(); }, [refresh]);

    async function approve(id: string) {
        const response = await fetch(`${API_URL}/api/landlord/approve/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
        if (!response.ok) return false;
        // A read started before this confirmation must not overwrite the updated record.
        tenantRead.current++; setLoading(false);
        setTenants(current => current.map(tenant => tenant.id === id ? { ...tenant, isApproved: true } : tenant));
        return true;
    }
    async function remove(id: string) {
        const response = await fetch(`${API_URL}/api/landlord/reject/${id}`, { method: 'DELETE' });
        if (!response.ok) return false;
        tenantRead.current++; setLoading(false);
        setTenants(current => current.filter(tenant => tenant.id !== id));
        void refreshRooms();
        return true;
    }
    async function assign(id: string, roomNumber: string) {
        const response = await fetch(`${API_URL}/api/landlord/assign`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId: id, landlordId: user?.id, roomNumber }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Assignment could not be confirmed. Refresh records before retrying.');
        tenantRead.current++; setLoading(false);
        setTenants(current => current.map(tenant => tenant.id === id ? { ...tenant, roomNumber } : tenant));
        void refreshRooms();
        return true;
    }
    return <TenantDirectory tenants={tenants} rooms={rooms} loading={loading} error={error} roomsLoading={roomsLoading} roomsError={roomsError} onRetry={refresh} onRetryRooms={refreshRooms} onBack={onBack} onApprove={approve} onRemove={remove} onAssign={assign} />;
}
