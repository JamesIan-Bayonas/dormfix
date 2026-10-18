import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { pool } from '../config/dbConfig';
import type { SessionActor } from './session';

type Check = (req: Request, actor: SessionActor, res: Response) => boolean | Promise<boolean>;
export function permit(check: Check): RequestHandler {
    return async (req, res, next: NextFunction) => {
        try {
            if (!await check(req, res.locals.actor as SessionActor, res)) { res.status(403).json({ error: 'You do not have access to this resource.' }); return; }
            next();
        } catch { res.status(503).json({ error: 'Access could not be verified. Please try again.' }); }
    };
}
export const landlordOnly = permit((_req, actor) => actor.role === 'landlord');
export const approved = permit((_req, actor) => actor.role === 'landlord' || (actor.role === 'tenant' && actor.isApproved));
export const tenantOnly = permit((_req, actor) => actor.role === 'tenant');
export const approvedTenant = permit((_req, actor) => actor.role === 'tenant' && actor.isApproved);
export const assignedTenant = permit(async (_req, actor) => {
    if (actor.role !== 'tenant' || !actor.isApproved) return false;
    const result=await pool.query('SELECT room_number FROM dorm_assignments WHERE tenant_id=$1',[actor.id]);
    return result.rows.length === 1 && !!result.rows[0].room_number && result.rows[0].room_number !== 'Unassigned';
});
export const selfParam = (key: string) => permit((req, actor) => req.params[key] === actor.id);
export const selfBody = (key: string) => permit((req, actor) => req.body?.[key] === undefined || req.body[key] === actor.id);
export const bindBody = (key: string): RequestHandler => (req, res, next) => { req.body = { ...req.body, [key]: (res.locals.actor as SessionActor).id }; next(); };
export async function ownsTenant(landlordId: string, tenantId: unknown) {
    if (typeof tenantId !== 'string') return false;
    const result = await pool.query(`SELECT da.landlord_id FROM dorm_assignments da JOIN users u ON u.id=da.tenant_id WHERE da.tenant_id=$1 AND u.role='tenant'`, [tenantId]);
    return result.rows.length === 1 && result.rows[0].landlord_id === landlordId;
}
export const tenantOwner = (source: 'params' | 'body', key: string) => permit((req, actor) => actor.role === 'landlord' && ownsTenant(actor.id, req[source]?.[key]));
export const paymentOwner = permit(async (req, actor) => actor.role === 'landlord' && (await pool.query('SELECT 1 FROM payments WHERE id=$1 AND landlord_id=$2', [req.params.id, actor.id])).rows.length === 1);
export const maintenanceOwner = permit(async (req, actor) => {
    if (actor.role !== 'landlord') return false;
    const result = await pool.query('SELECT tenant_id FROM maintenance_requests WHERE id=$1', [req.params.id]);
    return !!result.rows[0] && await ownsTenant(actor.id, result.rows[0].tenant_id);
});
export const ruleOwner = permit(async (req, actor) => actor.role === 'landlord' && (await pool.query('SELECT 1 FROM house_rules WHERE id=$1 AND landlord_id=$2', [req.params.id, actor.id])).rows.length === 1);
export const ruleReader = permit(async (req, actor, res) => {
    if (actor.role === 'landlord') return req.params.landlordId === actor.id;
    if (actor.role !== 'tenant' || !actor.isApproved) return false;
    const assignments = await pool.query('SELECT landlord_id,room_number FROM dorm_assignments WHERE tenant_id=$1', [actor.id]);
    if (assignments.rows.length !== 1 || assignments.rows[0].landlord_id !== req.params.landlordId) return false;
    res.locals.ruleRoom = assignments.rows[0].room_number;
    return true;
});
