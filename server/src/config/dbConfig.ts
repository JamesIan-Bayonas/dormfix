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
    server: 'localhost', // Just use localhost
    database: process.env.DB_NAME,
    options: {
        instanceName: 'SQLEXPRESS', // Let the driver handle the connection details
        encrypt: false, 
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

console.log('🔌 Attempting to connect to SQL Server...');
console.log(`   Server: ${sqlConfig.server}`);
console.log(`   Database: ${sqlConfig.database}`);
console.log(`   User: ${sqlConfig.user}`);

export const poolPromise = new sql.ConnectionPool(sqlConfig)
    .connect()
    .then(pool => {
        console.log('✅ Connected to SQL Server successfully!');
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed!');
        console.error('   Error Code:', err.code);
        console.error('   Error Message:', err.message);
        console.error('\n💡 Troubleshooting tips:');
        console.error('   1. Verify SQL Server is running');
        console.error('   2. Check if SQL Server Authentication is enabled (not just Windows Auth)');
        console.error('   3. Verify the password for user "sa" is correct');
        console.error('   4. Ensure the database "dormfix" exists');
        console.error('   5. Try connecting with SQL Server Management Studio first\n');
        console.log(`   Server: ${sqlConfig.server}`);
        process.exit(1);``
    });

export { sql };