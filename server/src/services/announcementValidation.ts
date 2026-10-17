export interface AnnouncementInput {
    title: string; body: string; roomNumber: string | null;
    priority: 'standard' | 'important'; status: 'draft' | 'published'; expiresAt: string | null;
}

export function validateAnnouncement(value: unknown, now = Date.now()): AnnouncementInput {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Announcement details are required.');
    const data = value as Record<string, unknown>;
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    const body = typeof data.body === 'string' ? data.body.trim() : '';
    if (!title || title.length > 160) throw new Error('Enter a title of 1–160 characters.');
    if (!body || body.length > 10000) throw new Error('Enter announcement details of 1–10,000 characters.');
    if (!['standard', 'important'].includes(String(data.priority))) throw new Error('Choose a valid importance.');
    if (!['draft', 'published'].includes(String(data.status))) throw new Error('Choose draft or published status.');
    const roomNumber = data.roomNumber === null || data.roomNumber === undefined ? null : typeof data.roomNumber === 'string' ? data.roomNumber.trim() : '';
    if (roomNumber !== null && (!roomNumber || roomNumber.length > 50 || roomNumber === 'Unassigned')) throw new Error('Choose a valid room or all tenants.');
    let expiresAt: string | null = null;
    if (data.expiresAt !== null && data.expiresAt !== undefined && data.expiresAt !== '') {
        if (typeof data.expiresAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(data.expiresAt)) throw new Error('Expiry must be an ISO date and time including a timezone.');
        const timestamp = Date.parse(data.expiresAt);
        const calendar = new Date(`${data.expiresAt.slice(0, 10)}T00:00:00Z`);
        if (!Number.isFinite(timestamp) || calendar.toISOString().slice(0, 10) !== data.expiresAt.slice(0, 10) || timestamp <= now) throw new Error('Choose a valid expiry in the future or leave it empty.');
        expiresAt = new Date(timestamp).toISOString();
    }
    return { title, body, roomNumber, priority: data.priority as AnnouncementInput['priority'], status: data.status as AnnouncementInput['status'], expiresAt };
}
