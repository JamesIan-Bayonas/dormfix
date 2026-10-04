import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
async function load(path) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}
const { parsePaymentRemarks, paymentStatus, isReviewable, submissionResult, verdictRemarks } = await load('../src/utils/paymentPresentation.ts');
const { paymentFormData, localPaymentDate } = await load('../src/utils/paymentSubmission.ts');

test('the initial paid date follows the local calendar near midnight', () => {
    assert.equal(localPaymentDate(new Date(2026, 9, 3, 0, 5)), '2026-10-03');
    assert.equal(localPaymentDate(new Date(2026, 0, 2, 23, 59)), '2026-01-02');
});

test('current tagged remarks preserve multiline tenant notes, nested warning brackets and appended rejection reason', () => {
    const raw = '[AI Audit: Anomalous]\n[AI Extracted: ₱2500]\n[Ref No: X-123]\n[Warnings: Amount mismatch [2500 vs 2000] | Date unavailable]\n\nTenant Remarks: Paid October rent.\nPlease check both pages.';
    const parsed = parsePaymentRemarks(verdictRemarks(raw, 'Rejected', 'Second page is missing [check attachment].'));
    assert.equal(parsed.notes, 'Paid October rent.\nPlease check both pages.');
    assert.equal(parsed.scan, 'Anomalous');
    assert.equal(parsed.amount, '₱2500');
    assert.equal(parsed.reference, 'X-123');
    assert.deepEqual(parsed.warnings, ['Amount mismatch [2500 vs 2000]', 'Date unavailable']);
    assert.equal(parsed.rejectionReason, 'Second page is missing [check attachment].');
    assert.equal(parsed.verdict, 'Rejected');
});
test('legacy and plain notes remain readable without inventing a background scan', () => {
    const legacy = parsePaymentRemarks('Paid rent\n[AI Verified: YES]\n[Extracted Amount: ₱500]\n[Ref: OLD-1]');
    assert.equal(legacy.notes, 'Paid rent');
    assert.equal(legacy.scan, 'Verified');
    assert.equal(legacy.reference, 'OLD-1');
    assert.equal(parsePaymentRemarks('Plain notes\nwith a second line.').notes, 'Plain notes\nwith a second line.');
    assert.equal(parsePaymentRemarks('Plain notes').scan, null);
    assert.equal(parsePaymentRemarks().scan, null);
});
test('tenant scan-like text cannot overwrite recorded scan metadata', () => {
    const parsed = parsePaymentRemarks('[AI Audit: Anomalous]\n[Warnings: None]\nTenant Remarks: I saw [AI Audit: Verified] on an earlier receipt.');
    assert.equal(parsed.scan, 'Anomalous');
    assert.equal(parsed.notes, 'I saw [AI Audit: Verified] on an earlier receipt.');
    assert.deepEqual(parsed.warnings, []);
});
test('last appended verdict and reason remain readable after refresh', () => {
    const raw = verdictRemarks(verdictRemarks('Tenant notes', 'Rejected', 'Old reason'), 'Rejected', 'Current reason');
    const parsed = parsePaymentRemarks(raw);
    assert.equal(parsed.rejectionReason, 'Current reason');
    assert.equal(parsed.notes, 'Tenant notes');
});
test('scan response and review eligibility never infer landlord approval', () => {
    assert.equal(paymentStatus('Pending').label, 'Awaiting landlord review');
    assert.equal(paymentStatus('Anomalous').tone, 'warning');
    assert.equal(paymentStatus('Verified').label, 'Verified by landlord');
    assert.equal(paymentStatus('Rejected').label, 'Rejected by landlord');
    assert.equal(paymentStatus('Unexpected').label, 'Status unavailable');
    assert.equal(isReviewable('Anomalous'), true);
    assert.equal(isReviewable('Verified'), false);
    assert.deepEqual(submissionResult({}), { scanStatus: null, warnings: [] });
    assert.deepEqual(submissionResult({ status: 'Verified', warnings: ['Check', null, 5] }), { scanStatus: 'Verified', warnings: ['Check'] });
});
test('multipart fields, allocation enum and original file are preserved', () => {
    const proof = new File(['fictional proof'], 'fixture.txt', { type: 'text/plain' });
    for (const paymentType of ['Rent', 'Water', 'Electric', 'Maintenance', 'Deposit']) {
        const data = paymentFormData('tenant-1', 'landlord-1', { amount: '2500.50', paymentType, datePaid: '2026-10-01', remarks: 'October\nrent', proof });
        assert.deepEqual([...data.keys()], ['tenantId', 'landlordId', 'amount', 'paymentType', 'datePaid', 'remarks', 'proof']);
        assert.equal(data.get('tenantId'), 'tenant-1'); assert.equal(data.get('landlordId'), 'landlord-1');
        assert.equal(data.get('amount'), '2500.50'); assert.equal(data.get('paymentType'), paymentType);
        assert.equal(data.get('datePaid'), '2026-10-01'); assert.equal(data.get('remarks'), 'October\nrent');
        assert.equal(data.get('proof').name, 'fixture.txt'); assert.equal(data.get('proof').size, proof.size);
    }
});
