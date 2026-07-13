import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalToolUrl,
  categoryCapabilityDescription,
  readStoredList,
  requiredVendor,
  sanitizeToolSlugs,
  splitGraphemes,
  textStatistics,
  toolSeo,
  writeStoredList,
} from '../../assets/js/batch5-tools.js';
import { categories, tools } from '../../assets/js/tools-data.js';

test('visible character statistics count graphemes, combining marks, CRLF and Azerbaijani text', () => {
  assert.equal(textStatistics('👩‍💻').characters, 1);
  assert.equal(textStatistics('👍🏽').characters, 1);
  assert.equal(textStatistics('e\u0301').characters, 1);
  assert.equal(textStatistics('a\r\nb').characters, 3);
  assert.equal(textStatistics('a\r\nb').charactersWithoutWhitespace, 2);
  assert.equal(textStatistics('a\r\nb').lines, 2);
  assert.equal(textStatistics('Azərbaycan').characters, Array.from('Azərbaycan').length);
  assert.deepEqual(textStatistics('Salam dünya.\nİkinci sətir!'), {
    words: 4,
    characters: 26,
    charactersWithoutWhitespace: 23,
    sentences: 2,
    lines: 2,
    readingMinutes: 1,
  });
});

test('documented fallback keeps common joined graphemes together without Intl.Segmenter', () => {
  assert.deepEqual(splitGraphemes('👩‍💻👍🏽e\u0301\r\n', null), ['👩‍💻', '👍🏽', 'é', '\r\n']);
});

test('stored lists reject malformed shapes and storage exceptions, then recover safely', () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  for (const value of ['{', '{}', '"text"', 'null', '42']) {
    values.set('list', value);
    assert.deepEqual(readStoredList(storage, 'list'), []);
  }
  values.set('list', '["json-formatter","unknown",2,"json-formatter","qr-generator"]');
  assert.deepEqual(readStoredList(storage, 'list'), ['json-formatter', 'unknown', 2, 'json-formatter', 'qr-generator']);
  assert.deepEqual(sanitizeToolSlugs(readStoredList(storage, 'list'), tools.map((tool) => tool.slug), 8), ['json-formatter', 'qr-generator']);
  const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.deepEqual(readStoredList(denied, 'list'), []);
  assert.equal(writeStoredList(denied, 'list', []), false);
  assert.equal(writeStoredList(storage, 'list', ['text-counter']), true);
  assert.deepEqual(readStoredList(storage, 'list'), ['text-counter']);
});

test('registry drives counts, capability copy and unique tool SEO metadata', () => {
  assert.equal(categories.reduce((sum, category) => sum + category.count, 0), tools.length);
  for (const category of categories) assert.equal(category.count, tools.filter((tool) => tool.category === category.id).length);
  assert.doesNotMatch(categoryCapabilityDescription('pdf', tools), /sıx/u);
  const splitOnly = tools.filter((tool) => tool.kind === 'pdf-split');
  assert.match(categoryCapabilityDescription('pdf', splitOnly), /ayırın/u);
  assert.doesNotMatch(categoryCapabilityDescription('pdf', splitOnly), /birləşdirin/u);
  const metadata = tools.map(toolSeo);
  assert.equal(new Set(metadata.map((entry) => entry.title)).size, tools.length);
  assert.equal(new Set(metadata.map((entry) => entry.description)).size, tools.length);
  for (const [index, tool] of tools.entries()) {
    assert.match(metadata[index].title, new RegExp(tool.name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
    assert.match(metadata[index].description, new RegExp(tool.description.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
    assert.equal(canonicalToolUrl('https://example.test/base/tool/?utm=x#part', tool.slug), `https://example.test/base/tool/?slug=${encodeURIComponent(tool.slug)}`);
  }
});

test('vendor contract loads only the dependency required by the current tool kind', () => {
  assert.deepEqual(requiredVendor('pdf-split'), { global: 'PDFLib', file: 'pdf-lib.min.js', label: 'PDF mühərriki' });
  assert.deepEqual(requiredVendor('image-pdf'), { global: 'PDFLib', file: 'pdf-lib.min.js', label: 'PDF mühərriki' });
  assert.deepEqual(requiredVendor('qr'), { global: 'QRCode', file: 'qrcode.min.js', label: 'QR mühərriki' });
  for (const kind of ['json', 'text', 'percentage', 'image-clean', 'password']) assert.equal(requiredVendor(kind), null);
});
