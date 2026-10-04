import { useState, useEffect, useCallback, useRef } from 'react';
import { maintenanceService } from '../services/maintenanceService';
import type { LandlordMaintenanceRequest, MaintenanceStatus, UserRole } from '../types/types';
import { replaceMaintenanceStatus } from '../utils/maintenancePresentation';

export const useMaintenance = (userId: string | undefined, role: UserRole) => {
    const [requests, setRequests] = useState<LandlordMaintenanceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const readSequence = useRef(0);
    const pending = useRef(new Map<string, MaintenanceStatus>());
    const fetchRequests = useCallback(async () => {
        if (!userId) { setIsLoading(false); return; }
        const read = ++readSequence.current;
        setIsLoading(true);
        try {
            const data = await maintenanceService.getRequests(userId, role);
            if (!Array.isArray(data)) throw new Error('Invalid maintenance response.');
            if (read === readSequence.current) {
                setRequests(data.map(request => pending.current.has(request.id) ? { ...request, status: pending.current.get(request.id)! } : request));
                setError(null);
            }
        } catch {
            if (read === readSequence.current) setError('Maintenance requests could not be loaded. Please try again.');
        } finally { if (read === readSequence.current) setIsLoading(false); }
    }, [userId, role]);
    useEffect(() => { void fetchRequests(); }, [fetchRequests]);

    const changeStatus = async (id: string, newStatus: MaintenanceStatus) => {
        const original = requests.find(request => request.id === id);
        if (!original || pending.current.has(id)) return false;
        pending.current.set(id, newStatus);
        readSequence.current++; setIsLoading(false);
        setRequests(current => replaceMaintenanceStatus(current, id, newStatus));
        try {
            await maintenanceService.updateStatus(id, newStatus);
            readSequence.current++; setIsLoading(false);
            return true;
        } catch {
            // Roll back only this status, preserving concurrent record changes.
            readSequence.current++; setIsLoading(false);
            setRequests(current => replaceMaintenanceStatus(current, id, original.status));
            return false;
        } finally { pending.current.delete(id); }
    };
    return { requests, isLoading, error, changeStatus, refresh: fetchRequests };
};
