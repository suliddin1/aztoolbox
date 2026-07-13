const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const test = require('node:test');
const puppeteer = require('puppeteer');

const port = 8880;
const origin = `http://127.0.0.1:${port}`;
let browser;
let server;

const waitForServer = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Batch 4 preview did not start');
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
  await page.goto(`${origin}/tool/?slug=${slug}`, { waitUntil: 'networkidle0' });
  return { page, errors };
}

test('PDF tools enforce approved order, duplicate and split ZIP semantics', async () => {
  const { page, errors } = await openTool('pdf-page-extractor');
  const result = await page.evaluate(async (baseUrl) => {
    const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    const installDownloads = () => {
      const blobs = new Map(); const downloads = [];
      const originalCreate = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => { const url = originalCreate(blob); blobs.set(url, blob); return url; };
      HTMLAnchorElement.prototype.click = function click() { downloads.push({ name: this.download, blob: blobs.get(this.href) }); };
      return downloads;
    };
    const downloads = installDownloads();
    const source = await PDFLib.PDFDocument.create({ updateMetadata: false });
    for (let index = 0; index < 3; index += 1) source.addPage([101 + index, 201 + index]);
    const file = new File([await source.save()], 'ordered.pdf', { type: 'application/pdf' });
    const readStoredZip = (bytes) => {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); const decoder = new TextDecoder(); const entries = [];
      let offset = 0;
      while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
        const method = view.getUint16(offset + 8, true); const size = view.getUint32(offset + 18, true);
        const nameLength = view.getUint16(offset + 26, true); const extraLength = view.getUint16(offset + 28, true);
        const nameStart = offset + 30; const dataStart = nameStart + nameLength + extraLength;
        entries.push({ method, name: decoder.decode(bytes.slice(nameStart, nameStart + nameLength)), data: bytes.slice(dataStart, dataStart + size) });
        offset = dataStart + size;
      }
      return entries;
    };
    const run = async (slug, expression) => {
      await fetch(`${baseUrl}/tool/?slug=${slug}`);
      if (!location.search.includes(slug)) {
        location.href = `${baseUrl}/tool/?slug=${slug}`;
        await new Promise(() => {});
      }
      const input = document.querySelector('[data-simple-file]'); const transfer = new DataTransfer(); transfer.items.add(file);
      input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
      const field = document.querySelector('[data-page-list]'); field.value = expression; field.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('[data-simple-run]').click();
      await new Promise((resolve, reject) => {
        const started = performance.now();
        const poll = () => {
          const button = document.querySelector('[data-simple-run]'); const output = document.querySelector('[data-output]');
          if (!button.hasAttribute('aria-busy') && !output.hidden) return resolve();
          if (performance.now() - started > 3000) return reject(new Error(`timeout: ${slug}`));
          setTimeout(poll, 20);
        };
        poll();
      });
      return document.querySelector('[data-output]').innerText;
    };

    const extractorInvalid = [];
    for (const expression of ['3-1', '1,nope,3', '1,4']) extractorInvalid.push(await run('pdf-page-extractor', expression));
    const extractorText = await run('pdf-page-extractor', '3,1,3');
    document.querySelector('[data-download-simple]').click(); await delay(10);
    const extractedDownload = downloads.at(-1); const extracted = await PDFLib.PDFDocument.load(await extractedDownload.blob.arrayBuffer(), { updateMetadata: false });
    const extractor = { name: extractedDownload.name, type: extractedDownload.blob.type, sizes: extracted.getPages().map((item) => item.getSize()) };

    return { extractorInvalid, extractorText, extractor };
  }, origin).catch((error) => ({ evaluationError: error.message }));

  // The extractor is verified on the first document; remaining tools use fresh documents below.
  assert.equal(result.evaluationError, undefined, result.evaluationError);
  assert.match(result.extractorInvalid[0], /1-3/u);
  assert.match(result.extractorInvalid[1], /nope/u);
  assert.match(result.extractorInvalid[2], /1-3/u);
  assert.match(result.extractorText, /uğurla tamamlandı/u);
  assert.equal(result.extractor.name, 'pdf-page-extractor.pdf');
  assert.equal(result.extractor.type, 'application/pdf');
  assert.deepEqual(result.extractor.sizes, [{ width: 103, height: 203 }, { width: 101, height: 201 }, { width: 103, height: 203 }]);
  assert.deepEqual(errors, []);
  await page.close();

  const verifyTool = async (slug) => {
    const opened = await openTool(slug);
    const value = await opened.page.evaluate(async (selectedSlug) => {
      const blobs = new Map(); let download;
      const originalCreate = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => { const url = originalCreate(blob); blobs.set(url, blob); return url; };
      HTMLAnchorElement.prototype.click = function click() { download = { name: this.download, blob: blobs.get(this.href) }; };
      const source = await PDFLib.PDFDocument.create({ updateMetadata: false });
      for (let index = 0; index < 3; index += 1) source.addPage([101 + index, 201 + index]);
      const file = new File([await source.save()], 'ordered.pdf', { type: 'application/pdf' });
      const transfer = new DataTransfer(); transfer.items.add(file);
      const input = document.querySelector('[data-simple-file]'); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
      const field = document.querySelector('[data-page-list]'); field.value = '3,1,3'; field.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('[data-simple-run]').click();
      await new Promise((resolve) => {
        const poll = () => document.querySelector('[data-download-simple]') ? resolve() : setTimeout(poll, 20); poll();
      });
      document.querySelector('[data-download-simple]').click(); await new Promise((resolve) => setTimeout(resolve, 10));
      if (selectedSlug === 'pdf-page-remover') {
        const pdf = await PDFLib.PDFDocument.load(await download.blob.arrayBuffer(), { updateMetadata: false });
        return { name: download.name, type: download.blob.type, sizes: pdf.getPages().map((item) => item.getSize()) };
      }
      const bytes = new Uint8Array(await download.blob.arrayBuffer()); const view = new DataView(bytes.buffer); const decoder = new TextDecoder(); const entries = [];
      let offset = 0;
      while (view.getUint32(offset, true) === 0x04034b50) {
        const method = view.getUint16(offset + 8, true); const size = view.getUint32(offset + 18, true); const nameLength = view.getUint16(offset + 26, true); const extraLength = view.getUint16(offset + 28, true);
        const nameStart = offset + 30; const dataStart = nameStart + nameLength + extraLength; const data = bytes.slice(dataStart, dataStart + size);
        const pdf = await PDFLib.PDFDocument.load(data, { updateMetadata: false });
        entries.push({ method, name: decoder.decode(bytes.slice(nameStart, nameStart + nameLength)), size: pdf.getPage(0).getSize(), pages: pdf.getPageCount() });
        offset = dataStart + size;
      }
      return { name: download.name, type: download.blob.type, signature: view.getUint32(0, true), entries };
    }, slug);
    assert.deepEqual(opened.errors, []);
    await opened.page.close();
    return value;
  };
  const remover = await verifyTool('pdf-page-remover');
  assert.equal(remover.type, 'application/pdf');
  assert.deepEqual(remover.sizes, [{ width: 102, height: 202 }], 'remover deduplicates the removal list');
  const splitter = await verifyTool('pdf-splitter');
  assert.equal(splitter.name, 'ordered-sehifeler.zip');
  assert.equal(splitter.type, 'application/zip');
  assert.equal(splitter.signature, 0x04034b50);
  assert.deepEqual(splitter.entries, [
    { method: 0, name: 'sehife-3.pdf', size: { width: 103, height: 203 }, pages: 1 },
    { method: 0, name: 'sehife-1.pdf', size: { width: 101, height: 201 }, pages: 1 },
    { method: 0, name: 'sehife-3-2.pdf', size: { width: 103, height: 203 }, pages: 1 },
  ]);
});

