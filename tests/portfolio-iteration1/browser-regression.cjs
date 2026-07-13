const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const test = require('node:test');
const puppeteer = require('puppeteer');

const port = 8893;
const origin = `http://127.0.0.1:${port}`;
const encryptedPdfBase64 = 'JVBERi0xLjcKJYGBgYEKCjEgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFsgMyAwIFIgXQovQ291bnQgMQo+PgplbmRvYmoKCjIgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDEgMCBSCj4+CmVuZG9iagoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDEgMCBSCi9SZXNvdXJjZXMgPDwKPj4KL01lZGlhQm94IFsgMCAwIDEwMCAxMDAgXQo+PgplbmRvYmoKCjQgMCBvYmoKPDwKL0ZpbHRlciAvU3RhbmRhcmQKL1YgMQovUiAyCi9MZW5ndGggNDAKL08gPDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA+Ci9VIDwwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwPgovUCAtNAo+PgplbmRvYmoKCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNiAwMDAwMCBuIAowMDAwMDAwMDc2IDAwMDAwIG4gCjAwMDAwMDAxMjYgMDAwMDAgbiAKMDAwMDAwMDIxNyAwMDAwMCBuIAoKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDIgMCBSCi9FbmNyeXB0IDQgMCBSCj4+CgpzdGFydHhyZWYKNDI0CiUlRU9G';
let browser;
let server;

const waitForServer = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Portfolio Iteration 1 preview did not start');
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

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(origin)) errors.push(`network: ${request.url()} — ${request.failure()?.errorText}`);
  });
  page.on('response', (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
  });
  return errors;
}

async function openPage(path) {
  const page = await browser.newPage();
  const errors = watchErrors(page);
  await page.goto(`${origin}${path}`, { waitUntil: 'networkidle0' });
  return { page, errors };
}

async function waitForOrganizer(page) {
  await page.waitForFunction(() => (
    Boolean(globalThis.PDFLib)
    && Boolean(document.querySelector('[data-simple-file]'))
    && !document.querySelector('[data-simple-file]').disabled
  ));
}

async function installDownloadCaptureAndPdf(page, name = 'ordered.pdf', pageCount = 3) {
  await page.evaluate(async (fileName, totalPages) => {
    const blobs = new Map();
    const nativeCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = nativeCreateObjectURL(blob);
      blobs.set(url, blob);
      return url;
    };
    globalThis.__iteration1Downloads = [];
    HTMLAnchorElement.prototype.click = function click() {
      if (this.download) globalThis.__iteration1Downloads.push({ name: this.download, blob: blobs.get(this.href) });
    };

    const source = await PDFLib.PDFDocument.create({ updateMetadata: false });
    for (let index = 0; index < totalPages; index += 1) source.addPage([101 + index, 201 + index]);
    const file = new File([await source.save()], fileName, { type: 'application/pdf' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.querySelector('[data-simple-file]');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, name, pageCount);
  await page.waitForFunction((expectedPageCount) => (
    document.querySelectorAll('[data-page-index]').length === expectedPageCount
    && document.querySelector('[data-page-count]')?.textContent === String(expectedPageCount)
    && !document.querySelector('[data-organizer-summary]').hidden
  ), {}, pageCount);
}

async function setPagesAndRun(page, expression) {
  await page.$eval('[data-page-list]', (field, value) => {
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('[data-simple-run]').click();
  }, expression);
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-simple-run]');
    const output = document.querySelector('[data-output]');
    return !button.hasAttribute('aria-busy') && !output.hidden;
  });
}

async function downloadResult(page) {
  const previousCount = await page.evaluate(() => globalThis.__iteration1Downloads?.length || 0);
  await page.click('[data-download-simple]');
  await page.waitForFunction((count) => globalThis.__iteration1Downloads?.length > count, {}, previousCount);
}

