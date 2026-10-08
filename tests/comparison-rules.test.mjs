import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const compiled = stripTypeScriptTypes(readFileSync(new URL('../convex/comparisonRules.ts', import.meta.url), 'utf8'));
const { noData, validateEvidence, recommendation } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const sourceUrl = 'https://example.org/product-report.pdf';
const product = { name: 'Phone A 128GB', status: 'found', kgCO2e: 56, basis: 'One 128GB phone', sourceName: 'Manufacturer report', sourceUrl, sourceFigure: '56 kg CO₂e', excerpt: 'Total product footprint 56 kg CO₂e', boundary: 'Full life cycle', comparisonKey: 'phone-one-device-full-life-cycle-same-method', comparable: true };
test('a number is shown only when a cited source contains its figure and exact excerpt', () => {
  assert.equal(validateEvidence(product, new Set([sourceUrl]), product.excerpt).status, 'found');
  assert.equal(validateEvidence(product, new Set([sourceUrl]), 'Total product footprint 56 kg CO 2 e').status, 'found');
  for (const invalid of [validateEvidence(product, new Set(), product.excerpt), validateEvidence(product, new Set([sourceUrl]), 'No report available'), validateEvidence({...product, kgCO2e: 6}, new Set([sourceUrl]), product.excerpt)]) {
    assert.equal(invalid.status, 'no_data'); assert.equal(invalid.kgCO2e, null);
  }
});
test('missing or incompatible evidence never produces a winner', () => {
  assert.match(recommendation([product, noData('Unknown')]), /cannot recommend/);
  assert.match(recommendation([product, {...product, comparisonKey: 'production-only'}]), /cannot recommend/);
  assert.match(recommendation([product, {...product, comparable: false}]), /cannot recommend/);
});
test('lower comparable figure wins; a tie is explicit', () => {
  assert.match(recommendation([product, {...product, name: 'Phone B', kgCO2e: 60}]), /^Pick Phone A 128GB.*4 kg CO2e lower\.$/);
  assert.match(recommendation([product, product]), /same published estimate/);
});
