import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';

import {
  categories,
  findToolSearchTargets,
  migrateToolReferences,
  resolveToolRoute,
  serializeToolReferences,
  toolLifecycle,
  tools,
  toolUrl,
} from '../../assets/js/tools-data.js';
import {
  createSecureToken,
  createSecureTokenBatch,
  createUuidBatch,
  createUuidV4,
  runTextCleanupPipeline,
  textCleanupStats,
  tokenCharacterLength,
  validateIntegerSetting,
} from '../../assets/js/portfolio-iteration2-tools.js';

const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

const expectedCategoryCounts = Object.freeze({
  pdf: 4,
  image: 7,
  text: 4,
  developer: 8,
  business: 5,
  security: 2,
  az: 2,
});

test('Iteration 2 inventory has 32 unique active tools and registry-derived category counts', () => {
  assert.equal(tools.length, 32);
  assert.equal(new Set(tools.map((tool) => tool.slug)).size, tools.length);
  assert.deepEqual(
    Object.fromEntries(categories.map((category) => [category.id, category.count])),
    expectedCategoryCounts,
  );
  assert.equal(categories.reduce((sum, category) => sum + category.count, 0), tools.length);
  assert.ok(tools.every((tool) => tool.lifecycle === 'active' && tool.indexable && tool.sitemap));
  assert.equal(tools.filter((tool) => tool.kind === 'text-cleanup-workspace').length, 1);
  assert.equal(tools.filter((tool) => tool.kind === 'id-token-studio').length, 1);
  for (const slug of [
    'line-sorter',
    'duplicate-line-remover',
    'whitespace-cleaner',
    'uuid-generator',
    'secure-token-generator',
  ]) assert.equal(tools.some((tool) => tool.slug === slug), false, `${slug} must not be active`);
});

test('all five old routes resolve once to their canonical destination and intended mode', () => {
  const aliases = {
    'line-sorter': ['text-cleanup-workspace', 'sort'],
    'duplicate-line-remover': ['text-cleanup-workspace', 'deduplicate'],
    'whitespace-cleaner': ['text-cleanup-workspace', 'whitespace'],
    'uuid-generator': ['id-token-studio', 'uuid'],
    'secure-token-generator': ['id-token-studio', 'token'],
  };

  for (const [slug, [canonicalSlug, mode]] of Object.entries(aliases)) {
    const resolved = resolveToolRoute(slug);
    assert.equal(resolved.status, 'replaced', slug);
    assert.equal(resolved.route.lifecycle, 'replaced', slug);
    assert.equal(resolved.canonicalSlug, canonicalSlug, slug);
    assert.equal(resolved.tool.slug, canonicalSlug, slug);
    assert.equal(resolved.mode, mode, slug);
    assert.equal(resolved.route.indexable, false, slug);
    assert.equal(resolved.route.sitemap, false, slug);
    assert.equal(resolveToolRoute(slug, mode).status, 'invalid', `${slug} must reject an alias mode parameter`);
  }

  assert.deepEqual(
    (({ status, canonicalSlug, mode }) => ({ status, canonicalSlug, mode }))(
      resolveToolRoute('text-cleanup-workspace', 'deduplicate'),
    ),
    { status: 'active', canonicalSlug: 'text-cleanup-workspace', mode: 'deduplicate' },
  );
  assert.deepEqual(
    (({ status, canonicalSlug, mode }) => ({ status, canonicalSlug, mode }))(
      resolveToolRoute('id-token-studio', 'token'),
    ),
    { status: 'active', canonicalSlug: 'id-token-studio', mode: 'token' },
  );
  assert.equal(resolveToolRoute('text-cleanup-workspace', 'token').status, 'invalid');
  assert.equal(resolveToolRoute('id-token-studio', 'sort').status, 'invalid');
  assert.equal(new Set(toolLifecycle.map((entry) => entry.slug)).size, toolLifecycle.length);
});

