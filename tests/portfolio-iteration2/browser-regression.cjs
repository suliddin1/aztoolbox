const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const test = require('node:test');
const puppeteer = require('puppeteer');

const port = 8894;
const origin = `http://127.0.0.1:${port}`;
const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
let browser;
let server;

const waitForServer = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Portfolio Iteration 2 preview did not start');
};

test.before(async () => {
  server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    windowsHide: true,
  });
  await waitForServer();
  browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox'],
  });
});

test.after(async () => {
  await browser?.close();
  server?.kill();
});

function watchTraffic(page) {
  const errors = [];
  const requests = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('request', (request) => requests.push(request.url()));
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(origin)) errors.push(`network: ${request.url()} — ${request.failure()?.errorText}`);
  });
  page.on('response', (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
  });
  return { errors, requests };
}

async function openPage(path) {
  const page = await browser.newPage();
  const traffic = watchTraffic(page);
  await page.goto(`${origin}${path}`, { waitUntil: 'networkidle0' });
  return { page, ...traffic };
}

async function setControl(page, selector, value, eventType = 'input') {
  await page.$eval(selector, (control, nextValue, type) => {
    if (control.type === 'checkbox') control.checked = Boolean(nextValue);
    else control.value = nextValue;
    control.dispatchEvent(new Event(type, { bubbles: true }));
  }, value, eventType);
}

async function installCaptures(page, { logs = false } = {}) {
  await page.evaluate((captureLogs) => {
    const blobs = new Map();
    const nativeCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = nativeCreateObjectURL(blob);
      blobs.set(url, blob);
      return url;
    };
    globalThis.__iteration2Captures = { copies: [], downloads: [], logs: [] };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => { globalThis.__iteration2Captures.copies.push(String(value)); },
      },
    });
    HTMLAnchorElement.prototype.click = function click() {
      if (this.download) globalThis.__iteration2Captures.downloads.push({ name: this.download, blob: blobs.get(this.href) });
    };
    if (captureLogs) {
      for (const method of ['log', 'info', 'warn', 'error']) {
        const native = console[method].bind(console);
        console[method] = (...values) => {
          globalThis.__iteration2Captures.logs.push(values.map(String).join(' '));
          native(...values);
        };
      }
    }
  }, logs);
}

async function previewText(page, value) {
  await setControl(page, '[data-cleanup-input]', value);
  await page.click('[data-cleanup-preview]');
  await page.waitForSelector('[data-cleanup-output]');
  return page.$eval('[data-cleanup-output]', (output) => output.value);
}

async function lastDownload(page) {
  return page.evaluate(async () => {
    const download = globalThis.__iteration2Captures.downloads.at(-1);
    return download ? { name: download.name, type: download.blob?.type, text: await download.blob?.text() } : null;
  });
}

