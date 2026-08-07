import type { Request, Response } from 'express';
import { poolPromise } from '../config/dbConfig';
import sql from 'mssql';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Helper function moved from index.ts
const generateDormCode = () => {
    return '#' + Math.floor(100000 + Math.random() * 900000).toString();
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM users WHERE email = @email');

        const user = result.recordset[0];

        if (!user) {
             res.status(401).json({ error: "Invalid email or password" });
             return; // Ensure function stops here
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
             res.status(401).json({ error: "Invalid email or password" });
             return;
        }

        // Sanitize
        const { password: _, ...safeUser } = user;

        const formattedUser = {
            ...safeUser,
            dormFixId: user.dorm_fix_id,
            isApproved: user.is_approved, 
            createdAt: user.created_at
        };

        res.json(formattedUser);

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const register = async (req: Request, res: Response) => {
    const { name, email, password, role, landlordCode } = req.body;

    if (!name || !email || !password || !role) {
         res.status(400).json({ error: "Missing required fields" });
         return;
    }   

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();

        try {
            //  Check Email Duplication
            const checkRequest = new sql.Request(transaction);
            const checkResult = await checkRequest.input('email', sql.VarChar, email)
                .query('SELECT id FROM users WHERE email = @email');
            
            if (checkResult.recordset.length > 0) {
                throw new Error("Email already registered");
            }

            const userId = crypto.randomUUID();
            const hashedPassword = await bcrypt.hash(password, 10);
            
            let myDormFixId = '';
            let landlordId = '';
            
            // Determine Approval Status
            let isApproved = role === 'landlord' ? 1 : 0; 

            if (role === 'landlord') {
                myDormFixId = generateDormCode(); 
            } else if (role === 'tenant') {
                myDormFixId = 'T-' + Math.floor(1000 + Math.random() * 9000);
                
                if (!landlordCode) throw new Error("Landlord Code is required for Tenants");
                
                const landlordCheck = new sql.Request(transaction);
                const landlordResult = await landlordCheck.input('code', sql.VarChar, landlordCode)
                    .query("SELECT id FROM users WHERE dorm_fix_id = @code AND role = 'landlord'");
                
                if (landlordResult.recordset.length === 0) {
                    throw new Error("Invalid Landlord Code");
                }
                landlordId = landlordResult.recordset[0].id;
            }

            // Insert User
            const createRequest = new sql.Request(transaction);
            await createRequest
                .input('id', sql.VarChar, userId)
                .input('name', sql.VarChar, name)
                .input('email', sql.VarChar, email)
                .input('password', sql.VarChar, hashedPassword)
                .input('role', sql.VarChar, role)
                .input('dormFixId', sql.VarChar, myDormFixId)
                .input('isApproved', sql.Bit, isApproved) 
                .query(`
                    INSERT INTO users (id, name, email, password, role, dorm_fix_id, is_approved, created_at)
                    VALUES (@id, @name, @email, @password, @role, @dormFixId, @isApproved, GETDATE())
                `);

            // Create Assignment
            if (role === 'tenant') {
                const assignmentId = crypto.randomUUID();
                const assignRequest = new sql.Request(transaction);
                await assignRequest
                    .input('id', sql.VarChar, assignmentId)
                    .input('tenantId', sql.VarChar, userId)
                    .input('landlordId', sql.VarChar, landlordId)
                    .query(`
                        INSERT INTO dorm_assignments (id, tenant_id, landlord_id, room_number, move_in_date, created_at)
                        VALUES (@id, @tenantId, @landlordId, 'Unassigned', GETDATE(), GETDATE())
                    `);
            }

            await transaction.commit();
            res.status(201).json({ message: "Registration successful" });

        } catch (err: any) {
            await transaction.rollback();
            throw err;
        }

    } catch (error: any) {
        console.error("Register Error:", error.message);
        res.status(400).json({ error: error.message || "Registration failed" });
    }
};