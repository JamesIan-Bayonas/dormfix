const { chromium } = require(process.env.DORMFIX_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
        const page = await context.newPage();
        const base = process.env.DORMFIX_UI_URL || 'http://localhost:5179';
        const dark = page.getByRole('button', { name: 'Use dark mode', exact: true });
        const light = page.getByRole('button', { name: 'Use light mode', exact: true });
        await page.goto(base);
        await dark.click();
        assert.equal(await dark.count(), 0);
        assert.equal(await light.count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dormfix-dark');
        await page.reload();
        await light.waitFor();
        await page.screenshot({ path: path.resolve(__dirname, '../../docs/screenshots/appearance-buttons-login.png'), fullPage: true });
        const other = await context.newPage();
        await other.goto(`${base}/tests/fixtures/appearance.html`);
        await page.bringToFront();
        await light.focus();
        await page.keyboard.press('Enter');
        await other.getByRole('button', { name: 'Use dark mode', exact: true }).waitFor();
        await other.waitForFunction(() => document.documentElement.dataset.theme === 'dormfix-light');
        await dark.focus();
        await page.keyboard.press('Space');
        await light.waitFor();
        for (const route of ['/', '/tests/fixtures/payments.html?preview=1#/history', '/tests/fixtures/messages.html?preview=1#/chat']) {
            for (const width of [320, 390, 1440]) {
                await page.setViewportSize({ width, height: 1000 });
                await page.goto(base + route);
                await light.waitFor();
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${route} fits ${width}`);
            }
        }
        console.log('PASS: single appearance button, alternating theme actions, keyboard, persistence, cross-tab sync and responsive headers.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