test('old routes, favorites, recent history and search preserve mode intent without duplicate canonicals', async () => {
  const { page, errors } = await openPage('/');
  await page.evaluate(() => {
    localStorage.setItem('aztoolbox-favorites', JSON.stringify([
      'line-sorter',
      'duplicate-line-remover',
      'uuid-generator',
      'secure-token-generator',
    ]));
    localStorage.setItem('aztoolbox-recent', JSON.stringify([
      'whitespace-cleaner',
      'line-sorter',
      'secure-token-generator',
      'uuid-generator',
    ]));
  });

  await page.goto(`${origin}/tools/?view=favorites`, { waitUntil: 'networkidle0' });
  assert.deepEqual(
    await page.$$eval('[data-tools-grid] [data-tool-card] h3 a', (links) => links.map((link) => link.getAttribute('href'))),
    [
      '../tool/?slug=text-cleanup-workspace&mode=sort',
      '../tool/?slug=id-token-studio&mode=uuid',
    ],
  );
  assert.deepEqual(
    await page.evaluate(() => JSON.parse(localStorage.getItem('aztoolbox-favorites'))),
    [
      { slug: 'text-cleanup-workspace', mode: 'sort' },
      { slug: 'id-token-studio', mode: 'uuid' },
    ],
  );

  await page.goto(`${origin}/tools/?view=recent`, { waitUntil: 'networkidle0' });
  assert.deepEqual(
    await page.$$eval('[data-tools-grid] [data-tool-card] h3 a', (links) => links.map((link) => link.getAttribute('href'))),
    [
      '../tool/?slug=text-cleanup-workspace&mode=whitespace',
      '../tool/?slug=id-token-studio&mode=token',
    ],
  );

  const aliases = {
    'line-sorter': ['text-cleanup-workspace', 'sort'],
    'duplicate-line-remover': ['text-cleanup-workspace', 'deduplicate'],
    'whitespace-cleaner': ['text-cleanup-workspace', 'whitespace'],
    'uuid-generator': ['id-token-studio', 'uuid'],
    'secure-token-generator': ['id-token-studio', 'token'],
  };
  for (const [alias, [canonical, mode]] of Object.entries(aliases)) {
    await page.goto(`${origin}/tool/?slug=${alias}`, { waitUntil: 'networkidle0' });
    const state = await page.evaluate((canonicalSlug) => ({
      url: location.href,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      robots: document.querySelector('meta[name="robots"]')?.content,
      heading: document.querySelector('h1')?.textContent,
      activeMode: document.querySelector('.mode-tab[aria-current="page"]')?.getAttribute('href'),
      recent: JSON.parse(localStorage.getItem('aztoolbox-recent')),
      canonicalSlug,
    }), canonical);
    assert.equal(state.url, `${origin}/tool/?slug=${alias}`);
    assert.equal(state.canonical, `${origin}/tool/?slug=${canonical}`);
    assert.equal(state.robots, 'noindex,follow');
    assert.match(state.activeMode, new RegExp(`mode=${mode}$`, 'u'));
    assert.match(state.heading, canonical === 'text-cleanup-workspace' ? /Mətn təmizləmə/u : /ID və token/u);
    const matchingRecent = state.recent.filter((entry) => (typeof entry === 'string' ? entry : entry.slug) === canonical);
    assert.equal(matchingRecent.length, 1, `${alias} duplicated recent history`);
    assert.deepEqual(matchingRecent[0], { slug: canonical, mode });

    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(page.url(), `${origin}/tool/?slug=${alias}`);
    assert.match(
      await page.$eval('.mode-tab[aria-current="page"]', (link) => link.getAttribute('href')),
      new RegExp(`mode=${mode}$`, 'u'),
    );
  }

  await page.goto(`${origin}/tool/?slug=line-sorter`, { waitUntil: 'networkidle0' });
  await page.goto(`${origin}/tool/?slug=uuid-generator`, { waitUntil: 'networkidle0' });
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-cleanup-input]');
  assert.equal(page.url(), `${origin}/tool/?slug=line-sorter`);
  await page.goForward({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-studio-generate]');
  assert.equal(page.url(), `${origin}/tool/?slug=uuid-generator`);

  await page.goto(origin, { waitUntil: 'networkidle0' });
  await page.click('[data-open-search]');
  await page.waitForSelector('[data-search-dialog]:not([hidden])');
  for (const [query, canonical, mode] of [
    ['Line sorter', 'text-cleanup-workspace', 'sort'],
    ['Duplicate line remover', 'text-cleanup-workspace', 'deduplicate'],
    ['Whitespace cleaner', 'text-cleanup-workspace', 'whitespace'],
    ['UUID generator', 'id-token-studio', 'uuid'],
    ['Secure token generator', 'id-token-studio', 'token'],
  ]) {
    await setControl(page, '[data-global-search]', query);
    assert.equal(
      await page.$eval('[data-global-results] .search-item', (link) => link.getAttribute('href')),
      `./tool/?slug=${canonical}&mode=${mode}`,
      query,
    );
  }

  await page.goto(`${origin}/tools/`, { waitUntil: 'networkidle0' });
  assert.equal(await page.$$eval('[data-tools-grid] [data-tool-card]', (cards) => cards.length), 32);
  const activeSlugs = await page.$$eval('[data-tools-grid] [data-tool-card]', (cards) => cards.map((card) => card.dataset.slug));
  for (const alias of Object.keys(aliases)) assert.equal(activeSlugs.includes(alias), false);
  await setControl(page, '[data-catalog-search]', 'Secure token generator');
  await page.waitForFunction(() => document.querySelector('[data-tools-grid] [data-tool-card] h3 a')?.getAttribute('href')?.includes('id-token-studio'));
  assert.equal(
    await page.$eval('[data-tools-grid] [data-tool-card] h3 a', (link) => link.getAttribute('href')),
    '../tool/?slug=id-token-studio&mode=token',
  );

  assert.deepEqual(errors, []);
  await page.close();
});

