const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const test = require('node:test');
const puppeteer = require('puppeteer');

const port = 8879;
const origin = `http://127.0.0.1:${port}`;
let browser;
let server;

const waitForServer = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Batch 3 preview did not start');
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

test('percentage calculator supports both approved modes, precision and recovery', async () => {
  const { page, errors } = await openTool('percentage-calculator');
  const result = await page.evaluate(() => {
    const mode = document.querySelector('[data-percentage-mode]');
    const first = document.querySelector('[data-a]');
    const second = document.querySelector('[data-b]');
    const run = document.querySelector('[data-simple-run]');
    const calculate = (selectedMode, a, b) => {
      mode.value = selectedMode; mode.dispatchEvent(new Event('change'));
      first.value = a; second.value = b; run.click();
      return document.querySelector('[data-output]').innerText;
    };
    return {
      part: calculate('part', '200', '15'),
      negativePart: calculate('part', '-200', '10'),
      comma: calculate('part', '100', '0,333333333333'),
      increase: calculate('change', '100', '120'),
      decrease: calculate('change', '100', '80'),
      invalid: calculate('change', '0', '120'),
      recovered: calculate('part', '50', '10'),
      labels: [document.querySelector('[data-a-label]').textContent, document.querySelector('[data-b-label]').textContent],
    };
  });
  assert.match(result.part, /30/u);
  assert.match(result.negativePart, /-20/u);
  assert.match(result.comma, /0[.,]333333333333/u);
  assert.match(result.increase, /20% artım/u);
  assert.match(result.decrease, /20% azalma/u);
  assert.match(result.invalid, /0-dan böyük olmalıdır/u);
  assert.doesNotMatch(result.invalid, /NaN|Infinity|20% artım/u);
  assert.match(result.recovered, /5/u);
  assert.deepEqual(result.labels, ['Ədəd', 'Faiz']);
  assert.deepEqual(errors, []);
  await page.close();
});

test('VAT and unit calculators validate blank, negative, non-finite, comma and zero inputs', async () => {
  const vat = await openTool('vat-calculator');
  const vatResult = await vat.page.evaluate(() => {
    const amount = document.querySelector('[data-a]'); const rate = document.querySelector('[data-b]');
    const mode = document.querySelector('[data-mode]'); const run = document.querySelector('[data-simple-run]');
    const calculate = (a, b, selectedMode = 'add') => { amount.value = a; rate.value = b; mode.value = selectedMode; run.click(); return document.querySelector('[data-output]').innerText; };
    return { normal: calculate('100', '18'), extracted: calculate('118', '18', 'extract'), blank: calculate('', '18'), negative: calculate('-1', '18'), nonFinite: calculate('Infinity', '18'), zero: calculate('0', '18'), recovered: calculate('100,50', '18') };
  });
  assert.match(vatResult.normal, /18[.,]00 ₼[\s\S]*118[.,]00 ₼/u);
  assert.match(vatResult.extracted, /18[.,]00 ₼/u);
  assert.match(vatResult.blank, /Məbləğ daxil edin/u);
  assert.match(vatResult.negative, /0-dan/u);
  assert.match(vatResult.nonFinite, /rəqəm/u);
  assert.doesNotMatch(vatResult.blank + vatResult.negative + vatResult.nonFinite, /NaN|Infinity|118[.,]00/u);
  assert.match(vatResult.zero, /0[.,]00 ₼/u);
  assert.match(vatResult.recovered, /118[.,]59 ₼/u);
  assert.deepEqual(vat.errors, []);
  await vat.page.close();

  const unit = await openTool('unit-converter');
  const unitResult = await unit.page.evaluate(() => {
    const value = document.querySelector('[data-a]'); const from = document.querySelector('[data-from]'); const to = document.querySelector('[data-to]'); const run = document.querySelector('[data-simple-run]');
    const convert = (raw, source = 'km', target = 'm') => { value.value = raw; from.value = source; to.value = target; run.click(); return document.querySelector('[data-output]').innerText; };
    return { comma: convert('1,5'), blank: convert(''), negative: convert('-1'), nonFinite: convert('NaN'), zero: convert('0'), recovered: convert('2', 'm', 'cm') };
  });
  assert.match(unitResult.comma, /1[.,]500/u);
  assert.match(unitResult.blank, /Dəyər daxil edin/u);
  assert.match(unitResult.negative, /0-dan/u);
  assert.match(unitResult.nonFinite, /rəqəm/u);
  assert.doesNotMatch(unitResult.blank + unitResult.negative + unitResult.nonFinite, /NaN|Infinity|1[.,]500/u);
  assert.match(unitResult.zero, /\b0\b/u);
  assert.match(unitResult.recovered, /200/u);
  assert.deepEqual(unit.errors, []);
  await unit.page.close();
});

