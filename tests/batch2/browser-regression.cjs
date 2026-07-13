const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const test = require('node:test');
const puppeteer = require('puppeteer');

const port = 8878;
const origin = `http://127.0.0.1:${port}`;
let browser;
let server;

const waitForServer = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Batch 2 preview did not start');
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

async function openTool(slug) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('requestfailed', (request) => { if (request.url().startsWith(origin)) errors.push(`network: ${request.url()} — ${request.failure()?.errorText}`); });
  await page.goto(`${origin}/tool/?slug=${slug}`, { waitUntil: 'networkidle0' });
  return { page, errors };
}

test('transliteration preserves the reviewed alphabet, case, punctuation and round trips', async () => {
  const { page, errors } = await openTool('az-transliterator');
  const result = await page.evaluate(() => {
    const input = document.querySelector('[data-simple-input]');
    const mode = document.querySelector('[data-mode]');
    const run = document.querySelector('[data-simple-run]');
    const latin = 'abcçdeəfgğhxıijkqlmnoöprsştuüvyzABCÇDEƏFGĞHXIİJKQLMNOÖPRSŞTUÜVYZ';
    input.value = latin;
    run.click();
    const cyrillic = document.querySelector('[data-output] pre').textContent;
    mode.value = 'cyr-latin'; input.value = cyrillic; run.click();
    const roundTrip = document.querySelector('[data-output] pre').textContent;
    mode.value = 'latin-cyr'; input.value = 'Gəncə, Bakı! g/q/j/y — 😀'; run.click();
    return { latin, cyrillic, roundTrip, sentence: document.querySelector('[data-output] pre').textContent };
  });
  assert.equal(result.cyrillic, 'абҹчдеәфҝғһхыижкглмноөпрсштуүвјзАБҸЧДЕӘФҜҒҺХЫИЖКГЛМНОӨПРСШТУҮВЈЗ');
  assert.equal(result.roundTrip, result.latin);
  assert.equal(result.sentence, 'Ҝәнҹә, Бакы! ҝ/г/ж/ј — 😀');
  assert.deepEqual(errors, []);
  await page.close();
});

