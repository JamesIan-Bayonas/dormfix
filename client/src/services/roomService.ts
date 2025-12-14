import { apiClient } from '../api/client';
import type { Room } from '../types/types'; // We will ensure types are defined

// Define the payload for adding a room to ensure type safety
interface AddRoomPayload {
    landlordId: string;
    roomNumber: string;
    capacity: number;
}

export const roomService = {
    // Fetch all rooms for a specific landlord
    getRooms: async (landlordId: string): Promise<Room[]> => {
        return apiClient<Room[]>(`/landlord/rooms/${landlordId}`);
    },

    // Add a new room
    addRoom: async (data: AddRoomPayload): Promise<{ message: string }> => {
        return apiClient<{ message: string }>('/landlord/rooms', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};