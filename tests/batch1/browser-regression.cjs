const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const test = require('node:test');
const puppeteer = require('puppeteer');

const port = 8877;
const origin = `http://127.0.0.1:${port}`;
let browser;
let server;

const waitForServer = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Test preview did not start');
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

async function openTool(slug) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  await page.goto(`${origin}/tool/?slug=${slug}`, { waitUntil: 'networkidle0' });
  return { page, errors };
}

test('QR preserves exact input, emits correct UTF-8 bytes and handles capacity errors', async () => {
  const { page, errors } = await openTool('qr-generator');
  const result = await page.evaluate(async () => {
    const input = document.querySelector('[data-qr-input]');
    input.value = '  A\u0259\u015f \ud83d\udc69\u200d\ud83d\udcbb  ';
    document.querySelector('[data-qr-generate]').click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const qrHost = document.querySelector('#qr-output');
    const instance = qrHost?.__aztoolboxQr;
    const bytes = instance?._oQRCode?.dataList?.[0]?.parsedData;
    const byteLength = instance?._oQRCode?.dataList?.[0]?.getLength();
    const exactTitle = qrHost?.title || qrHost?.querySelector('canvas')?.parentElement?.title || '';
    const firstCanvas = qrHost.querySelector('canvas');
    const firstCanvasVisible = getComputedStyle(firstCanvas).display !== 'none' && firstCanvas.getBoundingClientRect().width > 0;
    const png = await new Promise((resolve) => firstCanvas.toBlob(resolve, 'image/png'));
    const pngBytes = new Uint8Array(await png.arrayBuffer());
    const dimensions = [[firstCanvas.width, firstCanvas.height]];
    for (const size of ['192', '384']) {
      document.querySelector('[data-qr-size]').value = size;
      document.querySelector('[data-qr-generate]').click();
      await new Promise((resolve) => setTimeout(resolve, 20));
      const canvas = document.querySelector('#qr-output canvas');
      dimensions.push([canvas.width, canvas.height]);
    }

    input.value = 'x'.repeat(1200);
    const highDimensions = [];
    const highByteLengths = [];
    for (const size of ['192', '256', '384']) {
      document.querySelector('[data-qr-size]').value = size;
      document.querySelector('[data-qr-generate]').click();
      await new Promise((resolve) => setTimeout(resolve, 30));
      const canvas = document.querySelector('#qr-output canvas');
      highDimensions.push(canvas ? [canvas.width, canvas.height] : null);
      const data = document.querySelector('#qr-output')?.__aztoolboxQr?._oQRCode?.dataList?.[0];
      highByteLengths.push(data ? [data.getLength(), data.parsedData.length] : null);
    }

    input.value = 'x'.repeat(10000);
    document.querySelector('[data-qr-generate]').click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      bytes,
      byteLength,
      exactTitle,
      pngType: png.type,
      pngSize: png.size,
      pngSignature: [...pngBytes.slice(0, 8)],
      dimensions,
      firstCanvasVisible,
      highDimensions,
      highByteLengths,
      output: document.querySelector('[data-output]').innerText,
      hasCanvasAfterError: Boolean(document.querySelector('#qr-output canvas')),
    };
  });

  const expected = [0xef, 0xbb, 0xbf, ...new TextEncoder().encode('  A\u0259\u015f \ud83d\udc69\u200d\ud83d\udcbb  ')];
  assert.deepEqual(result.bytes, expected);
  assert.equal(result.byteLength, expected.length);
  assert.equal(result.exactTitle, '  A\u0259\u015f \ud83d\udc69\u200d\ud83d\udcbb  ');
  assert.equal(result.pngType, 'image/png');
  assert.equal(result.firstCanvasVisible, true);
  assert.ok(result.pngSize > 100);
  assert.deepEqual(result.pngSignature, [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.deepEqual(result.dimensions, [[256, 256], [192, 192], [384, 384]]);
  assert.deepEqual(result.highDimensions, [[192, 192], [256, 256], [384, 384]]);
  assert.deepEqual(result.highByteLengths, [[1200, 1200], [1200, 1200], [1200, 1200]]);
  assert.match(result.output, /çox uzundur/u);
  assert.equal(result.hasCanvasAfterError, false);
  assert.deepEqual(errors, []);
  await page.close();
});

test('PDF metadata output reopens without Info metadata and preserves page size', async () => {
  const { page, errors } = await openTool('pdf-metadata-remover');
  const result = await page.evaluate(async () => {
    const source = await PDFLib.PDFDocument.create({ updateMetadata: false });
    source.addPage([123, 234]);
    source.setTitle('Secret');
    source.setCreator('Original');
    source.setProducer('Original');
    const file = new File([await source.save()], 'meta.pdf', { type: 'application/pdf' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.querySelector('[data-simple-file]');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    document.querySelector('[data-simple-run]').click();
    await new Promise((resolve) => setTimeout(resolve, 150));

    const originalCreate = URL.createObjectURL.bind(URL);
    let downloaded;
    URL.createObjectURL = (blob) => {
      downloaded = blob;
      return originalCreate(blob);
    };
    document.querySelector('[data-download-simple]').click();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const bytes = new Uint8Array(await downloaded.arrayBuffer());
    const cleaned = await PDFLib.PDFDocument.load(bytes, { updateMetadata: false });
    return {
      signature: new TextDecoder('latin1').decode(bytes.slice(0, 5)),
      type: downloaded.type,
      pages: cleaned.getPageCount(),
      size: cleaned.getPage(0).getSize(),
      hasInfo: Boolean(cleaned.context.trailerInfo.Info),
      creator: cleaned.getCreator(),
      producer: cleaned.getProducer(),
    };
  });

  assert.deepEqual(result, {
    signature: '%PDF-',
    type: 'application/pdf',
    pages: 1,
    size: { width: 123, height: 234 },
    hasInfo: false,
  });
  assert.deepEqual(errors, []);
  await page.close();
});

test('Image-to-PDF rejects unsafe input before embed, stays atomic and recovers', async () => {
  const { page, errors } = await openTool('image-to-pdf');
  const result = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 3; canvas.height = 2;
    canvas.getContext('2d').fillRect(0, 0, 3, 2);
    const validBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const valid = new File([validBlob], 'valid.png', { type: 'image/png' });
    const oversized = new File([Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
      0, 0, 0x20, 0x01, 0, 0, 0, 1, 8, 6, 0, 0, 0,
    ])], 'oversized.png', { type: 'image/png' });
    const corrupt = new File([Uint8Array.from([1, 2, 3])], 'corrupt.png', { type: 'image/png' });
    const input = document.querySelector('[data-simple-files]');
    const runButton = document.querySelector('[data-simple-run]');
    const prototype = PDFLib.PDFDocument.prototype;
    const originalEmbedPng = prototype.embedPng;
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);
    let embedCalls = 0;
    let downloaded;
    prototype.embedPng = function embedPng(...args) {
      embedCalls += 1;
      return originalEmbedPng.apply(this, args);
    };
    URL.createObjectURL = (blob) => {
      if (blob.type === 'application/pdf') downloaded = blob;
      return originalCreateObjectURL(blob);
    };
    const attempt = async (files) => {
      const transfer = new DataTransfer();
      files.forEach((file) => transfer.items.add(file));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change'));
      runButton.click();
      await new Promise((resolve, reject) => {
        const started = performance.now();
        const poll = () => {
          if (!runButton.hasAttribute('aria-busy') && !document.querySelector('[data-output]').hidden) return resolve();
          if (performance.now() - started > 3000) return reject(new Error('Image-to-PDF attempt timed out'));
          setTimeout(poll, 20);
        };
        poll();
      });
      return {
        text: document.querySelector('[data-output]').innerText,
        buttons: document.querySelectorAll('[data-output] button').length,
        embedCalls,
      };
    };

    try {
      const firstValid = await attempt([valid]);
      const oversizedResult = await attempt([oversized]);
      const corruptResult = await attempt([corrupt]);
      const mixedResult = await attempt([valid, corrupt]);
      const recovered = await attempt([valid]);
      document.querySelector('[data-download-simple]').click();
      await new Promise((resolve) => setTimeout(resolve, 20));
      const bytes = new Uint8Array(await downloaded.arrayBuffer());
      const pdf = await PDFLib.PDFDocument.load(bytes, { updateMetadata: false });
      return {
        firstValid,
        oversizedResult,
        corruptResult,
        mixedResult,
        recovered,
        outputSignature: new TextDecoder('latin1').decode(bytes.slice(0, 5)),
        outputPages: pdf.getPageCount(),
        outputSize: pdf.getPage(0).getSize(),
      };
    } finally {
      prototype.embedPng = originalEmbedPng;
      URL.createObjectURL = originalCreateObjectURL;
    }
  });

  assert.equal(result.firstValid.buttons, 1);
  assert.match(result.firstValid.text, /u\u011furla tamamland\u0131/u);
  assert.equal(result.firstValid.embedCalls, 1);
  assert.equal(result.oversizedResult.embedCalls, 1, 'oversized dimensions must be rejected before embed/decode');
  assert.match(result.oversizedResult.text, /8192/u);
  assert.equal(result.oversizedResult.buttons, 0, 'failure must clear the prior successful download');
  assert.equal(result.corruptResult.embedCalls, 1, 'corrupt bytes must be rejected before embed/decode');
  assert.match(result.corruptResult.text, /format\u0131 tan\u0131nmad\u0131/u);
  assert.equal(result.corruptResult.buttons, 0);
  assert.equal(result.mixedResult.embedCalls, 1, 'mixed input must be fully preflighted before any image is embedded');
  assert.equal(result.mixedResult.buttons, 0, 'mixed valid/invalid input must not publish a partial PDF');
  assert.doesNotMatch(result.mixedResult.text, /u\u011furla tamamland\u0131/u);
  assert.equal(result.recovered.embedCalls, 2);
  assert.equal(result.recovered.buttons, 1);
  assert.match(result.recovered.text, /u\u011furla tamamland\u0131/u);
  assert.equal(result.outputSignature, '%PDF-');
  assert.equal(result.outputPages, 1);
  assert.deepEqual(result.outputSize, { width: 3, height: 2 });
  assert.deepEqual(errors, []);
  await page.close();
});