test('all three text presets retain old output while preview, stats, copy, download, apply, undo and reset work', async () => {
  const { page, errors } = await openPage('/tool/?slug=line-sorter');
  const sortInput = 'ş\na\nə\nç';
  const collator = new Intl.Collator('az');
  const expectedSort = ['ş', 'a', 'ə', 'ç'].sort((left, right) => collator.compare(left, right)).join('\n');
  assert.equal(await previewText(page, sortInput), expectedSort);
  assert.deepEqual(
    await page.$$eval('[data-cleanup-operation]', (items) => items.map((item) => item.dataset.cleanupOperation)),
    ['sort'],
  );
  assert.deepEqual(await page.evaluate(() => ({
    beforeLines: document.querySelector('[data-before-lines]').textContent,
    beforeNonEmpty: document.querySelector('[data-before-nonempty]').textContent,
    afterLines: document.querySelector('[data-after-lines]').textContent,
    afterNonEmpty: document.querySelector('[data-after-nonempty]').textContent,
  })), { beforeLines: '4', beforeNonEmpty: '4', afterLines: '4', afterNonEmpty: '4' });
  assert.deepEqual(await page.evaluate(() => ({
    beforeTabIndex: document.querySelector('[data-cleanup-before]').tabIndex,
    beforeRole: document.querySelector('[data-cleanup-before]').getAttribute('role'),
    beforeName: document.getElementById(document.querySelector('[data-cleanup-before]').getAttribute('aria-labelledby')).textContent,
    outputName: document.getElementById(document.querySelector('[data-cleanup-output]').getAttribute('aria-labelledby')).textContent,
  })), { beforeTabIndex: 0, beforeRole: 'region', beforeName: 'Əvvəl', outputName: 'Sonra' });

  await page.goto(`${origin}/tool/?slug=duplicate-line-remover`, { waitUntil: 'networkidle0' });
  assert.equal(await previewText(page, 'A\na\nA\n\n'), 'A\na\n');
  assert.deepEqual(
    await page.$$eval('[data-cleanup-operation]', (items) => items.map((item) => item.dataset.cleanupOperation)),
    ['deduplicate'],
  );
  assert.deepEqual(await page.evaluate(() => ({
    beforeLines: document.querySelector('[data-before-lines]').textContent,
    afterLines: document.querySelector('[data-after-lines]').textContent,
    removed: document.querySelector('[data-removed-duplicates]').textContent,
  })), { beforeLines: '5', afterLines: '3', removed: '2' });

  await page.goto(`${origin}/tool/?slug=whitespace-cleaner`, { waitUntil: 'networkidle0' });
  await installCaptures(page);
  const whitespaceInput = '  A\t\t B  \n\n C  \n';
  assert.equal(await previewText(page, whitespaceInput), 'A B\nC');
  assert.deepEqual(
    await page.$$eval('[data-cleanup-operation]', (items) => items.map((item) => item.dataset.cleanupOperation)),
    ['whitespace'],
  );

  await page.click('[data-cleanup-copy]');
  await page.waitForFunction(() => globalThis.__iteration2Captures.copies.length === 1);
  assert.deepEqual(await page.evaluate(() => globalThis.__iteration2Captures.copies), ['A B\nC']);
  await page.click('[data-cleanup-download]');
  await page.waitForFunction(() => globalThis.__iteration2Captures.downloads.length === 1);
  assert.deepEqual(await lastDownload(page), {
    name: 'aztoolbox-temizlenmis-metn.txt',
    type: 'text/plain;charset=utf-8',
    text: 'A B\nC',
  });

  await page.click('[data-cleanup-apply]');
  assert.equal(await page.$eval('[data-cleanup-input]', (input) => input.value), 'A B\nC');
  assert.equal(await page.$('[data-cleanup-output]'), null);
  assert.equal(await page.$eval('[data-cleanup-undo]', (button) => button.disabled), false);
  await page.click('[data-cleanup-undo]');
  assert.equal(await page.$eval('[data-cleanup-input]', (input) => input.value), whitespaceInput);
  await page.click('[data-cleanup-preview]');
  await page.waitForSelector('[data-cleanup-output]');
  await page.click('[data-cleanup-reset]');
  assert.equal(await page.$eval('[data-cleanup-input]', (input) => input.value), '');
  assert.equal(await page.$('[data-cleanup-output]'), null);
  assert.deepEqual(
    await page.$$eval('[data-cleanup-operation]', (items) => items.map((item) => item.dataset.cleanupOperation)),
    ['whitespace'],
  );

  assert.deepEqual(errors, []);
  await page.close();
});

