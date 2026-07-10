import type { PDFPageProxy } from "pdfjs-dist";

let configured = false;

export async function loadPdfJsDocument(data: ArrayBuffer | Uint8Array) {
  const pdfjs = await import("pdfjs-dist");
  if (!configured) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    configured = true;
  }
  const loadingTask = pdfjs.getDocument({
    data: data instanceof Uint8Array ? data : new Uint8Array(data),
  });
  const document = await loadingTask.promise;
  return { document, loadingTask };
}

export async function renderPdfPage(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number,
) {
  const viewport = page.getViewport({ scale });
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas yaradıla bilmədi.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return viewport;
}
