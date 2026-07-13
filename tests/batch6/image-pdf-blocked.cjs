const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const test = require('node:test');
const puppeteer = require('puppeteer');

const port = 8883;
const origin = `http://127.0.0.1:${port}`;
let browser;
let server;

const waitForServer = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Batch 6 Image-to-PDF preview did not start');
};

test.before(async () => {
  server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: process.cwd(), stdio: 'ignore', windowsHide: true });
  await waitForServer();
  browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox'],
  });
});

test.after(async () => { await browser?.close(); server?.kill(); });

test('all 16 formerly blocked Image-to-PDF cases are bounded, atomic and independently valid', async () => {
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('requestfailed', (request) => { if (request.url().startsWith(origin)) errors.push(`network: ${request.url()}`); });
  page.on('response', (response) => { if (response.url().startsWith(origin) && response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`); });
  await page.goto(`${origin}/tool/?slug=image-to-pdf`, { waitUntil: 'networkidle0' });
  const result = await page.evaluate(async () => {
    const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    const blobs = new Map(); const downloads = [];
    const originalCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => { const url = originalCreate(blob); blobs.set(url, blob); return url; };
    HTMLAnchorElement.prototype.click = function click() { downloads.push({ name: this.download, blob: blobs.get(this.href) }); };
    const canvasBlob = async (width, height, type, color) => {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d'); context.fillStyle = color; context.fillRect(0,0,width,height);
      return new Promise((resolve) => canvas.toBlob(resolve, type, .9));
    };
    const png = await canvasBlob(2, 3, 'image/png', '#f00');
    const jpeg = await canvasBlob(4, 2, 'image/jpeg', '#0a0');
    const webp = await canvasBlob(3, 4, 'image/webp', '#00f');
    const crcTable = (() => {
      const table = new Uint32Array(256);
      for (let index=0;index<256;index+=1) { let value=index; for(let bit=0;bit<8;bit+=1)value=(value&1)?(0xedb88320^(value>>>1)):(value>>>1); table[index]=value>>>0; }
      return table;
    })();
    const crc32 = (bytes) => { let crc=0xffffffff; for(const byte of bytes)crc=crcTable[(crc^byte)&0xff]^(crc>>>8); return (crc^0xffffffff)>>>0; };
    const addPngText = async (blob) => {
      const bytes=new Uint8Array(await blob.arrayBuffer()); let offset=8;
      while(offset+12<=bytes.length){const view=new DataView(bytes.buffer);const length=view.getUint32(offset,false);const type=String.fromCharCode(...bytes.slice(offset+4,offset+8));if(type==='IDAT')break;offset+=12+length;}
      const type=Uint8Array.from([0x74,0x45,0x58,0x74]);const data=new TextEncoder().encode('Comment\0Batch 6 metadata');const chunk=new Uint8Array(12+data.length);const view=new DataView(chunk.buffer);view.setUint32(0,data.length,false);chunk.set(type,4);chunk.set(data,8);view.setUint32(8+data.length,crc32(new Uint8Array([...type,...data])),false);
      return new Blob([bytes.slice(0,offset),chunk,bytes.slice(offset)],{type:'image/png'});
    };
    const input=document.querySelector('[data-simple-files]');const run=document.querySelector('[data-simple-run]');
    const attempt=async(files)=>{
      const before=downloads.length;const transfer=new DataTransfer();files.forEach((file)=>transfer.items.add(file));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));run.click();
      await new Promise((resolve,reject)=>{const started=performance.now();const poll=()=>{const output=document.querySelector('[data-output]');if(!run.hasAttribute('aria-busy')&&!output.hidden)return resolve();if(performance.now()-started>4000)return reject(new Error('Image-to-PDF case timed out'));setTimeout(poll,15);};poll();});
      const button=document.querySelector('[data-download-simple]');let output=null;
      if(button){button.click();await delay(10);const current=downloads.at(-1);if(downloads.length!==before+1)throw new Error('Expected exactly one download');const bytes=new Uint8Array(await current.blob.arrayBuffer());const pdf=await PDFLib.PDFDocument.load(bytes,{updateMetadata:false});output={name:current.name,type:current.blob.type,signature:new TextDecoder('latin1').decode(bytes.slice(0,5)),sizes:pdf.getPages().map((item)=>item.getSize())};}
      return {text:document.querySelector('[data-output]').innerText,download:Boolean(button),output};
    };
    const cases={};
    const pngBytes=new Uint8Array(await png.arrayBuffer());
    cases.truncated=await attempt([new File([pngBytes.slice(0,33)],'truncated.png',{type:'image/png'})]);
    cases.corruptRepeat=await attempt([new File([Uint8Array.from([1,2,3,4])],'corrupt-again.png',{type:'image/png'})]);
    cases.uppercase=await attempt([new File([png],'UPPERCASE.PNG',{type:'image/png'})]);
    cases.unicode=await attempt([new File([png],'şəkil-ə.png',{type:'image/png'})]);
    cases.extensionless=await attempt([new File([png],'image',{type:'image/png'})]);
    cases.renamedJpg=await attempt([new File([png],'renamed.jpg',{type:'image/png'})]);
    cases.pngCorrectMime=await attempt([new File([png],'bytes.png',{type:'image/png'})]);
    cases.pngJpegMime=await attempt([new File([png],'png-as-jpeg.jpg',{type:'image/jpeg'})]);
    cases.jpegPngMime=await attempt([new File([jpeg],'jpeg-as-png.png',{type:'image/png'})]);
    cases.jpegBlankMime=await attempt([new File([jpeg],'blank-mime.jpg',{type:''})]);
    cases.webpJpegMime=await attempt([new File([webp],'webp-as-jpeg.jpg',{type:'image/jpeg'})]);
    cases.validWebp=await attempt([new File([png],'first.png',{type:'image/png'}),new File([webp],'second.webp',{type:'image/webp'})]);
    cases.mixedInvalid=await attempt([new File([png],'first.png',{type:'image/png'}),new File([Uint8Array.from([9,8,7])],'bad.png',{type:'image/png'}),new File([jpeg],'last.jpg',{type:'image/jpeg'})]);
    const orderedFiles=[];for(const [index,[width,height,color]] of [[1,1,'#100'],[2,1,'#200'],[1,2,'#300'],[3,2,'#400']].entries())orderedFiles.push(new File([await canvasBlob(width,height,'image/png',color)],`order-${index+1}.png`,{type:'image/png'}));
    cases.fourFileOrder=await attempt(orderedFiles);
    const reselected=new File([png],'same.png',{type:'image/png'});cases.reselectFirst=await attempt([reselected]);cases.reselectSecond=await attempt([reselected]);
    cases.metadataPng=await attempt([new File([await addPngText(png)],'metadata.png',{type:'image/png'})]);
    return cases;
  });

  for (const key of ['truncated','corruptRepeat','mixedInvalid']) {
    assert.equal(result[key].download,false,key); assert.doesNotMatch(result[key].text,/uğurla tamamlandı/u,key);
  }
  assert.match(result.truncated.text,/çevrilə bilmədi|emal edilə bilmədi|formatı|sağlam/u);
  assert.match(result.corruptRepeat.text,/formatı tanınmadı/u);
  const validKeys=['uppercase','unicode','extensionless','renamedJpg','pngCorrectMime','pngJpegMime','jpegPngMime','jpegBlankMime','webpJpegMime','validWebp','fourFileOrder','reselectFirst','reselectSecond','metadataPng'];
  for(const key of validKeys){assert.equal(result[key].download,true,key);assert.equal(result[key].output.type,'application/pdf',key);assert.equal(result[key].output.signature,'%PDF-',key);assert.equal(result[key].output.name,'sekiller.pdf',key);}
  for(const key of ['uppercase','unicode','extensionless','renamedJpg','pngCorrectMime','pngJpegMime','reselectFirst','reselectSecond','metadataPng'])assert.deepEqual(result[key].output.sizes,[{width:2,height:3}],key);
  assert.deepEqual(result.jpegPngMime.output.sizes,[{width:4,height:2}]);
  assert.deepEqual(result.jpegBlankMime.output.sizes,[{width:4,height:2}]);
  assert.deepEqual(result.webpJpegMime.output.sizes,[{width:3,height:4}]);
  assert.deepEqual(result.validWebp.output.sizes,[{width:2,height:3},{width:3,height:4}]);
  assert.deepEqual(result.fourFileOrder.output.sizes,[{width:1,height:1},{width:2,height:1},{width:1,height:2},{width:3,height:2}]);
  assert.deepEqual(errors, []);
  await page.close();
});
