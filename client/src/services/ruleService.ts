import { apiClient } from '../api/client';

export interface HouseRule {
    id: string;
    rule_text: string;
    target_room_number?: string | null;
}

export interface HouseRule {
    id: string;
    rule_text: string;
    target_room_number?: string | null;
    category: 'General' | 'Safety' | 'Noise' | 'Guests' | 'Cleanliness'; // UCD: Categorization
    is_priority: boolean; 
}

export const ruleService = {
    getRules: async (landlordId: string): Promise<HouseRule[]> => {
        return apiClient<HouseRule[]>(`/rules/${landlordId}`);
    },

    addRule: async (landlordId: string, ruleText: string, roomNumber?: string, category: string = 'General', isPriority: boolean = false) => {
    return apiClient<any>('/rules', {
        method: 'POST',
        body: JSON.stringify({ 
            landlordId, 
            ruleText,
            category,
            isPriority,
            roomNumber: roomNumber === 'Global' ? null : roomNumber 
        })
    });
},

    deleteRule: async (id: string) => {
        return apiClient<any>(`/rules/${id}`, {
            method: 'DELETE'
        });
    }

    
};