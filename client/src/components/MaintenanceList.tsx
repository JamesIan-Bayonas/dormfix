import { useEffect, useState } from 'react';
import { useAuth } from './UserContext';
import type { MaintenanceRequest } from '../types/types';
import { MaintenanceRequests } from './maintenance/MaintenanceRequests';

export function MaintenanceList({ refreshKey = 0 }: { refreshKey?: number }) {
    const { user } = useAuth();
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        if (!user?.id) { setLoading(false); return; }
        let active = true;
        setLoading(true);
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/maintenance/${user.id}`)
            .then(async response => {
                if (!response.ok) throw new Error();
                const data = await response.json();
                if (!Array.isArray(data)) throw new Error();
                if (active) { setRequests(data); setError(null); }
            }).catch(() => { if (active) setError('Maintenance history could not be loaded. Please try again.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [user?.id, retry, refreshKey]);
    return <MaintenanceRequests role="tenant" requests={requests} loading={loading} error={error} onRetry={() => setRetry(current => current + 1)} />;
}
