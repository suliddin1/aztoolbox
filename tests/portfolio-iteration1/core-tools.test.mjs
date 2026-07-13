import assert from 'node:assert/strict';
import test from 'node:test';

import {
  categories,
  findToolSearchTargets,
  migrateToolReferences,
  migrateToolSlugs,
  resolveToolRoute,
  serializeToolReferences,
  toolLifecycle,
  tools,
  toolUrl,
} from '../../assets/js/tools-data.js';
import { LIMITS, parsePageSelection } from '../../assets/js/tool-guards.js';

const expectedCategoryCounts = Object.freeze({
  pdf: 4,
  image: 7,
  text: 6,
  developer: 8,
  business: 5,
  security: 3,
  az: 2,
});

test('Iteration 1 inventory has 35 unique active tools and registry-derived category counts', () => {
  assert.equal(tools.length, 35);
  assert.equal(new Set(tools.map((tool) => tool.slug)).size, tools.length);
  assert.deepEqual(
    Object.fromEntries(categories.map((category) => [category.id, category.count])),
    expectedCategoryCounts,
  );
  assert.equal(categories.reduce((sum, category) => sum + category.count, 0), tools.length);
  assert.ok(tools.every((tool) => tool.lifecycle === 'active' && tool.indexable && tool.sitemap));
  assert.equal(tools.filter((tool) => tool.kind === 'pdf-organizer').length, 1);
  for (const slug of [
    'pdf-splitter',
    'pdf-page-remover',
    'pdf-page-extractor',
    'slug-generator',
    'lorem-ipsum-generator',
  ]) {
    assert.equal(tools.some((tool) => tool.slug === slug), false, `${slug} must not be active`);
  }
});

test('lifecycle resolver fails closed for active, replaced, removed and invalid routes', () => {
  assert.deepEqual(
    (({ status, canonicalSlug, mode }) => ({ status, canonicalSlug, mode }))(resolveToolRoute('pdf-organizer')),
    { status: 'active', canonicalSlug: 'pdf-organizer', mode: 'split' },
  );
  assert.deepEqual(
    (({ status, canonicalSlug, mode }) => ({ status, canonicalSlug, mode }))(resolveToolRoute('pdf-organizer', 'delete')),
    { status: 'active', canonicalSlug: 'pdf-organizer', mode: 'delete' },
  );

  const aliases = {
    'pdf-splitter': 'split',
    'pdf-page-extractor': 'extract',
    'pdf-page-remover': 'delete',
  };
  for (const [slug, mode] of Object.entries(aliases)) {
    const resolved = resolveToolRoute(slug);
    assert.equal(resolved.status, 'replaced');
    assert.equal(resolved.route.lifecycle, 'replaced');
    assert.equal(resolved.canonicalSlug, 'pdf-organizer');
    assert.equal(resolved.mode, mode);
    assert.equal(resolved.tool.slug, 'pdf-organizer');
    assert.equal(resolved.route.indexable, false);
    assert.equal(resolved.route.sitemap, false);
  }

  for (const slug of ['slug-generator', 'lorem-ipsum-generator']) {
    const resolved = resolveToolRoute(slug);
    assert.equal(resolved.status, 'removed');
    assert.equal(resolved.route.lifecycle, 'removed');
    assert.equal(resolved.route.destination, undefined);
    assert.equal(resolved.route.indexable, false);
    assert.equal(resolved.route.sitemap, false);
  }

  assert.equal(resolveToolRoute('pdf-organizer', 'unknown').status, 'invalid');
  assert.equal(resolveToolRoute('json-formatter', 'split').status, 'invalid');
  assert.equal(resolveToolRoute('pdf-splitter', 'split').status, 'invalid');
  assert.equal(resolveToolRoute('').status, 'not-found');
  assert.equal(resolveToolRoute('does-not-exist').status, 'not-found');
  assert.equal(resolveToolRoute(null).status, 'not-found');
  assert.equal(new Set(toolLifecycle.map((entry) => entry.slug)).size, toolLifecycle.length);
});

test('slug migration is ordered, deduplicated, idempotent and drops removed or unknown tools', () => {
  const source = [
    'pdf-splitter',
    'pdf-page-extractor',
    'json-formatter',
    'pdf-organizer',
    'slug-generator',
    'lorem-ipsum-generator',
    'does-not-exist',
    42,
    'text-counter',
  ];
  const migrated = migrateToolSlugs(source);
  assert.deepEqual(migrated, ['pdf-organizer', 'json-formatter', 'text-counter']);
  assert.deepEqual(migrateToolSlugs(migrated), migrated);
  assert.deepEqual(migrateToolSlugs(source, 2), ['pdf-organizer', 'json-formatter']);
  assert.deepEqual(migrateToolSlugs(null), []);
});