test('ordered text pipelines, case options, CRLF policy, stale invalidation and privacy are explicit', async () => {
  const { page, errors, requests } = await openPage('/tool/?slug=text-cleanup-workspace&mode=sort');
  await installCaptures(page, { logs: true });
  await page.evaluate(() => {
    localStorage.setItem('iteration2-sentinel', 'safe-local-value');
    sessionStorage.setItem('iteration2-sentinel', 'safe-session-value');
  });

  await setControl(page, '[data-add-operation]', 'deduplicate', 'change');
  await page.click('[data-add-operation-button]');
  await setControl(page, '[data-add-operation]', 'whitespace', 'change');
  await page.click('[data-add-operation-button]');
  await page.click('[data-cleanup-operation="sort"] [data-operation-remove]');
  assert.deepEqual(
    await page.$$eval('[data-cleanup-operation]', (items) => items.map((item) => item.dataset.cleanupOperation)),
    ['deduplicate', 'whitespace'],
  );

  const privateMarker = 'PRIVATE-ITER2-İ-👩🏽‍💻';
  await page.$eval('[data-cleanup-input]', (input, marker) => {
    const rawClipboardText = ` A \r\nA\r\n A \r\n${marker}`;
    const paste = new Event('paste', { bubbles: true });
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => rawClipboardText } });
    input.dispatchEvent(paste);
  }, privateMarker);
  await setControl(page, '[data-cleanup-newline]', 'preserve', 'change');
  assert.equal(await previewText(page, ` A \nA\n A \n${privateMarker}`), `A\nA\n${privateMarker}`);
  await page.click('[data-cleanup-copy]');
  await page.waitForFunction(() => globalThis.__iteration2Captures.copies.length === 1);
  assert.deepEqual(
    await page.evaluate(() => globalThis.__iteration2Captures.copies),
    [`A\r\nA\r\n${privateMarker}`],
    'copy preserves the selected CRLF output even though textarea values normalize line endings',
  );
  await page.click('[data-cleanup-operation="whitespace"] [data-operation-up]');
  assert.deepEqual(
    await page.$$eval('[data-cleanup-operation]', (items) => items.map((item) => item.dataset.cleanupOperation)),
    ['whitespace', 'deduplicate'],
  );
  await page.click('[data-cleanup-preview]');
  await page.waitForSelector('[data-cleanup-output]');
  assert.equal(await page.$eval('[data-cleanup-output]', (output) => output.value), `A\n${privateMarker}`);

  await setControl(page, '[data-cleanup-input]', 'İ\nI\nı\ni\nКирил\nКирил\n👩🏽‍💻\n👩🏽‍💻');
  await setControl(page, '[data-dedupe-case-sensitive]', false, 'change');
  await page.click('[data-cleanup-preview]');
  await page.waitForSelector('[data-cleanup-output]');
  assert.equal(await page.$eval('[data-cleanup-output]', (output) => output.value), 'İ\nI\nКирил\n👩🏽‍💻');

  await setControl(page, '[data-cleanup-input]', 'changed input');
  assert.equal(await page.$('[data-cleanup-output]'), null, 'input changes must clear stale previews');

  const privacy = await page.evaluate(() => ({
    url: location.href,
    local: Object.keys(localStorage).map((key) => `${key}:${localStorage.getItem(key)}`).join('\n'),
    session: Object.keys(sessionStorage).map((key) => `${key}:${sessionStorage.getItem(key)}`).join('\n'),
    logs: globalThis.__iteration2Captures.logs.join('\n'),
  }));
  for (const value of Object.values(privacy)) assert.equal(value.includes(privateMarker), false);
  assert.equal(requests.some((url) => url.includes(privateMarker) || url.includes(encodeURIComponent(privateMarker))), false);

  assert.deepEqual(errors, []);
  await page.close();
});

