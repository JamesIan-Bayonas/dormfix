import { useCallback, useEffect, useState } from 'react';
import { announcementService, AnnouncementError, type Announcement } from '../services/announcementService';

export function useAnnouncements(user: { id: string; accessToken?: string } | null) {
    const [revision, setRevision] = useState(0);
    const retry = useCallback(() => setRevision(value => value + 1), []);
    const token = user?.accessToken;
    const owner = user?.id;
    const [result, setResult] = useState<{ owner?: string; token?: string; revision: number; data: Announcement[]; error: string | null; needsSignIn: boolean }>({ revision: -1, data: [], error: null, needsSignIn: false });
    useEffect(() => {
        if (!token || !owner) return;
        let active = true;
        announcementService.list(token).then(data => {
            if (!Array.isArray(data)) throw new Error('Announcements returned an unexpected response.');
            if (active) setResult({ owner, token, revision, data, error: null, needsSignIn: false });
        }).catch(error => {
            if (active) setResult({ owner, token, revision, data: [], error: error instanceof Error ? error.message : 'Announcements could not be loaded.', needsSignIn: error instanceof AnnouncementError && error.status === 401 });
        });
        return () => { active = false; };
    }, [owner, token, revision]);
    useEffect(() => {
        window.addEventListener('focus', retry);
        return () => window.removeEventListener('focus', retry);
    }, [retry]);
    const current = result.owner === owner && result.token === token && result.revision === revision;
    return { data: current ? result.data : [], loading: !!token && !!owner && !current,
        error: !token ? 'Sign in again to access announcements securely.' : current ? result.error : null,
        needsSignIn: !token || (current && result.needsSignIn), retry };
}
export type AnnouncementResource = ReturnType<typeof useAnnouncements>;
