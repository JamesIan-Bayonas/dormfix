import type { HouseRule } from '../services/ruleService';
export const ruleCategories = ['General', 'Safety', 'Noise', 'Guests', 'Cleanliness'] as const;
export interface RuleFields { ruleText: string; roomNumber: string; category: string; isPriority: boolean }
export function isGlobalRule(rule: HouseRule) { return !rule.target_room_number || rule.target_room_number === 'Global'; }
export function ruleScope(rule: HouseRule) { return isGlobalRule(rule) ? 'All rooms' : `Room ${rule.target_room_number}`; }
export function applicableRules(rules: HouseRule[], roomNumber?: string) {
    return rules.filter(rule => isGlobalRule(rule) || rule.target_room_number === roomNumber);
}
export function filterRules(rules: HouseRule[], query = '', scope = 'all', category = 'all', priorityOnly = false) {
    const normalized = query.trim().toLowerCase();
    return rules.filter(rule => (scope === 'all' || (scope === 'Global' ? isGlobalRule(rule) : rule.target_room_number === scope)) &&
        (category === 'all' || (rule.category || 'General') === category) && (!priorityOnly || !!rule.is_priority) &&
        `${rule.rule_text} ${rule.category || 'General'} ${ruleScope(rule)}`.toLowerCase().includes(normalized))
        .sort((a, b) => Number(!!b.is_priority) - Number(!!a.is_priority));
}
