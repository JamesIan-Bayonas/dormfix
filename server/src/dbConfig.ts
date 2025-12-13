import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// I have placed your ACTUAL credentials here so it works immediately.
// Ideally, you put these in a .env file later, but for the deadline, this works.
const sqlConfig: sql.config = {
    user: process.env.DB_USER || 'dormfix_admin', 
    password: process.env.DB_PASSWORD || 'sharingan', 
    server: process.env.DB_SERVER || 'localhost', 
    database: process.env.DB_NAME || 'dormfix',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true, 
        trustServerCertificate: true,
        instanceName: 'SQLEXPRESS' 
    }
};

const poolPromise = new sql.ConnectionPool(sqlConfig)
    .connect()
    .then(pool => {
        console.log('✅ Connected to SQL Server (Global Pool)');
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed!', err);
        throw err;
    });

export { sql, poolPromise };