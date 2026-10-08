const { chromium } = require('playwright-core');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const liveUrl = 'https://successful-opossum-152.convex.site';
(async () => {
  fs.mkdirSync('artifacts', { recursive: true });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(liveUrl);
    await page.getByRole('heading', { name: 'Two products. A lighter choice.' }).waitFor();
    assert(await page.getByRole('button', { name: 'Compare footprints' }).isDisabled());
    await page.getByLabel('First product', { exact: true }).fill('Apple iPhone 16 128GB');
    await page.getByLabel('Second product', { exact: true }).fill('Apple iPhone 16 Plus 128GB');
    await page.getByRole('button', { name: 'Compare footprints' }).click();
    await page.waitForFunction(() => !!document.querySelector('.results,.error'), { timeout: 130000 });
    const result = await page.locator('.results,.error').innerText();
    fs.writeFileSync('artifacts/live-comparison.txt', result);
    await page.screenshot({ path: 'artifacts/live-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: 'artifacts/live-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('LIVE URL: ' + liveUrl + '\nCOMPARISON: Apple iPhone 16 128GB vs Apple iPhone 16 Plus 128GB\nFULL RESULT:\n' + result + '\nDesktop and mobile opened; no browser errors or horizontal overflow.');
    if (process.argv.includes('--require-comparison')) assert(await page.locator('.results').count(), 'Live AI comparison unavailable');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