test('input and option changes remove stale results and block old downloads', async () => {
  const { page, errors } = await openTool('percentage-calculator');
  const percentage = await page.evaluate(() => {
    const first = document.querySelector('[data-a]'); const second = document.querySelector('[data-b]');
    first.value = '200'; second.value = '10'; document.querySelector('[data-simple-run]').click();
    const before = document.querySelector('[data-output]').hidden;
    first.value = '300'; first.dispatchEvent(new Event('input', { bubbles: true }));
    return { before, after: document.querySelector('[data-output]').hidden, buttons: document.querySelectorAll('[data-output] button').length };
  });
  assert.deepEqual(percentage, { before: false, after: true, buttons: 0 });
  await page.goto(`${origin}/tool/?slug=qr-generator`, { waitUntil: 'networkidle0' });
  const qr = await page.evaluate(() => {
    document.querySelector('[data-qr-input]').value = 'Batch 4'; document.querySelector('[data-qr-generate]').click();
    const size = document.querySelector('[data-qr-size]'); size.value = '384'; size.dispatchEvent(new Event('change', { bubbles: true }));
    return { hidden: document.querySelector('[data-output]').hidden, download: Boolean(document.querySelector('[data-qr-download]')) };
  });
  assert.deepEqual(qr, { hidden: true, download: false });
  await page.goto(`${origin}/tool/?slug=json-formatter`, { waitUntil: 'networkidle0' });
  const json = await page.evaluate(() => {
    const input = document.querySelector('[data-json-input]'); input.value = '{"ok":true}'; document.querySelector('[data-json-format]').click();
    input.value = '{"ok":false}'; input.dispatchEvent(new Event('input', { bubbles: true }));
    return { hidden: document.querySelector('[data-output]').hidden, copy: Boolean(document.querySelector('[data-copy-result]')) };
  });
  assert.deepEqual(json, { hidden: true, copy: false });
  assert.deepEqual(errors, []);
  await page.close();
});