test('oversized text clears stale output and valid input recovers immediately', async () => {
  const { page, errors } = await openPage('/tool/?slug=text-cleanup-workspace&mode=whitespace');
  assert.equal(await previewText(page, '  əvvəl  '), 'əvvəl');
  await setControl(page, '[data-cleanup-input]', 'x'.repeat(1_000_001));
  await page.click('[data-cleanup-preview]');
  await page.waitForFunction(() => !document.querySelector('[data-output]').hidden);
  const invalid = await page.evaluate(() => ({
    message: document.querySelector('[data-output]').innerText,
    preview: Boolean(document.querySelector('[data-cleanup-output]')),
  }));
  assert.equal(invalid.preview, false);
  assert.match(invalid.message, /Mətn çox uzundur|1\.000\.000/u);

  await setControl(page, '[data-cleanup-input]', '  bərpa   edildi  ');
  await page.click('[data-cleanup-preview]');
  await page.waitForSelector('[data-cleanup-output]');
  assert.equal(await page.$eval('[data-cleanup-output]', (output) => output.value), 'bərpa edildi');

  assert.deepEqual(errors, []);
  await page.close();
});

test('UUID mode enforces bounds and supports per-item/batch copy, download, reset and recovery', async () => {
  const { page, errors } = await openPage('/tool/?slug=id-token-studio&mode=uuid');
  await installCaptures(page);
  await setControl(page, '[data-studio-count]', '3');
  await page.click('[data-studio-generate]');
  await page.waitForFunction(() => document.querySelectorAll('[data-studio-item]').length === 3);
  const values = await page.$$eval('[data-studio-item] code', (codes) => codes.map((code) => code.textContent));
  assert.equal(new Set(values).size, values.length);
  assert.ok(values.every((value) => uuidV4Pattern.test(value)));
  assert.deepEqual(
    await page.$$eval('[data-studio-copy-one]', (buttons) => buttons.map((button) => button.getAttribute('aria-label'))),
    ['UUID 1 nəticəsini kopyala', 'UUID 2 nəticəsini kopyala', 'UUID 3 nəticəsini kopyala'],
  );

  await page.click('[data-studio-copy-one="0"]');
  await page.waitForFunction(() => globalThis.__iteration2Captures.copies.length === 1);
  await page.click('[data-studio-copy-all]');
  await page.waitForFunction(() => globalThis.__iteration2Captures.copies.length === 2);
  assert.deepEqual(await page.evaluate(() => globalThis.__iteration2Captures.copies), [values[0], values.join('\n')]);
  await page.click('[data-studio-download]');
  await page.waitForFunction(() => globalThis.__iteration2Captures.downloads.length === 1);
  assert.deepEqual(await lastDownload(page), {
    name: 'uuid-v4.txt',
    type: 'text/plain;charset=utf-8',
    text: values.join('\n'),
  });

  for (const invalidValue of ['0', '-1', '1.5', '51']) {
    await setControl(page, '[data-studio-count]', invalidValue);
    await page.click('[data-studio-generate]');
    await page.waitForFunction(() => !document.querySelector('[data-output]').hidden);
    assert.equal(await page.$$eval('[data-studio-item]', (items) => items.length), 0, invalidValue);
    assert.equal(await page.$eval('[data-studio-count]', (input) => input.getAttribute('aria-invalid')), 'true');
  }
  await setControl(page, '[data-studio-count]', '1');
  await page.click('[data-studio-generate]');
  await page.waitForFunction(() => document.querySelectorAll('[data-studio-item]').length === 1);
  assert.match(await page.$eval('[data-studio-item] code', (code) => code.textContent), uuidV4Pattern);
  await page.click('[data-studio-reset]');
  assert.equal(await page.$$eval('[data-studio-item]', (items) => items.length), 0);
  assert.equal(await page.$eval('[data-studio-count]', (input) => input.value), '5');

  assert.deepEqual(errors, []);
  await page.close();
});

