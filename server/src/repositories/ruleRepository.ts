// server/src/repositories/ruleRepository.ts
import { sql, poolPromise } from '../config/dbConfig';

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
        const pool = await poolPromise;
        const result = await pool.request()
            .input('lid', sql.VarChar(36), landlordId)
            .query(`
                SELECT 
                    id, 
                    rule_text, 
                    target_room_number,
                    category,
                    is_priority,
                    created_at
                FROM house_rules 
                WHERE landlord_id = @lid 
                ORDER BY created_at DESC
            `);
        return result.recordset;
    },

    // 2. Create a house rule
    create: async (input: CreateHouseRuleInput) => {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar(36), input.id)
            .input('lid', sql.VarChar(36), input.landlordId)
            .input('text', sql.NVarChar(sql.MAX), input.ruleText)
            .input('target', sql.VarChar(50), input.roomNumber || null)
            .input('category', sql.VarChar(50), input.category || 'General')
            .input('isPriority', sql.Bit, input.isPriority ? 1 : 0)
            .query(`
                INSERT INTO house_rules (id, landlord_id, rule_text, target_room_number, category, is_priority)
                VALUES (@id, @lid, @text, @target, @category, @isPriority)
            `);
    },

    // 3. Delete a house rule by ID
    delete: async (id: string) => {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .query('DELETE FROM house_rules WHERE id = @id');
    }
};