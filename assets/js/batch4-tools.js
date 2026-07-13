import { ToolInputError } from './tool-guards.js';

const MIME_EXTENSIONS = Object.freeze({
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
});

export function imageExtension(type) {
  const extension = MIME_EXTENSIONS[type];
  if (!extension) throw new ToolInputError('Şəkil çıxış formatı dəstəklənmir.');
  return extension;
}

export function imageOutputType(kind, sourceType, selectedType) {
  if (kind === 'image-convert') {
    imageExtension(selectedType);
    return selectedType;
  }
  imageExtension(sourceType);
  return sourceType;
}

export function createResultLifecycle(revokeObjectURL = (url) => URL.revokeObjectURL(url)) {
  let operation = 0;
  const previewUrls = new Set();
  const revokePreviews = () => {
    for (const url of previewUrls) revokeObjectURL(url);
    previewUrls.clear();
  };
  return {
    begin() { operation += 1; revokePreviews(); return operation; },
    invalidate() { operation += 1; revokePreviews(); return operation; },
    isCurrent(id) { return id === operation; },
    trackPreview(url) { previewUrls.add(url); return url; },
    releasePreview(url) {
      if (!previewUrls.delete(url)) return false;
      revokeObjectURL(url); return true;
    },
    dispose() { operation += 1; revokePreviews(); },
    get operation() { return operation; },
    get previewCount() { return previewUrls.size; },
  };
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(view, offset, value) { view.setUint16(offset, value, true); }
function writeUint32(view, offset, value) { view.setUint32(offset, value, true); }

export function createStoredZip(entries) {
  if (!Array.isArray(entries) || !entries.length) throw new ToolInputError('ZIP üçün ən azı bir fayl olmalıdır.');
  const encoder = new TextEncoder();
  const normalized = entries.map((entry) => {
    const name = String(entry.name || '');
    const nameBytes = encoder.encode(name);
    const data = entry.data instanceof Uint8Array ? entry.data : new Uint8Array(entry.data);
    if (!name || nameBytes.length > 0xffff) throw new ToolInputError('ZIP fayl adı düzgün deyil.');
    return { nameBytes, data, crc: crc32(data), offset: 0 };
  });
  const localSize = normalized.reduce((sum, entry) => sum + 30 + entry.nameBytes.length + entry.data.length, 0);
  const centralSize = normalized.reduce((sum, entry) => sum + 46 + entry.nameBytes.length, 0);
  const totalSize = localSize + centralSize + 22;
  if (!Number.isSafeInteger(totalSize) || totalSize > 0xffffffff) throw new ToolInputError('ZIP nəticəsi çox böyükdür.');
  const output = new Uint8Array(totalSize);
  const view = new DataView(output.buffer);
  let offset = 0;
  for (const entry of normalized) {
    entry.offset = offset;
    writeUint32(view, offset, 0x04034b50); writeUint16(view, offset + 4, 20); writeUint16(view, offset + 6, 0x0800);
    writeUint16(view, offset + 8, 0); writeUint16(view, offset + 10, 0); writeUint16(view, offset + 12, 33);
    writeUint32(view, offset + 14, entry.crc); writeUint32(view, offset + 18, entry.data.length); writeUint32(view, offset + 22, entry.data.length);
    writeUint16(view, offset + 26, entry.nameBytes.length); writeUint16(view, offset + 28, 0);
    output.set(entry.nameBytes, offset + 30); output.set(entry.data, offset + 30 + entry.nameBytes.length);
    offset += 30 + entry.nameBytes.length + entry.data.length;
  }
  const centralOffset = offset;
  for (const entry of normalized) {
    writeUint32(view, offset, 0x02014b50); writeUint16(view, offset + 4, 20); writeUint16(view, offset + 6, 20);
    writeUint16(view, offset + 8, 0x0800); writeUint16(view, offset + 10, 0); writeUint16(view, offset + 12, 0); writeUint16(view, offset + 14, 33);
    writeUint32(view, offset + 16, entry.crc); writeUint32(view, offset + 20, entry.data.length); writeUint32(view, offset + 24, entry.data.length);
    writeUint16(view, offset + 28, entry.nameBytes.length); writeUint16(view, offset + 30, 0); writeUint16(view, offset + 32, 0);
    writeUint16(view, offset + 34, 0); writeUint16(view, offset + 36, 0); writeUint32(view, offset + 38, 0); writeUint32(view, offset + 42, entry.offset);
    output.set(entry.nameBytes, offset + 46); offset += 46 + entry.nameBytes.length;
  }
  writeUint32(view, offset, 0x06054b50); writeUint16(view, offset + 4, 0); writeUint16(view, offset + 6, 0);
  writeUint16(view, offset + 8, normalized.length); writeUint16(view, offset + 10, normalized.length);
  writeUint32(view, offset + 12, centralSize); writeUint32(view, offset + 16, centralOffset); writeUint16(view, offset + 20, 0);
  return output;
}
