import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Determine if running in cloud production
const isProduction = process.env.NODE_ENV === 'production';

const dbConfig: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'dormfix',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
    options: {
        // Enforce encryption for cloud databases (e.g., Azure SQL)
        encrypt: isProduction, 
        trustServerCertificate: !isProduction
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

export const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log(`✅ Connected to MSSQL Database (${isProduction ? 'Production Cloud' : 'Local Host'})`);
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed: ', err);
        throw err;
    });

export { sql };