test('legacy routes preserve modes across refresh, canonicalize storage and search to mode-aware links', async () => {
  const { page, errors } = await openPage('/');
  await page.evaluate(() => {
    localStorage.setItem('aztoolbox-favorites', JSON.stringify([
      'pdf-splitter',
      'pdf-organizer',
      'pdf-page-remover',
      'lorem-ipsum-generator',
    ]));
    localStorage.setItem('aztoolbox-recent', JSON.stringify([
      'pdf-page-extractor',
      'pdf-organizer',
      'slug-generator',
      'text-counter',
    ]));
  });

  const aliases = {
    'pdf-splitter': 'split',
    'pdf-page-extractor': 'extract',
    'pdf-page-remover': 'delete',
  };
  for (const [slug, mode] of Object.entries(aliases)) {
    await page.goto(`${origin}/tool/?slug=${slug}`, { waitUntil: 'networkidle0' });
    const first = await page.evaluate(() => ({
      url: location.href,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      robots: document.querySelector('meta[name="robots"]')?.content || '',
      heading: document.querySelector('h1')?.textContent,
      mode: document.querySelector('.mode-tab[aria-current="page"]')?.getAttribute('href'),
      favorite: document.querySelector('[data-favorite="pdf-organizer"]')?.getAttribute('aria-pressed'),
      recent: JSON.parse(localStorage.getItem('aztoolbox-recent')),
      favorites: JSON.parse(localStorage.getItem('aztoolbox-favorites')),
    }));
    assert.equal(first.url, `${origin}/tool/?slug=${slug}`);
    assert.equal(first.canonical, `${origin}/tool/?slug=pdf-organizer`);
    assert.equal(first.robots, 'noindex,follow');
    assert.match(first.heading, /PDF təşkilatçısı/u);
    assert.match(first.mode, new RegExp(`mode=${mode}$`, 'u'));
    assert.equal(first.favorite, 'true');
    assert.deepEqual(first.recent, [{ slug: 'pdf-organizer', mode }, 'text-counter']);
    assert.deepEqual(first.favorites, [{ slug: 'pdf-organizer', mode: 'split' }]);

    await page.reload({ waitUntil: 'networkidle0' });
    const refreshed = await page.evaluate(() => ({
      url: location.href,
      mode: document.querySelector('.mode-tab[aria-current="page"]')?.getAttribute('href'),
      recent: JSON.parse(localStorage.getItem('aztoolbox-recent')),
    }));
    assert.equal(refreshed.url, `${origin}/tool/?slug=${slug}`);
    assert.match(refreshed.mode, new RegExp(`mode=${mode}$`, 'u'));
    assert.deepEqual(refreshed.recent, [{ slug: 'pdf-organizer', mode }, 'text-counter']);
  }

  await page.evaluate(() => {
    localStorage.setItem('aztoolbox-favorites', JSON.stringify(['pdf-page-extractor']));
    localStorage.setItem('aztoolbox-recent', JSON.stringify(['pdf-page-remover']));
  });
  await page.goto(`${origin}/tools/?view=favorites`, { waitUntil: 'networkidle0' });
  assert.equal(
    await page.$eval('[data-tools-grid] [data-tool-card] h3 a', (link) => link.getAttribute('href')),
    '../tool/?slug=pdf-organizer&mode=extract',
  );
  assert.deepEqual(
    await page.evaluate(() => JSON.parse(localStorage.getItem('aztoolbox-favorites'))),
    [{ slug: 'pdf-organizer', mode: 'extract' }],
  );
  await page.goto(`${origin}/tools/?view=recent`, { waitUntil: 'networkidle0' });
  assert.equal(
    await page.$eval('[data-tools-grid] [data-tool-card] h3 a', (link) => link.getAttribute('href')),
    '../tool/?slug=pdf-organizer&mode=delete',
  );
  assert.deepEqual(
    await page.evaluate(() => JSON.parse(localStorage.getItem('aztoolbox-recent'))),
    [{ slug: 'pdf-organizer', mode: 'delete' }],
  );

  await page.goto(origin, { waitUntil: 'networkidle0' });
  await page.click('[data-open-search]');
  await page.waitForSelector('[data-search-dialog]:not([hidden])');
  for (const [query, mode] of [
    ['PDF splitter', 'split'],
    ['PDF page extractor', 'extract'],
    ['PDF page remover', 'delete'],
  ]) {
    await page.$eval('[data-global-search]', (input, value) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, query);
    const href = await page.$eval('[data-global-results] .search-item', (link) => link.getAttribute('href'));
    assert.equal(href, `./tool/?slug=pdf-organizer&mode=${mode}`);
  }

  await page.goto(`${origin}/tools/`, { waitUntil: 'networkidle0' });
  await page.$eval('[data-catalog-search]', (input) => {
    input.value = 'PDF page extractor';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => document.querySelector('[data-tools-grid] [data-tool-card] h3 a')?.getAttribute('href')?.includes('mode=extract'));
  assert.equal(
    await page.$eval('[data-tools-grid] [data-tool-card] h3 a', (link) => link.getAttribute('href')),
    '../tool/?slug=pdf-organizer&mode=extract',
  );
  assert.deepEqual(errors, []);
  await page.close();
});

test('removed tools stay noindex, open no workspace, add no recent item and remain absent from inventory', async () => {
  const { page, errors } = await openPage('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('aztoolbox-recent', JSON.stringify(['text-counter']));
  });

  for (const slug of ['slug-generator', 'lorem-ipsum-generator']) {
    await page.goto(`${origin}/tool/?slug=${slug}`, { waitUntil: 'networkidle0' });
    const state = await page.evaluate(() => ({
      removed: Boolean(document.querySelector('[data-removed]')),
      workspace: Boolean(document.querySelector('.workspace')),
      canonical: document.querySelector('link[rel="canonical"]')?.href || null,
      robots: document.querySelector('meta[name="robots"]')?.content,
      recent: JSON.parse(localStorage.getItem('aztoolbox-recent')),
      organizer: Boolean(document.querySelector('[data-page-list]')),
    }));
    assert.deepEqual(state, {
      removed: true,
      workspace: false,
      canonical: null,
      robots: 'noindex',
      recent: ['text-counter'],
      organizer: false,
    });
  }

  await page.goto(`${origin}/tools/`, { waitUntil: 'networkidle0' });
  assert.equal(await page.$$eval('[data-tools-grid] [data-tool-card]', (cards) => cards.length), 32);
  for (const query of ['Lorem ipsum', 'Slug yaradan']) {
    await page.$eval('[data-catalog-search]', (input, value) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, query);
    await page.waitForFunction(() => document.querySelectorAll('[data-tools-grid] [data-tool-card]').length === 0);
    assert.equal(await page.$$eval('[data-tools-grid] [data-tool-card]', (cards) => cards.length), 0);
  }
  assert.deepEqual(errors, []);
  await page.close();
});