test('token mode distinguishes bytes from characters, validates both encodings and supports secure result actions', async () => {
  const { page, errors } = await openPage('/tool/?slug=id-token-studio&mode=token');
  await installCaptures(page);
  assert.match(await page.$eval('.privacy-note[role="note"]', (note) => note.textContent), /təkrar istifadə etməyin/u);
  await setControl(page, '[data-studio-count]', '2');
  await setControl(page, '[data-token-bytes]', '8');
  await page.click('[data-studio-generate]');
  await page.waitForFunction(() => document.querySelectorAll('[data-studio-item]').length === 2);
  const hexValues = await page.$$eval('[data-studio-item] code', (codes) => codes.map((code) => code.textContent));
  assert.ok(hexValues.every((value) => /^[0-9a-f]{16}$/u.test(value)));
  assert.match(await page.$eval('[data-output]', (output) => output.innerText), /8 bayt və 16 simvol/u);

  await setControl(page, '[data-token-format]', 'base64url', 'change');
  assert.equal(await page.$eval('[data-token-character-length]', (value) => value.textContent), '11');
  assert.equal(await page.$$eval('[data-studio-item]', (items) => items.length), 0);
  await page.click('[data-studio-generate]');
  await page.waitForFunction(() => document.querySelectorAll('[data-studio-item]').length === 2);
  const base64Values = await page.$$eval('[data-studio-item] code', (codes) => codes.map((code) => code.textContent));
  assert.ok(base64Values.every((value) => /^[A-Za-z0-9_-]{11}$/u.test(value)));
  assert.match(await page.$eval('[data-output]', (output) => output.innerText), /8 bayt və 11 simvol/u);

  await page.$eval('[data-studio-copy-one="0"]', (button) => button.click());
  await page.waitForFunction(() => globalThis.__iteration2Captures.copies.length === 1);
  await page.click('[data-studio-copy-all]');
  await page.waitForFunction(() => globalThis.__iteration2Captures.copies.length === 2);
  await page.click('[data-studio-download]');
  await page.waitForFunction(() => globalThis.__iteration2Captures.downloads.length === 1);
  assert.deepEqual(await page.evaluate(() => globalThis.__iteration2Captures.copies), [base64Values[0], base64Values.join('\n')]);
  assert.deepEqual(await lastDownload(page), {
    name: 'tehlukesiz-tokenler.txt',
    type: 'text/plain;charset=utf-8',
    text: base64Values.join('\n'),
  });

  for (const invalidValue of ['0', '-1', '7', '8.5', '129']) {
    await setControl(page, '[data-token-bytes]', invalidValue);
    await page.click('[data-studio-generate]');
    await page.waitForFunction(() => !document.querySelector('[data-output]').hidden);
    assert.equal(await page.$$eval('[data-studio-item]', (items) => items.length), 0, invalidValue);
    assert.equal(await page.$eval('[data-token-bytes]', (input) => input.getAttribute('aria-invalid')), 'true');
  }
  await setControl(page, '[data-token-bytes]', '128');
  await page.click('[data-studio-generate]');
  await page.waitForFunction(() => document.querySelectorAll('[data-studio-item]').length === 2);
  assert.ok((await page.$$eval('[data-studio-item] code', (codes) => codes.map((code) => code.textContent))).every((value) => value.length === 171));

  assert.deepEqual(errors, []);
  await page.close();
});