test('stored reference migration preserves a legacy alias mode and remains idempotent', () => {
  const migrated = migrateToolReferences([
    'pdf-page-extractor',
    'pdf-organizer',
    'json-formatter',
    'lorem-ipsum-generator',
  ]);
  assert.deepEqual(migrated, [
    { slug: 'pdf-organizer', mode: 'extract' },
    { slug: 'json-formatter', mode: null },
  ]);
  const serialized = serializeToolReferences(migrated);
  assert.deepEqual(serialized, [{ slug: 'pdf-organizer', mode: 'extract' }, 'json-formatter']);
  assert.deepEqual(migrateToolReferences(serialized), migrated);
  assert.deepEqual(migrateToolReferences([{ slug: 'pdf-organizer', mode: 'delete' }]), [
    { slug: 'pdf-organizer', mode: 'delete' },
  ]);
  assert.deepEqual(migrateToolReferences([{ slug: 'pdf-organizer', mode: 'invalid' }]), []);
});

test('old PDF names and intents search to the organizer with the intended mode', () => {
  const cases = [
    ['PDF splitter', 'split'],
    ['səhifələri ayrıca PDF et', 'split'],
    ['PDF page extractor', 'extract'],
    ['seçilmiş səhifələrdən PDF yarat', 'extract'],
    ['PDF page remover', 'delete'],
    ['səhifələri sil', 'delete'],
  ];
  for (const [query, mode] of cases) {
    const matches = findToolSearchTargets(query);
    assert.equal(matches.length, 1, query);
    assert.equal(matches[0].tool.slug, 'pdf-organizer', query);
    assert.equal(matches[0].mode, mode, query);
    assert.equal(matches[0].matchedAlias.lifecycle, 'replaced', query);
    assert.equal(toolUrl('.', matches[0].tool.slug, matches[0].mode), `./tool/?slug=pdf-organizer&mode=${mode}`);
  }
  assert.deepEqual(findToolSearchTargets('Lorem ipsum'), []);
  assert.deepEqual(findToolSearchTargets('Slug yaradan'), []);
});

test('page selection parser preserves organizer mode semantics and recovers after invalid input', () => {
  assert.deepEqual(
    parsePageSelection('3, 1, 3', 3, { preserveOrder: true, allowDuplicates: true }),
    [2, 0, 2],
  );
  assert.deepEqual(
    parsePageSelection('3, 1, 3', 3, { preserveOrder: false, allowDuplicates: false }),
    [0, 2],
  );
  assert.deepEqual(
    parsePageSelection('2-3, 1', 3, { preserveOrder: true, allowDuplicates: true }),
    [1, 2, 0],
  );

  for (const expression of [
    '',
    '0',
    '-1',
    '3-1',
    '1,nope,3',
    '1,4',
    '1,',
    '1.5',
    '9007199254740993',
  ]) {
    assert.throws(
      () => parsePageSelection(expression, 3, { preserveOrder: true, allowDuplicates: true }),
      { name: 'ToolInputError' },
      expression,
    );
  }

  assert.throws(
    () => parsePageSelection('1'.repeat(LIMITS.pageExpressionChars + 1), 3),
    { name: 'ToolInputError' },
  );
  assert.throws(
    () => parsePageSelection(Array(LIMITS.pageTokens + 1).fill('1').join(','), 3),
    { name: 'ToolInputError' },
  );
  assert.deepEqual(
    parsePageSelection('1, 3', 3, { preserveOrder: true, allowDuplicates: true }),
    [0, 2],
    'a valid expression must work immediately after rejected expressions',
  );
});

test('sitemap lifecycle policy contains active tools only', () => {
  const sitemapSlugs = toolLifecycle.filter((entry) => entry.sitemap).map((entry) => entry.slug);
  assert.deepEqual(sitemapSlugs, tools.map((tool) => tool.slug));
  assert.ok(sitemapSlugs.includes('pdf-organizer'));
  for (const slug of [
    'pdf-splitter',
    'pdf-page-remover',
    'pdf-page-extractor',
    'slug-generator',
    'lorem-ipsum-generator',
  ]) assert.equal(sitemapSlugs.includes(slug), false);
});
