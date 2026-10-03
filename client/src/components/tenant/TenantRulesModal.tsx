import React, { useEffect, useState } from 'react';
import { ruleService, type HouseRule } from '../../services/ruleService';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ErrorState, EmptyState, LoadingState } from '../ui/Feedback';
import { StatusBadge } from '../ui/StatusBadge';

interface Props { isOpen: boolean; onClose: () => void; landlordId: string; roomNumber?: string }
export const TenantRulesModal: React.FC<Props> = ({ isOpen, onClose, landlordId, roomNumber }) => {
    const [rules, setRules] = useState<HouseRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        if (!isOpen || !landlordId) return;
        let active = true;
        setIsLoading(true);
        ruleService.getRules(landlordId).then(data => {
            if (!active) return;
            const applicable = data.filter(rule => !rule.target_room_number || rule.target_room_number === 'Global' || rule.target_room_number === roomNumber);
            applicable.sort((a,b) => Number(!!b.is_priority) - Number(!!a.is_priority));
            setRules(applicable); setError(null);
        }).catch(() => { if (active) setError('House rules could not be loaded. Please try again.'); })
          .finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, [isOpen, landlordId, roomNumber, retry]);
    return (
        <Dialog open={isOpen} onClose={onClose} title="House rules" description="Rules that apply to your dormitory and room.">
            {isLoading ? <LoadingState>Loading house rules…</LoadingState> : error ? <ErrorState title="House rules unavailable" description={error} action={<Button variant="secondary" onClick={() => setRetry(value => value + 1)}>Try again</Button>} /> : rules.length === 0 ? <EmptyState title="No rules published" description="Your landlord has not published rules for your room or dormitory." /> : rules.map((rule,index) => (
                <article key={rule.id || index} className="df-panel space-y-3">
                    <div className="flex flex-wrap gap-2"><StatusBadge tone={rule.is_priority ? 'warning' : 'neutral'}>{rule.category || 'General'}</StatusBadge><StatusBadge>{rule.target_room_number && rule.target_room_number !== 'Global' ? `Room ${rule.target_room_number}` : 'All rooms'}</StatusBadge></div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{rule.rule_text}</p>
                    {rule.is_priority && <p className="text-sm font-semibold text-warning">Priority rule</p>}
                </article>
            ))}
            <div className="flex justify-end"><Button onClick={onClose}>Close</Button></div>
        </Dialog>
    );
};
