/* Isolated UI verification. Run against Vite; fictional callbacks never reach the API. */
const { chromium } = require(process.env.DORMFIX_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const directory = path.resolve(__dirname, '../../docs/screenshots');
        fs.mkdirSync(directory, { recursive: true });
        await page.goto(`${process.env.DORMFIX_UI_URL || 'http://localhost:5179'}/tests/fixtures/tenants.html#/tenants`);
        const ethan = page.getByRole('listitem', { name: 'Tenant Ethan Flores (Demo)', exact: true });
        await ethan.waitFor();
        await page.screenshot({ path: path.join(directory, 'tenant-directory-desktop.png'), fullPage: true });
        await ethan.getByRole('button', { name: 'Remove tenant: Ethan Flores (Demo)', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: 'Remove tenant?', exact: true });
        await dialog.waitFor();
        assert.equal(await dialog.getByRole('button', { name: 'Cancel', exact: true }).evaluate(el => el === document.activeElement), true);
        assert.match(await dialog.innerText(), /payment records for this dormitory/);
        await page.screenshot({ path: path.join(directory, 'tenant-remove-confirmation.png'), fullPage: true });
        await page.keyboard.press('Escape');
        assert.equal(await page.getByText('Removal calls: 0', { exact: true }).count(), 1);
        assert.equal(await ethan.getByRole('button', { name: 'Remove tenant: Ethan Flores (Demo)', exact: true }).evaluate(el => el === document.activeElement), true);
        await page.getByLabel('Simulate removal failure').check();
        await ethan.getByRole('button', { name: 'Remove tenant: Ethan Flores (Demo)', exact: true }).click();
        await dialog.getByRole('button', { name: 'Remove tenant', exact: true }).click();
        await page.keyboard.press('Escape');
        assert.equal(await dialog.isVisible(), true, 'Cannot dismiss while saving');
        await dialog.getByRole('alert').waitFor();
        assert.equal(await ethan.count(), 1, 'Failed removal retains tenant');
        await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
        await page.getByLabel('Simulate removal failure').uncheck();
        await ethan.getByRole('button', { name: 'Remove tenant: Ethan Flores (Demo)', exact: true }).click();
        await dialog.getByRole('button', { name: 'Remove tenant', exact: true }).click();
        await ethan.waitFor({ state: 'detached' });
        assert.equal(await page.getByText('Removal calls: 2', { exact: true }).count(), 1);
        await page.reload();
        await page.getByLabel('Find tenant', { exact: true }).fill('204');
        assert.equal(await page.locator('li[aria-label^="Tenant "]').count(), 2);
        await page.getByLabel('Find tenant', { exact: true }).fill('');
        await page.getByLabel('Show tenants', { exact: true }).selectOption('unassigned');
        await page.getByRole('button', { name: 'Assign room', exact: true }).click();
        const assign = page.getByRole('dialog', { name: 'Assign room', exact: true });
        await assign.getByLabel('Available room', { exact: true }).selectOption('206');
        await assign.getByRole('button', { name: 'Assign room', exact: true }).click();
        await assign.waitFor({ state: 'hidden' });
        await page.getByLabel('Show tenants', { exact: true }).selectOption('all');
        await page.getByRole('listitem', { name: 'Tenant Jamie Santos', exact: true }).getByText('Room 206', { exact: true }).waitFor();
        for (const width of [768, 390, 320]) {
            await page.setViewportSize({ width, height: 900 });
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Directory fits ${width}px`);
            await page.getByRole('button', { name: 'Remove tenant: Ethan Flores (Demo)', exact: true }).click();
            assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth), true, `Dialog fits ${width}px`);
            await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
        }
        await page.setViewportSize({ width: 390, height: 900 });
        await page.reload();
        await ethan.waitFor();
        await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0); });
        await page.screenshot({ path: path.join(directory, 'tenant-directory-mobile.png'), fullPage: true });
        await page.setViewportSize({ width: 1440, height: 1100 });
        await page.reload();
        await ethan.waitFor();
        await page.getByRole('button', { name: 'Use dark mode', exact: true }).click();
        await page.waitForTimeout(300); // Allow the shared appearance transition to finish before capture.
        await page.screenshot({ path: path.join(directory, 'tenant-directory-dark.png'), fullPage: true });
        assert.deepEqual(errors, []);
        console.log('PASS: confirmation, cancel/focus, failure recovery, busy guard, successful removal, search, assignment, responsive layouts, and no runtime errors.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });



