import { ToolInputError } from './tool-guards.js';

const NUMBER_PATTERN = /^[+-]?(?:(?:\d+(?:[.,]\d*)?)|(?:[.,]\d+))(?:e[+-]?\d+)?$/iu;

export function readFiniteNumber(rawValue, policy = {}) {
  const label = policy.label || 'Dəyər';
  const raw = String(rawValue ?? '').trim();
  if (!raw) throw new ToolInputError(`${label} daxil edin.`);
  if (!NUMBER_PATTERN.test(raw) || (raw.includes(',') && raw.includes('.'))) {
    throw new ToolInputError(`${label} düzgün rəqəm olmalıdır.`);
  }
  const value = Number(raw.replace(',', '.'));
  if (!Number.isFinite(value)) throw new ToolInputError(`${label} sonlu rəqəm olmalıdır.`);
  if (policy.integer && !Number.isInteger(value)) throw new ToolInputError(`${label} tam ədəd olmalıdır.`);
  if (policy.min != null && value < policy.min) {
    const comparison = policy.exclusiveMin ? 'böyük olmalıdır' : 'az olmamalıdır';
    throw new ToolInputError(`${label} ${policy.min}-dan ${comparison}.`);
  }
  if (policy.exclusiveMin && policy.min != null && value === policy.min) {
    throw new ToolInputError(`${label} ${policy.min}-dan böyük olmalıdır.`);
  }
  if (policy.max != null && value > policy.max) throw new ToolInputError(`${label} ${policy.max}-dan çox olmamalıdır.`);
  return value;
}

function finiteResult(value) {
  if (!Number.isFinite(value)) throw new ToolInputError('Hesablama sonlu nəticə vermədi. Daha kiçik dəyərlər daxil edin.');
  return value;
}

export function calculatePercentage(mode, firstRaw, secondRaw) {
  if (mode === 'part') {
    const number = readFiniteNumber(firstRaw, { label: 'Ədəd' });
    const percent = readFiniteNumber(secondRaw, { label: 'Faiz' });
    return { mode, number, percent, value: finiteResult(number * percent / 100) };
  }
  if (mode === 'change') {
    const from = readFiniteNumber(firstRaw, { label: 'İlkin dəyər', min: 0, exclusiveMin: true });
    const to = readFiniteNumber(secondRaw, { label: 'Son dəyər', min: 0 });
    const value = finiteResult((to - from) / from * 100);
    return { mode, from, to, value, direction: value > 0 ? 'artım' : value < 0 ? 'azalma' : 'dəyişiklik yoxdur' };
  }
  throw new ToolInputError('Faiz hesablama rejimini seçin.');
}

export function calculateVat(amountRaw, rateRaw, mode) {
  const amount = readFiniteNumber(amountRaw, { label: 'Məbləğ', min: 0 });
  const ratePercent = readFiniteNumber(rateRaw, { label: 'ƏDV faizi', min: 0 });
  const rate = ratePercent / 100;
  let vat;
  let total;
  if (mode === 'add') {
    vat = amount * rate;
    total = amount + vat;
  } else if (mode === 'extract') {
    vat = amount - amount / (1 + rate);
    total = amount;
  } else {
    throw new ToolInputError('ƏDV hesablama rejimini seçin.');
  }
  return { amount, ratePercent, vat: finiteResult(vat), total: finiteResult(total) };
}

const LENGTH_FACTORS = Object.freeze({ m: 1, km: 1000, cm: 0.01, ft: 0.3048, in: 0.0254 });

export function convertLength(valueRaw, from, to) {
  const value = readFiniteNumber(valueRaw, { label: 'Dəyər', min: 0 });
  if (!(from in LENGTH_FACTORS) || !(to in LENGTH_FACTORS)) throw new ToolInputError('Uzunluq vahidini seçin.');
  return finiteResult(value * LENGTH_FACTORS[from] / LENGTH_FACTORS[to]);
}

