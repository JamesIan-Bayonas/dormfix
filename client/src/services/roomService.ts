import { apiClient } from '../api/client';

export interface Room {
    id: string;
    room_number: string;
    capacity: number;
    currentOccupants: number;
    landlord_id: string;
}

export const roomService = {
    // 1. GET ROOMS
    getRooms: async (landlordId: string): Promise<Room[]> => {
        // OLD: await apiClient(...)
        // NEW: await apiClient.get(...)
        const { data } = await apiClient.get<Room[]>(`/api/landlord/rooms/${landlordId}`);
        return data;
    },

    // 2. ADD ROOM
    addRoom: async (landlordId: string, roomNumber: string, capacity: number) => {
        const { data } = await apiClient.post('/api/landlord/rooms', { 
            landlordId, 
            roomNumber, 
            capacity 
        });
        return data;
    },

    // 3. ASSIGN TENANT
    assignTenant: async (tenantId: string, landlordId: string, roomNumber: string, moveInDate: string) => {
        const { data } = await apiClient.post('/api/landlord/assign', {
            tenantId,
            landlordId,
            roomNumber,
            moveInDate
        });
        return data;
    }
};