test('favorites and recent references migrate, preserve first intent, deduplicate and remain idempotent', () => {
  const source = [
    'duplicate-line-remover',
    'line-sorter',
    { slug: 'text-cleanup-workspace', mode: 'whitespace' },
    'uuid-generator',
    'secure-token-generator',
    { slug: 'id-token-studio', mode: 'token' },
    'slug-generator',
    'does-not-exist',
  ];
  const migrated = migrateToolReferences(source);
  assert.deepEqual(migrated, [
    { slug: 'text-cleanup-workspace', mode: 'deduplicate' },
    { slug: 'id-token-studio', mode: 'uuid' },
  ]);
  const serialized = serializeToolReferences(migrated);
  assert.deepEqual(serialized, [
    { slug: 'text-cleanup-workspace', mode: 'deduplicate' },
    { slug: 'id-token-studio', mode: 'uuid' },
  ]);
  assert.deepEqual(migrateToolReferences(serialized), migrated);
  assert.deepEqual(migrateToolReferences(source, 1), [migrated[0]]);
});

test('old names and task phrases search to mode-aware canonical links', () => {
  const cases = [
    ['Line sorter', 'text-cleanup-workspace', 'sort'],
    ['Duplicate line remover', 'text-cleanup-workspace', 'deduplicate'],
    ['Whitespace cleaner', 'text-cleanup-workspace', 'whitespace'],
    ['UUID generator', 'id-token-studio', 'uuid'],
    ['Secure token generator', 'id-token-studio', 'token'],
  ];
  for (const [query, slug, mode] of cases) {
    const matches = findToolSearchTargets(query);
    assert.equal(matches.length, 1, query);
    assert.equal(matches[0].tool.slug, slug, query);
    assert.equal(matches[0].mode, mode, query);
    assert.equal(matches[0].matchedAlias.lifecycle, 'replaced', query);
    assert.equal(toolUrl('.', slug, mode), `./tool/?slug=${slug}&mode=${mode}`);
  }
});

test('the three legacy text defaults remain exact presets', () => {
  const sortInput = 'ş\r\na\r\nə\r\nç';
  const sortLines = ['ş', 'a', 'ə', 'ç'];
  const collator = new Intl.Collator('az');
  const expectedSort = [...sortLines].sort((left, right) => collator.compare(left, right)).join('\n');
  const sorted = runTextCleanupPipeline(sortInput, ['sort'], { newline: 'lf', sortDirection: 'asc' });
  assert.equal(sorted.output, expectedSort);
  assert.equal(sorted.newline, 'lf');

  const deduplicated = runTextCleanupPipeline('A\r\na\nA\r\n\r\n', ['deduplicate'], {
    newline: 'lf',
    caseSensitive: true,
  });
  assert.equal(deduplicated.output, 'A\na\n');
  assert.equal(deduplicated.stats.removedDuplicates, 2);
  assert.deepEqual(deduplicated.stats.before, {
    lineCount: 5,
    nonEmptyLineCount: 3,
    characterCount: 7,
  });
  assert.deepEqual(deduplicated.stats.after, {
    lineCount: 3,
    nonEmptyLineCount: 2,
    characterCount: 4,
  });

  const whitespace = runTextCleanupPipeline('  A\t\t B  \r\n\r\n C  \r\n', ['whitespace'], { newline: 'lf' });
  assert.equal(whitespace.output, 'A B\nC');
});

test('Azerbaijani, Turkish-I, Cyrillic and emoji content is preserved and collated predictably', () => {
  const lines = ['ş', 'ç', 'ö', 'ğ', 'ü', 'ı', 'i', 'İ', 'I', 'ə', 'a', 'б', '👨‍👩‍👧‍👦', '🙂'];
  const collator = new Intl.Collator('az');
  const expected = [...lines].sort((left, right) => collator.compare(left, right)).join('\n');
  assert.equal(
    runTextCleanupPipeline(lines.join('\n'), ['sort'], { newline: 'lf' }).output,
    expected,
  );

  assert.equal(
    runTextCleanupPipeline('İ\nI\nı\ni\nКирил\nКирил\n👩🏽‍💻\n👩🏽‍💻', ['deduplicate'], {
      newline: 'lf',
      caseSensitive: false,
    }).output,
    'İ\nI\nКирил\n👩🏽‍💻',
  );
});

