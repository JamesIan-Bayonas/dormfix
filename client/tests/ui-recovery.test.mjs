import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/housingLink.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { readHousingLink } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const response = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('a valid housing response retains the linked workflow', async () => {
    assert.equal(await readHousingLink(response(200, { landlordId: 'fixture-landlord', roomNumber: '108' })), true);
});
test('the explicit unlinked response retains the relink workflow', async () => {
    assert.equal(await readHousingLink(response(404, { error: 'Assignment not found', isUnlinked: true })), false);
});
test('server failure cannot become an administrative rejection', async () => {
    await assert.rejects(readHousingLink(response(500, { error: 'Failed to fetch details' })));
    await assert.rejects(readHousingLink(response(500, { isUnlinked: true })));
});
test('unknown failure, invalid JSON and invalid response shapes require recovery', async () => {
    await assert.rejects(readHousingLink(response(404, { error: 'Unknown route' })));
    await assert.rejects(readHousingLink(new Response('gateway failure', { status: 502 })));
    await assert.rejects(readHousingLink(response(200, null)));
    await assert.rejects(readHousingLink(response(200, [])));
});
