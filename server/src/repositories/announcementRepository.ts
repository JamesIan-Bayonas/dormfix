import crypto from 'crypto';
import { pool } from '../config/dbConfig';
import type { AnnouncementInput } from '../services/announcementValidation';

const fields = `id, title, body, room_number AS "roomNumber", priority, status, expires_at AS "expiresAt",
    published_at AS "publishedAt", created_at AS "createdAt", updated_at AS "updatedAt", version`;

export const announcementRepository = {
    async landlordList(landlordId: string) {
        return (await pool.query(`SELECT ${fields} FROM announcements WHERE landlord_id = $1 ORDER BY updated_at DESC, id`, [landlordId])).rows;
    },
    async tenantList(tenantId: string) {
        return (await pool.query(`SELECT ${fields} FROM announcements a WHERE a.published_at IS NOT NULL AND a.status IN ('published', 'archived')
            AND EXISTS (SELECT 1 FROM dorm_assignments da WHERE da.tenant_id = $1 AND da.landlord_id = a.landlord_id
                AND (a.room_number IS NULL OR (da.room_number <> 'Unassigned' AND da.room_number = a.room_number)))
            ORDER BY a.published_at DESC, a.id`, [tenantId])).rows;
    },
    async ownsRoom(landlordId: string, room: string) {
        return (await pool.query('SELECT 1 FROM rooms WHERE landlord_id = $1 AND room_number = $2 LIMIT 1', [landlordId, room])).rows.length > 0;
    },
    async create(landlordId: string, data: AnnouncementInput) {
        return (await pool.query(`INSERT INTO announcements (id, landlord_id, title, body, room_number, priority, status, expires_at, published_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7::varchar,$8,CASE WHEN $7::varchar = 'published' THEN now() ELSE NULL END) RETURNING ${fields}`,
            [crypto.randomUUID(), landlordId, data.title, data.body, data.roomNumber, data.priority, data.status, data.expiresAt])).rows[0];
    },
    async update(id: string, landlordId: string, version: number, data: AnnouncementInput) {
        return (await pool.query(`UPDATE announcements SET title=$1, body=$2, room_number=$3, priority=$4, status=$5::varchar, expires_at=$6,
            published_at=CASE WHEN $5::varchar='published' THEN COALESCE(published_at, now()) ELSE published_at END, updated_at=now(), version=version+1
            WHERE id=$7 AND landlord_id=$8 AND version=$9 AND status <> 'archived' AND (published_at IS NULL OR $5::varchar='published') RETURNING ${fields}`,
            [data.title, data.body, data.roomNumber, data.priority, data.status, data.expiresAt, id, landlordId, version])).rows[0] || null;
    },
    async archive(id: string, landlordId: string, version: number) {
        return (await pool.query(`UPDATE announcements SET status='archived', updated_at=now(), version=version+1
            WHERE id=$1 AND landlord_id=$2 AND version=$3 AND status <> 'archived' RETURNING ${fields}`, [id, landlordId, version])).rows[0] || null;
    },
};
