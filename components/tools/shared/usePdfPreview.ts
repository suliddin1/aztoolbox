"use client";

import { useEffect, useState, type RefObject } from "react";
import { loadPdfJsDocument, renderPdfPage } from "@/lib/pdf/pdfjs-client";

export function usePdfPreview(
  file: File | null,
  pageNumber: number,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!file || !canvasRef.current) {
      setPageCount(0);
      setError("");
      return;
    }
    setIsLoading(true);
    setError("");
    void (async () => {
      try {
        const { document: pdfDocument, loadingTask } = await loadPdfJsDocument(
          await file.arrayBuffer(),
        );
        if (cancelled) {
          await loadingTask.destroy();
          return;
        }
        setPageCount(pdfDocument.numPages);
        const safePage = Math.max(
          1,
          Math.min(pageNumber, pdfDocument.numPages),
        );
        const page = await pdfDocument.getPage(safePage);
        if (canvasRef.current)
          await renderPdfPage(page, canvasRef.current, 1.2);
        await loadingTask.destroy();
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message.toLowerCase() : "";
        setError(
          message.includes("password")
            ? "PDF şifrəlidir."
            : "PDF önizləməsi yaradıla bilmədi.",
        );
        setPageCount(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canvasRef, file, pageNumber]);

  return { pageCount, isLoading, error };
}
