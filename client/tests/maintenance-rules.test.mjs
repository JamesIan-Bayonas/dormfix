import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
async function load(path) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}
const { maintenanceStatus, nextMaintenanceStatus, urgencyTone, filterMaintenance, replaceMaintenanceStatus, maintenanceBody, issueTypes, urgencyLevels } = await load('../src/utils/maintenancePresentation.ts');
const { applicableRules, filterRules, ruleScope } = await load('../src/utils/rulesPresentation.ts');

test('all recorded maintenance statuses have truthful labels and existing progression', () => {
    assert.deepEqual(['Pending', 'In Progress', 'Completed', 'Rejected'].map(status => maintenanceStatus(status).label), ['Awaiting review', 'In progress', 'Completed', 'Rejected']);
    assert.equal(maintenanceStatus('Unknown').label, 'Status unavailable');
    assert.equal(nextMaintenanceStatus('Pending'), 'In Progress');
    assert.equal(nextMaintenanceStatus('In Progress'), 'Completed');
    assert.equal(nextMaintenanceStatus('Completed'), null);
    assert.equal(nextMaintenanceStatus('Rejected'), null);
    assert.equal(urgencyTone('Emergency'), 'error');
    assert.equal(urgencyTone('High'), 'warning');
    assert.equal(urgencyTone('Low'), 'neutral');
});
test('active, urgency and local search filters exclude finished work without changing records', () => {
    const requests = [
        { id: '1', status: 'Pending', urgency: 'Emergency', issueType: 'Plumbing', tenantName: 'Alex Rivera', roomNumber: '108', description: 'Leaking tap' },
        { id: '2', status: 'In Progress', urgency: 'High', issueType: 'Electrical', tenantName: 'Jamie', roomNumber: '109', description: 'Broken light' },
        { id: '3', status: 'Completed', urgency: 'Emergency', issueType: 'Other', description: 'Done' },
        { id: '4', status: 'Rejected', urgency: 'High', issueType: 'Other', description: 'Rejected' },
    ];
    assert.deepEqual(filterMaintenance(requests, 'active', 'all').map(request => request.id), ['1', '2']);
    assert.deepEqual(filterMaintenance(requests, 'active', 'High', '  LIGHT  ').map(request => request.id), ['2']);
    assert.deepEqual(filterMaintenance(requests, 'all', 'all', '108').map(request => request.id), ['1']);
    assert.deepEqual(filterMaintenance(requests, 'Rejected', 'all').map(request => request.id), ['4']);
    assert.equal(requests[0].status, 'Pending');
});
test('failed update rolls back only that record, preserving another confirmed status and notes', () => {
    const baseline = [{ id: 'a', status: 'Pending', description: 'A' }, { id: 'b', status: 'In Progress', description: 'B' }];
    const firstPending = replaceMaintenanceStatus(baseline, 'a', 'In Progress');
    const secondSaved = replaceMaintenanceStatus(firstPending, 'b', 'Completed');
    const withRefreshedNotes = secondSaved.map(request => request.id === 'a' ? { ...request, adminRemarks: 'Updated note' } : request);
    const recovered = replaceMaintenanceStatus(withRefreshedNotes, 'a', 'Pending');
    assert.equal(recovered[0].status, 'Pending');
    assert.equal(recovered[0].adminRemarks, 'Updated note');
    assert.equal(recovered[1].status, 'Completed');
    assert.equal(recovered[1], withRefreshedNotes[1]);
    assert.equal(baseline[1].status, 'In Progress');
});
test('maintenance body preserves all issue/urgency enum values and the original description', () => {
    assert.deepEqual(issueTypes, ['Plumbing', 'Electrical', 'Appliance', 'Structural', 'Other']);
    assert.deepEqual(urgencyLevels, ['Low', 'Medium', 'High', 'Emergency']);
    for (const issueType of issueTypes) for (const urgency of urgencyLevels) {
        const body = maintenanceBody('fixture-tenant', { issueType, urgency, description: 'First line\nFull details.' });
        assert.deepEqual(Object.keys(body), ['tenantId', 'issueType', 'urgency', 'description']);
        assert.deepEqual(body, { tenantId: 'fixture-tenant', issueType, urgency, description: 'First line\nFull details.' });
    }
});
const rules = [
    { id: 'all', rule_text: 'General instruction', category: 'General', target_room_number: null },
    { id: 'legacy', rule_text: 'Legacy global rule', target_room_number: 'Global' },
    { id: '108', rule_text: 'Keep this exit clear\nDo not block it.', category: 'Safety', target_room_number: '108', is_priority: true },
    { id: '109', rule_text: 'Room 109 only', category: 'Guests', target_room_number: '109', is_priority: true },
    { id: 'no-scope', rule_text: 'Whole dormitory' },
];
test('tenant applicability includes current/legacy global rules and only their own room', () => {
    assert.deepEqual(applicableRules(rules, '108').map(rule => rule.id), ['all', 'legacy', '108', 'no-scope']);
    assert.deepEqual(applicableRules(rules, 'Unassigned').map(rule => rule.id), ['all', 'legacy', 'no-scope']);
    assert.equal(ruleScope(rules[0]), 'All rooms');
    assert.equal(ruleScope(rules[1]), 'All rooms');
    assert.equal(ruleScope(rules[2]), 'Room 108');
});
test('priority ordering is stable, filters combine and multiline rule text remains intact', () => {
    assert.deepEqual(filterRules(rules).map(rule => rule.id), ['108', '109', 'all', 'legacy', 'no-scope']);
    assert.deepEqual(filterRules(rules, '  EXIT ', '108', 'Safety', true).map(rule => rule.id), ['108']);
    assert.deepEqual(filterRules(rules, '', 'Global', 'General').map(rule => rule.id), ['all', 'legacy', 'no-scope']);
    assert.equal(filterRules(rules, '', '108')[0].rule_text, 'Keep this exit clear\nDo not block it.');
    assert.equal(rules[0].id, 'all');
});
