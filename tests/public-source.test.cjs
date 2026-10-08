const { test } = require('node:test');
const assert = require('node:assert/strict');
const { build } = require('esbuild');
const fs = require('node:fs');
test('reads actual Apple source figures from a bundled public PDF and refuses private URLs', async () => {
  fs.mkdirSync('artifacts', {recursive:true});
  await build({ entryPoints:['convex/readPublicSource.ts'], bundle:true, platform:'node', format:'cjs', outfile:'artifacts/source-reader.cjs', logLevel:'silent' });
  const { readPublicSource } = require('../artifacts/source-reader.cjs');
  assert.equal(await readPublicSource('https://127.0.0.1/report.pdf'), '');
  assert.equal(await readPublicSource('http://example.org/report.pdf'), '');
  const text = await readPublicSource('https://www.apple.com/ecc-shared/environment/pdf/products/iphone/iPhone_16_and_iPhone_16_Plus_PER_June2025.pdf');
  assert.ok(/56\s*kg\s*CO\s*[₂2]\s*e/i.test(text), 'Original PDF must contain the 56 kg CO2e figure');
  assert.ok(/60\s*kg\s*CO\s*[₂2]\s*e/i.test(text), 'Original PDF must contain the 60 kg CO2e figure');
  console.log('Actual Apple PDF contains 56 and 60 kg CO2e; bundled PDF reader works.');
});
