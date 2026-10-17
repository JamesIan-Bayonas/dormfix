import { pool } from '../config/dbConfig';
import type { SessionActor } from '../middleware/session';

export async function conversationFor(actor: SessionActor, roomId: unknown) {
    if (typeof roomId !== 'string' || roomId.length > 100 || !['landlord','tenant'].includes(actor.role) || (actor.role === 'tenant' && !actor.isApproved)) return null;
    const result = await pool.query(`SELECT da.landlord_id AS "landlordId", da.tenant_id AS "tenantId" FROM dorm_assignments da
        JOIN users t ON t.id=da.tenant_id AND t.role='tenant' AND t.is_approved=true
        JOIN users l ON l.id=da.landlord_id AND l.role='landlord'
        WHERE da.landlord_id || '-' || da.tenant_id = $1 AND ${actor.role === 'landlord' ? 'da.landlord_id' : 'da.tenant_id'}=$2
        AND (SELECT count(*) FROM dorm_assignments x WHERE x.tenant_id=da.tenant_id)=1`, [roomId,actor.id]);
    return result.rows.length === 1 ? result.rows[0] as { landlordId: string; tenantId: string } : null;
}
export async function canSeePresence(actor: SessionActor, peerId: unknown) {
    if (typeof peerId !== 'string') return false;
    if (peerId === actor.id) return actor.role === 'landlord' || (actor.role === 'tenant' && actor.isApproved);
    return !!await conversationFor(actor, actor.role === 'landlord' ? `${actor.id}-${peerId}` : `${peerId}-${actor.id}`);
}
