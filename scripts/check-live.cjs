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
    const pairs = [
      {id:'iphone', first:'Apple iPhone 16 128GB', second:'Apple iPhone 16 Plus 128GB'},
      {id:'milk', first:'Amul Taaza Toned Milk 1L', second:'Amul Gold Full Cream Milk 1L'},
    ];
    for (const pair of pairs) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.getByLabel('First product', { exact: true }).fill(pair.first);
      if (pair.id === 'milk') assert(await page.getByRole('heading', {name:'Previous comparison', exact:true}).count(), 'Changing the first input must mark the result previous');
      await page.getByLabel('Second product', { exact: true }).fill(pair.second);
      await page.getByRole('button', { name: 'Compare footprints', exact:true }).click();
      await page.waitForFunction(() => !!document.querySelector('.results,.error'), { timeout: 180000 });
      const result = await page.locator('.results,.error').innerText();
      const links = await page.locator('.results a').evaluateAll(elements => elements.map(a => ({label:a.innerText,url:a.href})));
      fs.writeFileSync(`artifacts/live-${pair.id}-result.txt`, result);
      fs.writeFileSync(`artifacts/live-${pair.id}-links.json`, JSON.stringify(links,null,2));
      console.log('LIVE URL: ' + liveUrl + '\nCOMPARISON: ' + pair.first + ' vs ' + pair.second + '\nFULL RESULT:\n' + result + '\nREPORT LINKS:\n' + JSON.stringify(links));
      assert(await page.locator('.results').count(), 'Live comparison unavailable');
      assert.equal(await page.locator('.product-result').count(), 2);
      assert(await page.getByRole('heading',{name:'Your comparison',exact:true}).count());
      if (pair.id === 'iphone') {
        const products = page.locator('.product-result');
        assert.match(await products.nth(0).innerText(), /56\s+kg CO2e/);
        assert.match(await products.nth(1).innerText(), /60\s+kg CO2e/);
        assert.match(result, /Pick Apple iPhone 16 128GB.*4 kg CO2e lower\./);
        assert.equal(links.length, 2);
        for (const link of links) { assert.match(link.url, /^https:\/\/[^/]*apple\.com\//); assert(!link.url.includes('...')); }
      }
      await page.screenshot({ path: `artifacts/live-${pair.id}-desktop.png`, fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `artifacts/live-${pair.id}-mobile.png`, fullPage: true });
    }
    await page.getByLabel('Second product', {exact:true}).fill('Amul Gold Full Cream Milk 2L');
    assert(await page.getByRole('heading',{name:'Previous comparison',exact:true}).count(), 'Changing the second input must mark the result previous');
    await page.screenshot({path:'artifacts/live-previous-comparison.png',fullPage:true});
    assert.deepEqual(errors, []);
    console.log('Both pairs checked on desktop and mobile; both input changes label old results Previous comparison; no browser errors or horizontal overflow.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
