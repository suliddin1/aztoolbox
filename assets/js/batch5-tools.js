const markPattern = /[\p{Mark}\uFE0E\uFE0F]/u;
const modifierPattern = /\p{Emoji_Modifier}/u;
const regionalPattern = /\p{Regional_Indicator}/u;

function fallbackGraphemes(value) {
  const clusters = [];
  let regionalCount = 0;
  for (const character of Array.from(String(value))) {
    const previous = clusters.at(-1) || '';
    const followsJoiner = previous.endsWith('\u200d');
    const combines = markPattern.test(character) || modifierPattern.test(character) || character === '\u200d';
    const crlf = previous === '\r' && character === '\n';
    const regional = regionalPattern.test(character);
    if (previous && (combines || followsJoiner || crlf || (regional && regionalCount % 2 === 1))) clusters[clusters.length - 1] += character;
    else clusters.push(character);
    regionalCount = regional ? regionalCount + 1 : 0;
  }
  return clusters;
}

export function splitGraphemes(value, Segmenter = globalThis.Intl?.Segmenter) {
  const text = String(value);
  if (typeof Segmenter !== 'function') return fallbackGraphemes(text);
  const segmenter = new Segmenter('az', { granularity: 'grapheme' });
  return Array.from(segmenter.segment(text), (entry) => entry.segment);
}

export function textStatistics(value, Segmenter = globalThis.Intl?.Segmenter) {
  const text = String(value);
  const graphemes = splitGraphemes(text, Segmenter);
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  return {
    words,
    characters: graphemes.length,
    charactersWithoutWhitespace: graphemes.filter((grapheme) => !/^\s+$/u.test(grapheme)).length,
    sentences: text.trim() ? text.split(/[.!?]+/u).filter((item) => item.trim()).length : 0,
    lines: text ? text.split(/\r\n|\r|\n/u).length : 0,
    readingMinutes: Math.max(0, Math.ceil(words / 200)),
  };
}

export function readStoredList(storage, key) {
  try {
    const parsed = JSON.parse(storage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function writeStoredList(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

export function sanitizeToolSlugs(values, validSlugs, limit = Number.POSITIVE_INFINITY) {
  const allowed = validSlugs instanceof Set ? validSlugs : new Set(validSlugs);
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    if (typeof value !== 'string' || !allowed.has(value) || result.includes(value)) continue;
    result.push(value);
    if (result.length >= limit) break;
  }
  return result;
}

const capabilityCopy = Object.freeze({
  pdf: 'PDF-ləri birləşdirin',
  'pdf-organizer': 'səhifələri bölün, çıxarın və ya silin',
  'image-pdf': 'şəkilləri PDF-ə çevirin',
  'pdf-clean': 'sənəd məlumatlarını təmizləyin',
  image: 'şəkil ölçüsünü dəyişin',
  'image-compress': 'fayl ölçüsünü mümkün olduqda azaldın',
  'image-convert': 'şəkil formatını çevirin',
  'image-crop': 'şəkli kəsin',
  'image-rotate': 'şəkli döndərin',
  'image-gray': 'qara-ağ versiya yaradın',
  'image-clean': 'şəkil metadata-sını təmizləyin',
  text: 'söz və simvolları sayın',
  'text-case': 'hərf registrini dəyişin',
  'line-sort': 'sətirləri sıralayın',
  'line-unique': 'təkrar sətirləri silin',
  'space-clean': 'boşluqları təmizləyin',
  'text-diff': 'mətnləri müqayisə edin',
  json: 'JSON-u yoxlayın və formatlayın',
  base64: 'Base64 kodlayın',
  'url-codec': 'URL mətnini kodlayın',
  jwt: 'JWT məlumatını oxuyun',
  hash: 'hash yaradın',
  uuid: 'UUID yaradın',
  timestamp: 'timestamp çevirin',
  regex: 'regex sınayın',
  percentage: 'faiz hesablayın',
  vat: 'ƏDV hesablayın',
  unit: 'uzunluq vahidlərini çevirin',
  loan: 'kredit ödənişini hesablayın',
  qr: 'QR kod yaradın',
  password: 'təhlükəsiz parol yaradın',
  'password-check': 'parol gücünü yoxlayın',
  token: 'təhlükəsiz token yaradın',
  iban: 'AZ IBAN quruluşunu yoxlayın',
  transliterate: 'latın və kiril yazılarını çevirin',
});

export function categoryCapabilityDescription(category, registry) {
  const capabilities = registry.filter((tool) => tool.category === category).map((tool) => capabilityCopy[tool.kind]).filter(Boolean);
  if (!capabilities.length) return 'Mövcud alətləri brauzerdə işlədin.';
  const selected = capabilities.slice(0, 3);
  if (selected.length === 1) return `${selected[0]}.`;
  return `${selected.slice(0, -1).join(', ')} və ${selected.at(-1)}.`;
}

export function toolSeo(tool) {
  return {
    title: `${tool.name} — AzToolBox`,
    description: `${tool.description} Əməliyyatı qeydiyyatsız və brauzerinizdə yerinə yetirin.`,
  };
}

export function canonicalToolUrl(href, slug) {
  const url = new URL(href);
  url.hash = '';
  url.search = '';
  url.searchParams.set('slug', slug);
  return url.href;
}

const pdfKinds = new Set(['pdf', 'pdf-organizer', 'pdf-clean', 'image-pdf']);

export function requiredVendor(kind) {
  if (pdfKinds.has(kind)) return { global: 'PDFLib', file: 'pdf-lib.min.js', label: 'PDF mühərriki' };
  if (kind === 'qr') return { global: 'QRCode', file: 'qrcode.min.js', label: 'QR mühərriki' };
  return null;
}
