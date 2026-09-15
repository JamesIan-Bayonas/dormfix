import { Pool, PoolClient, types } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required for PostgreSQL.');
const url = new URL(connectionString);
if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string.');
}

// SSL parameters in a URI can override pg's SSL object. Configure TLS here.
for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat']) {
    if (url.searchParams.has(key)) throw new Error(`Remove ${key} from DATABASE_URL; configure TLS using DB_SSL and DB_SSL_CA_PATH.`);
}
const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
const sslMode = process.env.DB_SSL ?? (local ? 'false' : 'true');
if (!['true', 'false'].includes(sslMode)) throw new Error('DB_SSL must be true or false.');
if (sslMode === 'false' && !local) throw new Error('Remote PostgreSQL connections require verified TLS.');
const ca = process.env.DB_SSL_CA_PATH ? fs.readFileSync(process.env.DB_SSL_CA_PATH, 'utf8') : undefined;

// SQL Server date fields were Date objects. Parse calendar dates at UTC midnight
// so JSON serialization stays stable across the server's timezone.
types.setTypeParser(1082, value => new Date(`${value}T00:00:00.000Z`));

export const pool = new Pool({
    connectionString,
    ssl: sslMode === 'true' ? { rejectUnauthorized: true, ...(ca ? { ca } : {}) } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 60000,
    statement_timeout: 60000,
    application_name: 'dormfix-api',
});

pool.on('error', error => {
    console.error('Idle PostgreSQL connection failed:', error.message);
});

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    let releaseError: Error | undefined;
    try {
        await client.query('BEGIN');
        const result = await work(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            // Discard a connection whose transaction state cannot be restored.
            releaseError = rollbackError instanceof Error ? rollbackError : new Error('Rollback failed');
        }
        throw error;
    } finally {
        client.release(releaseError);
    }
}

export function toDateOnly(value: Date | string): string {
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) throw new Error('Invalid calendar date.');
        return value.toISOString().slice(0, 10);
    }
    // Accept date-only strings and ISO timestamp strings used by existing callers.
    const match = /^(\d{4}-\d{2}-\d{2})(?:$|T)/.exec(value);
    if (!match) throw new Error('Calendar date must use YYYY-MM-DD or an ISO timestamp.');
    const date = new Date(`${match[1]}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== match[1]) {
        throw new Error('Invalid calendar date.');
    }
    return match[1];
}
