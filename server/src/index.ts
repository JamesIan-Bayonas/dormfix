import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import dotenv from 'dotenv';
import crypto from 'crypto'; // Built-in Node module for UUIDs
import bcrypt from 'bcrypt'; // For password hashing
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { assignUserToRoom } from './controllers/roomController.ts';
import { poolPromise } from './dbConfig.ts';

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Helpers ---
const generateDormCode = () => {
    return '#' + Math.floor(100000 + Math.random() * 900000).toString();
};

// --- FILE UPLOAD CONFIGURATION (Multer) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. Ensure the 'uploads' folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Define Storage Strategy
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// 3. Initialize the "Bouncer"
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed')); 
        }
    }
});


// 1. LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await poolPromise; // FIX APPLIED
        const result = await pool.request()
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

    try {
        const pool = await poolPromise; // FIX APPLIED
        const transaction = new sql.Transaction(pool); // Use pool here
        
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

        } catch (err: any) {
            await transaction.rollback();
            throw err; // Re-throw to be caught by outer catch
        }

    } catch (error: any) {
        console.error("Register Error:", error.message);
        res.status(400).json({ error: error.message || "Registration failed" });
    }
});

// 4. APPROVE TENANT (The "Open Door" Action)
app.patch('/api/landlord/approve/:tenantId', async (req, res) => {
    const { tenantId } = req.params;

    try {
        const pool = await poolPromise; // FIX APPLIED
        await pool.request()
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
        const pool = await poolPromise; // FIX APPLIED
        
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('tenantId', sql.VarChar(36), tenantId)
            .input('issueType', sql.VarChar(50), issueType)
            .input('description', sql.VarChar(sql.MAX), description)
            .input('urgency', sql.VarChar(20), urgency)
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
        const pool = await poolPromise; // FIX APPLIED
        const request = pool.request().input('userId', sql.VarChar, userId);

        if (role === 'landlord') {
            query = `
                SELECT 
                    mr.id, mr.issue_type as issueType, mr.description, mr.urgency, mr.status, mr.date_submitted as dateSubmitted,
                    u.name as tenantName, da.room_number as roomNumber
                FROM maintenance_requests mr
                JOIN dorm_assignments da ON mr.tenant_id = da.tenant_id
                JOIN users u ON mr.tenant_id = u.id
                WHERE da.landlord_id = @userId
                ORDER BY 
                    CASE WHEN mr.urgency = 'Emergency' THEN 1 WHEN mr.urgency = 'High' THEN 2 ELSE 3 END,
                    mr.date_submitted DESC
            `;
        } else {
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

// 7. REJECT TENANT (Delete Account & Assignment)
app.delete('/api/landlord/reject/:tenantId', async (req, res) => {
    const { tenantId } = req.params;

    try {
        const pool = await poolPromise; // FIX APPLIED
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            // 1. First, delete the link to the dorm
            await request.input('tenantId', sql.VarChar(36), tenantId)
                         .query('DELETE FROM dorm_assignments WHERE tenant_id = @tenantId');

            // 2. Then, delete the user account itself
            await request.query('DELETE FROM users WHERE id = @tenantId');

            await transaction.commit();
            res.json({ message: "Tenant rejected and removed successfully" });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error("Reject Error:", error);
        res.status(500).json({ error: "Failed to reject tenant" });
    }
});

// 8. UPDATE MAINTENANCE STATUS
app.patch('/api/maintenance/status/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    try {
        const pool = await poolPromise; // FIX APPLIED
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('status', sql.VarChar(20), status)
            .query(`UPDATE maintenance_requests SET status = @status WHERE id = @id`);

        res.json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ error: "Failed to update status" });
    }
});

