import type { Announcement } from '../services/announcementService';

export function announcementState(notice: Announcement, now = Date.now()) {
    if (notice.status === 'archived') return 'Archived';
    if (notice.status === 'draft') return 'Draft';
    if (notice.expiresAt && new Date(notice.expiresAt).getTime() <= now) return 'Expired';
    return 'Published';
}
export function currentAnnouncements(notices: Announcement[], now = Date.now()) {
    return notices.filter(notice => announcementState(notice, now) === 'Published').sort((a, b) =>
        Number(b.priority === 'important') - Number(a.priority === 'important') || new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
}
export function announcementDate(value: string) {
    return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
export function localExpiry(value: string | null) {
    if (!value) return '';
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