test('metadata remover preserves verified formats, dimensions and alpha while rejecting animation', async () => {
  const { page, errors } = await openTool('image-metadata-remover');
  const result = await page.evaluate(async () => {
    const blobs = new Map(); let download;
    const originalCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => { const url = originalCreate(blob); blobs.set(url, blob); return url; };
    HTMLAnchorElement.prototype.click = function click() { download = { name: this.download, blob: blobs.get(this.href) }; };
    const canvas = document.createElement('canvas'); canvas.width = 2; canvas.height = 2; const context = canvas.getContext('2d');
    context.clearRect(0, 0, 2, 2); context.fillStyle = 'rgba(255, 0, 0, .4)'; context.fillRect(0, 0, 1, 1);
    const makeBlob = (type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    const injectExif = async (blob) => {
      const bytes = new Uint8Array(await blob.arrayBuffer()); const marker = Uint8Array.from([0xff,0xe1,0x00,0x0c,0x45,0x78,0x69,0x66,0x00,0x00,1,2,3,4]);
      const output = new Uint8Array(bytes.length + marker.length); output.set(bytes.slice(0,2)); output.set(marker,2); output.set(bytes.slice(2),2+marker.length); return new Blob([output], { type:'image/jpeg' });
    };
    const containsExif = async (blob) => {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      for (let index = 0; index + 3 < bytes.length; index += 1) if (bytes[index]===0x45 && bytes[index+1]===0x78 && bytes[index+2]===0x69 && bytes[index+3]===0x66) return true;
      return false;
    };
    const alphaAtCorner = async (blob) => {
      const bitmap = await createImageBitmap(blob); const target = document.createElement('canvas'); target.width = bitmap.width; target.height = bitmap.height;
      target.getContext('2d').drawImage(bitmap,0,0); return target.getContext('2d').getImageData(1,1,1,1).data[3];
    };
    const process = async (file) => {
      const transfer = new DataTransfer(); transfer.items.add(file); const input = document.querySelector('[data-simple-file]'); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles:true }));
      document.querySelector('[data-simple-run]').click();
      await new Promise((resolve) => { const poll=()=>document.querySelector('[data-download-simple]')?resolve():setTimeout(poll,20); poll(); });
      document.querySelector('[data-download-simple]').click(); await new Promise((resolve)=>setTimeout(resolve,10));
      const bitmap = await createImageBitmap(download.blob); const bytes = new Uint8Array(await download.blob.slice(0,12).arrayBuffer());
      return { name: download.name, type: download.blob.type, width: bitmap.width, height: bitmap.height, bytes: [...bytes], alpha: download.blob.type === 'image/jpeg' ? 255 : await alphaAtCorner(download.blob), exif: await containsExif(download.blob) };
    };
    const pngBlob = await makeBlob('image/png'); const webpBlob = await makeBlob('image/webp', .9); const jpegBlob = await injectExif(await makeBlob('image/jpeg', .9));
    const outputs = [];
    outputs.push(await process(new File([jpegBlob], 'with-exif.jpg', { type:'image/jpeg' })));
    outputs.push(await process(new File([pngBlob], 'alpha.png', { type:'image/png' })));
    outputs.push(await process(new File([webpBlob], 'alpha.webp', { type:'image/webp' })));
    outputs.push(await process(new File([pngBlob], 'misleading.jpg', { type:'image/jpeg' })));
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer()); const animationChunk = Uint8Array.from([0,0,0,8,0x61,0x63,0x54,0x4c,0,0,0,1,0,0,0,0,0,0,0,0]);
    const animatedBytes = new Uint8Array(pngBytes.length + animationChunk.length); animatedBytes.set(pngBytes.slice(0,33)); animatedBytes.set(animationChunk,33); animatedBytes.set(pngBytes.slice(33),33+animationChunk.length);
    const transfer = new DataTransfer(); transfer.items.add(new File([animatedBytes], 'animated.png', { type:'image/png' }));
    const input = document.querySelector('[data-simple-file]'); input.files=transfer.files; input.dispatchEvent(new Event('change',{bubbles:true})); document.querySelector('[data-simple-run]').click();
    await new Promise((resolve)=>setTimeout(resolve,80));
    return { outputs, animation: document.querySelector('[data-output]').innerText, animationDownload: Boolean(document.querySelector('[data-download-simple]')) };
  });
  assert.deepEqual(result.outputs.map((item) => [item.name,item.type,item.width,item.height]), [
    ['image-metadata-remover.jpg','image/jpeg',2,2], ['image-metadata-remover.png','image/png',2,2],
    ['image-metadata-remover.webp','image/webp',2,2], ['image-metadata-remover.png','image/png',2,2],
  ]);
  assert.equal(result.outputs[0].bytes[0], 0xff); assert.equal(result.outputs[0].bytes[1], 0xd8); assert.equal(result.outputs[0].exif, false);
  assert.deepEqual(result.outputs[1].bytes.slice(0,8), [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  assert.equal(String.fromCharCode(...result.outputs[2].bytes.slice(0,4)), 'RIFF');
  assert.ok(result.outputs[1].alpha < 255); assert.ok(result.outputs[2].alpha < 255);
  assert.match(result.animation, /Animasiyalı|animasiyanı/u); assert.equal(result.animationDownload, false);
  assert.deepEqual(errors, []);
  await page.close();
});

