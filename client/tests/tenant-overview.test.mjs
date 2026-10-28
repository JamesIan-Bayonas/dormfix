import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/tenantOverview.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { tenantOverview, overviewDate } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const payment = (id, datePaid, status) => ({ id, datePaid, status, amount: 2500, paymentType: 'Rent', proofImage: '' });
const request = (id, dateSubmitted, status) => ({ id, dateSubmitted, status, tenantId: 'fixture', issueType: 'Plumbing', description: 'Fixture', urgency: 'Low' });

test('a newer verified or pending receipt does not revive an older rejection warning', () => {
    for (const status of ['Verified', 'Pending', 'Anomalous']) {
        const result = tenantOverview([payment('old', '2026-10-01', 'Rejected'), payment('new', '2026-10-17', status)], []);
        assert.equal(result.recentPayment.id, 'new');
        assert.equal(result.attentionPayment, null);
    }
    assert.equal(tenantOverview([payment('rejected', '2026-10-17', 'Rejected')], []).attentionPayment.id, 'rejected');
});

test('date-only ties cannot establish the last submission or trigger a rejection warning', () => {
    const sameDay = [payment('rejected', '2026-10-17T00:00:00Z', 'Rejected'), payment('replacement', '2026-10-17', 'Pending')];
    assert.equal(tenantOverview(sameDay, []).sameDateCount, 2);
    assert.equal(tenantOverview(sameDay, []).attentionPayment, null);
    assert.equal(tenantOverview([...sameDay].reverse(), []).attentionPayment, null);
});

test('only active request statuses contribute to counts and recent requests are sorted without changing history', () => {
    const history = [request('closed', '2026-10-17', 'Completed'), request('older', '2026-10-01', 'In Progress'), request('rejected', '2026-10-16', 'Rejected'), request('newer', '2026-10-15', 'Pending')];
    const before = [...history];
    const result = tenantOverview([], history);
    assert.deepEqual(result.active.map(item => item.id), ['newer', 'older']);
    assert.equal(result.pending, 1);
    assert.equal(result.inProgress, 1);
    assert.deepEqual(history, before);
    assert.equal(tenantOverview([], [history[0], history[2]]).active.length, 0);
});

test('missing records and invalid dates do not fabricate recency or an attention requirement', () => {
    const empty = tenantOverview([], []);
    assert.equal(empty.recentPayment, undefined);
    assert.equal(empty.attentionPayment, null);
    assert.equal(empty.active.length, 0);
    const invalid = payment('unknown-date', 'invalid', 'Rejected');
    assert.equal(tenantOverview([invalid], []).attentionPayment, null);
    assert.equal(tenantOverview([invalid, payment('valid', '2026-10-17', 'Pending')], []).recentPayment.id, 'valid');
    assert.equal(overviewDate('invalid'), 'Date unavailable');
});