test('generated identifiers and tokens never enter URL/storage and are cleared on reset, navigation and BFCache restore', async () => {
  const { page, errors, requests } = await openPage('/tool/?slug=id-token-studio&mode=uuid');
  await page.evaluate(() => {
    localStorage.setItem('iteration2-privacy-local', 'sentinel');
    sessionStorage.setItem('iteration2-privacy-session', 'sentinel');
  });
  await setControl(page, '[data-studio-count]', '1');
  await page.click('[data-studio-generate]');
  await page.waitForSelector('[data-studio-item]');
  const firstSecret = await page.$eval('[data-studio-item] code', (code) => code.textContent);
  const firstPrivacy = await page.evaluate(() => ({
    url: location.href,
    history: JSON.stringify(history.state),
    local: Object.keys(localStorage).map((key) => localStorage.getItem(key)).join('\n'),
    session: Object.keys(sessionStorage).map((key) => sessionStorage.getItem(key)).join('\n'),
  }));
  for (const value of Object.values(firstPrivacy)) assert.equal(value.includes(firstSecret), false);
  assert.equal(requests.some((url) => url.includes(firstSecret)), false);

  await page.click('[data-studio-reset]');
  assert.equal(await page.$$eval('[data-studio-item]', (items) => items.length), 0);
  await page.click('[data-studio-generate]');
  await page.waitForSelector('[data-studio-item]');
  const navigationSecret = await page.$eval('[data-studio-item] code', (code) => code.textContent);
  await page.goto(`${origin}/tool/?slug=id-token-studio&mode=token`, { waitUntil: 'networkidle0' });
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-studio-generate]');
  assert.equal(await page.$$eval('[data-studio-item]', (items) => items.length), 0);
  assert.equal(await page.$eval('body', (body, secret) => body.innerText.includes(secret), navigationSecret), false);

  assert.deepEqual(errors, []);
  await page.close();
});

test('both workspaces fit 320, 375 and 1440 pixels and primary controls work by keyboard', async () => {
  const { page, errors } = await openPage('/tool/?slug=text-cleanup-workspace&mode=sort');
  for (const width of [320, 375, 1440]) {
    await page.setViewport({ width, height: 950, deviceScaleFactor: 1 });
    await page.goto(`${origin}/tool/?slug=text-cleanup-workspace&mode=sort`, { waitUntil: 'networkidle0' });
    await setControl(page, '[data-cleanup-input]', 'ş\na');
    if (width === 320) {
      await page.focus('[data-cleanup-preview]');
      await page.keyboard.press('Enter');
    } else await page.click('[data-cleanup-preview]');
    await page.waitForSelector('[data-cleanup-output]');
    const textLayout = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      operations: document.querySelectorAll('[data-cleanup-operation]').length,
      output: document.querySelector('[data-cleanup-output]').value,
      keyboardFocus: document.activeElement === document.querySelector('[data-cleanup-preview]'),
    }));
    assert.equal(textLayout.viewport, width);
    assert.ok(textLayout.documentWidth <= width, `${width}px text document overflowed to ${textLayout.documentWidth}px`);
    assert.ok(textLayout.bodyWidth <= width, `${width}px text body overflowed to ${textLayout.bodyWidth}px`);
    assert.equal(textLayout.operations, 1);
    assert.ok(textLayout.output.length > 0);
    if (width === 320) assert.equal(textLayout.keyboardFocus, true);

    await page.goto(`${origin}/tool/?slug=id-token-studio&mode=token`, { waitUntil: 'networkidle0' });
    await setControl(page, '[data-token-bytes]', '128');
    await setControl(page, '[data-token-format]', 'base64url', 'change');
    if (width === 320) {
      await page.focus('[data-studio-generate]');
      await page.keyboard.press('Enter');
    } else await page.click('[data-studio-generate]');
    await page.waitForSelector('[data-studio-item]');
    const studioLayout = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      items: document.querySelectorAll('[data-studio-item]').length,
      chars: document.querySelector('[data-studio-item] code').textContent.length,
      keyboardFocus: document.activeElement === document.querySelector('[data-studio-generate]'),
    }));
    assert.equal(studioLayout.viewport, width);
    assert.ok(studioLayout.documentWidth <= width, `${width}px studio document overflowed to ${studioLayout.documentWidth}px`);
    assert.ok(studioLayout.bodyWidth <= width, `${width}px studio body overflowed to ${studioLayout.bodyWidth}px`);
    assert.equal(studioLayout.items, 1);
    assert.equal(studioLayout.chars, 171);
    if (width === 320) assert.equal(studioLayout.keyboardFocus, true);
  }

  assert.deepEqual(errors, []);
  await page.close();
});
