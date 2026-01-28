import api from '../api/client';
import { poolPromise } from '../config/dbConfig.js';

export interface HouseRule {
    id: string;
    rule_text: string;
}

export const ruleService = {
    getRules: async (landlordId: string): Promise<HouseRule[]> => {
        const response = await api.get(`/rules/${landlordId}`);
        return response.data;
    },

    addRule: async (landlordId: string, ruleText: string) => {
        const response = await api.post('/rules', { landlordId, ruleText });
        return response.data;
    },

    deleteRule: async (id: string) => {
        const response = await api.delete(`/rules/${id}`);
        return response.data;
    }
};