import { apiClient } from '../api/client';

export interface HouseRule {
    id: string;
    rule_text: string;
}

export const ruleService = {
    getRules: async (landlordId: string): Promise<HouseRule[]> => {
        return apiClient<HouseRule[]>(`/rules/${landlordId}`);
    },

    addRule: async (landlordId: string, ruleText: string) => {
        return apiClient<any>('/rules', {
            method: 'POST',
            body: JSON.stringify({ landlordId, ruleText }) // ⚠️ Manual Stringify
        });
    },

    deleteRule: async (id: string) => {
        return apiClient<any>(`/rules/${id}`, {
            method: 'DELETE'
        });
    }
};