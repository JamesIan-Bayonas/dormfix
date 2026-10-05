import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../public/appearance.js', import.meta.url), 'utf8');
function page({ saved = null, dark = false, unavailable = false, writeUnavailable = false } = {}) {
    const handlers = {};
    const media = { matches: dark, addEventListener: (_, callback) => { handlers.system = callback; } };
    const writes = [];
    const root = { dataset: {}, style: {} };
    const window = {
        matchMedia: () => media,
        localStorage: {
            getItem: () => { if (unavailable) throw new Error('Blocked'); return saved; },
            setItem: (key, value) => { if (unavailable || writeUnavailable) throw new Error('Blocked'); writes.push([key, value]); },
        },
        addEventListener: (event, callback) => { handlers[event] = callback; },
    };
    runInNewContext(source, { window, document: { documentElement: root } });
    return { store: window.DormFixAppearance, root, writes, handlers, media };
}
test('first paint defaults to Light even when device prefers Dark', () => {
    const p = page({ dark: true });
    assert.equal(p.root.dataset.theme, 'dormfix-light');
    assert.equal(p.root.style.colorScheme, 'light');
    assert.equal(p.writes.length, 0);
});
test('saved explicit choice resolves before React and follows its own native scheme', () => {
    const p = page({ saved: 'dark' });
    assert.equal(p.store.getPreference(), 'dark');
    assert.equal(p.root.dataset.theme, 'dormfix-dark');
    assert.equal(p.root.style.colorScheme, 'dark');
});
test('legacy System migrates once to the current device appearance', () => {
    for (const dark of [false, true]) {
        const p = page({ saved: 'system', dark });
        const expected = dark ? 'dark' : 'light';
        assert.equal(p.store.getPreference(), expected);
        assert.equal(p.root.dataset.theme, `dormfix-${expected}`);
        assert.deepEqual(p.writes, [['dormfix-appearance', expected]]);
        p.media.matches = !dark;
        assert.equal(p.handlers.system, undefined);
        assert.equal(p.root.dataset.theme, `dormfix-${expected}`);
        p.store.setPreference('system');
        assert.equal(p.store.getPreference(), expected);
    }
});

test('legacy migration remains explicit when storage writes are blocked', () => {
    const p = page({ saved: 'system', dark: true, writeUnavailable: true });
    assert.equal(p.store.getPreference(), 'dark');
    assert.equal(p.root.dataset.theme, 'dormfix-dark');
    p.store.setPreference('light');
    assert.equal(p.root.dataset.theme, 'dormfix-light');
});

test('legacy cross-tab System resolves once without writing back', () => {
    const p = page({ dark: true });
    p.handlers.storage({ key: 'dormfix-appearance', newValue: 'system' });
    assert.equal(p.store.getPreference(), 'dark');
    assert.equal(p.root.dataset.theme, 'dormfix-dark');
    assert.equal(p.writes.length, 0);
});
test('blocked storage leaves theme switching available for the document', () => {
    const p = page({ unavailable: true });
    p.store.setPreference('dark');
    assert.equal(p.root.dataset.theme, 'dormfix-dark');
    assert.equal(p.store.getPreference(), 'dark');
});
test('invalid saved and incoming preferences cannot create an unsupported theme', () => {
    const p = page({ saved: 'unknown' });
    p.store.setPreference('unknown');
    p.handlers.storage({ key: 'dormfix-appearance', newValue: 'unknown' });
    assert.equal(p.root.dataset.theme, 'dormfix-light');
    assert.equal(p.writes.length, 0);
});
test('cross-tab preference and removal synchronize without reloading or writing back', () => {
    const p = page();
    p.handlers.storage({ key: 'dormfix-appearance', newValue: 'dark' });
    assert.equal(p.root.dataset.theme, 'dormfix-dark');
    p.handlers.storage({ key: 'dormfix-appearance', newValue: null });
    assert.equal(p.root.dataset.theme, 'dormfix-light');
    p.handlers.storage({ key: 'token', newValue: 'dark' });
    assert.equal(p.root.dataset.theme, 'dormfix-light');
    assert.equal(p.writes.length, 0);
});
test('subscribers receive choices and cleanup prevents stale component notifications', () => {
    const p = page(); let updates = 0;
    const unsubscribe = p.store.subscribe(() => updates++);
    p.store.setPreference('dark'); unsubscribe(); p.store.setPreference('light');
    assert.equal(updates, 1);
});
test('another storage area cannot change local appearance', () => {
    const p = page();
    p.handlers.storage({ key: 'dormfix-appearance', newValue: 'dark', storageArea: {} });
    assert.equal(p.root.dataset.theme, 'dormfix-light');
});
