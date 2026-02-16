import { useState, useEffect, useCallback } from 'react';
import { roomService } from '../services/roomService';
import type { Room } from '../types/types';

export const useRooms = (landlordId: string | undefined) => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // useCallback ensures this function doesn't get recreated on every render
    const fetchRooms = useCallback(async () => {
        if (!landlordId) return;
        setIsLoading(true);
        try {
            const data = await roomService.getRooms(landlordId);
            setRooms(data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load rooms");
        } finally {
            setIsLoading(false);
        }
    }, [landlordId]);

    // Initial load
    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // Logic for adding a room
    const addRoom = async (roomNumber: string, capacity: number) => {
        if (!landlordId) return;
        try {
            await roomService.addRoom(landlordId, roomNumber, capacity);
            // Refresh the list after successful addition
            await fetchRooms();
            return true; // Indicate success
        } catch (err: any) {
            alert(err.message);
            return false; // Indicate failure
        }
    };

    return { rooms, isLoading, error, addRoom, refreshRooms: fetchRooms };
};