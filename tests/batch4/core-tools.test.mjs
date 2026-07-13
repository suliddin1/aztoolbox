import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createResultLifecycle,
  createStoredZip,
  imageExtension,
  imageOutputType,
} from '../../assets/js/batch4-tools.js';
import { parsePageSelection } from '../../assets/js/tool-guards.js';

function readStoredZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const entries = [];
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    const method = view.getUint16(offset + 8, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    assert.equal(method, 0, 'test fixture expects stored ZIP entries');
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    entries.push({
      name: decoder.decode(bytes.slice(nameStart, nameStart + nameLength)),
      data: bytes.slice(dataStart, dataStart + size),
    });
    offset = dataStart + size;
  }
  assert.equal(view.getUint32(offset, true), 0x02014b50, 'central directory must follow entries');
  return entries;
}

test('PDF grammar can preserve exact order and duplicates without changing remover defaults', () => {
  assert.deepEqual(parsePageSelection('3, 1, 3', 3, { preserveOrder: true, allowDuplicates: true }), [2, 0, 2]);
  assert.deepEqual(parsePageSelection('3, 1, 3', 3), [0, 2]);
  assert.throws(() => parsePageSelection('3-1', 3, { preserveOrder: true, allowDuplicates: true }), /1-3/u);
  assert.throws(() => parsePageSelection('1, nope, 3', 3, { preserveOrder: true, allowDuplicates: true }), /nope/u);
  assert.throws(() => parsePageSelection('1,4', 3, { preserveOrder: true, allowDuplicates: true }), /1-3/u);
});

test('stored ZIP preserves entry order, duplicate page names and exact payloads', () => {
  const entries = [
    { name: 'sehife-3.pdf', data: Uint8Array.from([0x25, 0x50, 0x44, 0x46, 3]) },
    { name: 'sehife-1.pdf', data: Uint8Array.from([0x25, 0x50, 0x44, 0x46, 1]) },
    { name: 'sehife-3-2.pdf', data: Uint8Array.from([0x25, 0x50, 0x44, 0x46, 3, 2]) },
  ];
  const zip = createStoredZip(entries);
  assert.equal(new DataView(zip.buffer).getUint32(0, true), 0x04034b50);
  assert.deepEqual(readStoredZip(zip), entries);
  assert.throws(() => createStoredZip([]), /ən azı bir/u);
});

test('image output contract preserves source format except for explicit conversion', () => {
  for (const [type, extension] of [['image/png', 'png'], ['image/jpeg', 'jpg'], ['image/webp', 'webp']]) {
    assert.equal(imageExtension(type), extension);
    assert.equal(imageOutputType('image-clean', type), type);
    assert.equal(imageOutputType('image-resize', type), type);
  }
  assert.equal(imageOutputType('image-convert', 'image/png', 'image/webp'), 'image/webp');
  assert.throws(() => imageOutputType('image-clean', 'image/gif'), /dəstəklənmir/u);
  assert.throws(() => imageOutputType('image-convert', 'image/png', 'image/gif'), /dəstəklənmir/u);
});

test('result lifecycle versions operations and revokes every tracked preview', () => {
  const revoked = [];
  const lifecycle = createResultLifecycle((url) => revoked.push(url));
  const first = lifecycle.begin();
  lifecycle.trackPreview('blob:first');
  lifecycle.trackPreview('blob:second');
  assert.equal(lifecycle.isCurrent(first), true);
  assert.equal(lifecycle.previewCount, 2);
  const second = lifecycle.invalidate();
  assert.deepEqual(revoked, ['blob:first', 'blob:second']);
  assert.equal(lifecycle.isCurrent(first), false);
  assert.equal(lifecycle.isCurrent(second), true);
  lifecycle.trackPreview('blob:third');
  assert.equal(lifecycle.releasePreview('blob:third'), true);
  assert.equal(lifecycle.releasePreview('blob:third'), false);
  lifecycle.trackPreview('blob:last');
  lifecycle.dispose();
  assert.deepEqual(revoked, ['blob:first', 'blob:second', 'blob:third', 'blob:last']);
  assert.equal(lifecycle.previewCount, 0);
});
