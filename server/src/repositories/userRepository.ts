// server/src/repositories/userRepository.ts
import { pool, withTransaction } from '../config/dbConfig';
import crypto from 'crypto';

export interface UserRecord {
    id: string;
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'tenant' | 'landlord';
    dorm_fix_id: string;
    is_approved: boolean;
    created_at: Date;
    profile_image?: string | null;
    last_seen?: Date | null;
    phone_number?: string | null;
}

export interface CreateUserInput {
    id: string;
    name: string;
    email: string;
    hashedPassword: string;
    role: 'tenant' | 'landlord';
    dormFixId: string;
    isApproved: number;
    landlordId?: string;
    phoneNumber?: string | null;
}

export const userRepository = {
    // 1. Find user by email
    findByEmail: async (email: string): Promise<UserRecord | null> => {

        const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
        return result.rows[0] || null;
    },

    // 2. Find landlord by dormFixId
    findLandlordByDormFixId: async (dormFixId: string): Promise<{ id: string } | null> => {

        const result = await pool.query(`SELECT id FROM users WHERE dorm_fix_id = $1 AND role = 'landlord'`, [dormFixId]);
        return result.rows[0] || null;
    },

    // 3. Register user with transactional assignment
    registerTransaction: async (data: CreateUserInput) => {
        try {
            await withTransaction(async client => {
                const existing = await client.query('SELECT id FROM users WHERE email = $1', [data.email]);
                if (existing.rows.length) throw new Error('Email already registered');
                await client.query(`INSERT INTO users
                    (id, name, email, password, role, dorm_fix_id, is_approved, phone_number)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [data.id, data.name, data.email, data.hashedPassword, data.role,
                     data.dormFixId, Boolean(data.isApproved), data.phoneNumber || null]);
                if (data.role === 'tenant' && data.landlordId) {
                    await client.query(`INSERT INTO dorm_assignments
                        (id, tenant_id, landlord_id, room_number, move_in_date)
                        VALUES ($1, $2, $3, 'Unassigned', CURRENT_DATE)`,
                        [crypto.randomUUID(), data.id, data.landlordId]);
                }
            });
        } catch (error) {
            if ((error as { code?: string; constraint?: string }).code === '23505'
                && (error as { constraint?: string }).constraint === 'users_email_key') {
                throw new Error('Email already registered');
            }
            throw error;
        }
    },
    // 4. Update user profile details
    updateProfile: async (id: string, name: string, phoneNumber?: string | null): Promise<UserRecord | null> => {

        const result = await pool.query(`
                UPDATE users
                SET name = $1, phone_number = $2
                
                WHERE id = $3
                RETURNING *
            `, [name, phoneNumber || null, id]);
        return result.rows[0] || null;
    }
};