/* Shared shell with fictional data only; no account or server writes. */
const { chromium } = require(process.env.DORMFIX_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const base = process.env.DORMFIX_UI_URL || 'http://localhost:5179';
        const url = `${base}/tests/fixtures/workspace.html?role=tenant&preview=1`;
        const sidebar = page.getByRole('complementary', { name: 'Tenant workspace', exact: true });
        const menu = page.getByRole('button', { name: 'Open navigation', exact: true });
        const drawer = page.getByRole('dialog', { name: 'Navigation', exact: true });
        await page.goto(url + '#/');
        await sidebar.waitFor();
        assert.equal(await sidebar.getByRole('navigation').getByRole('link').count(), 5);
        assert.equal(await sidebar.getByRole('link', { name: 'Tenants', exact: true }).count(), 0);
        assert.equal(await menu.isVisible(), false);
        assert.equal(await sidebar.getByRole('link', { name: 'Home', exact: true }).getAttribute('aria-current'), 'page');
        await sidebar.getByRole('link', { name: 'Payments', exact: true }).click();
        await page.waitForFunction(() => document.activeElement?.id === 'workspace-main');
        for (const [route, label] of [['history', 'Payments'], ['pay', 'Payments'], ['report', 'Maintenance'], ['chat', 'Messages'], ['announcements', 'Announcements']]) {
            await page.goto(url + '#/' + route);
            assert.equal(await sidebar.getByRole('link', { name: label, exact: true }).getAttribute('aria-current'), 'page');
        }
        await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
        await page.getByRole('dialog', { name: 'Edit profile fixture', exact: true }).waitFor();
        await page.keyboard.press('Escape');
        for (const width of [320, 390, 768]) {
            await page.setViewportSize({ width, height: 900 });
            assert.equal(await sidebar.isVisible(), false);
            await menu.click();
            await drawer.waitFor();
            assert.equal(await drawer.getByRole('navigation', { name: 'Tenant navigation', exact: true }).getByRole('link').count(), 5);
            assert.equal(await drawer.evaluate(el => el.scrollWidth <= el.clientWidth), true);
            await page.keyboard.press('Escape');
            assert.equal(await menu.evaluate(el => el === document.activeElement), true);
            await menu.click();
            await drawer.getByRole('link', { name: 'Home', exact: true }).click();
            await drawer.waitFor({ state: 'hidden' });
            await page.waitForFunction(() => document.activeElement?.id === 'workspace-main');
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
            await menu.click();
            await drawer.getByRole('button', { name: 'Sign out', exact: true }).click();
            await page.getByRole('dialog', { name: 'Sign out fixture — no session exists', exact: true }).waitFor();
            await page.keyboard.press('Escape');
            await page.keyboard.press('Escape');
            await page.goto(url + '#/announcements');
        }
        await menu.click();
        await page.setViewportSize({ width: 1440, height: 1000 });
        await drawer.waitFor({ state: 'hidden' });
        await page.goto(`${base}/tests/fixtures/messages.html?role=tenant&preview=1#/chat`);
        await page.getByRole('log').getByText(/History for Alex Rivera/).waitFor();
        const sizing = await page.getByRole('region', { name: 'Conversation with Morgan Reyes', exact: true }).evaluate(el => {
            const main = document.getElementById('workspace-main');
            const style = getComputedStyle(main);
            return { actual: el.getBoundingClientRect().width, available: main.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) };
        });
        assert.ok(Math.abs(sizing.actual - sizing.available) < 2, 'Tenant conversation fills the content width');
        await page.screenshot({ path: path.resolve(__dirname, '../../docs/screenshots/tenant-sidebar-desktop.png'), fullPage: true });
        await page.getByRole('button', { name: 'Use dark mode', exact: true }).click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.resolve(__dirname, '../../docs/screenshots/tenant-sidebar-dark.png'), fullPage: true });
        await page.setViewportSize({ width: 390, height: 900 });
        await menu.click();
        await page.screenshot({ path: path.resolve(__dirname, '../../docs/screenshots/tenant-sidebar-mobile.png'), fullPage: true });
        await page.goto(`${base}/tests/fixtures/workspace.html#/`);
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.getByRole('complementary', { name: 'Landlord workspace', exact: true }).getByRole('link', { name: 'Tenants', exact: true }).waitFor();
        assert.deepEqual(errors, []);
        console.log('PASS: tenant desktop/mobile sidebar, five destinations, alias highlights, route focus, Escape, profile/sign-out callbacks, resizing, overflow, and landlord navigation.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

