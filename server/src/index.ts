import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;

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
    }
};

// CONNECT TO DATABASE
const connectDB = async () => {
    try {
        await sql.connect(dbConfig);
        console.log('✅ Connected to SQL Server (SQLEXPRESS)');
    } catch (err) {
        console.error('❌ Database connection failed. Check if SQL Browser service is running.', err);
    }
};

connectDB();

// LOGIN API ROUTE
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // Query the 'users' table
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM users WHERE email = @email');

        const user = result.recordset[0];

        // Check if user exists
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Simple Password Check (Plain text for now, match DB)
        if (user.password !== password) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Sanitize (Remove password)
        // We use the destructuring trick we learned!
        const { password: _, ...safeUser } = user;

        // Map Snake_Case to CamelCase
        // Your React app expects 'dormFixId', but DB has 'dorm_fix_id'
        const responseUser = {
            id: safeUser.id,
            name: safeUser.name,
            email: safeUser.email,
            role: safeUser.role,
            dormFixId: safeUser.dorm_fix_id, // Mapping here
            createdAt: safeUser.created_at
        };

        res.json(responseUser);

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});