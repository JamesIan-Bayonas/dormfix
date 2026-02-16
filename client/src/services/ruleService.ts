import { apiClient } from '../api/client';

export interface HouseRule {
    id: string;
    rule_text: string;
    target_room_number?: string | null;
    category?: 'General' | 'Safety' | 'Noise' | 'Guests' | 'Cleanliness';
    is_priority?: boolean;
}

export const ruleService = {
    // 1. GET RULES
    getRules: async (landlordId: string): Promise<HouseRule[]> => {
        const { data } = await apiClient.get<HouseRule[]>(`/api/rules/${landlordId}`);
        return data;
    },

    // 2. ADD RULE
    addRule: async (landlordId: string, ruleText: string, roomNumber?: string, category: string = 'General', isPriority: boolean = false) => {
        const { data } = await apiClient.post('/api/rules', {
            landlordId,
            ruleText,
            roomNumber: roomNumber === 'Global' ? null : roomNumber,
            category,
            isPriority
        });
        return data;
    },

    // 3. DELETE RULE
    deleteRule: async (id: string) => {
        const { data } = await apiClient.delete(`/api/rules/${id}`);
        return data;
    }
};