import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LIMITS,
  ToolInputError,
  inspectImageFile,
  parsePageSelection,
  validateFileSet,
  validateGeneratedSize,
  validateImageDimensions,
  validateQrText,
  validateTextLength,
} from '../../assets/js/tool-guards.js';

test('page selection accepts bounded valid input and keeps current sort/dedupe contract', () => {
  assert.deepEqual(parsePageSelection('3, 1, 3, 4-5', 5), [0, 2, 3, 4]);
});

test('page selection rejects reversed, partial, unsafe and out-of-range input atomically', () => {
  assert.throws(() => parsePageSelection('5-3', 5), /3-5/u);
  assert.throws(() => parsePageSelection('1, abc, 4', 5), /abc/u);
  assert.throws(() => parsePageSelection('1-999999999', 5), /1-5/u);
  assert.throws(() => parsePageSelection('9007199254740992', 5), /təhlükəsiz/u);
});

test('page and expression limits are explicit and bounded', () => {
  assert.throws(() => parsePageSelection('1', LIMITS.pdfPages + 1), ToolInputError);
  assert.throws(() => parsePageSelection('1'.repeat(LIMITS.pageExpressionChars + 1), 2), ToolInputError);
  const allPages = Array.from({ length: 500 }, (_, index) => index + 1).join(',');
  assert.equal(parsePageSelection(allPages, 500).length, 500);
  assert.throws(() => parsePageSelection('1-500,1-500', 500), /bir əməliyyatda/iu);
});

test('file count, per-file bytes and total bytes are bounded', () => {
  const valid = [{ name: 'a.pdf', size: 10, type: 'application/pdf' }];
  assert.deepEqual(validateFileSet(valid), valid);
  assert.doesNotThrow(() => validateFileSet([{ name: 'edge.bin', size: LIMITS.fileBytes }]));
  assert.doesNotThrow(() => validateFileSet([{ name: 'edge.pdf', size: LIMITS.pdfFileBytes }], { fileBytes: LIMITS.pdfFileBytes }));
  assert.throws(() => validateFileSet([{ name: 'large.pdf', size: LIMITS.pdfFileBytes + 1 }], { fileBytes: LIMITS.pdfFileBytes }), /həddini aşır/u);
  assert.throws(() => validateFileSet([{ name: 'unsafe.bin', size: Number.MAX_SAFE_INTEGER + 1 }]), /oxuna bilmədi/u);
  assert.throws(
    () => validateFileSet([{ name: 'large.pdf', size: LIMITS.fileBytes + 1 }]),
    /həddini aşır/u,
  );
  assert.throws(
    () => validateFileSet(Array.from({ length: LIMITS.files + 1 }, (_, index) => ({ name: `${index}.pdf`, size: 1 }))),
    /ən çox/u,
  );
  assert.throws(
    () => validateFileSet([
      { name: 'a.pdf', size: Math.floor(LIMITS.totalFileBytes / 2) + 1 },
      { name: 'b.pdf', size: Math.floor(LIMITS.totalFileBytes / 2) + 1 },
    ], { fileBytes: LIMITS.totalFileBytes }),
    /ümumi ölçüsü/u,
  );
  assert.equal(validateGeneratedSize(1, LIMITS.fileBytes), 1);
  assert.throws(() => validateGeneratedSize(0, LIMITS.fileBytes), /boş/u);
  assert.throws(() => validateGeneratedSize(LIMITS.fileBytes + 1, LIMITS.fileBytes), /həddini aşır/u);
});

test('QR limit is measured in UTF-8 bytes while preserving exact whitespace', () => {
  assert.equal(validateQrText(`  ${'x'.repeat(1196)}  `), `  ${'x'.repeat(1196)}  `);
  assert.throws(() => validateQrText('x'.repeat(LIMITS.qrBytes + 1)), /çox uzundur/u);
  assert.throws(() => validateQrText('ə'.repeat(601)), /çox uzundur/u);
  assert.throws(() => validateQrText('   \n\t'), /daxil edin/u);
});

test('text, canvas side and decoded pixels are bounded', () => {
  assert.equal(validateTextLength('abc'), 'abc');
  assert.throws(() => validateTextLength('x'.repeat(LIMITS.textChars + 1)), /çox uzundur/u);
  assert.deepEqual(validateImageDimensions(800, 600), { width: 800, height: 600, pixels: 480000 });
  assert.doesNotThrow(() => validateImageDimensions(LIMITS.canvasSide, 2));
  assert.doesNotThrow(() => validateImageDimensions(4096, 4096));
  assert.throws(() => validateImageDimensions(LIMITS.canvasSide + 1, 1), /ölçüsü/u);
  assert.throws(() => validateImageDimensions(12000, 2), /ölçüsü/u);
  assert.throws(() => validateImageDimensions(4097, 4096), /piksel/u);
  assert.throws(() => validateImageDimensions(6000, 5000), /piksel/u);
});

test('image signatures and animation are detected without trusting MIME', async () => {
  const png = new File([
    Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
      0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 8, 0x61, 0x63, 0x54, 0x4c, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0,
    ]),
  ], 'animated.png', { type: 'image/png' });
  const webp = new File([
    Uint8Array.from([
      0x52, 0x49, 0x46, 0x46, 22, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x58, 10, 0, 0, 0,
      0x02, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]),
  ], 'animated.webp', { type: 'image/jpeg' });

  assert.deepEqual(await inspectImageFile(png), { type: 'image/png', extension: 'png', animated: true, width: 1, height: 1 });
  assert.deepEqual(await inspectImageFile(webp), { type: 'image/webp', extension: 'webp', animated: true, width: 1, height: 1 });
  const jpeg = new File([Uint8Array.from([
    0xff, 0xd8, 0xff, 0xe0, 0, 2,
    0xff, 0xc0, 0, 11, 8, 0, 2, 0, 3, 3, 1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0,
  ])], 'extensionless', { type: 'image/png' });
  assert.deepEqual(await inspectImageFile(jpeg), { type: 'image/jpeg', extension: 'jpg', animated: false, width: 3, height: 2 });
  const staticWebp = new File([Uint8Array.from([
    0x52, 0x49, 0x46, 0x46, 22, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    0x56, 0x50, 0x38, 0x58, 10, 0, 0, 0,
    0, 0, 0, 0, 1, 0, 0, 2, 0, 0,
  ])], 'wrong.jpg', { type: 'image/jpeg' });
  assert.deepEqual(await inspectImageFile(staticWebp), { type: 'image/webp', extension: 'webp', animated: false, width: 2, height: 3 });
  await assert.rejects(
    inspectImageFile(new File([Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])], 'animated.gif', { type: 'image/gif' })),
    /formatı tanınmadı/u,
  );
  await assert.rejects(
    inspectImageFile(new File([Uint8Array.from([1, 2, 3])], 'bad.png', { type: 'image/png' })),
    /formatı tanınmadı/u,
  );
});
