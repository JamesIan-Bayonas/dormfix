import api from '../api/client';
import type { Room } from '../types/types';

// Define the type for adding a room
interface AddRoomPayload {
    landlordId: string;
    roomNumber: string;
    capacity: number;
}

export const roomService = {
    // Fetch all rooms for a specific landlord
    getRooms: async (landlordId: string): Promise<Room[]> => {
        const response = await api.get(`/landlord/rooms/${landlordId}`);
        return response.data; 
    },

    // Add a new room
    addRoom: async (data: AddRoomPayload): Promise<{ message: string }> => {
        const response = await api.post('/landlord/rooms', data);
        return response.data;
    }
};