test('newline policy is explicit and whitespace controls are independently configurable', () => {
  assert.equal(
    runTextCleanupPipeline(' A \r\n B ', ['whitespace'], { newline: 'preserve' }).output,
    'A\r\nB',
  );
  assert.equal(
    runTextCleanupPipeline(' A \n B ', ['whitespace'], { newline: 'preserve' }).output,
    'A\nB',
  );
  assert.equal(
    runTextCleanupPipeline(' A \n B ', ['whitespace'], { newline: 'crlf' }).output,
    'A\r\nB',
  );
  assert.equal(
    runTextCleanupPipeline('  A   B  \n\n C ', ['whitespace'], {
      newline: 'lf', trim: false, collapseSpaces: false, removeEmpty: false,
    }).output,
    '  A   B  \n\n C ',
  );
  assert.equal(
    runTextCleanupPipeline('  A   B  \n\n C ', ['whitespace'], {
      newline: 'lf', trim: true, collapseSpaces: false, removeEmpty: false,
    }).output,
    'A   B\n\nC',
  );
  assert.equal(
    runTextCleanupPipeline('A\n \n\nB', ['whitespace'], {
      newline: 'lf', trim: false, collapseSpaces: false, removeEmpty: true,
    }).output,
    'A\nB',
  );
});

test('pipeline order is observable and operation statistics describe the final preview', () => {
  const input = ' A \nA\n A ';
  const dedupeThenClean = runTextCleanupPipeline(input, ['deduplicate', 'whitespace'], {
    newline: 'lf', caseSensitive: true,
  });
  const cleanThenDedupe = runTextCleanupPipeline(input, ['whitespace', 'deduplicate'], {
    newline: 'lf', caseSensitive: true,
  });
  assert.equal(dedupeThenClean.output, 'A\nA');
  assert.equal(cleanThenDedupe.output, 'A');
  assert.equal(dedupeThenClean.stats.removedDuplicates, 1);
  assert.equal(cleanThenDedupe.stats.removedDuplicates, 2);
  assert.deepEqual(textCleanupStats('bir\n\nüç'), {
    lineCount: 3,
    nonEmptyLineCount: 2,
    characterCount: 7,
  });
  assert.deepEqual(textCleanupStats(''), {
    lineCount: 0,
    nonEmptyLineCount: 0,
    characterCount: 0,
  });
});

test('oversized text is rejected atomically and a valid preview works immediately afterward', () => {
  assert.throws(() => runTextCleanupPipeline('x'.repeat(1_000_001), ['whitespace'], { newline: 'lf' }));
  assert.equal(
    runTextCleanupPipeline('  bərpa  edildi  ', ['whitespace'], { newline: 'lf' }).output,
    'bərpa edildi',
  );
});

test('integer settings reject unsafe, fractional and out-of-bound values without poisoning recovery', () => {
  assert.equal(validateIntegerSetting('1', { label: 'Say', min: 1, max: 100 }), 1);
  assert.equal(validateIntegerSetting(100, { label: 'Say', min: 1, max: 100 }), 100);
  for (const value of ['', 0, -1, 1.5, '1.5', 'x', 101, Number.NaN, Number.POSITIVE_INFINITY, '9007199254740993']) {
    assert.throws(
      () => validateIntegerSetting(value, { label: 'Say', min: 1, max: 100 }),
      undefined,
      String(value),
    );
  }
  assert.equal(validateIntegerSetting('7', { label: 'Say', min: 1, max: 100 }), 7);
});

