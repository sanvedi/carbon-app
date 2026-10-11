import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const load = async path => import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8'))).toString('base64')}`);
const { completeSourceUrl } = await load('../convex/sourceDiscovery.ts');
const { pdfPageText } = await load('../convex/pdfText.ts');
test('shortened, private and unsafe report links are never treated as evidence', () => {
  for (const url of ['https://www.apple.com/.../report.pdf', 'https://www.apple.com/…/report.pdf', 'http://apple.com/report.pdf', 'https://127.0.0.1/report.pdf', 'https://user:password@apple.com/report.pdf']) assert.equal(completeSourceUrl(url), null);
  assert.equal(completeSourceUrl('https://www.apple.com/environment/report.pdf?utm_source=openai'), 'https://www.apple.com/environment/report.pdf');
});
test('PDF table columns stay together, including subscript CO2e glyphs', () => {
  const item = (str, x, y, width, font = 6.5) => ({str, width, transform:[font,0,0,font,x,y]});
  // Positions and text from Apple's actual page 10 total-footprint row.
  const items = [item('Total product footprint',217.8843,618.2882,66.6874), item('56 kg CO',367.2571,619.2882,28.0423), item('2',395.2979,618.7656,2.6043,4.3333), item('e',397.9004,619.2882,3.6205), item('60 kg CO',466.079,619.2882,28.1788), item('2',494.2531,618.7656,2.6043,4.3333), item('e',496.8556,619.2882,3.6205)];
  assert.equal(pdfPageText(items.reverse()), 'Total product footprint | 56 kg CO₂e | 60 kg CO₂e');
});
