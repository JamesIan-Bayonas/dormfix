import { useCallback, useEffect, useRef, useState } from 'react';
import { ruleService, type HouseRule } from '../../services/ruleService';
import type { RuleFields } from '../../utils/rulesPresentation';
import { useAuth } from '../UserContext';
import { useRooms } from '../../hooks/useRooms';
import { RulesWorkspace } from '../rules/RulesWorkspace';

export function LandlordRules() {
    const { user } = useAuth();
    const { rooms, isLoading: roomsLoading, error: roomsError, refreshRooms } = useRooms(user?.id);
    const [rules, setRules] = useState<HouseRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const readSequence = useRef(0);
    const loadRules = useCallback(async () => {
        if (!user?.id) { setLoading(false); return; }
        const read = ++readSequence.current;
        setLoading(true);
        try {
            const data = await ruleService.getRules(user.id);
            if (!Array.isArray(data)) throw new Error('Invalid rules response.');
            if (read === readSequence.current) { setRules(data); setError(null); }
        } catch { if (read === readSequence.current) setError('House rules could not be loaded. Please try again.'); }
        finally { if (read === readSequence.current) setLoading(false); }
    }, [user?.id]);
    useEffect(() => { void loadRules(); }, [loadRules]);
    async function add(fields: RuleFields) {
        if (!user?.id) return false;
        await ruleService.addRule(user.id, fields.ruleText, fields.roomNumber, fields.category, fields.isPriority);
        // A failed list refresh does not turn a confirmed publication into a failed save.
        await loadRules();
        return true;
    }
    async function remove(id: string) {
        await ruleService.deleteRule(id);
        readSequence.current++; setLoading(false);
        setRules(current => current.filter(rule => rule.id !== id));
        return true;
    }
    return <RulesWorkspace rules={rules} loading={loading} error={error} rooms={rooms} roomsLoading={roomsLoading} roomsError={roomsError} onRetry={loadRules} onRetryRooms={refreshRooms} onAdd={add} onDelete={remove} />;
}
