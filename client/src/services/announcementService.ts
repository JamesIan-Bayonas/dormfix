import { sessionFetch } from '../api/session';
export interface Announcement {
    id: string; title: string; body: string; roomNumber: string | null;
    priority: 'standard' | 'important'; status: 'draft' | 'published' | 'archived';
    expiresAt: string | null; publishedAt: string | null; createdAt: string; updatedAt: string; version: number;
}
export type AnnouncementFields = Pick<Announcement, 'title' | 'body' | 'roomNumber' | 'priority' | 'expiresAt'>;
export class AnnouncementError extends Error {
    status: number;
    constructor(message: string, status: number) { super(message); this.status = status; }
}
async function request<T>(token: string, path = '', method = 'GET', data?: unknown): Promise<T> {
    const response = await sessionFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/announcements${path}`, {
        method, headers: { Authorization: `Bearer ${token}`, ...(data ? { 'Content-Type': 'application/json' } : {}) },
        ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const body = await response.json();
    if (!response.ok) throw new AnnouncementError(response.status === 401 ? 'Your session expired. Sign out and sign in again to access announcements.' : body.error || 'The announcement request failed.', response.status);
    return body;
}
export const announcementService = {
    list: (token: string) => request<Announcement[]>(token),
    create: (token: string, data: AnnouncementFields & { status: 'draft' | 'published' }) => request<Announcement>(token, '', 'POST', data),
    update: (token: string, id: string, version: number, data: AnnouncementFields & { status: 'draft' | 'published' }) => request<Announcement>(token, `/${encodeURIComponent(id)}`, 'PUT', { ...data, version }),
    archive: (token: string, id: string, version: number) => request<Announcement>(token, `/${encodeURIComponent(id)}/archive`, 'POST', { version }),
};
