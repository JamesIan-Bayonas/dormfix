import { useId, useState } from 'react';
import { Search } from 'lucide-react';
import type { HouseRule } from '../../services/ruleService';
import { filterRules, ruleCategories, ruleScope, isGlobalRule } from '../../utils/rulesPresentation';
import { Button } from '../ui/Button';
import { FormField, Input, Select } from '../ui/FormField';
import { EmptyState, ErrorState, LoadingState } from '../ui/Feedback';
import { StatusBadge } from '../ui/StatusBadge';
import { Panel } from '../ui/Layout';

interface Props { rules: HouseRule[]; loading: boolean; error: string | null; onRetry: () => void; landlord?: boolean; onDelete?: (rule: HouseRule) => void; busy?: Record<string, boolean> }
export function RulesCollection({ rules, loading, error, onRetry, landlord = false, onDelete, busy = {} }: Props) {
    const [query, setQuery] = useState('');
    const [scope, setScope] = useState('all');
    const [category, setCategory] = useState('all');
    const [priority, setPriority] = useState(false);
    const priorityId = useId();
    const scopes = [...new Set(rules.filter(rule => !isGlobalRule(rule)).map(rule => rule.target_room_number!))];
    const visible = filterRules(rules, query, scope, category, priority);
    const filters = <div className="space-y-4">
        <FormField label="Find a rule">{field => <Input {...field} type="search" leadingIcon={<Search size={18} />} value={query} onChange={event => setQuery(event.target.value)} />}</FormField>
        <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Rule scope">{field => <Select {...field} value={scope} onChange={event => setScope(event.target.value)}><option value="all">All applicable scopes</option><option value="Global">All rooms</option>{scope !== 'all' && scope !== 'Global' && !scopes.includes(scope) && <option value={scope}>Room {scope} — no rules</option>}{scopes.map(value => <option key={value} value={value}>Room {value}</option>)}</Select>}</FormField>
            <FormField label="Rule category">{field => <Select {...field} value={category} onChange={event => setCategory(event.target.value)}><option value="all">All categories</option>{ruleCategories.map(value => <option key={value}>{value}</option>)}</Select>}</FormField>
        </div>
        <label htmlFor={priorityId} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input id={priorityId} type="checkbox" className="h-5 w-5 shrink-0 accent-primary" checked={priority} onChange={event => setPriority(event.target.checked)} />Priority rules only</label>
    </div>;
    return <section className="space-y-4" aria-label={landlord ? 'Published rules' : 'Applicable house rules'}>
        {landlord && <h2 className="df-section-title">Published rules</h2>}
        {landlord ? filters : <details className="rounded-control border border-divider px-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold leading-11">Find or filter rules</summary><div className="pb-3 pt-2">{filters}</div></details>}
        {loading ? <LoadingState>Loading house rules…</LoadingState> : error ? <ErrorState title="House rules unavailable" description={error} action={<Button variant="secondary" onClick={onRetry}>Try again</Button>} /> : !rules.length ? <EmptyState title="No rules published" description={landlord ? 'Publish a rule to make it available to tenants in the selected scope.' : 'Your landlord has not published rules for your dormitory or room.'} /> : !visible.length ? <EmptyState title="No matching rules" description="Try another scope or category, or clear the filters." action={<Button variant="secondary" onClick={() => { setQuery(''); setScope('all'); setCategory('all'); setPriority(false); }}>Clear filters</Button>} /> : <>
            <p className="text-sm text-muted">{visible.length} of {rules.length} rules · Priority rules first</p>
            {visible.map(rule => <Panel key={rule.id} className="space-y-3 break-words" aria-label={`Rule ${rule.id}`}>
                <div className="flex flex-wrap gap-2"><StatusBadge>{rule.category || 'General'}</StatusBadge><StatusBadge tone="info">{ruleScope(rule)}</StatusBadge>{rule.is_priority && <StatusBadge tone="warning">Priority rule</StatusBadge>}</div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{rule.rule_text}</p>
                {landlord && onDelete && <Button variant="quiet" className="text-error" disabled={busy[rule.id]} onClick={() => onDelete(rule)}>Delete rule</Button>}
            </Panel>)}
        </>}
    </section>;
}
