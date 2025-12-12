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

// DATABASE CONFIGURATION
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
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const appPool = new sql.ConnectionPool(dbConfig);

const connectDB = async () => {
    try {
        await appPool.connect();
        console.log('✅ Connected to SQL Server (Global Pool)');
    } catch (err) {
        console.error('❌ Database Connection Failed:', err);
    }
};

connectDB();

// --- Helpers ---
const generateDormCode = () => {
    return '#' + Math.floor(100000 + Math.random() * 900000).toString();
};

// 1. LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await appPool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM users WHERE email = @email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
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
});

// 2. REGISTER ROUTE (Fixed Transaction Logic)
app.post('/api/register', async (req, res) => {
    const { name, email, password, role, landlordCode } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Missing required fields" });
    }   

    // Create a Transaction "Ensures User + Assignment are created together, or not at all"
    const transaction = new sql.Transaction(appPool);
    let transactionStarted = false; // <--- The safe, manual flag
    
    try {
        await transaction.begin();
        transactionStarted = true; // Mark as started ONLY if begin() succeeds

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
        
        // B. Determine Approval Status
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

        // C. Insert User
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

        // D. Create Assignment (The "Relational Truth")
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
        // Safe Rollback Logic: Only rollback if we actually started the transaction
        if (transactionStarted) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError);
            }
        }
        console.error("Register Error:", error.message);
        res.status(400).json({ error: error.message || "Registration failed" });
    }
});

// 3. GET TENANT CHECKLIST (For Landlord Dashboard)
app.get('/api/landlord/tenants/:landlordId', async (req, res) => {
    const { landlordId } = req.params;

    try {
        const result = await appPool.request()
            .input('landlordId', sql.VarChar, landlordId)
            .query(`
                SELECT 
                    u.id, 
                    u.name, 
                    u.email, 
                    u.is_approved,
                    da.room_number,
                    da.created_at as joined_date
                FROM dorm_assignments da
                JOIN users u ON da.tenant_id = u.id
                WHERE da.landlord_id = @landlordId
                ORDER BY u.is_approved ASC, da.created_at DESC
            `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error("Fetch Tenants Error:", error);
        res.status(500).json({ error: "Failed to fetch tenants" });
    }
});

// 4. APPROVE TENANT (The "Open Door" Action)
app.patch('/api/landlord/approve/:tenantId', async (req, res) => {
    const { tenantId } = req.params;

    try {
        await appPool.request()
            .input('tenantId', sql.VarChar, tenantId)
            .query(`UPDATE users SET is_approved = 1 WHERE id = @tenantId`);

        res.json({ message: "Tenant approved successfully" });
    } catch (error) {
        console.error("Approval Error:", error);
        res.status(500).json({ error: "Failed to approve tenant" });
    }
});

// 5. SUBMIT MAINTENANCE REQUEST (Tenant)
app.post('/api/maintenance', async (req, res) => {
    const { tenantId, issueType, description, urgency } = req.body;

    if (!tenantId || !issueType || !description || !urgency) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const id = crypto.randomUUID();
        
        await appPool.request()
            .input('id', sql.VarChar(36), id)
            .input('tenantId', sql.VarChar(36), tenantId)
            .input('issueType', sql.VarChar(50), issueType)
            .input('description', sql.VarChar(sql.MAX), description)
            .input('urgency', sql.VarChar(20), urgency)
            // status and date_submitted have defaults in SQL, so we skip them
            .query(`
                INSERT INTO maintenance_requests (id, tenant_id, issue_type, description, urgency)
                VALUES (@id, @tenantId, @issueType, @description, @urgency)
            `);

        res.status(201).json({ message: "Request submitted successfully" });
    } catch (error) {
        console.error("Maintenance Submit Error:", error);
        res.status(500).json({ error: "Failed to submit request" });
    }
});

// 6. FETCH MAINTENANCE REQUESTS (Universal Route)
app.get('/api/maintenance/:userId', async (req, res) => {
    const { userId } = req.params;
    const { role } = req.query;

    try {
        let query = '';
        // We define the input parameter once. The SQL variable is now named @userId
        const request = appPool.request().input('userId', sql.VarChar, userId);

        if (role === 'landlord') {
            // Landlord View: See requests for THEIR tenants
            query = `
                SELECT 
                    mr.id, mr.issue_type as issueType, mr.description, mr.urgency, mr.status, mr.date_submitted as dateSubmitted,
                    u.name as tenantName, da.room_number as roomNumber
                FROM maintenance_requests mr
                JOIN dorm_assignments da ON mr.tenant_id = da.tenant_id
                JOIN users u ON mr.tenant_id = u.id
                -- FIX APPLIED HERE: Changed @landlordId to @userId to match the input above
                WHERE da.landlord_id = @userId
                ORDER BY 
                    CASE WHEN mr.urgency = 'Emergency' THEN 1 WHEN mr.urgency = 'High' THEN 2 ELSE 3 END,
                    mr.date_submitted DESC
            `;
        } else {
            // Tenant View: Just their own requests
            // This works perfectly because it also uses @userId
            query = `
                SELECT 
                    id, issue_type as issueType, description, urgency, status, date_submitted as dateSubmitted, admin_remarks as adminRemarks
                FROM maintenance_requests 
                WHERE tenant_id = @userId
                ORDER BY date_submitted DESC
            `;
        }

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error("Fetch Maintenance Error:", error);
        res.status(500).json({ error: "Failed to fetch requests" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// 7. REJECT TENANT (Delete Account & Assignment)
app.delete('/api/landlord/reject/:tenantId', async (req, res) => {
    const { tenantId } = req.params;

    // We use a Transaction to ensure both delete cleanly or neither does
    const transaction = new sql.Transaction(appPool);
    let transactionStarted = false;

    try {
        await transaction.begin();
        transactionStarted = true;

        const request = new sql.Request(transaction);

        // 1. First, delete the link to the dorm (Foreign Key Requirement)
        await request.input('tenantId', sql.VarChar(36), tenantId)
                     .query('DELETE FROM dorm_assignments WHERE tenant_id = @tenantId');

        // 2. Then, delete the user account itself
        // Note: We reuse the parameter @tenantId since it's already defined in the request scope
        await request.query('DELETE FROM users WHERE id = @tenantId');

        await transaction.commit();
        res.json({ message: "Tenant rejected and removed successfully" });

    } catch (error) {
        if (transactionStarted) {
            try { await transaction.rollback(); } catch (err) { console.error("Rollback error", err); }
        }
        console.error("Reject Error:", error);
        res.status(500).json({ error: "Failed to reject tenant" });
    }
});

// 8. UPDATE MAINTENANCE STATUS
app.patch('/api/maintenance/status/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate against your SQL Check Constraints
    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    try {
        await appPool.request()
            .input('id', sql.VarChar(36), id)
            .input('status', sql.VarChar(20), status)
            .query(`UPDATE maintenance_requests SET status = @status WHERE id = @id`);

        res.json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ error: "Failed to update status" });
    }
});