// 9. GET TENANT HOUSING DETAILS (Profile Card)
app.get('/api/tenant/details/:tenantId', async (req, res) => {
    const { tenantId } = req.params;

    try {
        const pool = await poolPromise; // FIX APPLIED
        const result = await pool.request()
            .input('tenantId', sql.VarChar(36), tenantId)
            .query(`
                SELECT 
                    u.name AS landlordName, 
                    u.email AS landlordEmail, 
                    da.room_number AS roomNumber, 
                    da.move_in_date AS moveInDate
                FROM dorm_assignments da
                JOIN users u ON da.landlord_id = u.id
                WHERE da.tenant_id = @tenantId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Fetch Housing Details Error:", error);
        res.status(500).json({ error: "Failed to fetch details" });
    }
});

// 10. GET LANDLORD ROOMS (Inventory & Occupancy Check)
app.get('/api/landlord/rooms/:landlordId', async (req, res) => {
    const { landlordId } = req.params;

    try {
        const pool = await poolPromise; // FIX APPLIED
        const result = await pool.request()
            .input('landlordId', sql.VarChar(36), landlordId)
            .query(`
                SELECT 
                    r.id, 
                    r.room_number, 
                    r.capacity,
                    (SELECT COUNT(*) 
                     FROM dorm_assignments da 
                     WHERE da.room_number = r.room_number 
                     AND da.landlord_id = r.landlord_id) as currentOccupants
                FROM rooms r
                WHERE r.landlord_id = @landlordId
                ORDER BY r.room_number ASC
            `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error("Fetch Rooms Error:", error);
        res.status(500).json({ error: "Failed to fetch rooms" });
    }
});

// 11. ADD NEW ROOM
app.post('/api/landlord/rooms', async (req, res) => {
    const { landlordId, roomNumber, capacity } = req.body;

    if (!landlordId || !roomNumber) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const pool = await poolPromise; // FIX APPLIED
        
        // Check for duplicate room number for this landlord
        const check = await pool.request()
            .input('lid', sql.VarChar(36), landlordId)
            .input('rnum', sql.VarChar(50), roomNumber)
            .query("SELECT id FROM rooms WHERE landlord_id = @lid AND room_number = @rnum");

        if (check.recordset.length > 0) {
            return res.status(400).json({ error: "Room number already exists" });
        }

        const id = crypto.randomUUID();
        
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('landlordId', sql.VarChar(36), landlordId)
            .input('roomNumber', sql.VarChar(50), roomNumber)
            .input('capacity', sql.Int, capacity || 1) // Default to 1 if empty
            .query(`
                INSERT INTO rooms (id, landlord_id, room_number, capacity)
                VALUES (@id, @landlordId, @roomNumber, @capacity)
            `);

        res.status(201).json({ message: "Room added successfully" });
    } catch (error) {
        console.error("Add Room Error:", error);
        res.status(500).json({ error: "Failed to add room" });
    }
});

// 12. UPLOAD PROOF OF PAYMENT
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const filePath = `/uploads/${req.file.filename}`;
        res.json({ url: filePath });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "File upload failed" });
    }
});

// 13. ASSIGN TENANT TO ROOM (With Capacity Check)
app.post('/api/landlord/assign', async (req, res) => {
    const { tenantId, landlordId, roomNumber, moveInDate } = req.body;

    if (!tenantId || !landlordId || !roomNumber) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const pool = await poolPromise; // FIX APPLIED
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            // 1. Check if the room exists and get its capacity
            const roomCheck = await transaction.request()
                .input('lid', sql.VarChar(36), landlordId)
                .input('rnum', sql.VarChar(50), roomNumber)
                .query(`SELECT capacity FROM rooms WHERE landlord_id = @lid AND room_number = @rnum`);

            if (roomCheck.recordset.length === 0) {
                throw new Error("Room does not exist.");
            }
            const capacity = roomCheck.recordset[0].capacity;

            // 2. Count current occupants
            const countCheck = await transaction.request()
                .input('lid', sql.VarChar(36), landlordId)
                .input('rnum', sql.VarChar(50), roomNumber)
                .query(`SELECT COUNT(*) as count FROM dorm_assignments WHERE landlord_id = @lid AND room_number = @rnum`);
            
            if (countCheck.recordset[0].count >= capacity) {
                throw new Error("Room is already at full capacity.");
            }

            // 3. Create the Assignment
            const id = crypto.randomUUID();
            await transaction.request()
                .input('id', sql.VarChar(36), id)
                .input('tenantId', sql.VarChar(36), tenantId)
                .input('landlordId', sql.VarChar(36), landlordId)
                .input('roomNumber', sql.VarChar(50), roomNumber)
                .input('moveInDate', sql.Date, moveInDate || new Date())
                .query(`
                    INSERT INTO dorm_assignments (id, tenant_id, landlord_id, room_number, move_in_date)
                    VALUES (@id, @tenantId, @landlordId, @roomNumber, @moveInDate)
                `);

            await transaction.commit();
            res.json({ message: "Tenant assigned successfully" });

        } catch (err: any) {
            await transaction.rollback();
            throw err;
        }

    } catch (error: any) {
        console.error("Assignment Error:", error);
        res.status(400).json({ error: error.message || "Failed to assign room" });
    }
});

// 14. GET ALL TENANTS FOR LANDLORD
app.get('/api/landlord/tenants/:landlordId', async (req, res) => {
    const { landlordId } = req.params;
    try {
        const pool = await poolPromise; // FIX APPLIED
        const result = await pool.request()
            .input('lid', sql.VarChar(36), landlordId) 
            .query(`
                SELECT 
                    u.id, 
                    u.name, 
                    u.email, 
                    u.is_approved as isApproved,
                    da.room_number as roomNumber
                FROM users u
                LEFT JOIN dorm_assignments da ON u.id = da.tenant_id
                WHERE u.role = 'tenant' 
            `);
        
        res.json(result.recordset);
    } catch (err) {
        console.error("Fetch Tenants Error:", err); 
        res.status(500).json({ error: "Failed to fetch tenants" });
    }
});

// 15. UPDATE USER STATUS
app.patch('/api/users/:id/status', async (req, res) => {
    const { id } = req.params;
    const { isApproved } = req.body; 

    try {
        const pool = await poolPromise; // FIX APPLIED
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('isApproved', sql.Bit, isApproved === true ? 1 : 0) 
            .query(`UPDATE users SET is_approved = @isApproved WHERE id = @id`);

        res.json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Status Update Error Detailed:", error);
        res.status(500).json({ error: "Failed to update status. Check server logs." });
    }
});

// 16. NEW SECURE ASSIGNMENT ROUTE (From RoomController)
app.post('/api/assign-room', assignUserToRoom);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});