import { splitGraphemes } from './batch5-tools.js';
import { LIMITS, ToolInputError, validateTextLength } from './tool-guards.js';

export const ITERATION2_LIMITS = Object.freeze({
  textCharacters: LIMITS.textChars,
  uuidCount: 50,
  tokenCount: 50,
  tokenBytesMin: 8,
  tokenBytesMax: 128,
});

const textOperations = new Set(['sort', 'deduplicate', 'whitespace']);
const tokenFormats = new Set(['hex', 'base64url']);

function splitLines(value) {
  const text = String(value);
  return text ? text.split(/\r\n|\r|\n/u) : [];
}

function sourceNewline(value) {
  return String(value).includes('\r\n') ? '\r\n' : '\n';
}

function outputNewline(value, preference) {
  if (preference === 'lf' || preference == null) return '\n';
  if (preference === 'crlf') return '\r\n';
  if (preference === 'preserve') return sourceNewline(value);
  throw new ToolInputError('Sətir sonu seçimi düzgün deyil.');
}

export function textCleanupStats(value) {
  const text = String(value);
  const lines = splitLines(text);
  return {
    lineCount: lines.length,
    nonEmptyLineCount: lines.filter((line) => line.trim()).length,
    characterCount: splitGraphemes(text).length,
  };
}

export function runTextCleanupPipeline(input, operations, options = {}) {
  const text = validateTextLength(input);
  if (!Array.isArray(operations) || !operations.length) throw new ToolInputError('Ən azı bir mətn əməliyyatı seçin.');
  if (new Set(operations).size !== operations.length || operations.some((operation) => !textOperations.has(operation))) {
    throw new ToolInputError('Mətn əməliyyatlarının sırası düzgün deyil.');
  }
  const newline = outputNewline(text, options.newline);
  const sortDirection = options.sortDirection ?? 'asc';
  if (!['asc', 'desc'].includes(sortDirection)) throw new ToolInputError('Sıralama istiqaməti düzgün deyil.');
  const caseSensitive = options.caseSensitive !== false;
  const trim = options.trim !== false;
  const collapseSpaces = options.collapseSpaces !== false;
  const removeEmpty = options.removeEmpty !== false;
  let lines = splitLines(text);
  let removedDuplicates = 0;

  for (const operation of operations) {
    if (operation === 'sort') {
      const collator = new Intl.Collator('az', { usage: 'sort', sensitivity: 'variant' });
      const direction = sortDirection === 'desc' ? -1 : 1;
      lines = lines.map((line, index) => ({ line, index })).sort((left, right) => {
        const compared = collator.compare(left.line, right.line) * direction;
        return compared || left.index - right.index;
      }).map((entry) => entry.line);
    }
    if (operation === 'deduplicate') {
      const seen = new Set();
      lines = lines.filter((line) => {
        const key = caseSensitive ? line : line.toLocaleLowerCase('az');
        if (seen.has(key)) { removedDuplicates += 1; return false; }
        seen.add(key); return true;
      });
    }
    if (operation === 'whitespace') {
      if (trim) lines = lines.map((line) => line.trim());
      if (collapseSpaces) lines = lines.map((line) => line.replace(/\s+/gu, ' '));
      if (removeEmpty) lines = lines.filter((line) => line.trim().length > 0);
    }
  }

  const output = lines.join(newline);
  return {
    output,
    newline: newline === '\r\n' ? 'crlf' : 'lf',
    stats: {
      before: textCleanupStats(text),
      after: textCleanupStats(output),
      removedDuplicates,
    },
  };
}

export function validateIntegerSetting(value, { label = 'Dəyər', min, max } = {}) {
  const source = typeof value === 'number' ? String(value) : String(value ?? '').trim();
  if (!/^\d+$/u.test(source)) throw new ToolInputError(`${label} müsbət tam ədəd olmalıdır.`);
  const number = Number(source);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new ToolInputError(`${label} ${min}-${max} aralığında olmalıdır.`);
  }
  return number;
}

function formatUuid(bytes) {
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function createUuidV4(cryptoSource = globalThis.crypto) {
  if (typeof cryptoSource?.randomUUID === 'function') {
    const value = cryptoSource.randomUUID().toLowerCase();
    if (!uuidV4Pattern.test(value)) throw new ToolInputError('Brauzer düzgün UUID v4 yarada bilmədi.');
    return value;
  }
  if (typeof cryptoSource?.getRandomValues !== 'function') throw new ToolInputError('Təhlükəsiz təsadüfi generator mövcud deyil.');
  const bytes = cryptoSource.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return formatUuid(bytes);
}

export function createUuidBatch(count, cryptoSource = globalThis.crypto) {
  const total = validateIntegerSetting(count, { label: 'UUID sayı', min: 1, max: ITERATION2_LIMITS.uuidCount });
  return Array.from({ length: total }, () => createUuidV4(cryptoSource));
}

function bytesToBase64Url(bytes) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    output += alphabet[first >>> 2];
    output += alphabet[((first & 0x03) << 4) | ((second ?? 0) >>> 4)];
    if (second !== undefined) output += alphabet[((second & 0x0f) << 2) | ((third ?? 0) >>> 6)];
    if (third !== undefined) output += alphabet[third & 0x3f];
  }
  return output;
}

export function tokenCharacterLength(byteLength, format) {
  const bytes = validateIntegerSetting(byteLength, { label: 'Token uzunluğu', min: ITERATION2_LIMITS.tokenBytesMin, max: ITERATION2_LIMITS.tokenBytesMax });
  if (!tokenFormats.has(format)) throw new ToolInputError('Token formatı düzgün deyil.');
  return format === 'hex' ? bytes * 2 : Math.ceil(bytes * 4 / 3);
}

export function createSecureToken(byteLength, format = 'hex', cryptoSource = globalThis.crypto) {
  const bytes = validateIntegerSetting(byteLength, { label: 'Token uzunluğu', min: ITERATION2_LIMITS.tokenBytesMin, max: ITERATION2_LIMITS.tokenBytesMax });
  if (!tokenFormats.has(format)) throw new ToolInputError('Token formatı düzgün deyil.');
  if (typeof cryptoSource?.getRandomValues !== 'function') throw new ToolInputError('Təhlükəsiz təsadüfi generator mövcud deyil.');
  const random = cryptoSource.getRandomValues(new Uint8Array(bytes));
  return format === 'hex' ? [...random].map((byte) => byte.toString(16).padStart(2, '0')).join('') : bytesToBase64Url(random);
}

export function createSecureTokenBatch(count, byteLength, format = 'hex', cryptoSource = globalThis.crypto) {
  const total = validateIntegerSetting(count, { label: 'Token sayı', min: 1, max: ITERATION2_LIMITS.tokenCount });
  return Array.from({ length: total }, () => createSecureToken(byteLength, format, cryptoSource));
}
