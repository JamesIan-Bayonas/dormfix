/* Real UI with simulated transport only. No messages are sent to DormFix accounts. */
const { chromium } = require(process.env.DORMFIX_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const url = `${process.env.DORMFIX_UI_URL || 'http://localhost:5179'}/tests/fixtures/messages.html`;
        const contacts = page.getByRole('region', { name: 'Tenant conversations', exact: true });
        const alex = page.locator('[data-contact-id="t1"]');
        const jamie = page.locator('[data-contact-id="t2"]');
        await page.goto(`${url}#/chat`);
        await contacts.getByLabel('Find a tenant', { exact: true }).fill('109');
        assert.equal(await page.locator('[data-contact-id]').count(), 1);
        await contacts.getByLabel('Find a tenant', { exact: true }).fill('nobody');
        await page.getByRole('button', { name: 'Clear search' }).click();
        await alex.click();
        const conversation = page.getByRole('region', { name: 'Conversation with Alex Rivera', exact: true });
        await conversation.getByRole('log').getByText(/History for Alex Rivera/).waitFor();
        await conversation.getByLabel('Message', { exact: true }).fill('Fictional draft\nSecond line');
        await jamie.click();
        await alex.click();
        assert.equal(await conversation.getByLabel('Message', { exact: true }).inputValue(), 'Fictional draft\nSecond line');
        await page.getByRole('button', { name: 'Simulate disconnect', exact: true }).click();
        assert.equal(await conversation.getByRole('button', { name: 'Send message', exact: true }).isDisabled(), true);
        await page.getByRole('button', { name: 'Simulate reconnect', exact: true }).click();
        await conversation.getByRole('button', { name: 'Send message', exact: true }).click();
        await conversation.getByText(/Message submitted to the connection/).waitFor();
        await conversation.getByRole('button', { name: 'Refresh history', exact: true }).click();
        await conversation.getByRole('log').getByText('Fictional draft\nSecond line', { exact: true }).waitFor();
        await page.getByLabel('History failure', { exact: true }).check();
        await conversation.getByRole('button', { name: 'Refresh history', exact: true }).click();
        await conversation.getByRole('button', { name: 'Retry history', exact: true }).waitFor();
        await page.getByLabel('History failure', { exact: true }).uncheck();
        await conversation.getByRole('button', { name: 'Retry history', exact: true }).click();
        await conversation.getByRole('button', { name: 'Retry history', exact: true }).waitFor({ state: 'detached' });
        await page.setViewportSize({ width: 390, height: 900 });
        assert.equal(await contacts.isVisible(), false);
        await conversation.getByRole('button', { name: 'All tenants', exact: true }).click();
        assert.equal(await alex.evaluate(el => el === document.activeElement), true);
        for (const width of [320, 390, 768, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            await page.goto(`${url}?preview=1#/chat`);
            await page.reload();
            await alex.waitFor();
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Inbox fits ${width}px`);
            if (width === 1440) await page.screenshot({ path: path.resolve(__dirname, '../../docs/screenshots/messages-inbox-desktop.png'), fullPage: true });
            await alex.click();
            await conversation.getByRole('log').getByText(/History for Alex Rivera/).waitFor();
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Conversation fits ${width}px`);
            if (width === 390 || width === 1440) {
                await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
                await page.screenshot({ path: path.resolve(__dirname, `../../docs/screenshots/messages-conversation-${width === 390 ? 'mobile' : 'desktop'}.png`), fullPage: true });
            }
        }
        await page.getByRole('button', { name: 'Use dark mode', exact: true }).click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.resolve(__dirname, '../../docs/screenshots/messages-conversation-dark.png'), fullPage: true });
        await page.goto(`${url}?preview=1#/tenant`);
        await page.getByRole('region', { name: 'Conversation with Morgan Reyes', exact: true }).getByRole('log').getByText(/History for Alex Rivera/).waitFor();
        assert.deepEqual(errors, []);
        console.log('PASS: search, selection, draft retention, disconnect/send, history recovery, mobile back/focus, tenant conversation and responsive layouts.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });


