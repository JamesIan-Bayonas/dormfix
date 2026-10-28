/* Isolated receipt history checks: fictional records, no API or financial writes. */
const { chromium } = require(process.env.DORMFIX_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const base = `${process.env.DORMFIX_UI_URL || 'http://localhost:5179'}/tests/fixtures/payments.html`;
        const url = `${base}?bulk=1#/history`;
        const table = page.getByRole('table', { name: 'Payment receipts', exact: true });
        const rows = table.getByRole('row').filter({ has: page.getByRole('button') });
        const type = page.getByLabel('Payment type', { exact: true });
        const status = page.getByLabel('Status', { exact: true });
        const detail = page.getByRole('region', { name: 'Payment proof details', exact: true });
        await page.goto(url);
        await table.waitFor();
        assert.equal(await rows.count(), 5);
        assert.equal(await page.getByText('Page 1 of 5', { exact: true }).count(), 1);
        assert.equal(await page.getByText('Scan warnings', { exact: true }).count(), 0, 'Scan detail is collapsed by default');
        const firstId = await rows.first().getByRole('button').getAttribute('aria-label');
        await page.getByRole('button', { name: 'Next receipts page', exact: true }).click();
        assert.notEqual(await rows.first().getByRole('button').getAttribute('aria-label'), firstId);
        await rows.first().getByRole('button').click();
        await detail.getByRole('heading', { name: 'Tenant notes', exact: true }).waitFor();
        assert.equal(await table.count(), 0, 'Detail replaces the list');
        assert.equal(await page.locator('dialog[open]').count(), 0, 'Details are inline');
        assert.equal(await page.getByRole('heading', { name: 'Your receipts', exact: true }).count(), 0);
        assert.equal(await detail.getByRole('heading', { name: 'Payment proof details', exact: true }).evaluate(el => el === document.activeElement), true);
        await detail.getByRole('button', { name: 'Back to receipts', exact: true }).click();
        assert.equal(await page.getByText('Page 2 of 5', { exact: true }).count(), 1, 'Closing preserves page');
        assert.equal(await rows.first().getByRole('button').evaluate(el => el === document.activeElement), true);
        await page.getByRole('button', { name: 'Next receipts page (bottom)', exact: true }).click();
        assert.equal(await page.getByRole('heading', { name: 'Your receipts', exact: true }).evaluate(el => el === document.activeElement), true);
        assert.equal(await page.getByText('Page 3 of 5', { exact: true }).count(), 1);
        await page.getByRole('button', { name: 'Previous receipts page (bottom)', exact: true }).click();
        for (const [value, label, count] of [['Rent', 'Rent', 5], ['Water', 'Water', 5], ['Electric', 'Electricity', 5], ['Maintenance', 'Maintenance', 4], ['Deposit', 'Deposit', 4]]) {
            await type.selectOption(value);
            assert.equal(await rows.count(), count);
            for (const row of await rows.all()) assert.equal(await row.getByRole('cell').first().innerText(), label);
            assert.equal(await page.getByText('Page 1 of 1', { exact: true }).count(), 1);
        }
        await type.selectOption('Electric');
        await status.selectOption('Verified');
        assert.equal(await rows.count(), 2);
        await rows.first().getByRole('button').click();
        await detail.getByRole('button', { name: 'Back to receipts', exact: true }).click();
        assert.equal(await type.inputValue(), 'Electric');
        assert.equal(await status.inputValue(), 'Verified');
        await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
        await page.getByLabel('Search receipts', { exact: true }).fill('bulk-2');
        assert.equal(await rows.count(), 5); // IDs 2 and 20–23
        await page.getByLabel('Search receipts', { exact: true }).fill('missing-reference');
        await page.getByRole('heading', { name: 'No matching receipts', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Show all receipts', exact: true }).click();
        await page.getByText('Date range & sorting', { exact: true }).click();
        await page.getByLabel('Recorded from', { exact: true }).fill('2026-10-21');
        await page.getByLabel('Recorded to', { exact: true }).fill('2026-10-23');
        assert.equal(await rows.count(), 3);
        await page.getByLabel('Recorded to', { exact: true }).fill('2026-10-01');
        await page.getByText('End date must be on or after the start date.', { exact: true }).waitFor();
        assert.equal(await table.count(), 0);
        await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
        await page.getByLabel('Per page', { exact: true }).selectOption('10');
        assert.equal(await rows.count(), 10);
        await page.getByRole('button', { name: 'Next receipts page', exact: true }).click();
        await page.getByRole('button', { name: 'Next receipts page', exact: true }).click();
        assert.equal(await rows.count(), 3);
        assert.equal(await page.getByRole('button', { name: 'Next receipts page', exact: true }).isDisabled(), true);
        await page.goto(`${base}?bulk=1&receipt=bulk-2#/history`);
        await detail.waitFor();
        await detail.getByRole('heading', { name: 'Scan warnings', exact: true }).waitFor();
        await detail.getByRole('button', { name: 'View receipt', exact: true }).click();
        const imageDialog = page.getByRole('dialog', { name: 'Payment receipt', exact: true });
        await imageDialog.getByRole('img').waitFor();
        await page.keyboard.press('Escape');
        assert.equal(await detail.isVisible(), true);
        await detail.getByRole('button', { name: 'Back to receipts', exact: true }).click();
        await page.goto(`${base}?bulk=1&receipt=bulk-2#/history`);
        await page.reload();
        await detail.waitFor();
        await page.getByLabel('Data state', { exact: true }).selectOption('Read failure');
        await detail.getByRole('heading', { name: 'Receipt unavailable', exact: true }).waitFor();
        await detail.getByRole('button', { name: 'Retry receipt', exact: true }).click();
        await detail.getByRole('heading', { name: 'Scan warnings', exact: true }).waitFor();
        await page.getByLabel('Data state', { exact: true }).selectOption('Empty');
        await detail.getByRole('heading', { name: 'Receipt unavailable', exact: true }).waitFor();
        await detail.getByRole('button', { name: 'Back to receipts', exact: true }).click();
        await page.getByRole('heading', { name: 'No receipts yet', exact: true }).waitFor();
        for (const width of [1440, 768, 390, 320]) {
            await page.setViewportSize({ width, height: 1100 });
            await page.goto(`${base}?bulk=1&preview=1#/history`);
            await page.reload();
            await table.waitFor();
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `History fits ${width}px`);
            if ([1440, 390].includes(width)) await page.screenshot({ path: path.resolve(__dirname, `../../docs/screenshots/tenant-payments-${width === 1440 ? 'desktop' : 'mobile'}.png`), fullPage: true });
            await rows.first().getByRole('button').click();
            assert.equal(await detail.evaluate(el => el.scrollWidth <= el.clientWidth), true, `Details fit ${width}px`);
            assert.equal(await page.locator('dialog[open]').count(), 0);
            if ([1440, 390].includes(width)) {
                await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
                await page.screenshot({ path: path.resolve(__dirname, `../../docs/screenshots/tenant-payment-inline-${width === 1440 ? 'desktop' : 'mobile'}.png`), fullPage: true });
            }
            await detail.getByRole('button', { name: 'Back to receipts', exact: true }).click();
        }
        await page.setViewportSize({ width: 1440, height: 1100 });
        await page.getByRole('button', { name: 'Use dark mode', exact: true }).click();
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.resolve(__dirname, '../../docs/screenshots/tenant-payments-dark.png'), fullPage: true });
        await rows.first().getByRole('button').click();
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
        await page.screenshot({ path: path.resolve(__dirname, '../../docs/screenshots/tenant-payment-inline-dark.png'), fullPage: true });
        await page.goto(base + '#/history');
        await page.getByLabel('Data state', { exact: true }).selectOption('Read failure');
        await page.getByRole('heading', { name: 'Receipts unavailable', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Try again', exact: true }).click();
        await table.waitFor();
        await page.getByLabel('Data state', { exact: true }).selectOption('Empty');
        await page.getByRole('heading', { name: 'No receipts yet', exact: true }).waitFor();
        await page.goto(base + '#/payments');
        await page.reload();
        await table.waitFor();
        assert.equal(await rows.count(), 2, 'Landlord still defaults to pending review');
        assert.deepEqual(errors, []);
        console.log('PASS: inline detail replacement, list/page/filter/focus restoration, missing/error recovery, image viewing, 23-receipt pagination/filtering, responsive themes, and landlord regression.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });


