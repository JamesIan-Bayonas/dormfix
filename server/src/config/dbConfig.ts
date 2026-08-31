// server/src/config/dbConfig.ts
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const dbConfig: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'dormfix',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,

    // Allow 60 seconds for Azure Serverless to resume compute
    connectionTimeout: 60000,
    requestTimeout: 60000,

    options: {
        encrypt: isProduction,
        trustServerCertificate: !isProduction,
        connectTimeout: 60000, // Tedious handshake timeout
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 60000 // Allow queries waiting on the pool to hold for 60s
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