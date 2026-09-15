// server/src/repositories/ruleRepository.ts
import { pool } from '../config/dbConfig';

export interface HouseRuleRecord {
    id: string;
    rule_text: string;
    target_room_number?: string | null;
    category?: string | null;
    is_priority?: boolean | null;
    created_at?: Date | string;
}

export interface CreateHouseRuleInput {
    id: string;
    landlordId: string;
    ruleText: string;
    roomNumber?: string | null;
    category?: string | null;
    isPriority?: boolean | null;
}

export const ruleRepository = {
    // 1. Get all rules for a landlord
    getByLandlord: async (landlordId: string): Promise<HouseRuleRecord[]> => {

        const result = await pool.query(`
                SELECT 
                    id, 
                    rule_text, 
                    target_room_number,
                    category,
                    is_priority,
                    created_at
                FROM house_rules 
                WHERE landlord_id = $1 
                ORDER BY created_at DESC
            `, [landlordId]);
        return result.rows;
    },

    // 2. Create a house rule
    create: async (input: CreateHouseRuleInput) => {

        await pool.query(`
                INSERT INTO house_rules (id, landlord_id, rule_text, target_room_number, category, is_priority)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [input.id, input.landlordId, input.ruleText, input.roomNumber || null, input.category || 'General', Boolean(input.isPriority ? 1 : 0)]);
    },

    // 3. Delete a house rule by ID
    delete: async (id: string) => {

        await pool.query(`DELETE FROM house_rules WHERE id = $1`, [id]);
    }
};