test('loan calculator matches amortization and handles zero interest and invalid inputs', async () => {
  const { page, errors } = await openTool('loan-calculator');
  const result = await page.evaluate(() => {
    const principal = document.querySelector('[data-a]'); const rate = document.querySelector('[data-b]'); const months = document.querySelector('[data-c]'); const run = document.querySelector('[data-simple-run]');
    const calculate = (a, b, c) => { principal.value = a; rate.value = b; months.value = c; run.click(); return document.querySelector('[data-output]').innerText; };
    return { normal: calculate('10000', '12', '12'), zeroRate: calculate('1200', '0', '12'), comma: calculate('1200,50', '6,5', '24'), blank: calculate('', '', ''), zeroMonths: calculate('1000', '5', '0'), negative: calculate('-1000', '5', '12'), decimalMonths: calculate('1000', '5', '12,5'), huge: calculate('1e308', '1000', '1200'), recovered: calculate('2400', '0', '24') };
  });
  assert.match(result.normal, /888[.,]49 ₼[\s\S]*10[.,]661[.,]85 ₼[\s\S]*661[.,]85 ₼/u);
  assert.match(result.zeroRate, /100[.,]00 ₼[\s\S]*1[.,]200[.,]00 ₼[\s\S]*0[.,]00 ₼/u);
  assert.doesNotMatch(result.comma, /NaN|Infinity/u);
  assert.match(result.blank, /Kredit məbləği daxil edin/u);
  assert.match(result.zeroMonths, /1-dan/u);
  assert.match(result.negative, /0-dan/u);
  assert.match(result.decimalMonths, /tam ədəd/u);
  assert.match(result.huge, /sonlu nəticə/u);
  assert.doesNotMatch([result.blank, result.zeroMonths, result.negative, result.decimalMonths, result.huge].join(' '), /NaN|Infinity|888[.,]49/u);
  assert.match(result.recovered, /100[.,]00 ₼/u);
  assert.deepEqual(errors, []);
  await page.close();
});