test('PDF organizer split, extract and delete outputs preserve the approved page semantics and reopen', async () => {
  const { page, errors } = await openPage('/tool/?slug=pdf-organizer&mode=split');
  await waitForOrganizer(page);
  await installDownloadCaptureAndPdf(page);
  await setPagesAndRun(page, '3,1,3');
  await downloadResult(page);
  const split = await page.evaluate(async () => {
    const download = globalThis.__iteration1Downloads.at(-1);
    const bytes = new Uint8Array(await download.blob.arrayBuffer());
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const decoder = new TextDecoder();
    const entries = [];
    let offset = 0;
    while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
      const method = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const nameLength = view.getUint16(offset + 26, true);
      const extraLength = view.getUint16(offset + 28, true);
      const nameStart = offset + 30;
      const dataStart = nameStart + nameLength + extraLength;
      const data = bytes.slice(dataStart, dataStart + compressedSize);
      const pdf = await PDFLib.PDFDocument.load(data, { updateMetadata: false });
      entries.push({
        method,
        name: decoder.decode(bytes.slice(nameStart, nameStart + nameLength)),
        pages: pdf.getPageCount(),
        size: pdf.getPage(0).getSize(),
      });
      offset = dataStart + compressedSize;
    }
    return {
      name: download.name,
      type: download.blob.type,
      signature: view.getUint32(0, true),
      entries,
    };
  });
  assert.equal(split.name, 'ordered-sehifeler.zip');
  assert.equal(split.type, 'application/zip');
  assert.equal(split.signature, 0x04034b50);
  assert.deepEqual(split.entries, [
    { method: 0, name: 'sehife-3.pdf', pages: 1, size: { width: 103, height: 203 } },
    { method: 0, name: 'sehife-1.pdf', pages: 1, size: { width: 101, height: 201 } },
    { method: 0, name: 'sehife-3-2.pdf', pages: 1, size: { width: 103, height: 203 } },
  ]);

  await page.goto(`${origin}/tool/?slug=pdf-organizer&mode=extract`, { waitUntil: 'networkidle0' });
  await waitForOrganizer(page);
  await installDownloadCaptureAndPdf(page);
  await setPagesAndRun(page, '3,1,3');
  await downloadResult(page);
  const extract = await page.evaluate(async () => {
    const download = globalThis.__iteration1Downloads.at(-1);
    const pdf = await PDFLib.PDFDocument.load(await download.blob.arrayBuffer(), { updateMetadata: false });
    return {
      name: download.name,
      type: download.blob.type,
      sizes: pdf.getPages().map((item) => item.getSize()),
    };
  });
  assert.deepEqual(extract, {
    name: 'pdf-page-extractor.pdf',
    type: 'application/pdf',
    sizes: [
      { width: 103, height: 203 },
      { width: 101, height: 201 },
      { width: 103, height: 203 },
    ],
  });

  await page.goto(`${origin}/tool/?slug=pdf-organizer&mode=delete`, { waitUntil: 'networkidle0' });
  await waitForOrganizer(page);
  await installDownloadCaptureAndPdf(page);
  await setPagesAndRun(page, '3,1,3');
  await downloadResult(page);
  const deletion = await page.evaluate(async () => {
    const download = globalThis.__iteration1Downloads.at(-1);
    const pdf = await PDFLib.PDFDocument.load(await download.blob.arrayBuffer(), { updateMetadata: false });
    return {
      name: download.name,
      type: download.blob.type,
      sizes: pdf.getPages().map((item) => item.getSize()),
    };
  });
  assert.deepEqual(deletion, {
    name: 'pdf-page-remover.pdf',
    type: 'application/pdf',
    sizes: [{ width: 102, height: 202 }],
  });

  await page.$eval('[data-page-list]', (field) => {
    field.value = '1-3';
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
  assert.equal(await page.$eval('[data-output]', (output) => output.hidden), true, 'changing input clears the stale result');
  await page.click('[data-simple-run]');
  await page.waitForFunction(() => !document.querySelector('[data-output]').hidden && !document.querySelector('[data-simple-run]').hasAttribute('aria-busy'));
  assert.match(await page.$eval('[data-output]', (output) => output.innerText), /Bütün səhifələri silmək olmaz/u);
  assert.equal(await page.$('[data-download-simple]'), null);
  assert.deepEqual(errors, []);
  await page.close();
});

test('invalid selection is atomic, clears stale output and accepts a valid correction immediately', async () => {
  const { page, errors } = await openPage('/tool/?slug=pdf-organizer&mode=extract');
  await waitForOrganizer(page);
  await installDownloadCaptureAndPdf(page, 'recovery.pdf');

  await setPagesAndRun(page, '1');
  assert.ok(await page.$('[data-download-simple]'));
  await page.$eval('[data-page-list]', (field) => {
    field.value = '3-1';
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const invalidBeforeRun = await page.evaluate(() => ({
    outputHidden: document.querySelector('[data-output]').hidden,
    pageErrorHidden: document.querySelector('[data-page-error]').hidden,
    invalid: document.querySelector('[data-page-list]').getAttribute('aria-invalid'),
    checked: [...document.querySelectorAll('[data-page-index]')].filter((item) => item.checked).length,
  }));
  assert.deepEqual(invalidBeforeRun, {
    outputHidden: true,
    pageErrorHidden: false,
    invalid: 'true',
    checked: 0,
  });

  await page.click('[data-simple-run]');
  await page.waitForFunction(() => !document.querySelector('[data-output]').hidden && !document.querySelector('[data-simple-run]').hasAttribute('aria-busy'));
  assert.equal(await page.$('[data-download-simple]'), null);
  assert.match(await page.$eval('[data-output]', (output) => output.innerText), /1-3/u);

  await page.$eval('[data-page-list]', (field) => {
    field.value = '2';
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const corrected = await page.evaluate(() => ({
    outputHidden: document.querySelector('[data-output]').hidden,
    pageErrorHidden: document.querySelector('[data-page-error]').hidden,
    invalid: document.querySelector('[data-page-list]').hasAttribute('aria-invalid'),
    checked: [...document.querySelectorAll('[data-page-index]')].map((item) => item.checked),
    selected: document.querySelector('[data-selected-count]').textContent,
  }));
  assert.deepEqual(corrected, {
    outputHidden: true,
    pageErrorHidden: true,
    invalid: false,
    checked: [false, true, false],
    selected: '1',
  });
  await setPagesAndRun(page, '2');
  assert.ok(await page.$('[data-download-simple]'));
  await downloadResult(page);
  const recovered = await page.evaluate(async () => {
    const download = globalThis.__iteration1Downloads.at(-1);
    const pdf = await PDFLib.PDFDocument.load(await download.blob.arrayBuffer(), { updateMetadata: false });
    return { count: pdf.getPageCount(), size: pdf.getPage(0).getSize() };
  });
  assert.deepEqual(recovered, { count: 1, size: { width: 102, height: 202 } });
  assert.deepEqual(errors, []);
  await page.close();
});

test('organizer has no horizontal overflow at 320, 375 and 1440 pixels and page checkboxes work by keyboard', async () => {
  const { page, errors } = await openPage('/tool/?slug=pdf-organizer&mode=split');
  for (const width of [320, 375, 1440]) {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${origin}/tool/?slug=pdf-organizer&mode=split`, { waitUntil: 'networkidle0' });
    await waitForOrganizer(page);
    await installDownloadCaptureAndPdf(page, `responsive-${width}.pdf`);
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      cards: document.querySelectorAll('[data-page-index]').length,
    }));
    assert.equal(layout.viewport, width);
    assert.ok(layout.documentWidth <= width, `${width}px document overflowed to ${layout.documentWidth}px`);
    assert.ok(layout.bodyWidth <= width, `${width}px body overflowed to ${layout.bodyWidth}px`);
    assert.equal(layout.cards, 3);

    if (width === 375) {
      await page.waitForFunction(() => document.querySelectorAll('[data-thumbnail-ready]').length === 3, { timeout: 5000 });
      const thumbnails = await page.$$eval('[data-page-thumbnail]', (canvases) => canvases.map((canvas) => ({
        hidden: canvas.hidden,
        width: canvas.width,
        height: canvas.height,
      })));
      assert.equal(thumbnails.length, 3);
      assert.ok(thumbnails.every((thumbnail) => !thumbnail.hidden && thumbnail.width > 0 && thumbnail.height > 0));
    }

    if (width === 320) {
      await page.focus('[data-page-index="0"]');
      await page.keyboard.press('Space');
      await page.waitForFunction(() => document.querySelector('[data-page-index="0"]').checked);
      const keyboard = await page.evaluate(() => ({
        checked: document.querySelector('[data-page-index="0"]').checked,
        expression: document.querySelector('[data-page-list]').value,
        selected: document.querySelector('[data-selected-count]').textContent,
        focused: document.activeElement === document.querySelector('[data-page-index="0"]'),
      }));
      assert.deepEqual(keyboard, { checked: true, expression: '1', selected: '1', focused: true });
    }
  }
  assert.deepEqual(errors, []);
  await page.close();
});

test('PDF.js thumbnails load locally and lazily only after an organizer file is selected', async () => {
  const page = await browser.newPage();
  const errors = watchErrors(page);
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto(`${origin}/tool/?slug=json-formatter`, { waitUntil: 'networkidle0' });
  assert.equal(requests.some((url) => /pdfjs-6\.1\.200/u.test(url)), false);

  await page.goto(`${origin}/tool/?slug=pdf-organizer&mode=split`, { waitUntil: 'networkidle0' });
  await waitForOrganizer(page);
  assert.equal(requests.some((url) => /pdfjs-6\.1\.200/u.test(url)), false, 'thumbnail engine must not load before a file is selected');

  await installDownloadCaptureAndPdf(page, 'thumbnail.pdf');
  await page.waitForFunction(() => document.querySelectorAll('[data-thumbnail-ready]').length === 3, { timeout: 5000 });
  assert.ok(requests.some((url) => url === `${origin}/assets/vendor/pdfjs-6.1.200.min.js`));
  assert.equal(requests.some((url) => !url.startsWith(origin)), false);
  assert.deepEqual(errors, []);
  await page.close();
});

test('organizer rejects malformed, encrypted, oversized and over-500-page PDFs before exposing a workspace result', async () => {
  const { page, errors } = await openPage('/tool/?slug=pdf-organizer&mode=split');
  await waitForOrganizer(page);

  const waitForRejection = async () => {
    await page.waitForFunction(() => {
      const output = document.querySelector('[data-output]');
      const button = document.querySelector('[data-simple-run]');
      return output && !output.hidden && !button.hasAttribute('aria-busy');
    });
    return page.evaluate(() => ({
      message: document.querySelector('[data-output]').innerText,
      pages: document.querySelectorAll('[data-page-index]').length,
      summaryHidden: document.querySelector('[data-organizer-summary]').hidden,
      download: Boolean(document.querySelector('[data-download-simple]')),
    }));
  };

  await page.evaluate(() => {
    const file = new File([Uint8Array.from([0x25, 0x50, 0x44, 0x46, 1, 2, 3])], 'malformed.pdf', { type: 'application/pdf' });
    const transfer = new DataTransfer(); transfer.items.add(file);
    const input = document.querySelector('[data-simple-file]'); input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const malformed = await waitForRejection();
  assert.match(malformed.message, /PDF açıla bilmədi|zədəli/u);
  assert.deepEqual({ ...malformed, message: undefined }, { message: undefined, pages: 0, summaryHidden: true, download: false });

  await page.evaluate((base64) => {
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const file = new File([bytes], 'encrypted.pdf', { type: 'application/pdf' });
    const transfer = new DataTransfer(); transfer.items.add(file);
    const input = document.querySelector('[data-simple-file]'); input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, encryptedPdfBase64);
  const encrypted = await waitForRejection();
  assert.match(encrypted.message, /şifrəli/u);
  assert.deepEqual({ ...encrypted, message: undefined }, { message: undefined, pages: 0, summaryHidden: true, download: false });

  await page.evaluate(() => {
    const limit = 50 * 1024 * 1024;
    const nativeArrayBuffer = Blob.prototype.arrayBuffer;
    globalThis.__oversizedPdfWasRead = false;
    Blob.prototype.arrayBuffer = function arrayBuffer() {
      if (this.size > limit) globalThis.__oversizedPdfWasRead = true;
      return nativeArrayBuffer.call(this);
    };
    const file = new File([Uint8Array.of(0)], 'oversized.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { configurable: true, value: limit + 1 });
    const transfer = new DataTransfer(); transfer.items.add(file);
    const input = document.querySelector('[data-simple-file]'); input.files = transfer.files;
    globalThis.__oversizedPdfReportedSize = input.files[0].size;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    Blob.prototype.arrayBuffer = nativeArrayBuffer;
  });
  const oversized = await waitForRejection();
  assert.match(oversized.message, /50\.0 MB/u);
  assert.equal(await page.evaluate(() => globalThis.__oversizedPdfReportedSize), (50 * 1024 * 1024) + 1);
  assert.equal(await page.evaluate(() => globalThis.__oversizedPdfWasRead), false, 'size validation must run before File.arrayBuffer');
  assert.deepEqual({ ...oversized, message: undefined }, { message: undefined, pages: 0, summaryHidden: true, download: false });

  await page.evaluate(async () => {
    const pdfDocument = await PDFLib.PDFDocument.create({ updateMetadata: false });
    for (let index = 0; index < 501; index += 1) pdfDocument.addPage([10, 10]);
    const file = new File([await pdfDocument.save()], '501-pages.pdf', { type: 'application/pdf' });
    const transfer = new DataTransfer(); transfer.items.add(file);
    const input = document.querySelector('[data-simple-file]'); input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const tooManyPages = await waitForRejection();
  assert.match(tooManyPages.message, /ən çox 500 səhifə/u);
  assert.deepEqual({ ...tooManyPages, message: undefined }, { message: undefined, pages: 0, summaryHidden: true, download: false });

  await installDownloadCaptureAndPdf(page, 'valid-after-rejections.pdf');
  await page.waitForFunction(() => document.querySelectorAll('[data-thumbnail-ready]').length === 3, { timeout: 5000 });
  assert.equal(await page.$eval('[data-page-count]', (element) => element.textContent), '3');
  assert.deepEqual(errors, []);
  await page.close();
});

test('delete mode handles first, middle, last, multiple and duplicate selections while rejecting all pages', async () => {
  const { page, errors } = await openPage('/tool/?slug=pdf-organizer&mode=delete');
  await waitForOrganizer(page);
  await installDownloadCaptureAndPdf(page, 'delete-cases.pdf', 5);

  const cases = [
    { label: 'first', expression: '1', selected: '1', widths: [102, 103, 104, 105] },
    { label: 'middle', expression: '3', selected: '1', widths: [101, 102, 104, 105] },
    { label: 'last', expression: '5', selected: '1', widths: [101, 102, 103, 104] },
    { label: 'multiple', expression: '2,4', selected: '2', widths: [101, 103, 105] },
    { label: 'duplicate', expression: '2,2,4,2', selected: '2', widths: [101, 103, 105] },
  ];

  for (const current of cases) {
    await setPagesAndRun(page, current.expression);
    assert.equal(await page.$eval('[data-selected-count]', (element) => element.textContent), current.selected, current.label);
    await downloadResult(page);
    const output = await page.evaluate(async () => {
      const download = globalThis.__iteration1Downloads.at(-1);
      const document = await PDFLib.PDFDocument.load(await download.blob.arrayBuffer(), { updateMetadata: false });
      return {
        name: download.name,
        type: download.blob.type,
        widths: document.getPages().map((pdfPage) => pdfPage.getWidth()),
      };
    });
    assert.deepEqual(output, {
      name: 'pdf-page-remover.pdf',
      type: 'application/pdf',
      widths: current.widths,
    }, current.label);
  }

  const downloadsBeforeAll = await page.evaluate(() => globalThis.__iteration1Downloads.length);
  await setPagesAndRun(page, '1-5');
  assert.match(await page.$eval('[data-output]', (output) => output.innerText), /Bütün səhifələri silmək olmaz/u);
  assert.equal(await page.$('[data-download-simple]'), null);
  assert.equal(await page.evaluate(() => globalThis.__iteration1Downloads.length), downloadsBeforeAll);
  assert.deepEqual(errors, []);
  await page.close();
});

test('alias and canonical mode navigation survives Back and Forward without redirects or loops', async () => {
  const { page, errors } = await openPage('/tools/');
  await page.goto(`${origin}/tool/?slug=pdf-splitter`, { waitUntil: 'networkidle0' });

  const assertRoute = async (expectedUrl, expectedMode) => {
    await page.waitForFunction((url, mode) => (
      location.href === url
      && document.querySelector('.mode-tab[aria-current="page"]')?.getAttribute('href')?.endsWith(`mode=${mode}`)
    ), {}, expectedUrl, expectedMode);
    const state = await page.evaluate(() => ({
      url: location.href,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      robots: document.querySelector('meta[name="robots"]')?.content,
      workspace: Boolean(document.querySelector('[data-page-list]')),
    }));
    assert.deepEqual(state, {
      url: expectedUrl,
      canonical: `${origin}/tool/?slug=pdf-organizer`,
      robots: 'noindex,follow',
      workspace: true,
    });
  };

  const aliasUrl = `${origin}/tool/?slug=pdf-splitter`;
  const extractUrl = `${origin}/tool/?slug=pdf-organizer&mode=extract`;
  const deleteUrl = `${origin}/tool/?slug=pdf-organizer&mode=delete`;
  await assertRoute(aliasUrl, 'split');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('.mode-tab[href*="mode=extract"]'),
  ]);
  await assertRoute(extractUrl, 'extract');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('.mode-tab[href*="mode=delete"]'),
  ]);
  await assertRoute(deleteUrl, 'delete');

  await page.goBack({ waitUntil: 'networkidle0' });
  await assertRoute(extractUrl, 'extract');
  await page.goBack({ waitUntil: 'networkidle0' });
  await assertRoute(aliasUrl, 'split');
  await page.goForward({ waitUntil: 'networkidle0' });
  await assertRoute(extractUrl, 'extract');
  await page.goForward({ waitUntil: 'networkidle0' });
  await assertRoute(deleteUrl, 'delete');
  assert.deepEqual(errors, []);
  await page.close();
});