test('UUID generation prefers randomUUID, has a bit-correct WebCrypto fallback and enforces batch bounds', () => {
  let randomUuidCalls = 0;
  const preferred = {
    randomUUID() {
      randomUuidCalls += 1;
      return '123e4567-e89b-42d3-a456-426614174000';
    },
    getRandomValues() { throw new Error('fallback must not run'); },
  };
  assert.equal(createUuidV4(preferred), '123e4567-e89b-42d3-a456-426614174000');
  assert.equal(randomUuidCalls, 1);

  const fallback = {
    getRandomValues(target) {
      target.set(Uint8Array.from({ length: target.length }, (_, index) => index));
      return target;
    },
  };
  assert.equal(createUuidV4(fallback), '00010203-0405-4607-8809-0a0b0c0d0e0f');
  assert.match(createUuidV4(fallback), uuidV4Pattern);
  assert.equal(createUuidBatch('3', webcrypto).length, 3);
  for (const count of [0, -1, 1.5, 51, 101]) assert.throws(() => createUuidBatch(count, webcrypto));
  assert.equal(createUuidBatch(1, webcrypto).length, 1, 'valid generation must recover immediately');
});

test('10,000 UUID v4 values satisfy format, version, variant and uniqueness invariants', () => {
  const values = Array.from({ length: 10_000 }, () => createUuidV4(webcrypto));
  assert.equal(new Set(values).size, values.length);
  assert.ok(values.every((value) => uuidV4Pattern.test(value)));
});

test('secure tokens use WebCrypto bytes and exact hex/Base64URL lengths without Math.random', () => {
  let getRandomValuesCalls = 0;
  const bytes = Uint8Array.from([0, 1, 2, 253, 254, 255, 16, 32]);
  const source = {
    getRandomValues(target) {
      getRandomValuesCalls += 1;
      target.set(bytes.slice(0, target.length));
      return target;
    },
  };
  const originalRandom = Math.random;
  Math.random = () => { throw new Error('Math.random must not be used'); };
  try {
    assert.equal(createSecureToken(8, 'hex', source), '000102fdfeff1020');
    assert.equal(createSecureToken(8, 'base64url', source), Buffer.from(bytes).toString('base64url'));
  } finally {
    Math.random = originalRandom;
  }
  assert.equal(getRandomValuesCalls, 2);
  assert.equal(tokenCharacterLength(8, 'hex'), 16);
  assert.equal(tokenCharacterLength(8, 'base64url'), 11);
  assert.equal(tokenCharacterLength(32, 'base64url'), 43);
  assert.equal(tokenCharacterLength(128, 'base64url'), 171);
});

test('secure token batches enforce format, count and byte boundaries and recover after errors', () => {
  for (const format of ['hex', 'base64url']) {
    const values = createSecureTokenBatch(3, 8, format, webcrypto);
    assert.equal(values.length, 3);
    assert.ok(values.every((value) => value.length === tokenCharacterLength(8, format)));
    assert.equal(new Set(values).size, values.length);
  }
  for (const count of [0, -1, 1.5, 51, 101]) {
    assert.throws(() => createSecureTokenBatch(count, 8, 'hex', webcrypto));
  }
  for (const byteLength of [0, -1, 7, 8.5, 129]) {
    assert.throws(() => createSecureTokenBatch(1, byteLength, 'hex', webcrypto));
  }
  assert.throws(() => createSecureToken(8, 'base64', webcrypto));
  assert.throws(() => createSecureToken(8, 'hex', {}));
  assert.equal(createSecureTokenBatch(1, 128, 'base64url', webcrypto)[0].length, 171);
});

test('sitemap lifecycle policy contains the two canonical tools and no replaced aliases', () => {
  const sitemapSlugs = toolLifecycle.filter((entry) => entry.sitemap).map((entry) => entry.slug);
  assert.deepEqual(sitemapSlugs, tools.map((tool) => tool.slug));
  assert.ok(sitemapSlugs.includes('text-cleanup-workspace'));
  assert.ok(sitemapSlugs.includes('id-token-studio'));
  for (const slug of [
    'line-sorter',
    'duplicate-line-remover',
    'whitespace-cleaner',
    'uuid-generator',
    'secure-token-generator',
  ]) assert.equal(sitemapSlugs.includes(slug), false);
});
