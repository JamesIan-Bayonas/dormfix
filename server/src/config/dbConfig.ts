import sql from 'mssql';
import dotenv from 'dotenv';

// Load environmental environment .env
dotenv.config();

if (!process.env.DB_PASSWORD) {
    console.error('❌ FATAL ERROR: DB_PASSWORD is missing in .env file.');
    process.exit(1);
}

const sqlConfig: sql.config = {
    user: process.env.DB_USER || 'sa', 
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost', 
    database: process.env.DB_NAME || 'dormfix',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true, // Required for Azure/Cloud SQL compatibility
        trustServerCertificate: true, // Keep true for local dev
        instanceName: 'SQLEXPRESS' // Our System currently use ssms
    }
};

const poolPromise = new sql.ConnectionPool(sqlConfig)
    .connect()
    .then(pool => {
        console.log('✅ Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed!', err);
        process.exit(1);
    });

export { sql, poolPromise };