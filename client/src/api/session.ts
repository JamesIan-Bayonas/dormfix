const api = new URL(import.meta.env.VITE_API_URL || 'http://localhost:5000');
export const sessionExpiredEvent = 'dormfix:session-expired';
export function sessionToken(): string | null {
    try { const user = JSON.parse(localStorage.getItem('dormfixUser') || 'null'); return typeof user?.accessToken === 'string' ? user.accessToken : null; }
    catch { return null; }
}
export async function sessionFetch(input: string | URL, init: RequestInit = {}) {
    const url = new URL(input, window.location.origin);
    const headers = new Headers(init.headers);
    const token = sessionToken();
    const privateApi = url.origin === api.origin && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/'));
    if (privateApi && token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(input, { ...init, headers });
    const sentToken = headers.get('Authorization')?.replace(/^Bearer /, '');
    if (privateApi && response.status === 401 && sentToken) window.dispatchEvent(new CustomEvent(sessionExpiredEvent, { detail: { token: sentToken } }));
    return response;
}
export function isPrivateReceipt(src: string) {
    try { const url = new URL(src, window.location.origin); return url.origin === api.origin && url.pathname.startsWith('/uploads/'); }
    catch { return false; }
}