test('password generator validates options and guarantees every selected group', async () => {
  const { page, errors } = await openTool('password-generator');
  const result = await page.evaluate(() => {
    const button = document.querySelector('[data-password-generate]');
    const number = document.querySelector('[data-password-number]');
    const boxes = [...document.querySelectorAll('[data-password-set]')];
    const setLength = (value) => { number.value = value; number.dispatchEvent(new Event('input')); };
    boxes.forEach((box) => { box.checked = false; }); button.click();
    const noGroup = document.querySelector('[data-output]').innerText;
    boxes.forEach((box) => { box.checked = true; }); setLength('7'); button.click();
    const invalidLength = document.querySelector('[data-output]').innerText;
    setLength('8');
    const values = [];
    for (let index = 0; index < 500; index += 1) {
      button.click(); values.push(document.querySelector('[data-output] code').textContent);
    }
    setLength('64'); button.click();
    return { noGroup, invalidLength, values, maximum: document.querySelector('[data-output] code').textContent };
  });
  assert.match(result.noGroup, /Ən azı bir simvol qrupu/u);
  assert.match(result.invalidLength, /8.*64/u);
  assert.equal(new Set(result.values).size, 500);
  result.values.forEach((value) => {
    assert.equal(value.length, 8);
    assert.match(value, /[A-Z]/u); assert.match(value, /[a-z]/u); assert.match(value, /\d/u); assert.match(value, /[!@#$%&*+\-=?]/u);
  });
  assert.equal(result.maximum.length, 64);
  assert.deepEqual(errors, []);
  await page.close();
});

test('password strength gives conservative explanations and uses password input semantics', async () => {
  const { page, errors } = await openTool('password-strength');
  const result = await page.evaluate(() => {
    const input = document.querySelector('[data-simple-input]');
    const run = document.querySelector('[data-simple-run]');
    const assess = (value) => { input.value = value; run.click(); return document.querySelector('[data-output]').innerText; };
    return {
      type: input.type,
      common: assess('Password1234!'),
      repeated: assess('aaaaaaaaAAAA1111!!!!'),
      sequence: assess('Abcd1234!'),
      passphrase: assess('narıncı dəniz sakit külək fənər'),
      empty: assess(''),
    };
  });
  assert.equal(result.type, 'password');
  for (const text of [result.common, result.repeated, result.sequence]) {
    assert.match(text, /(Çox zəif|Zəif).*1\/4/u);
    assert.match(text, /Səbəb/u);
    assert.match(text, /Tövsiyə/u);
  }
  assert.match(result.passphrase, /Güclü görünür/u);
  assert.match(result.passphrase, /lokal təxmini/u);
  assert.match(result.empty, /Parolu daxil edin/u);
  assert.deepEqual(errors, []);
  await page.close();
});

test('AZ IBAN validates the published BBAN subtype and avoids account-existence claims', async () => {
  const { page, errors } = await openTool('az-iban-validator');
  const result = await page.evaluate(() => {
    const input = document.querySelector('[data-simple-input]');
    const run = document.querySelector('[data-simple-run]');
    const check = (value) => { input.value = value; run.click(); return document.querySelector('[data-output]').innerText; };
    return {
      valid: check('az21 nabz 0000 0000 1370 1000 1944'),
      numericBank: check('AZ97000000000000000000000000'),
      wrongChecksum: check('AZ20NABZ00000000137010001944'),
      empty: check(''),
    };
  });
  assert.match(result.valid, /formatı və checksum uyğundur/u);
  assert.match(result.valid, /bankın və hesabın mövcudluğunu təsdiqləmir/u);
  assert.match(result.numericBank, /bank identifikatoru 4 hərfdən/u);
  assert.match(result.wrongChecksum, /checksum/u);
  assert.match(result.empty, /IBAN daxil edin/u);
  assert.deepEqual(errors, []);
  await page.close();
});

test('Image-to-PDF supports ordered PNG/JPEG/WebP, alpha, orientation, atomic failures and recovery', async () => {
  const { page, errors } = await openTool('image-to-pdf');
  const result = await page.evaluate(async () => {
    const input = document.querySelector('[data-simple-files]');
    const run = document.querySelector('[data-simple-run]');
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);
    let downloaded;
    URL.createObjectURL = (blob) => {
      if (blob.type === 'application/pdf') downloaded = blob;
      return originalCreateObjectURL(blob);
    };
    const makeImage = async (width, height, type, alpha = false) => {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d');
      if (alpha) { context.clearRect(0, 0, width, height); context.fillStyle = 'rgba(255,0,0,.45)'; }
      else context.fillStyle = type === 'image/jpeg' ? '#1648cc' : '#2a9d52';
      context.fillRect(0, 0, Math.max(1, width - 1), Math.max(1, height - 1));
      return new Promise((resolve) => canvas.toBlob(resolve, type, .9));
    };
    const addExifOrientation = (blob) => blob.arrayBuffer().then((buffer) => {
      const source = new Uint8Array(buffer);
      const exif = Uint8Array.from([
        0xff,0xe1,0x00,0x22, 0x45,0x78,0x69,0x66,0,0,
        0x49,0x49,0x2a,0,0x08,0,0,0, 0x01,0,
        0x12,0x01,0x03,0,0x01,0,0,0,0x06,0,0,0, 0,0,0,0,
      ]);
      const output = new Uint8Array(source.length + exif.length);
      output.set(source.slice(0, 2)); output.set(exif, 2); output.set(source.slice(2), 2 + exif.length);
      return new Blob([output], { type: 'image/jpeg' });
    });
    const png = new File([await makeImage(3, 2, 'image/png', true)], '01-alpha.png', { type: 'image/png' });
    const jpeg = new File([await makeImage(4, 3, 'image/jpeg')], '02-photo.jpg', { type: 'image/jpeg' });
    const webpBlob = await makeImage(5, 4, 'image/webp', true);
    const webpMismatchedMime = new File([webpBlob], '03-şəkil.WEBP', { type: 'image/jpeg' });
    const oriented = new File([await addExifOrientation(await makeImage(6, 3, 'image/jpeg'))], '04-oriented.jpg', { type: 'image/jpeg' });
    const corrupt = new File([Uint8Array.from([1, 2, 3])], 'bad.webp', { type: 'image/webp' });
    const animated = new File([Uint8Array.from([
      0x52,0x49,0x46,0x46,0x16,0,0,0,0x57,0x45,0x42,0x50,
      0x56,0x50,0x38,0x58,0x0a,0,0,0,0x02,0,0,0,0,0,0,0,0,0,
    ])], 'animated.webp', { type: 'image/webp' });
    const animatedPng = new File([Uint8Array.from([
      0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,
      0,0,0,13,0x49,0x48,0x44,0x52, 0,0,0,1,0,0,0,1,8,6,0,0,0,0,0,0,0,
      0,0,0,8,0x61,0x63,0x54,0x4c, 0,0,0,2,0,0,0,0,0,0,0,0,
    ])], 'animated.png', { type: 'image/png' });
    const gif = new File([Uint8Array.from([0x47,0x49,0x46,0x38,0x39,0x61])], 'animated.gif', { type: 'image/gif' });
    const setFiles = (files) => {
      const transfer = new DataTransfer(); files.forEach((file) => transfer.items.add(file));
      input.files = transfer.files; input.dispatchEvent(new Event('change'));
    };
    const attempt = async (files) => {
      downloaded = undefined; setFiles(files); run.click();
      for (let index = 0; index < 100 && run.hasAttribute('aria-busy'); index += 1) await new Promise((resolve) => setTimeout(resolve, 25));
      return { text: document.querySelector('[data-output]').innerText, buttons: document.querySelectorAll('[data-output] button').length };
    };
    try {
      const first = await attempt([png, jpeg, webpMismatchedMime, oriented]);
      document.querySelector('[data-download-simple]').click(); await new Promise((resolve) => setTimeout(resolve, 20));
      const bytes = new Uint8Array(await downloaded.arrayBuffer());
      const pdf = await PDFLib.PDFDocument.load(bytes, { updateMetadata: false });
      const imageStreams = pdf.context.enumerateIndirectObjects().map(([, object]) => object).filter((object) => object?.dict?.get(PDFLib.PDFName.of('Subtype'))?.toString() === '/Image');
      const alphaMasks = imageStreams.filter((object) => object.dict.has(PDFLib.PDFName.of('SMask'))).length;
      const mixed = await attempt([png, corrupt]);
      const animatedResult = await attempt([animated]);
      const animatedPngResult = await attempt([animatedPng]);
      const gifResult = await attempt([gif]);
      const recovered = await attempt([webpMismatchedMime]);
      document.querySelector('[data-download-simple]').click(); await new Promise((resolve) => setTimeout(resolve, 20));
      const recoveryBytes = new Uint8Array(await downloaded.arrayBuffer());
      const recoveryPdf = await PDFLib.PDFDocument.load(recoveryBytes, { updateMetadata: false });
      return {
        first, signature: new TextDecoder('latin1').decode(bytes.slice(0, 5)), pages: pdf.getPageCount(),
        sizes: pdf.getPages().map((pdfPage) => pdfPage.getSize()), alphaMasks,
        mixed, animatedResult, animatedPngResult, gifResult, recovered, recoveryPages: recoveryPdf.getPageCount(),
      };
    } finally { URL.createObjectURL = originalCreateObjectURL; }
  });
  assert.match(result.first.text, /uğurla tamamlandı/u);
  assert.equal(result.first.buttons, 1);
  assert.equal(result.signature, '%PDF-');
  assert.equal(result.pages, 4);
  assert.deepEqual(result.sizes, [
    { width: 3, height: 2 }, { width: 4, height: 3 }, { width: 5, height: 4 }, { width: 3, height: 6 },
  ]);
  assert.ok(result.alphaMasks >= 2, `expected alpha masks for transparent PNG and WebP, got ${result.alphaMasks}`);
  assert.equal(result.mixed.buttons, 0); assert.doesNotMatch(result.mixed.text, /uğurla tamamlandı/u); assert.match(result.mixed.text, /formatı tanınmadı/u);
  assert.equal(result.animatedResult.buttons, 0); assert.match(result.animatedResult.text, /animasiyanı saxlamır/u);
  assert.equal(result.animatedPngResult.buttons, 0); assert.match(result.animatedPngResult.text, /animasiyanı saxlamır/u);
  assert.equal(result.gifResult.buttons, 0); assert.match(result.gifResult.text, /animasiyanı saxlamır/u);
  assert.equal(result.recovered.buttons, 1); assert.equal(result.recoveryPages, 1);
  assert.deepEqual(errors, []);
  await page.close();
});
