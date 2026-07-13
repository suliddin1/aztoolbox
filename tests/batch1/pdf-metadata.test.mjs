import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

import { cleanPdfMetadata } from '../../assets/js/pdf-tools.js';

async function loadPdfLib() {
  const source = await readFile(new URL('../../assets/vendor/pdf-lib.min.js', import.meta.url), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context);
  return { PDFLib: context.PDFLib, context };
}

test('metadata cleaner removes Info fields without rebuilding the PDF catalog', async () => {
  const { PDFLib, context } = await loadPdfLib();
  const source = await PDFLib.PDFDocument.create({ updateMetadata: false });
  const page = source.addPage();
  page.setSize(321, 456);
  page.setRotation(PDFLib.degrees(90));
  const font = await source.embedFont(PDFLib.StandardFonts.Helvetica);
  page.drawText('BATCH1_SENTINEL', { x: 24, y: 42, size: 12, font });
  const form = source.getForm();
  const field = form.createTextField('profile.name');
  field.setText('Alice');
  field.addToPage(page, { x: 24, y: 80, width: 120, height: 20 });
  await source.attach(vm.runInContext('new Uint8Array([65, 90, 84, 45, 49])', context), 'batch1.txt', {
    mimeType: 'text/plain',
    description: 'BATCH1_ATTACHMENT',
  });
  const secondPage = source.addPage();
  secondPage.setSize(612, 792);
  source.setTitle('Secret title');
  source.setAuthor('Secret author');
  source.setSubject('Secret subject');
  source.setKeywords(vm.runInContext("['secret']", context));
  source.setCreator('Original app');
  source.setProducer('Original producer');
  source.setCreationDate(vm.runInContext("new Date('2001-01-01T00:00:00Z')", context));
  source.setModificationDate(vm.runInContext("new Date('2002-01-01T00:00:00Z')", context));
  const info = source.context.lookup(source.context.trailerInfo.Info, PDFLib.PDFDict);
  info.set(PDFLib.PDFName.of('PrivateKey'), PDFLib.PDFString.of('PrivateValue'));

  const cleanedBytes = await cleanPdfMetadata(PDFLib, await source.save());
  assert.ok(cleanedBytes.length > 100);
  assert.equal(new TextDecoder('latin1').decode(cleanedBytes.slice(0, 5)), '%PDF-');

  const cleaned = await PDFLib.PDFDocument.load(cleanedBytes, { updateMetadata: false });
  assert.equal(cleaned.getPageCount(), 2);
  const size = cleaned.getPage(0).getSize();
  assert.equal(size.width, 321);
  assert.equal(size.height, 456);
  assert.equal(cleaned.getPage(0).getRotation().angle, 90);
  const secondSize = cleaned.getPage(1).getSize();
  assert.equal(secondSize.width, 612);
  assert.equal(secondSize.height, 792);
  const contents = cleaned.getPage(0).node.Contents();
  const streams = contents.asArray().map((reference) => cleaned.context.lookup(reference));
  const decodedContents = streams.map((stream) => new TextDecoder('latin1').decode(PDFLib.decodePDFRawStream(stream).decode())).join('\n');
  assert.match(decodedContents, /4241544348315F53454E54494E454C/u);
  const cleanedField = cleaned.getForm().getTextField('profile.name');
  assert.equal(cleanedField.getText(), 'Alice');
  assert.ok(cleaned.catalog.get(PDFLib.PDFName.of('AcroForm')));
  const namesReference = cleaned.catalog.get(PDFLib.PDFName.of('Names'));
  assert.ok(namesReference, 'embedded-file name tree must be preserved');
  const names = cleaned.context.lookup(namesReference, PDFLib.PDFDict);
  const embeddedFiles = cleaned.context.lookup(names.get(PDFLib.PDFName.of('EmbeddedFiles')), PDFLib.PDFDict);
  const attachmentPairs = embeddedFiles.lookup(PDFLib.PDFName.of('Names'), PDFLib.PDFArray);
  assert.equal(attachmentPairs.lookup(0).decodeText(), 'batch1.txt');
  const fileSpec = attachmentPairs.lookup(1, PDFLib.PDFDict);
  assert.equal(fileSpec.lookup(PDFLib.PDFName.of('Desc')).decodeText(), 'BATCH1_ATTACHMENT');
  const embeddedFile = fileSpec.lookup(PDFLib.PDFName.of('EF'), PDFLib.PDFDict)
    .lookup(PDFLib.PDFName.of('F'), PDFLib.PDFRawStream);
  assert.deepEqual([...PDFLib.decodePDFRawStream(embeddedFile).decode()], [65, 90, 84, 45, 49]);
  assert.equal(cleaned.context.trailerInfo.Info, undefined);
  assert.equal(cleaned.getTitle(), undefined);
  assert.equal(cleaned.getAuthor(), undefined);
  assert.equal(cleaned.getCreator(), undefined);
  assert.equal(cleaned.getProducer(), undefined);
  assert.equal(cleaned.getCreationDate(), undefined);
  assert.equal(cleaned.getModificationDate(), undefined);

  const raw = new TextDecoder('latin1').decode(cleanedBytes);
  assert.equal(raw.includes('PrivateValue'), false);
  assert.equal(raw.includes('AzToolBox'), false);
});
