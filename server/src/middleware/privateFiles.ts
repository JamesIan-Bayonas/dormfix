import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/dbConfig';
import type { SessionActor } from './session';

export const fileOwnerPrefix = (id: string) => crypto.createHash('sha256').update(id).digest('hex').slice(0,32)+'--';
export async function privateFile(req: Request, res: Response) {
    const name = String(req.params.filename);
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name)) { res.sendStatus(404); return; }
    const actor = res.locals.actor as SessionActor;
    try {
        const owned = await pool.query('SELECT 1 FROM payments WHERE proof_image=$1 AND (tenant_id=$2 OR landlord_id=$2) LIMIT 1', ['/uploads/'+name,actor.id]);
        if (!owned.rows.length && !name.startsWith(fileOwnerPrefix(actor.id))) { res.sendStatus(403); return; }
        res.setHeader('Cache-Control','private, no-store');
        res.setHeader('X-Content-Type-Options','nosniff');
        res.setHeader('Content-Security-Policy',"default-src 'none'; sandbox");
        if (!/\.(png|jpe?g|gif|webp)$/i.test(name)) res.attachment(name);
        res.sendFile(name,{root:path.resolve(process.cwd(),'uploads'),dotfiles:'deny'},error=>{if(error && !res.headersSent)res.sendStatus(404);});
    } catch { if (!res.headersSent) res.sendStatus(503); }
}
/** Multipart identity is checked after parsing but before AI, persistence, or alerts. */
export function paymentIdentity(req: Request, res: Response, next: NextFunction) {
    const actor = res.locals.actor as SessionActor;
    if (req.body?.tenantId && req.body.tenantId !== actor.id) {
        if (req.file) fs.unlink(req.file.path,()=>{});
        res.status(403).json({error:'You can only submit your own payment proof.'});return;
    }
    req.body={...req.body,tenantId:actor.id};
    next();
}