test('PDF page grammar rejects unsafe input atomically and accepts valid input after errors', async () => {
  const { page, errors } = await openTool('pdf-page-extractor');
  const result = await page.evaluate(async () => {
    const source = await PDFLib.PDFDocument.create({ updateMetadata: false });
    for (let index = 0; index < 5; index += 1) source.addPage([100 + index, 200 + index]);
    const file = new File([await source.save()], 'pages.pdf', { type: 'application/pdf' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.querySelector('[data-simple-file]');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    await new Promise((resolve, reject) => {
      const started = performance.now();
      const poll = () => {
        const summary = document.querySelector('[data-organizer-summary]');
        if (summary && !summary.hidden) return resolve();
        if (performance.now() - started > 3000) return reject(new Error('PDF organizer load timeout'));
        setTimeout(poll, 20);
      };
      poll();
    });
    const field = document.querySelector('[data-page-list]');
    const run = document.querySelector('[data-simple-run]');
    const attempt = async (value) => {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      run.click();
      await new Promise((resolve) => setTimeout(resolve, 40));
      return document.querySelector('[data-output]').innerText;
    };
    const reversed = await attempt('5-3');
    const partial = await attempt('1,abc,4');
    const huge = await attempt('1-999999999');
    const valid = await attempt('3,1,3');
    const originalCreate = URL.createObjectURL.bind(URL);
    let downloaded;
    URL.createObjectURL = (blob) => { downloaded = blob; return originalCreate(blob); };
    document.querySelector('[data-download-simple]').click();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const output = await PDFLib.PDFDocument.load(await downloaded.arrayBuffer(), { updateMetadata: false });
    return {
      reversed,
      partial,
      huge,
      valid,
      pages: output.getPageCount(),
      sizes: output.getPages().map((pdfPage) => pdfPage.getSize()),
    };
  });

  assert.match(result.reversed, /3-5/u);
  assert.match(result.partial, /abc/u);
  assert.match(result.huge, /1-5/u);
  assert.match(result.valid, /uğurla tamamlandı/u);
  assert.equal(result.pages, 3);
  assert.deepEqual(result.sizes, [{ width: 102, height: 202 }, { width: 100, height: 200 }, { width: 102, height: 202 }]);
  assert.deepEqual(errors, []);
  await page.close();
});

test('compressor preserves PNG transparency and does not claim a larger file is compressed', async () => {
  const { page, errors } = await openTool('image-compressor');
  const result = await page.evaluate(async () => {
    const created = [];
    const originalCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      created.push(blob);
      return originalCreate(blob);
    };
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, 2, 2);
    context.fillStyle = 'rgba(255, 0, 0, .25)';
    context.fillRect(0, 0, 1, 1);
    const source = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const file = new File([source], 'tiny.png', { type: 'image/png' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.querySelector('[data-simple-file]');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    document.querySelector('[data-simple-run]').click();
    await new Promise((resolve) => setTimeout(resolve, 150));
    const candidate = created.filter((blob) => !(blob instanceof File)).at(-1);
    const bitmap = await createImageBitmap(candidate);
    const check = document.createElement('canvas');
    check.width = bitmap.width;
    check.height = bitmap.height;
    const checkContext = check.getContext('2d');
    checkContext.drawImage(bitmap, 0, 0);
    const alpha = checkContext.getImageData(1, 1, 1, 1).data[3];
    return {
      sourceSize: source.size,
      candidateSize: candidate.size,
      candidateType: candidate.type,
      alpha,
      output: document.querySelector('[data-output]').innerText,
      buttons: [...document.querySelectorAll('[data-output] button')].map((button) => button.textContent.trim()),
    };
  });

  assert.equal(result.candidateType, 'image/png');
  assert.equal(result.alpha, 0);
  if (result.candidateSize >= result.sourceSize) {
    assert.match(result.output, /ölçü azalmadı/iu);
    assert.deepEqual(result.buttons, ['Orijinalı saxla', 'Yenə də PNG-i endir']);
  } else {
    assert.match(result.output, /azaldı/u);
  }
  assert.deepEqual(errors, []);
  await page.close();
});

test('compressor preserves JPEG/WebP MIME, signature, dimensions, alpha and download extension', async () => {
  const { page, errors } = await openTool('image-compressor');
  const results = await page.evaluate(async () => {
    const originalCreate = URL.createObjectURL.bind(URL);
    const created = [];
    URL.createObjectURL = (blob) => { created.push(blob); return originalCreate(blob); };
    let downloadedName = '';
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function click() { downloadedName = this.download; };
    const outputs = [];
    for (const type of ['image/jpeg', 'image/webp']) {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const context = canvas.getContext('2d');
      const imageData = context.createImageData(256, 256);
      let seed = 0x12345678;
      const randomByte = () => {
        seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
        return seed & 0xff;
      };
      for (let index = 0; index < imageData.data.length; index += 4) {
        imageData.data[index] = randomByte();
        imageData.data[index + 1] = randomByte();
        imageData.data[index + 2] = randomByte();
        imageData.data[index + 3] = type === 'image/webp' && index === 0 ? 0 : 255;
      }
      context.putImageData(imageData, 0, 0);
      const source = await new Promise((resolve) => canvas.toBlob(resolve, type, 1));
      const extension = type === 'image/jpeg' ? 'jpg' : 'webp';
      const file = new File([source], `noise.${extension}`, { type });
      const transfer = new DataTransfer(); transfer.items.add(file);
      const input = document.querySelector('[data-simple-file]'); input.files = transfer.files; input.dispatchEvent(new Event('change'));
      document.querySelector('[data-quality]').value = '20';
      document.querySelector('[data-quality]').dispatchEvent(new Event('input'));
      const start = created.length;
      document.querySelector('[data-simple-run]').click();
      const deadline = performance.now() + 3000;
      let candidate;
      while (performance.now() < deadline) {
        candidate = created.slice(start).filter((blob) => !(blob instanceof File)).at(-1);
        if (candidate && document.querySelector('[data-simple-run]').getAttribute('aria-busy') !== 'true') break;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      if (!candidate) throw new Error(`Compressor did not publish a ${type} result`);
      const bytes = new Uint8Array(await candidate.arrayBuffer());
      const bitmap = await createImageBitmap(candidate);
      const check = document.createElement('canvas'); check.width = bitmap.width; check.height = bitmap.height;
      const checkContext = check.getContext('2d'); checkContext.drawImage(bitmap, 0, 0);
      const alpha = checkContext.getImageData(0, 0, 1, 1).data[3];
      document.querySelector('[data-download-simple]').click();
      outputs.push({
        type,
        sourceSize: source.size,
        candidateSize: candidate.size,
        candidateType: candidate.type,
        signature: [...bytes.slice(0, 12)],
        width: bitmap.width,
        height: bitmap.height,
        alpha,
        downloadedName,
      });
    }
    HTMLAnchorElement.prototype.click = originalClick;
    return outputs;
  });

  for (const result of results) {
    assert.equal(result.candidateType, result.type);
    assert.ok(result.candidateSize < result.sourceSize);
    assert.equal(result.width, 256);
    assert.equal(result.height, 256);
    assert.equal(result.downloadedName, `image-compressor.${result.type === 'image/jpeg' ? 'jpg' : 'webp'}`);
  }
  assert.deepEqual(results[0].signature.slice(0, 3), [255, 216, 255]);
  assert.equal(String.fromCharCode(...results[1].signature.slice(0, 4)), 'RIFF');
  assert.equal(String.fromCharCode(...results[1].signature.slice(8, 12)), 'WEBP');
  assert.equal(results[1].alpha, 0);
  assert.deepEqual(errors, []);
  await page.close();
});

test('compressor fails closed for null Blob and MIME fallback output', async () => {
  const { page, errors } = await openTool('image-compressor');
  const result = await page.evaluate(async () => {
    const sourceCanvas = document.createElement('canvas'); sourceCanvas.width = 4; sourceCanvas.height = 4;
    sourceCanvas.getContext('2d').fillRect(0, 0, 4, 4);
    const png = await new Promise((resolve) => sourceCanvas.toBlob(resolve, 'image/png'));
    const webp = await new Promise((resolve) => sourceCanvas.toBlob(resolve, 'image/webp'));
    const input = document.querySelector('[data-simple-file]');
    const choose = (blob, name, type) => {
      const transfer = new DataTransfer(); transfer.items.add(new File([blob], name, { type }));
      input.files = transfer.files; input.dispatchEvent(new Event('change'));
    };
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const waitForAttempt = () => new Promise((resolve, reject) => {
      const started = performance.now();
      const poll = () => {
        const run = document.querySelector('[data-simple-run]'); const output = document.querySelector('[data-output]');
        if (!run.hasAttribute('aria-busy') && !output.hidden) return resolve();
        if (performance.now() - started > 3000) return reject(new Error('Compressor attempt timed out'));
        setTimeout(poll, 20);
      };
      poll();
    });

    choose(png, 'source.png', 'image/png');
    document.querySelector('[data-simple-run]').click();
    await waitForAttempt();
    const priorResultHadButtons = document.querySelectorAll('[data-output] button').length > 0;
    HTMLCanvasElement.prototype.toBlob = function toBlob(callback) { callback(null); };
    document.querySelector('[data-simple-run]').click();
    await waitForAttempt();
    const nullOutput = document.querySelector('[data-output]').innerText;
    const nullButtons = document.querySelectorAll('[data-output] button').length;

    choose(webp, 'source.webp', 'image/webp');
    HTMLCanvasElement.prototype.toBlob = function toBlob(callback) { callback(png); };
    document.querySelector('[data-simple-run]').click();
    await waitForAttempt();
    const fallbackOutput = document.querySelector('[data-output]').innerText;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
    return { priorResultHadButtons, nullOutput, nullButtons, fallbackOutput };
  });

  assert.equal(result.priorResultHadButtons, true);
  assert.match(result.nullOutput, /çıxışını yarada bilmədi/u);
  assert.doesNotMatch(result.nullOutput, /uğurla tamamlandı/u);
  assert.equal(result.nullButtons, 0);
  assert.match(result.fallbackOutput, /çıxış formatını dəstəkləmir/u);
  assert.doesNotMatch(result.fallbackOutput, /uğurla tamamlandı/u);
  assert.deepEqual(errors, []);
  await page.close();
});

test('animated image and over-limit text fail clearly without stale success', async () => {
  const image = await openTool('image-compressor');
  const animatedResult = await image.page.evaluate(async () => {
    const bytes = Uint8Array.from([
      0x52, 0x49, 0x46, 0x46, 22, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x58, 10, 0, 0, 0,
      0x02, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const file = new File([bytes], 'animated.webp', { type: 'image/webp' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.querySelector('[data-simple-file]');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    document.querySelector('[data-simple-run]').click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    return document.querySelector('[data-output]').innerText;
  });
  assert.match(animatedResult, /animasiyanı saxlamır/u);
  assert.doesNotMatch(animatedResult, /uğurla tamamlandı/u);
  assert.deepEqual(image.errors, []);
  await image.page.close();

  const json = await openTool('json-formatter');
  const textResult = await json.page.evaluate(() => {
    const input = document.querySelector('[data-json-input]');
    input.value = `"${'x'.repeat(1000001)}"`;
    document.querySelector('[data-json-format]').click();
    return document.querySelector('[data-output]').innerText;
  });
  assert.match(textResult, /çox uzundur/u);
  assert.doesNotMatch(textResult, /uğurla tamamlandı/u);
  assert.deepEqual(json.errors, []);
  await json.page.close();

  const regex = await openTool('regex-tester');
  const regexResult = await regex.page.evaluate(() => {
    document.querySelector('[data-pattern]').value = 'a'.repeat(1025);
    document.querySelector('[data-simple-input]').value = 'a';
    document.querySelector('[data-simple-run]').click();
    return document.querySelector('[data-output]').innerText;
  });
  assert.match(regexResult, /çox uzundur/u);
  assert.doesNotMatch(regexResult, /uğurla tamamlandı/u);
  assert.deepEqual(regex.errors, []);
  await regex.page.close();
});

test('previously passing tools retain representative behavior and direct routes', async () => {
  const cases = [
    ['line-sorter', async (page) => page.evaluate(() => { document.querySelector('[data-cleanup-input]').value = 'ş\na\nç'; document.querySelector('[data-cleanup-preview]').click(); return document.querySelector('[data-cleanup-output]').value; }), 'a\nç\nş'],
    ['whitespace-cleaner', async (page) => page.evaluate(() => { document.querySelector('[data-cleanup-input]').value = '  bir   iki  \n\n üç '; document.querySelector('[data-cleanup-preview]').click(); return document.querySelector('[data-cleanup-output]').value; }), 'bir iki\nüç'],
    ['url-encoder', async (page) => page.evaluate(() => { document.querySelector('[data-simple-input]').value = 'A B/ə'; document.querySelector('[data-encode]').click(); return document.querySelector('.output-code').textContent; }), encodeURIComponent('A B/ə')],
    ['hash-generator', async (page) => { await page.evaluate(() => { document.querySelector('[data-simple-input]').value = 'abc'; document.querySelector('[data-simple-run]').click(); }); await new Promise((resolve) => setTimeout(resolve, 50)); return page.$eval('.output-code', (element) => element.textContent); }, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
  ];
  for (const [slug, run, expected] of cases) {
    const { page, errors } = await openTool(slug);
    assert.ok(await page.$('h1'));
    assert.equal(await run(page), expected);
    assert.deepEqual(errors, []);
    await page.close();
  }
});

test('all registered tool routes still render directly without page errors', async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${origin}/tools/`, { waitUntil: 'domcontentloaded' });
  const tools = await page.evaluate(async () => (await import('../assets/js/tools-data.js')).tools.map(({ slug, name }) => ({ slug, name })));
  for (const tool of tools) {
    await page.goto(`${origin}/tool/?slug=${encodeURIComponent(tool.slug)}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1');
    assert.equal(await page.$eval('h1', (heading) => heading.textContent), tool.name);
  }
  assert.equal(tools.length, 32);
  assert.deepEqual(errors, []);
  await page.close();
});
