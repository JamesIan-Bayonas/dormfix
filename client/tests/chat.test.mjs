import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/utils/chatPresentation.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { chatMessage, mergeChatMessages, chatBody, presenceLabel } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const scope = { roomId: 'l-t1', userId: 'l', peerId: 't1', role: 'landlord' };
const message = { id: 'm1', senderId: 't1', role: 'tenant', text: 'First line\nLast line', timestamp: '2026-10-03T01:00:00Z' };
test('landlord drops other tenants and does not guess the room of an own echo', () => {
    assert.equal(chatMessage({ ...message, senderId: 't2' }, scope, false), null);
    assert.equal(chatMessage({ ...message, roomId: 'l-t2' }, scope, false), null);
    assert.equal(chatMessage({ ...message, senderId: 'l', role: 'landlord' }, scope, false), null);
    assert.equal(chatMessage({ ...message, senderId: 'l', role: 'landlord', roomId: scope.roomId }, scope, false).senderId, 'l');
    assert.equal(chatMessage({ ...message, senderId: 'l', senderRole: 'landlord', roomId: scope.roomId }, scope, true).recorded, true);
});
test('tenant accepts only its landlord or its own sender with matching role', () => {
    const tenant = { ...scope, userId: 't1', peerId: 'l', role: 'tenant' };
    assert.equal(chatMessage(message, tenant, false).senderId, 't1');
    assert.equal(chatMessage({ ...message, senderId: 'l', role: 'landlord' }, tenant, false).senderId, 'l');
    assert.equal(chatMessage({ ...message, senderId: 't2' }, tenant, false), null);
    assert.equal(chatMessage({ ...message, senderId: 'l', role: 'tenant' }, tenant, false), null);
});
test('history merges live messages, de-duplicates IDs and keeps evidence of persistence', () => {
    const live = chatMessage(message, scope, false);
    const recorded = chatMessage({ ...message, senderRole: 'tenant', roomId: scope.roomId }, scope, true);
    const later = chatMessage({ ...message, id: 'm2', timestamp: '2026-10-03T01:01:00Z' }, scope, false);
    const merged = mergeChatMessages([later, live], [recorded]);
    assert.deepEqual(merged.map(item => item.id), ['m1', 'm2']);
    assert.equal(merged[0].recorded, true);
    assert.equal(merged[1].recorded, false);
    assert.equal(mergeChatMessages(merged, [live])[0].recorded, true);
});
test('malformed messages are ignored; missing timestamps are not invented', () => {
    assert.equal(chatMessage(null, scope, false), null);
    assert.equal(chatMessage({ ...message, id: undefined }, scope, false), null);
    assert.equal(chatMessage({ ...message, text: 123 }, scope, false), null);
    assert.equal(chatMessage({ ...message, timestamp: 'bad date' }, scope, false).timestamp, null);
    assert.equal(chatMessage(message, scope, false).text, 'First line\nLast line');
});
test('both send bodies retain the existing role-specific contract', () => {
    assert.deepEqual(chatBody(scope, '  Hello\nthere  ', 12), { roomId: 'l-t1', senderId: 'l', recipientId: 't1', role: 'landlord', text: 'Hello\nthere' });
    assert.deepEqual(chatBody({ ...scope, userId: 't1', peerId: 'l', role: 'tenant' }, ' Hello ', 12), { roomId: 'l-t1', senderId: 't1', role: 'tenant', text: 'Hello', tempId: 12 });
});
test('missing and invalid presence remains unavailable, never inferred from account creation', () => {
    assert.equal(presenceLabel(null, null), 'Presence unavailable');
    assert.equal(presenceLabel(null, 'bad date'), 'Presence unavailable');
    assert.equal(presenceLabel(false, null), 'Offline · last seen unavailable');
    assert.equal(presenceLabel(true, null), 'Online');
    assert.match(presenceLabel(null, '2026-10-03T01:00:00Z'), /^Last seen /);
});
