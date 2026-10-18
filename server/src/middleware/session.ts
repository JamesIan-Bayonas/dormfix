import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/dbConfig';

export interface SessionActor { id: string; role: string; isApproved: boolean; expiresAt?: Date | string }
export const tokenHash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export async function findSession(token: unknown): Promise<SessionActor | null> {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) return null;
    const result = await pool.query(`SELECT u.id, u.role, u.is_approved AS "isApproved", s.expires_at AS "expiresAt" FROM app_sessions s
        JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()`, [tokenHash(token)]);
    return result.rows[0] || null;
}

export async function createSession(userId: string) {
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query('INSERT INTO app_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval \'12 hours\')', [tokenHash(token), userId]);
    await pool.query('DELETE FROM app_sessions WHERE user_id = $1 AND expires_at <= now()', [userId]);
    return token;
}

export async function requireSession(req: Request, res: Response, next: NextFunction) {
    const match = /^Bearer ([a-f0-9]{64})$/i.exec(req.headers.authorization || '');
    res.setHeader('Cache-Control', 'no-store');
    if (!match) { res.status(401).json({ error: 'Sign in to access your workspace.' }); return; }
    try {
        const actor = await findSession(match[1]);
        if (!actor) { res.status(401).json({ error: 'Your session expired. Sign in again.' }); return; }
        res.locals.actor = actor;
        res.locals.tokenHash = tokenHash(match[1]);
        next();
    } catch { res.status(503).json({ error: 'Session verification is unavailable. Please try again.' }); }
}

export async function revokeSession(_req: Request, res: Response) {
    try { await pool.query('DELETE FROM app_sessions WHERE token_hash = $1', [res.locals.tokenHash]); res.sendStatus(204); }
    catch { res.status(503).json({ error: 'Server sign out could not be confirmed.' }); }
}
