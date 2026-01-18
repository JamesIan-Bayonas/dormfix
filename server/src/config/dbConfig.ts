import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
    console.error(`CRITICAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please create a .env file in the server directory based on the README instructions.');
    process.exit(1);
}

const sqlConfig: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true, 
        trustServerCertificate: true, // Set to false in Production if you have valid certs
        instanceName: 'SQLEXPRESS' 
    }
};

export const poolPromise = new sql.ConnectionPool(sqlConfig)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed!', err);
        process.exit(1);
    });

export { sql };