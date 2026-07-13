const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const test = require('node:test');
const puppeteer = require('puppeteer');

const port = 8882;
const origin = `http://127.0.0.1:${port}`;
let browser;
let server;

const waitForServer = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Batch 5 preview did not start');
};

test.before(async () => {
  server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: process.cwd(), stdio: 'ignore', windowsHide: true,
  });
  await waitForServer();
  browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox'],
  });
});

test.after(async () => { await browser?.close(); server?.kill(); });

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('requestfailed', (request) => { if (request.url().startsWith(origin)) errors.push(`network: ${request.url()} — ${request.failure()?.errorText}`); });
  page.on('response', (response) => { if (response.url().startsWith(origin) && response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`); });
  return errors;
}

async function openTool(slug) {
  const page = await browser.newPage();
  const errors = watchErrors(page);
  await page.goto(`${origin}/tool/?slug=${encodeURIComponent(slug)}`, { waitUntil: 'networkidle0' });
  return { page, errors };
}

test('text counter uses graphemes and one throttled polite announcement', async () => {
  const { page, errors } = await openTool('text-counter');
  const result = await page.evaluate(async () => {
    const input = document.querySelector('[data-text-input]'); const live = document.querySelector('[data-text-announcement]'); let mutations = 0;
    new MutationObserver(() => { mutations += 1; }).observe(live, { childList: true, characterData: true, subtree: true });
    for (const value of ['👩', '👩‍', '👩‍💻', '👩‍💻 👍🏽 e\u0301\r\nAzərbaycan']) {
      input.value = value; input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await new Promise((resolve) => setTimeout(resolve, 360));
    const stats = Object.fromEntries([...document.querySelectorAll('.stat-card')].map((card) => [card.querySelector('span').textContent, card.querySelector('strong').textContent]));
    return { stats, live: live.textContent, ariaLive: live.getAttribute('aria-live'), atomic: live.getAttribute('aria-atomic'), mutations };
  });
  assert.equal(result.stats.Simvol, '16');
  assert.equal(result.stats.Boşluqsuz, '13');
  assert.equal(result.stats.Sətir, '2');
  assert.match(result.live, /16 simvol, 2 sətir/u);
  assert.equal(result.ariaLive, 'polite'); assert.equal(result.atomic, 'true'); assert.equal(result.mutations, 1);
  assert.deepEqual(errors, []);
  await page.close();
});

test('favorites and recent storage reject malformed shapes, denied access and recover', async () => {
  const page = await browser.newPage(); const errors = watchErrors(page);
  await page.goto(origin, { waitUntil: 'networkidle0' });
  for (const raw of ['{', '{}', '"text"', 'null', '42']) {
    await page.evaluate((value) => { localStorage.setItem('aztoolbox-recent', value); localStorage.setItem('aztoolbox-favorites', value); }, raw);
    await page.goto(`${origin}/tool/?slug=json-formatter`, { waitUntil: 'networkidle0' });
    assert.equal(await page.$eval('h1', (element) => element.textContent), 'JSON formatter');
  }
  await page.evaluate(() => {
    localStorage.setItem('aztoolbox-recent', '["unknown",2,"text-counter","text-counter"]');
    localStorage.setItem('aztoolbox-favorites', '["unknown","json-formatter","json-formatter"]');
  });
  await page.goto(`${origin}/tool/?slug=qr-generator`, { waitUntil: 'networkidle0' });
  const recovered = await page.evaluate(() => ({
    recent: JSON.parse(localStorage.getItem('aztoolbox-recent')),
    favoritePressed: document.querySelector('[data-favorite="qr-generator"]').getAttribute('aria-pressed'),
  }));
  assert.deepEqual(recovered.recent, ['qr-generator', 'text-counter']);
  assert.equal(recovered.favoritePressed, 'false');
  assert.deepEqual(errors, []);
  await page.close();

  const deniedPage = await browser.newPage(); const deniedErrors = watchErrors(deniedPage);
  await deniedPage.evaluateOnNewDocument(() => {
    Storage.prototype.getItem = () => { throw new DOMException('denied', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('denied', 'SecurityError'); };
  });
  await deniedPage.goto(`${origin}/tool/?slug=json-formatter`, { waitUntil: 'networkidle0' });
  assert.equal(await deniedPage.$eval('h1', (element) => element.textContent), 'JSON formatter');
  assert.deepEqual(deniedErrors, []);
  await deniedPage.close();
});

test('tool metadata is unique and canonical while unknown routes are noindex', async () => {
  const page = await browser.newPage(); const errors = watchErrors(page);
  await page.goto(origin, { waitUntil: 'networkidle0' });
  const registry = await page.evaluate(async () => (await import('/assets/js/tools-data.js')).tools.map(({ slug, name, description }) => ({ slug, name, description })));
  const observed = [];
  for (const tool of registry) {
    await page.goto(`${origin}/tool/?slug=${encodeURIComponent(tool.slug)}`, { waitUntil: 'networkidle0' });
    observed.push(await page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]').content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      h1: document.querySelector('h1').textContent,
      robots: document.querySelector('meta[name="robots"]')?.content || '',
    })));
  }
  assert.equal(new Set(observed.map((entry) => entry.title)).size, registry.length);
  assert.equal(new Set(observed.map((entry) => entry.description)).size, registry.length);
  observed.forEach((entry, index) => {
    assert.equal(entry.h1, registry[index].name);
    assert.match(entry.description, new RegExp(registry[index].description.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
    assert.equal(entry.canonical, `${origin}/tool/?slug=${encodeURIComponent(registry[index].slug)}`);
    assert.equal(entry.robots, '');
  });
  await page.goto(`${origin}/tool/?slug=unknown`, { waitUntil: 'networkidle0' });
  const missing = await page.evaluate(() => ({ title: document.title, description: document.querySelector('meta[name="description"]').content, canonical: document.querySelector('link[rel="canonical"]'), robots: document.querySelector('meta[name="robots"]')?.content }));
  assert.match(missing.title, /tapılmadı/u); assert.match(missing.description, /Naməlum/u); assert.equal(missing.canonical, null); assert.equal(missing.robots, 'noindex');
  assert.deepEqual(errors, []);
  await page.close();
});

test('network policy has no external fonts and vendors load only for matching tools', async () => {
  const check = async (slug) => {
    const page = await browser.newPage(); const errors = watchErrors(page); const requests = [];
    page.on('request', (request) => requests.push({ url: request.url(), type: request.resourceType() }));
    await page.goto(`${origin}/tool/?slug=${slug}`, { waitUntil: 'networkidle0' });
    const initialCount = requests.length;
    if (slug === 'json-formatter') await page.evaluate(() => { const input=document.querySelector('[data-json-input]');input.value='{"local":true}';document.querySelector('[data-json-format]').click(); });
    await new Promise((resolve) => setTimeout(resolve, 50));
    const value = { requests, operationRequests: requests.slice(initialCount), errors };
    await page.close(); return value;
  };
  const text = await check('json-formatter'); const pdf = await check('pdf-splitter'); const qr = await check('qr-generator');
  for (const current of [text,pdf,qr]) {
    assert.equal(current.requests.some((request) => !request.url.startsWith(origin)), false);
    assert.deepEqual(current.errors, []);
  }
  assert.equal(text.requests.some((request) => /assets\/vendor/u.test(request.url)), false);
  assert.equal(pdf.requests.some((request) => /pdf-lib\.min\.js$/u.test(request.url)), true);
  assert.equal(pdf.requests.some((request) => /qrcode\.min\.js$/u.test(request.url)), false);
  assert.equal(qr.requests.some((request) => /qrcode\.min\.js$/u.test(request.url)), true);
  assert.equal(qr.requests.some((request) => /pdf-lib\.min\.js$/u.test(request.url)), false);
  assert.equal(text.operationRequests.some((request) => ['fetch','xhr'].includes(request.type)), false);

  const failed = await browser.newPage();
  await failed.setRequestInterception(true);
  failed.on('request', (request) => request.url().endsWith('/assets/vendor/qrcode.min.js') ? request.abort() : request.continue());
  await failed.goto(`${origin}/tool/?slug=qr-generator`, { waitUntil: 'networkidle0' });
  assert.match(await failed.$eval('[data-output]', (element) => element.innerText), /QR mühərriki yüklənmədi/u);
  assert.equal(await failed.$eval('[data-qr-generate]', (element) => element.disabled), true);
  await failed.close();
});

test('registry-derived home/catalog copy and approved JWT/feedback limitations are visible', async () => {
  const page = await browser.newPage(); const errors = watchErrors(page);
  await page.goto(origin, { waitUntil: 'networkidle0' });
  const home = await page.evaluate(async () => {
    const { tools } = await import('/assets/js/tools-data.js');
    return { expected: tools.length, total: Number(document.querySelector('[data-total-tools]').textContent), link: Number(document.querySelector('[data-total-tools-link]').textContent), pdfCopy: document.querySelector('.dashboard-category-card.category-pdf p').textContent, title: document.title };
  });
  assert.equal(home.total, home.expected); assert.equal(home.link, home.expected); assert.match(home.title, new RegExp(String(home.expected))); assert.doesNotMatch(home.pdfCopy, /sıx/u);
  await page.goto(`${origin}/tools/`, { waitUntil: 'networkidle0' });
  assert.equal(await page.$eval('[data-tool-count]', (element) => Number(element.textContent.match(/\d+/u)[0])), home.expected);
  await page.goto(`${origin}/tool/?slug=jwt-decoder`, { waitUntil: 'networkidle0' });
  assert.match(await page.$eval('[role="note"]', (element) => element.textContent), /İmza, bitmə tarixi və etibarlılıq yoxlanmır/u);
  await page.evaluate(() => { document.querySelector('[data-simple-input]').value='eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.';document.querySelector('[data-simple-run]').click(); });
  assert.match(await page.$eval('[data-output]', (element) => element.innerText), /"sub": "1"/u);
  await page.goto(`${origin}/feedback/`, { waitUntil: 'networkidle0' });
  const feedback = await page.evaluate(() => {
    document.querySelector('#feedback-name').value='Aysel'; document.querySelector('#feedback-email').value='aysel@example.test'; document.querySelector('#feedback-message').value='Test rəyi';
    document.querySelector('[data-feedback-form]').requestSubmit();
    return { disclosure: document.querySelector('[role="note"]').textContent, message: document.querySelector('#feedback-message').value, status: document.querySelector('[data-feedback-status]').innerText, mailto: document.querySelector('[data-feedback-email]').getAttribute('href'), copy: Boolean(document.querySelector('[data-feedback-copy]')) };
  });
  assert.match(feedback.disclosure, /serverə göndərmir/u); assert.equal(feedback.message, 'Test rəyi'); assert.match(feedback.status, /serverə göndərilmədi/u); assert.match(feedback.mailto, /^mailto:\?subject=/u); assert.equal(feedback.copy, true);
  assert.deepEqual(errors, []);
  await page.close();
});

test('responsive layouts, touch targets, keyboard focus and reduced motion pass configured viewports', async () => {
  const page = await browser.newPage(); const errors = watchErrors(page);
  for (const width of [320,375,768,1440,1920]) {
    await page.setViewport({ width, height: width < 800 ? 900 : 1000, deviceScaleFactor: 1 });
    await page.goto(`${origin}/tool/?slug=json-formatter`, { waitUntil: 'networkidle0' });
    const layout = await page.evaluate(() => {
      const breadcrumb = document.querySelector('.breadcrumb a').getBoundingClientRect(); const favorite = document.querySelector('.tool-header .favorite-button').getBoundingClientRect();
      return { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, breadcrumbHeight: breadcrumb.height, favoriteWidth: favorite.width, favoriteHeight: favorite.height, mobileDisplay: getComputedStyle(document.querySelector('[data-mobile-toggle]')).display, desktopDisplay: getComputedStyle(document.querySelector('.desktop-nav')).display };
    });
    assert.ok(layout.scrollWidth <= layout.clientWidth, `${width}px must not overflow`);
    assert.ok(layout.breadcrumbHeight >= 44); assert.ok(layout.favoriteWidth >= 44); assert.ok(layout.favoriteHeight >= 44);
    if (width <= 768) { assert.notEqual(layout.mobileDisplay, 'none'); assert.equal(layout.desktopDisplay, 'none'); }
    if (width >= 1440) { assert.equal(layout.mobileDisplay, 'none'); assert.notEqual(layout.desktopDisplay, 'none'); }
  }
  await page.setViewport({ width:320, height:900 });
  await page.goto(`${origin}/tool/?slug=json-formatter`, { waitUntil:'networkidle0' });
  await page.click('[data-mobile-toggle]');
  assert.equal(await page.evaluate(() => document.activeElement.matches('[data-mobile-close]')), true);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.activeElement.matches('[data-mobile-toggle]') && document.querySelector('[data-mobile-panel]').hidden, { timeout: 1500 });
  assert.equal(await page.evaluate(() => document.activeElement.matches('[data-mobile-toggle]') && document.querySelector('[data-mobile-panel]').hidden), true);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyK'); await page.keyboard.up('Control');
  assert.equal(await page.evaluate(() => document.activeElement.matches('[data-global-search]')), true);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.activeElement.matches('[data-mobile-toggle]') && document.querySelector('[data-search-dialog]').hidden, { timeout: 1500 });
  assert.equal(await page.evaluate(() => document.activeElement.matches('[data-mobile-toggle]')), true);
  await page.emulateMediaFeatures([{ name:'prefers-reduced-motion', value:'reduce' }]);
  await page.goto(origin, { waitUntil:'networkidle0' });
  const reduced = await page.evaluate(() => ({ ambient: getComputedStyle(document.querySelector('ambient-waves')).display, reveal: document.querySelector('.reveal').classList.contains('visible'), duration: getComputedStyle(document.querySelector('.dashboard-category-card')).transitionDuration }));
  assert.equal(reduced.ambient,'none'); assert.equal(reduced.reveal,true); assert.ok(parseFloat(reduced.duration) <= 0.001);
  assert.deepEqual(errors, []);
  await page.close();
});