test('timestamp converter uses explicit seconds or milliseconds and reports timezone clearly', async () => {
  const { page, errors } = await openTool('timestamp-converter');
  const result = await page.evaluate(() => {
    const unit = document.querySelector('[data-timestamp-unit]'); const stamp = document.querySelector('[data-timestamp]'); const date = document.querySelector('[data-date]'); const run = document.querySelector('[data-simple-run]');
    const fromTimestamp = (raw, selectedUnit) => { stamp.value = raw; date.value = ''; unit.value = selectedUnit; run.click(); return document.querySelector('[data-output]').innerText; };
    const fromDate = (raw, selectedUnit) => { stamp.value = ''; date.value = raw; unit.value = selectedUnit; run.click(); return document.querySelector('[data-output]').innerText; };
    const epochSeconds = fromDate('1970-01-01T00:00:00', 'seconds');
    stamp.value = '1'; date.value = '1970-01-01T00:00:00'; run.click();
    const both = document.querySelector('[data-output]').innerText;
    return { zero: fromTimestamp('0', 'seconds'), negative: fromTimestamp('-2208988800', 'seconds'), milliseconds: fromTimestamp('1000', 'milliseconds'), invalid: fromTimestamp('not-a-number', 'seconds'), boundary: fromTimestamp('1e20', 'milliseconds'), empty: fromTimestamp('', 'seconds'), epochSeconds, both, recovered: fromTimestamp('0', 'milliseconds') };
  });
  assert.match(result.zero, /1970-01-01T00:00:00\.000Z[\s\S]*Yerli vaxt \(/u);
  assert.match(result.negative, /1900-01-01T00:00:00\.000Z/u);
  assert.match(result.milliseconds, /1970-01-01T00:00:01\.000Z/u);
  assert.match(result.invalid, /rəqəm/u);
  assert.match(result.boundary, /etibarlı tarix/u);
  assert.match(result.empty, /Timestamp və ya tarix daxil edin/u);
  assert.match(result.epochSeconds, /Saniyə:[\s\S]*yerli vaxt qurşağında/u);
  assert.match(result.both, /yalnız birini/u);
  assert.match(result.recovered, /1970-01-01T00:00:00\.000Z/u);
  assert.doesNotMatch(result.invalid + result.boundary + result.empty + result.both, /Invalid Date|NaN|Infinity/u);
  assert.deepEqual(errors, []);
  await page.close();
});

test('regex tester supports flags, groups, non-global and zero-length matches with timeout recovery', async () => {
  const { page, errors } = await openTool('regex-tester');
  const result = await page.evaluate(async () => {
    const pattern = document.querySelector('[data-pattern]'); const flags = document.querySelector('[data-flags]'); const text = document.querySelector('[data-simple-input]'); const run = document.querySelector('[data-simple-run]');
    const execute = async (p, f, source) => {
      pattern.value = p; flags.value = f; text.value = source; run.click();
      for (let index = 0; index < 100 && run.hasAttribute('aria-busy'); index += 1) await new Promise((resolve) => setTimeout(resolve, 20));
      return document.querySelector('[data-output]').innerText;
    };
    return {
      nonGlobal: await execute('a', 'i', 'A a'),
      globalGroups: await execute('(a)(\\d)', 'gi', 'a1 A2'),
      unicodeZero: await execute('(?=.)', 'gu', '😀a'),
      invalidPattern: await execute('(', 'g', 'abc'),
      invalidFlags: await execute('a', 'gg', 'abc'),
      timeout: await execute('(a+)+$', '', `${'a'.repeat(50000)}!`),
      recovered: await execute('b', '', 'abc'),
    };
  });
  assert.match(result.nonGlobal, /1\. A — indeks 0/u);
  assert.doesNotMatch(result.nonGlobal, /2\./u);
  assert.match(result.globalGroups, /1\. a1[\s\S]*qruplar: a, 1[\s\S]*2\. A2/u);
  assert.match(result.unicodeZero, /indeks 0[\s\S]*indeks 2/u);
  assert.match(result.invalidPattern, /Regex sintaksisini yoxlayın/u);
  assert.match(result.invalidFlags, /Regex sintaksisini yoxlayın/u);
  assert.match(result.timeout, /vaxt həddini aşdı/u);
  assert.doesNotMatch(result.timeout, /a{100}|Əməliyyat uğurla/u);
  assert.match(result.recovered, /1\. b — indeks 1/u);
  assert.deepEqual(errors, []);
  await page.close();
});

test('unknown routes render not-found, never default or pollute recents, and history remains correct', async () => {
  const page = await browser.newPage();
  const errors = watchErrors(page);
  await page.goto(origin, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.setItem('aztoolbox-recent', JSON.stringify(['json-formatter'])));
  const inspect = () => page.evaluate(() => ({ h1: document.querySelector('h1')?.textContent, notFound: Boolean(document.querySelector('[data-not-found]')), workspace: Boolean(document.querySelector('.workspace')), recent: JSON.parse(localStorage.getItem('aztoolbox-recent')), title: document.title }));
  const invalidUrls = [
    `${origin}/tool/`,
    `${origin}/tool/?slug=`,
    `${origin}/tool/?slug=unknown`,
    `${origin}/tool/?slug=PDF-MERGER`,
    `${origin}/tool/?slug=%2F`,
    `${origin}/tool/?slug=unknown&slug=loan-calculator`,
  ];
  for (const url of invalidUrls) {
    await page.goto(url, { waitUntil: 'networkidle0' });
    const state = await inspect();
    assert.equal(state.h1, 'Alət tapılmadı');
    assert.equal(state.notFound, true);
    assert.equal(state.workspace, false);
    assert.deepEqual(state.recent, ['json-formatter']);
    assert.equal(state.title, 'Alət tapılmadı — AzToolBox');
  }

  await page.goto(`${origin}/tool/?slug=%70ercentage-calculator`, { waitUntil: 'networkidle0' });
  let state = await inspect();
  assert.equal(state.h1, 'Faiz kalkulyatoru');
  assert.equal(state.notFound, false);
  assert.deepEqual(state.recent, ['percentage-calculator', 'json-formatter']);
  await page.reload({ waitUntil: 'networkidle0' });
  state = await inspect();
  assert.equal(state.h1, 'Faiz kalkulyatoru');

  await page.goto(`${origin}/tool/?slug=loan-calculator`, { waitUntil: 'networkidle0' });
  await page.goto(`${origin}/tool/?slug=unknown`, { waitUntil: 'networkidle0' });
  await page.goBack({ waitUntil: 'networkidle0' });
  assert.equal((await inspect()).h1, 'Kredit kalkulyatoru');
  await page.goForward({ waitUntil: 'networkidle0' });
  state = await inspect();
  assert.equal(state.h1, 'Alət tapılmadı');
  assert.deepEqual(state.recent, ['loan-calculator', 'percentage-calculator', 'json-formatter']);
  assert.deepEqual(errors, []);
  await page.close();
});
