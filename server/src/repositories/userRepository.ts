// server/src/repositories/userRepository.ts
import { sql, poolPromise } from '../config/dbConfig';
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
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.VarChar(100), email)
            .query('SELECT * FROM users WHERE email = @email');
        return result.recordset[0] || null;
    },

    // 2. Find landlord by dormFixId
    findLandlordByDormFixId: async (dormFixId: string): Promise<{ id: string } | null> => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('code', sql.VarChar(50), dormFixId)
            .query("SELECT id FROM users WHERE dorm_fix_id = @code AND role = 'landlord'");
        return result.recordset[0] || null;
    },

    // 3. Register user with transactional assignment
    registerTransaction: async (data: CreateUserInput) => {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            const checkRequest = new sql.Request(transaction);
            const checkResult = await checkRequest
                .input('email', sql.VarChar(100), data.email)
                .query('SELECT id FROM users WHERE email = @email');

            if (checkResult.recordset.length > 0) {
                throw new Error("Email already registered");
            }

            const createRequest = new sql.Request(transaction);
            await createRequest
                .input('id', sql.VarChar(36), data.id)
                .input('name', sql.NVarChar(100), data.name)
                .input('email', sql.NVarChar(100), data.email)
                .input('password', sql.NVarChar(255), data.hashedPassword)
                .input('role', sql.VarChar(20), data.role)
                .input('dormFixId', sql.VarChar(50), data.dormFixId)
                .input('isApproved', sql.Bit, data.isApproved)
                .input('phoneNumber', sql.VarChar(20), data.phoneNumber || null)
                .query(`
                    INSERT INTO users (id, name, email, password, role, dorm_fix_id, is_approved, phone_number, created_at)
                    VALUES (@id, @name, @email, @password, @role, @dormFixId, @isApproved, @phoneNumber, GETDATE())
                `);

            if (data.role === 'tenant' && data.landlordId) {
                const assignmentId = crypto.randomUUID();
                const assignRequest = new sql.Request(transaction);
                await assignRequest
                    .input('id', sql.VarChar(36), assignmentId)
                    .input('tenantId', sql.VarChar(36), data.id)
                    .input('landlordId', sql.VarChar(36), data.landlordId)
                    .query(`
                        INSERT INTO dorm_assignments (id, tenant_id, landlord_id, room_number, move_in_date, created_at)
                        VALUES (@id, @tenantId, @landlordId, 'Unassigned', GETDATE(), GETDATE())
                    `);
            }

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    // 4. Update user profile details
    updateProfile: async (id: string, name: string, phoneNumber?: string | null): Promise<UserRecord | null> => {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('name', sql.NVarChar(100), name)
            .input('phoneNumber', sql.VarChar(20), phoneNumber || null)
            .query(`
                UPDATE users
                SET name = @name, phone_number = @phoneNumber
                OUTPUT inserted.*
                WHERE id = @id
            `);
        return result.recordset[0] || null;
    }
};