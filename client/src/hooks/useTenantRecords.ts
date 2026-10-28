import { useCallback, useEffect, useState } from 'react';

export interface TenantRecords<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    retry: () => void;
}

/** Ignore superseded reads, including a tenant switch or a retry in flight. */
export function useTenantRecords<T>(tenantId: string | undefined, load: (id: string) => Promise<T[]>, failureMessage: string): TenantRecords<T> {
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState<{ owner?: string; revision: number; data: T[]; error: string | null }>({ revision: -1, data: [], error: null });
    const retry = useCallback(() => setRevision(value => value + 1), []);
    useEffect(() => {
        if (!tenantId) return;
        let active = true;
        load(tenantId).then(data => {
            if (!Array.isArray(data)) throw new Error('Invalid records response');
            if (active) setResult({ owner: tenantId, revision, data, error: null });
        }).catch(() => {
            if (active) setResult({ owner: tenantId, revision, data: [], error: failureMessage });
        });
        return () => { active = false; };
    }, [tenantId, revision, load, failureMessage]);
    const current = result.owner === tenantId && result.revision === revision;
    return { data: tenantId && current ? result.data : [], loading: !!tenantId && !current, error: current ? result.error : null, retry };
}