test('resizer reports corrupt inputs, preserves format and recovers at valid boundaries', async () => {
  const { page, errors } = await openTool('image-resizer');
  const result = await page.evaluate(async () => {
    const blobs = new Map(); let download;
    const originalCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => { const url = originalCreate(blob); blobs.set(url, blob); return url; };
    HTMLAnchorElement.prototype.click = function click() { download = { name:this.download, blob:blobs.get(this.href) }; };
    const input = document.querySelector('[data-image-file]'); const run = document.querySelector('[data-image-resize]');
    const setFile = async (file) => {
      const transfer = new DataTransfer(); transfer.items.add(file); input.files=transfer.files; input.dispatchEvent(new Event('change',{bubbles:true}));
      await new Promise((resolve)=>setTimeout(resolve,80));
    };
    await setFile(new File([Uint8Array.from([1,2,3])], 'corrupt.png', {type:'image/png'}));
    const corrupt = document.querySelector('[data-output]').innerText;
    const canvas=document.createElement('canvas'); canvas.width=2; canvas.height=2; const context=canvas.getContext('2d'); context.clearRect(0,0,2,2); context.fillStyle='rgba(0,0,255,.3)'; context.fillRect(0,0,1,1);
    const makeBlob=(type)=>new Promise((resolve)=>canvas.toBlob(resolve,type,.9));
    const cases=[];
    for (const [type,name,declared] of [['image/jpeg','source.jpg','image/jpeg'],['image/png','source.png','image/png'],['image/webp','source.webp','image/webp'],['image/png','wrong.jpg','image/jpeg']]) {
      const blob=await makeBlob(type); await setFile(new File([blob],name,{type:declared}));
      document.querySelector('[data-image-ratio]').checked=false; document.querySelector('[data-image-width]').value='1'; document.querySelector('[data-image-height]').value='1'; run.click();
      await new Promise((resolve)=>{const poll=()=>document.querySelector('[data-image-download]')?resolve():setTimeout(poll,20);poll();});
      document.querySelector('[data-image-download]').click(); await new Promise((resolve)=>setTimeout(resolve,10));
      const bitmap=await createImageBitmap(download.blob); const bytes=new Uint8Array(await download.blob.slice(0,12).arrayBuffer());
      cases.push({name:download.name,type:download.blob.type,width:bitmap.width,height:bitmap.height,bytes:[...bytes]});
    }
    await setFile(new File([await makeBlob('image/png')], 'boundary.png', {type:'image/png'}));
    document.querySelector('[data-image-ratio]').checked=false; document.querySelector('[data-image-width]').value='8193'; document.querySelector('[data-image-height]').value='1'; run.click(); await new Promise((resolve)=>setTimeout(resolve,30));
    const huge=document.querySelector('[data-output]').innerText;
    document.querySelector('[data-image-width]').value='1'; document.querySelector('[data-image-width]').dispatchEvent(new Event('input',{bubbles:true})); run.click();
    await new Promise((resolve)=>{const poll=()=>document.querySelector('[data-image-download]')?resolve():setTimeout(poll,20);poll();});
    return {corrupt,huge,recovered:document.querySelector('[data-output]').innerText,cases};
  });
  assert.match(result.corrupt,/formatı tanınmadı/u); assert.match(result.huge,/8192/u); assert.match(result.recovered,/uğurla tamamlandı/u);
  assert.deepEqual(result.cases.map((item)=>[item.name,item.type,item.width,item.height]),[
    ['resized-source.jpg','image/jpeg',1,1],['resized-source.png','image/png',1,1],['resized-source.webp','image/webp',1,1],['resized-wrong.png','image/png',1,1],
  ]);
  assert.equal(result.cases[0].bytes[0],0xff); assert.deepEqual(result.cases[1].bytes.slice(0,8),[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]); assert.equal(String.fromCharCode(...result.cases[2].bytes.slice(0,4)),'RIFF');
  assert.deepEqual(errors, []);
  await page.close();
});