export function calculateLoan(principalRaw, annualRateRaw, monthsRaw) {
  const principal = readFiniteNumber(principalRaw, { label: 'Kredit məbləği', min: 0, exclusiveMin: true });
  const annualRate = readFiniteNumber(annualRateRaw, { label: 'İllik faiz', min: 0 });
  const months = readFiniteNumber(monthsRaw, { label: 'Müddət', min: 1, max: 1200, integer: true });
  const monthlyRate = annualRate / 1200;
  let payment;
  if (monthlyRate === 0) payment = principal / months;
  else {
    const growth = Math.exp(months * Math.log1p(monthlyRate));
    payment = principal * monthlyRate * growth / (growth - 1);
  }
  payment = finiteResult(payment);
  const total = finiteResult(payment * months);
  return { principal, annualRate, months, payment, total, interest: finiteResult(total - principal) };
}

export function timestampToDate(rawValue, unit) {
  if (!['seconds', 'milliseconds'].includes(unit)) throw new ToolInputError('Timestamp vahidini seçin.');
  const value = readFiniteNumber(rawValue, { label: 'Unix timestamp' });
  const milliseconds = unit === 'seconds' ? value * 1000 : value;
  if (!Number.isFinite(milliseconds)) throw new ToolInputError('Timestamp tarix aralığını aşır.');
  const date = new Date(milliseconds);
  if (!Number.isFinite(date.getTime())) throw new ToolInputError('Timestamp etibarlı tarix yaratmır.');
  return date;
}

export function dateToTimestamp(rawValue, unit) {
  if (!['seconds', 'milliseconds'].includes(unit)) throw new ToolInputError('Timestamp vahidini seçin.');
  const raw = String(rawValue ?? '').trim();
  if (!raw) throw new ToolInputError('Tarix və saat daxil edin.');
  const milliseconds = new Date(raw).getTime();
  if (!Number.isFinite(milliseconds)) throw new ToolInputError('Tarix və saat düzgün deyil.');
  return unit === 'seconds' ? milliseconds / 1000 : milliseconds;
}

function advanceStringIndex(text, index, unicode) {
  if (!unicode || index >= text.length) return index + 1;
  const first = text.charCodeAt(index);
  if (first < 0xd800 || first > 0xdbff || index + 1 >= text.length) return index + 1;
  const second = text.charCodeAt(index + 1);
  return second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1;
}

export function collectRegexMatches(pattern, flags, text, maxMatches = 1000) {
  const regex = new RegExp(pattern, flags);
  const repeated = regex.global || regex.sticky;
  const unicode = regex.unicode || regex.unicodeSets;
  const matches = [];
  let truncated = false;
  while (true) {
    const match = regex.exec(text);
    if (!match) break;
    matches.push({
      value: match[0],
      index: match.index,
      groups: match.slice(1).map((value) => value ?? null),
      namedGroups: match.groups ? { ...match.groups } : null,
    });
    if (!repeated) break;
    if (matches.length >= maxMatches) { truncated = true; break; }
    if (match[0] === '') regex.lastIndex = advanceStringIndex(text, regex.lastIndex, unicode);
  }
  return { matches, truncated };
}

export function runRegexSafely(pattern, flags, text, options = {}) {
  new RegExp(pattern, flags);
  if (typeof Worker !== 'function') return Promise.resolve(collectRegexMatches(pattern, flags, text, options.maxMatches));
  const timeout = options.timeout ?? 500;
  const maxMatches = options.maxMatches ?? 1000;
  const source = `${advanceStringIndex.toString()}\n${collectRegexMatches.toString()}\nself.onmessage = ({ data }) => { try { self.postMessage({ ok: true, result: collectRegexMatches(data.pattern, data.flags, data.text, data.maxMatches) }); } catch (error) { self.postMessage({ ok: false, message: error.message }); } };`;
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  return new Promise((resolve, reject) => {
    const worker = new Worker(url);
    const finish = () => { worker.terminate(); URL.revokeObjectURL(url); };
    const timer = setTimeout(() => {
      finish();
      reject(new ToolInputError('Regex əməliyyatı vaxt həddini aşdı. Daha sadə pattern istifadə edin.'));
    }, timeout);
    worker.onmessage = ({ data }) => {
      clearTimeout(timer); finish();
      if (data.ok) resolve(data.result);
      else reject(new ToolInputError(data.message || 'Regex sintaksisini yoxlayın.'));
    };
    worker.onerror = () => {
      clearTimeout(timer); finish(); reject(new ToolInputError('Regex emal edilə bilmədi.'));
    };
    worker.postMessage({ pattern, flags, text, maxMatches });
  });
}
