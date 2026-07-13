const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');
const puppeteer = require('puppeteer');

const port = 8884;
const origin = `http://127.0.0.1:${port}`;
const artifactRoot = path.resolve(process.env.ARTIFACT_ROOT || 'dist');
let browser;
let server;

const waitForServer = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Batch 6 artifact preview did not start');
};

test.before(async () => {
  if (!process.env.ARTIFACT_ROOT) execFileSync(process.execPath, ['scripts/build-static.mjs'], { cwd: process.cwd(), stdio: 'pipe' });
  execFileSync(process.execPath, ['scripts/verify-static-artifact.mjs', artifactRoot], { cwd: process.cwd(), stdio: 'pipe' });
  server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: artifactRoot, stdio: 'ignore', windowsHide: true });
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

test('built artifact has provenance, correct MIME and all physical/logical routes', async () => {
  const page = await browser.newPage(); const errors = watchErrors(page); const external = [];
  page.on('request', (request) => { if (/^https?:/u.test(request.url()) && !request.url().startsWith(origin)) external.push(request.url()); });
  for (const route of ['/','/tools/','/about/','/privacy/','/feedback/','/tool/?slug=json-formatter']) {
    const response = await page.goto(`${origin}${route}`, { waitUntil:'networkidle0' }); assert.equal(response.status(),200,route);
  }
  const registry = await page.evaluate(async () => (await import('/assets/js/tools-data.js')).tools.map(({slug,name})=>({slug,name})));
  for (const tool of registry) {
    const response = await page.goto(`${origin}/tool/?slug=${encodeURIComponent(tool.slug)}`, { waitUntil:'networkidle0' });
    assert.equal(response.status(),200,tool.slug); assert.equal(await page.$eval('h1',(element)=>element.textContent),tool.name); assert.match(await page.title(),new RegExp(tool.name.replace(/[.*+?^${}()|[\]\\]/gu,'\\$&'),'u'));
  }
  await page.reload({ waitUntil:'networkidle0' }); assert.equal(await page.$eval('h1',(element)=>element.textContent),registry.at(-1).name);
  const manifest = await (await fetch(`${origin}/.aztoolbox-build.json`)).json();
  const head = execFileSync('git',['rev-parse','HEAD'],{cwd:process.cwd(),encoding:'utf8'}).trim();
  assert.equal(manifest.commit,head); assert.equal(manifest.files.length,28); assert.ok(manifest.files.some((entry)=>entry.path==='assets/js/motion.js'));
  const mimeChecks = [['/','text/html'],['/assets/js/app.js','(?:text|application)/javascript'],['/assets/css/app.css','text/css'],['/assets/images/aztoolbox-flow-field-v2.png','image/png']];
  for(const [resource,mime] of mimeChecks){const response=await fetch(`${origin}${resource}`);assert.equal(response.status,200);assert.match(response.headers.get('content-type')||'',new RegExp(mime,'u'));}
  assert.deepEqual(external,[]); assert.deepEqual(errors,[]);
  await page.close();
});

test('built artifact completes representative primary operations in every category', async () => {
  const page = await browser.newPage(); const errors = watchErrors(page);
  const goto = (slug) => page.goto(`${origin}/tool/?slug=${slug}`,{waitUntil:'networkidle0'});
  await goto('json-formatter');
  await page.evaluate(()=>{const input=document.querySelector('[data-json-input]');input.value='{"artifact":true}';document.querySelector('[data-json-format]').click();});
  assert.match(await page.$eval('[data-output]',(element)=>element.innerText),/"artifact": true/u);
  await goto('text-counter');
  await page.evaluate(()=>{const input=document.querySelector('[data-text-input]');input.value='👩‍💻 Azərbaycan';input.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.$eval('.stat-card:nth-child(2) strong',(element)=>element.textContent),'12');
  await goto('percentage-calculator');
  await page.evaluate(()=>{document.querySelector('[data-a]').value='200';document.querySelector('[data-b]').value='15';document.querySelector('[data-simple-run]').click();});
  assert.match(await page.$eval('[data-output]',(element)=>element.innerText),/30/u);
  await goto('password-generator'); await page.click('[data-password-generate]');
  assert.ok((await page.$eval('[data-output] code',(element)=>element.textContent)).length>=8);
  await goto('az-transliterator');
  await page.evaluate(()=>{document.querySelector('[data-simple-input]').value='Azərbaycan';document.querySelector('[data-simple-run]').click();});
  assert.match(await page.$eval('[data-output]',(element)=>element.innerText),/Азәрбајҹан/u);

  await goto('image-resizer');
  const imageResult=await page.evaluate(async()=>{const canvas=document.createElement('canvas');canvas.width=2;canvas.height=3;canvas.getContext('2d').fillRect(0,0,2,3);const blob=await new Promise((resolve)=>canvas.toBlob(resolve,'image/png'));const transfer=new DataTransfer();transfer.items.add(new File([blob],'artifact.png',{type:'image/png'}));const input=document.querySelector('[data-image-file]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise((resolve)=>setTimeout(resolve,50));document.querySelector('[data-image-ratio]').checked=false;document.querySelector('[data-image-width]').value='1';document.querySelector('[data-image-height]').value='1';document.querySelector('[data-image-resize]').click();await new Promise((resolve)=>{const poll=()=>document.querySelector('[data-image-download]')?resolve():setTimeout(poll,15);poll();});return document.querySelector('[data-output]').innerText;});
  assert.match(imageResult,/uğurla tamamlandı/u);

  await goto('pdf-merger');
  const pdfResult=await page.evaluate(async()=>{const downloads=[];const map=new Map();const create=URL.createObjectURL.bind(URL);URL.createObjectURL=(blob)=>{const url=create(blob);map.set(url,blob);return url;};HTMLAnchorElement.prototype.click=function click(){downloads.push(map.get(this.href));};const first=await PDFLib.PDFDocument.create();first.addPage([100,200]);const second=await PDFLib.PDFDocument.create();second.addPage([300,400]);const transfer=new DataTransfer();transfer.items.add(new File([await first.save()],'a.pdf',{type:'application/pdf'}));transfer.items.add(new File([await second.save()],'b.pdf',{type:'application/pdf'}));const input=document.querySelector('[data-pdf-files]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-pdf-merge]').click();await new Promise((resolve)=>{const poll=()=>downloads.length?resolve():setTimeout(poll,15);poll();});const output=await PDFLib.PDFDocument.load(await downloads[0].arrayBuffer(),{updateMetadata:false});return {pages:output.getPageCount(),sizes:output.getPages().map((item)=>item.getSize())};});
  assert.deepEqual(pdfResult,{pages:2,sizes:[{width:100,height:200},{width:300,height:400}]});
  assert.deepEqual(errors,[]);
  await page.close();
});
