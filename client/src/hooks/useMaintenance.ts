import { useState, useEffect, useCallback } from 'react';
import { maintenanceService } from '../services/maintenanceService';
import type { LandlordMaintenanceRequest, MaintenanceStatus, UserRole } from '../types/types';

export const useMaintenance = (userId: string | undefined, role: UserRole) => {
    const [requests, setRequests] = useState<LandlordMaintenanceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        //  If no userId, stop loading and return. Don't leave it true!
        if (!userId) {
            setIsLoading(false); 
            return;
        }
        
        setIsLoading(true);
        try {
            const data = await maintenanceService.getRequests(userId, role as 'landlord' | 'tenant');
            setRequests(data);
            setError(null);
        } catch (err) {
            console.error("Failed to load maintenance requests", err);
            setError('Maintenance requests could not be loaded. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [userId, role]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // The Optimistic Update Logic
    const changeStatus = async (id: string, newStatus: MaintenanceStatus) => {
        //  Snapshot previous state (in case we need to revert)
        const previousRequests = [...requests];

        // Optimistically update UI immediately
        setRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status: newStatus } : req
        ));

        try {
            // Send to API
            await maintenanceService.updateStatus(id, newStatus);
            console.log("Status saved successfully");
            return true;
        } catch (error) {
            console.error("Save failed:", error);
            // Revert if API fails
            setRequests(previousRequests);
            return false;
        }
    };

    return { 
        requests, 
        isLoading, 
        error,
        changeStatus, // Exposed action
        refresh: fetchRequests 
    };
};