test('100 repeated image operations balance object URLs and stale async work cannot publish', async () => {
  const { page, errors } = await openTool('image-metadata-remover');
  const result = await page.evaluate(async () => {
    let creates=0; let revokes=0; const originalCreate=URL.createObjectURL.bind(URL); const originalRevoke=URL.revokeObjectURL.bind(URL);
    URL.createObjectURL=(blob)=>{creates+=1;return originalCreate(blob);}; URL.revokeObjectURL=(url)=>{revokes+=1;return originalRevoke(url);};
    const canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;canvas.getContext('2d').fillRect(0,0,1,1);const blob=await new Promise((resolve)=>canvas.toBlob(resolve,'image/png'));
    const input=document.querySelector('[data-simple-file]');const transfer=new DataTransfer();transfer.items.add(new File([blob],'repeat.png',{type:'image/png'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
    const run=document.querySelector('[data-simple-run]');
    const wait=()=>new Promise((resolve)=>{const poll=()=>!run.hasAttribute('aria-busy')&&document.querySelector('[data-download-simple]')?resolve():setTimeout(poll,5);poll();});
    for(let index=0;index<100;index+=1){run.click();await wait();}
    input.dispatchEvent(new Event('input',{bubbles:true})); await new Promise((resolve)=>setTimeout(resolve,20));
    const balanced={creates,revokes,hidden:document.querySelector('[data-output]').hidden};
    const nativeToBlob=HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob=function delayed(callback,...args){return nativeToBlob.call(this,(value)=>setTimeout(()=>callback(value),60),...args);};
    run.click(); await new Promise((resolve)=>setTimeout(resolve,10)); input.dispatchEvent(new Event('input',{bubbles:true})); await new Promise((resolve)=>setTimeout(resolve,100));
    const staleHidden=document.querySelector('[data-output]').hidden;
    HTMLCanvasElement.prototype.toBlob=nativeToBlob; run.click(); await wait();
    return {...balanced,staleHidden,recovered:Boolean(document.querySelector('[data-download-simple]'))};
  });
  assert.equal(result.creates,result.revokes); assert.equal(result.hidden,true); assert.equal(result.staleHidden,true); assert.equal(result.recovered,true);
  assert.deepEqual(errors, []);
  await page.close();
});
