import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import dotenv from 'dotenv';
import crypto from 'crypto'; // Built-in Node module for UUIDs
import bcrypt from 'bcrypt'; // For password hashing

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Using your specific SQL Server details
const dbConfig: sql.config = {
    user: 'dormfix_admin', 
    password: 'sharingan', 
    server: 'localhost', 
    database: 'dormfix',
    options: {
        encrypt: true, 
        trustServerCertificate: true, 
        instanceName: 'SQLEXPRESS' 
    },
    // Connection Pool Settings (Best Practice)
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// We connect ONCE when the server starts
const appPool = new sql.ConnectionPool(dbConfig);

const connectDB = async () => {
    try {
        await appPool.connect();
        console.log('Connected to SQL Server (Global Pool)');
    } catch (err) {
        console.error(' Database Connection Failed:', err);
    }
};

connectDB();

// --- helper for generating ID ---
const generateDormFixId = () => '#' + Math.floor(1000 + Math.random() * 9000);

const generateDormCode = () => {
    return '#' + Math.floor(100000 + Math.random() * 900000).toString();
};

// LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Use the global pool
        const result = await appPool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM users WHERE email = @email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // CHECK PASSWORD (BCRYPT)
        // Ideally, clean your DB or register a new user to test.
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Sanitize
        const { password: _, ...safeUser } = user;

        // Map snake_case to camelCase for React
        const formattedUser = {
            ...safeUser,
            dormFixId: user.dorm_fix_id,
            createdAt: user.created_at
        };

        res.json(formattedUser);

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// REGISTER ROUTE
app.post('/api/register', async (req, res) => {
    const { name, email, password, role, landlordCode } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Missing required fields" });
    }   

    // Create a Transaction (Ensures User + Assignment are created together, or not at all)
    const transaction = new sql.Transaction(appPool);
    
    try {
        await transaction.begin();

        // Check Email
        const checkRequest = new sql.Request(transaction);
        const checkResult = await checkRequest.input('email', sql.VarChar, email)
            .query('SELECT id FROM users WHERE email = @email');
        
        if (checkResult.recordset.length > 0) {
            throw new Error("Email already registered");
        }

        // Prepare Data
        const userId = crypto.randomUUID();
        // HASH THE PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);
        
        let myDormFixId = '';
        let landlordId = '';

        let isApproved = role === 'landlord' ? 1 : 0;

        if (role === 'landlord') {
            myDormFixId = generateDormCode();
        } else if (role === 'tenant') {
            myDormFixId = 'T-' + Math.floor(1000 + Math.random() * 9000);

            if (!landlordCode) throw new Error("Landlord Code is required for Tenants");
            console.log(`Received Landlord Code directly: '${landlordCode}'`);
            
            const landlordCheck = new sql.Request(transaction);
            console.log('🔍 Looking for landlord with code:', landlordCode);
            const landlordResult = await landlordCheck.input('code', sql.VarChar, landlordCode)
                .query("SELECT id, dorm_fix_id, name FROM users WHERE dorm_fix_id = @code AND role = 'landlord'");
            
            console.log('🔍 Found landlords:', landlordResult.recordset);
            
            if (landlordResult.recordset.length === 0) {
                throw new Error("Invalid Landlord Code");
            }
            landlordId = landlordResult.recordset[0].id;
        }

        // 3. Insert User
        const createRequest = new sql.Request(transaction)
        await createRequest
            .input('id', sql.VarChar, userId)
            .input('name', sql.VarChar, name)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .input('role', sql.VarChar, role)
            .input('dormFixId', sql.VarChar, myDormFixId)
            .input('isApproved', sql.Bit, isApproved) // New Field
            .query(`
                INSERT INTO users (id, name, email, password, role, dorm_fix_id, is_approved, created_at)
                VALUES (@id, @name, @email, @password, @role, @dormFixId, @isApproved, GETDATE())
            `);

        // If Tenant, Create Assignment
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

    } catch (error: any) {
        // Safe Rollback logic
        // if (transaction._aborted === false) {
        //     try {
        //         await transaction.rollback();
        //     } catch (rollbackErr) {
        //         console.error("Rollback failed", rollbackErr);
        //     }
        // }w
        console.error("Register Error:", error.message);
        res.status(400).json({ error: error.message || "Registration failed" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Note: In production, consider more robust error handling, input validation, and security measures.