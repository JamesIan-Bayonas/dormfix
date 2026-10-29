import { useEffect, useState } from 'react';
import { ruleService, type HouseRule } from '../../services/ruleService';
import { applicableRules } from '../../utils/rulesPresentation';
import { RulesCollection } from '../rules/RulesCollection';

interface Props { landlordId: string; roomNumber?: string }
export function TenantRules({ landlordId, roomNumber }: Props) {
    const [rules, setRules] = useState<HouseRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        if (!landlordId) { setLoading(false); setError('Landlord details are unavailable. Return home and refresh.'); return; }
        let active = true;
        setLoading(true);
        ruleService.getRules(landlordId).then(data => {
            if (!Array.isArray(data)) throw new Error('Invalid rules response.');
            if (active) { setRules(applicableRules(data, roomNumber)); setError(null); }
        }).catch(() => { if (active) setError('House rules could not be loaded. Please try again.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [landlordId, roomNumber, retry]);
    return <RulesCollection rules={rules} loading={loading} error={error} onRetry={() => setRetry(current => current + 1)} />;
}
