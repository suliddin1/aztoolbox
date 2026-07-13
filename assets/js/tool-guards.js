const MEBIBYTE = 1024 * 1024;

export const LIMITS = Object.freeze({
  fileBytes: 20 * MEBIBYTE,
  imageFileBytes: 20 * MEBIBYTE,
  pdfFileBytes: 50 * MEBIBYTE,
  totalFileBytes: 100 * MEBIBYTE,
  files: 50,
  pdfPages: 500,
  combinedPdfPages: 1000,
  pageExpressionChars: 2048,
  pageTokens: 500,
  pageRange: 500,
  canvasSide: 8192,
  imagePixels: 16_777_216,
  textChars: 1_000_000,
  regexPatternChars: 1024,
  regexTextChars: 100_000,
  qrBytes: 1200,
});

export class ToolInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ToolInputError';
  }
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MEBIBYTE) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / MEBIBYTE).toFixed(1)} MB`;
}

export function validateFileSet(files, options = {}) {
  const list = [...files];
  const maxFiles = options.files ?? LIMITS.files;
  const maxFileBytes = options.fileBytes ?? LIMITS.fileBytes;
  const maxTotalBytes = options.totalFileBytes ?? LIMITS.totalFileBytes;

  if (list.length > maxFiles) throw new ToolInputError(`Bir əməliyyatda ən çox ${maxFiles} fayl seçilə bilər.`);
  for (const file of list) {
    if (!Number.isSafeInteger(file?.size) || file.size < 0) throw new ToolInputError('Fayl ölçüsü oxuna bilmədi.');
    if (file.size > maxFileBytes) {
      throw new ToolInputError(`${file.name || 'Fayl'} ${formatBytes(maxFileBytes)} həddini aşır.`);
    }
  }
  const total = list.reduce((sum, file) => sum + file.size, 0);
  if (total > maxTotalBytes) {
    throw new ToolInputError(`Seçilmiş faylların ümumi ölçüsü ${formatBytes(maxTotalBytes)} həddini aşır.`);
  }
  return list;
}

export function validateGeneratedSize(size, limit, label = 'Nəticə') {
  if (!Number.isSafeInteger(size) || size < 1) throw new ToolInputError(`${label} boş və ya zədəlidir.`);
  if (size > limit) throw new ToolInputError(`${label} ${formatBytes(limit)} həddini aşır.`);
  return size;
}

export function validatePdfPageCount(count) {
  if (!Number.isSafeInteger(count) || count < 1) throw new ToolInputError('PDF səhifə sayı oxuna bilmədi.');
  if (count > LIMITS.pdfPages) throw new ToolInputError(`PDF ən çox ${LIMITS.pdfPages} səhifə ola bilər.`);
  return count;
}

export function parsePageSelection(value, count) {
  validatePdfPageCount(count);
  const source = String(value).trim();
  if (!source) throw new ToolInputError('Səhifə nömrələrini daxil edin.');
  if (source.length > LIMITS.pageExpressionChars) throw new ToolInputError('Səhifə ifadəsi çox uzundur.');

  const pages = new Set();
  const parts = source.split(',');
  if (parts.length > LIMITS.pageTokens) throw new ToolInputError(`Ən çox ${LIMITS.pageTokens} səhifə ifadəsi qəbul edilir.`);
  let expanded = 0;
  for (const rawPart of parts) {
    const part = rawPart.trim();
    const match = part.match(/^(\d+)(?:-(\d+))?$/u);
    if (!match) throw new ToolInputError(`“${part || 'boş hissə'}” səhifə ifadəsi deyil.`);
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
      throw new ToolInputError('Səhifə nömrələri təhlükəsiz tam ədəd olmalıdır.');
    }
    if (start > end) throw new ToolInputError(`Aralıq kiçikdən böyüyə yazılmalıdır: ${end}-${start}.`);
    if (start < 1 || end > count) throw new ToolInputError(`Səhifə nömrələri 1-${count} aralığında olmalıdır.`);
    const span = end - start + 1;
    if (span > LIMITS.pageRange) throw new ToolInputError(`Bir aralıqda ən çox ${LIMITS.pageRange} səhifə seçilə bilər.`);
    expanded += span;
    if (expanded > LIMITS.pageRange) throw new ToolInputError(`Bir əməliyyatda ən çox ${LIMITS.pageRange} səhifə seçilə bilər.`);
    for (let page = start; page <= end; page += 1) pages.add(page - 1);
  }
  return [...pages].sort((left, right) => left - right);
}

export function validateTextLength(value, limit = LIMITS.textChars) {
  const text = String(value);
  if (text.length > limit) throw new ToolInputError(`Mətn çox uzundur. Maksimum ${limit.toLocaleString('az-AZ')} simvol qəbul edilir.`);
  return text;
}

export function utf8ByteLength(value) {
  return new TextEncoder().encode(String(value)).length;
}

export function validateQrText(value) {
  const text = validateTextLength(value);
  if (!text.trim()) throw new ToolInputError('QR kod üçün mətn və ya link daxil edin.');
  if (utf8ByteLength(text) > LIMITS.qrBytes) {
    throw new ToolInputError(`QR mətni çox uzundur. Maksimum ${LIMITS.qrBytes} UTF-8 bayt qəbul edilir.`);
  }
  return text;
}

export function validateImageDimensions(widthValue, heightValue) {
  const width = Number(widthValue);
  const height = Number(heightValue);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
    throw new ToolInputError('Şəkil ölçüləri müsbət tam ədəd olmalıdır.');
  }
  if (width > LIMITS.canvasSide || height > LIMITS.canvasSide) {
    throw new ToolInputError(`Şəkil ölçüsü hər tərəf üzrə ən çox ${LIMITS.canvasSide} piksel ola bilər.`);
  }
  const pixels = width * height;
  if (!Number.isSafeInteger(pixels) || pixels > LIMITS.imagePixels) {
    throw new ToolInputError(`Şəkil ən çox ${LIMITS.imagePixels.toLocaleString('az-AZ')} piksel ola bilər.`);
  }
  return { width, height, pixels };
}

const ascii = (bytes, start, length) => String.fromCharCode(...bytes.slice(start, start + length));

function inspectPng(bytes) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (signature.some((value, index) => bytes[index] !== value)) return null;
  let animated = false;
  let width;
  let height;
  let offset = 8;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset, false);
    const type = ascii(bytes, offset + 4, 4);
    if (type === 'IHDR' && length >= 8 && offset + 16 <= bytes.length) {
      width = view.getUint32(offset + 8, false);
      height = view.getUint32(offset + 12, false);
    }
    if (type === 'acTL') animated = true;
    if (type === 'IDAT' || type === 'IEND') break;
    const next = offset + 12 + length;
    if (!Number.isSafeInteger(next) || next <= offset || next > bytes.length) break;
    offset = next;
  }
  return { type: 'image/png', extension: 'png', animated, width, height };
}

function inspectJpeg(bytes) {
  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return null;
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    const isStartOfFrame = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
    if (isStartOfFrame && length >= 7 && offset + 7 <= bytes.length) {
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      return { type: 'image/jpeg', extension: 'jpg', animated: false, width, height };
    }
    if (length < 2) break;
    offset += length;
  }
  return { type: 'image/jpeg', extension: 'jpg', animated: false, width: undefined, height: undefined };
}

function inspectWebp(bytes) {
  if (bytes.length < 12 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WEBP') return null;
  let animated = false;
  let width;
  let height;
  let offset = 12;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (offset + 8 <= bytes.length) {
    const type = ascii(bytes, offset, 4);
    const length = view.getUint32(offset + 4, true);
    if (type === 'ANIM' || type === 'ANMF') animated = true;
    if (type === 'VP8X' && offset + 18 <= bytes.length) {
      if ((bytes[offset + 8] & 0x02) !== 0) animated = true;
      width = 1 + bytes[offset + 12] + (bytes[offset + 13] << 8) + (bytes[offset + 14] << 16);
      height = 1 + bytes[offset + 15] + (bytes[offset + 16] << 8) + (bytes[offset + 17] << 16);
    }
    if (type === 'VP8 ' && offset + 18 <= bytes.length && bytes[offset + 11] === 0x9d && bytes[offset + 12] === 0x01 && bytes[offset + 13] === 0x2a) {
      width = (bytes[offset + 14] | (bytes[offset + 15] << 8)) & 0x3fff;
      height = (bytes[offset + 16] | (bytes[offset + 17] << 8)) & 0x3fff;
    }
    if (type === 'VP8L' && offset + 13 <= bytes.length && bytes[offset + 8] === 0x2f) {
      const bits = bytes[offset + 9] | (bytes[offset + 10] << 8) | (bytes[offset + 11] << 16) | (bytes[offset + 12] << 24);
      width = 1 + (bits & 0x3fff);
      height = 1 + ((bits >>> 14) & 0x3fff);
    }
    const next = offset + 8 + length + (length % 2);
    if (!Number.isSafeInteger(next) || next <= offset || next > bytes.length) break;
    offset = next;
  }
  return { type: 'image/webp', extension: 'webp', animated, width, height };
}

export async function inspectImageFile(file, options = {}) {
  validateFileSet([file], { fileBytes: options.fileBytes ?? LIMITS.imageFileBytes });
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const result = inspectPng(bytes) || inspectJpeg(bytes) || inspectWebp(bytes);
  if (!result) throw new ToolInputError('Şəkil formatı tanınmadı. PNG, JPG və ya WebP seçin.');
  if (!result.width || !result.height) throw new ToolInputError('Şəkil ölçüləri təhlükəsiz şəkildə oxuna bilmədi.');
  validateImageDimensions(result.width, result.height);
  return result;
}
