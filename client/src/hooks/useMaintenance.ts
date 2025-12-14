import { useState, useEffect, useCallback } from 'react';
import { maintenanceService } from '../services/maintenanceService';
import type { LandlordMaintenanceRequest, MaintenanceStatus, UserRole } from '../types/types';

export const useMaintenance = (userId: string | undefined, role: UserRole) => {
    const [requests, setRequests] = useState<LandlordMaintenanceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        // FIX 1: If no userId, stop loading and return. Don't leave it true!
        if (!userId) {
            setIsLoading(false); 
            return;
        }
        
        setIsLoading(true);
        try {
            const data = await maintenanceService.getRequests(userId, role as 'landlord' | 'tenant');
            setRequests(data);
        } catch (error) {
            console.error("Failed to load maintenance requests", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, role]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // The Optimistic Update Logic
    const changeStatus = async (id: string, newStatus: MaintenanceStatus) => {
        // 1. Snapshot previous state (in case we need to revert)
        const previousRequests = [...requests];

        // 2. Optimistically update UI immediately
        setRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status: newStatus } : req
        ));

        try {
            // 3. Send to API
            await maintenanceService.updateStatus(id, newStatus);
            console.log("Status saved successfully");
        } catch (error) {
            console.error("Save failed:", error);
            // 4. Revert if API fails
            setRequests(previousRequests);
            alert("Failed to save changes. Please check your connection.");
        }
    };

    return { 
        requests, 
        isLoading, 
        changeStatus, // Exposed action
        refresh: fetchRequests 
    };
};