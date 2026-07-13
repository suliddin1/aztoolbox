import { validatePdfPageCount } from './tool-guards.js';

export async function cleanPdfMetadata(PDFLib, sourceBytes) {
  const source = await PDFLib.PDFDocument.load(sourceBytes, { updateMetadata: false });
  validatePdfPageCount(source.getPageCount());

  const infoReference = source.context.trailerInfo.Info;
  delete source.context.trailerInfo.Info;
  if (infoReference) source.context.delete(infoReference);

  return source.save();
}
