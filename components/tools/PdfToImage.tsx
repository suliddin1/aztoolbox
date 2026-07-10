"use client";

import { Download, FileArchive, RotateCcw } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { canvasToBlob } from "@/lib/image-tools";
import { formatBytes } from "@/lib/browser/download";
import {
  pageImageFilename,
  sanitizeDownloadBaseName,
} from "@/lib/pdf/filename";
import { parsePageRanges } from "@/lib/pdf/page-ranges";
import { loadPdfJsDocument, renderPdfPage } from "@/lib/pdf/pdfjs-client";
import {
  FilePicker,
  inputClass,
  primaryButtonClass,
  PrivacyNotice,
  ProgressBar,
  secondaryButtonClass,
  StatusMessage,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

type OutputFormat = "jpg" | "png";
type Resolution = "normal" | "high" | "very-high";
type RenderedPage = {
  page: number;
  blob: Blob;
  url: string;
  filename: string;
  width: number;
  height: number;
};

const resolutionScale: Record<Resolution, number> = {
  normal: 1.5,
  high: 2.25,
  "very-high": 3,
};

export function PdfToImage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const thumbnailUrls = useRef<string[]>([]);
  const outputUrls = useRef<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<
    Array<{ page: number; url: string; width: number; height: number }>
  >([]);
  const [range, setRange] = useState("");
  const [format, setFormat] = useState<OutputFormat>("jpg");
  const [resolution, setResolution] = useState<Resolution>("normal");
  const [results, setResults] = useState<RenderedPage[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function revoke(urls: string[]) {
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls.length = 0;
  }

  function clearResults() {
    revoke(outputUrls.current);
    setResults([]);
    setProgress(0);
    setProgressLabel("");
    setSuccess("");
  }

  useEffect(
    () => () => {
      revoke(thumbnailUrls.current);
      revoke(outputUrls.current);
    },
    [],
  );

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    setError("");
    setSuccess("");
    clearResults();
    revoke(thumbnailUrls.current);
    setThumbnails([]);
    setPageCount(0);
    setRange("");
    if (!selected) return;
    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setFile(null);
      setError("Yalnız PDF faylı seçin.");
      return;
    }

    setFile(selected);
    setIsProcessing(true);
    setProgressLabel("PDF yoxlanılır və kiçik önizləmələr hazırlanır");
    try {
      const { document: pdfDocument, loadingTask } = await loadPdfJsDocument(
        await selected.arrayBuffer(),
      );
      setPageCount(pdfDocument.numPages);
      const nextThumbnails: Array<{
        page: number;
        url: string;
        width: number;
        height: number;
      }> = [];
      for (
        let pageNumber = 1;
        pageNumber <= pdfDocument.numPages;
        pageNumber += 1
      ) {
        const page = await pdfDocument.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        await renderPdfPage(page, canvas, Math.min(0.35, 150 / base.width));
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.72);
        canvas.width = 1;
        canvas.height = 1;
        const url = URL.createObjectURL(blob);
        thumbnailUrls.current.push(url);
        nextThumbnails.push({
          page: pageNumber,
          url,
          width: canvas.width,
          height: canvas.height,
        });
        setThumbnails([...nextThumbnails]);
        setProgress((pageNumber / pdfDocument.numPages) * 100);
      }
      const loadedPageCount = pdfDocument.numPages;
      await loadingTask.destroy();
      setProgressLabel("");
      setProgress(0);
      setSuccess(`${loadedPageCount} səhifəli PDF hazırdır.`);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message.toLowerCase() : "";
      setFile(null);
      setError(
        message.includes("password")
          ? "PDF şifrəlidir. Şifrəsiz surət seçin."
          : "PDF oxuna bilmədi. Fayl zədələnmiş, etibarsız və ya şifrəli ola bilər.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function processPages() {
    if (!file || !pageCount || isProcessing) return;
    setError("");
    clearResults();
    const parsed = parsePageRanges(range, pageCount);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setIsProcessing(true);
    const next: RenderedPage[] = [];
    try {
      const { document: pdfDocument, loadingTask } = await loadPdfJsDocument(
        await file.arrayBuffer(),
      );
      for (let index = 0; index < parsed.pages.length; index += 1) {
        const pageNumber = parsed.pages[index];
        setProgressLabel(`Səhifə ${pageNumber} emal olunur`);
        const page = await pdfDocument.getPage(pageNumber);
        const canvas = document.createElement("canvas");
        await renderPdfPage(page, canvas, resolutionScale[resolution]);
        const mime = format === "jpg" ? "image/jpeg" : "image/png";
        const blob = await canvasToBlob(
          canvas,
          mime,
          format === "jpg" ? 0.92 : undefined,
        );
        const url = URL.createObjectURL(blob);
        outputUrls.current.push(url);
        next.push({
          page: pageNumber,
          blob,
          url,
          filename: pageImageFilename(file.name, pageNumber, format),
          width: canvas.width,
          height: canvas.height,
        });
        canvas.width = 1;
        canvas.height = 1;
        setResults([...next]);
        setProgress(((index + 1) / parsed.pages.length) * 100);
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }
      await loadingTask.destroy();
      setSuccess(
        `${next.length} səhifə ${format.toUpperCase()} formatında hazırdır.`,
      );
    } catch {
      clearResults();
      setError(
        "Səhifələr şəkilə çevrilə bilmədi. Daha aşağı resolution seçib yenidən sınayın.",
      );
    } finally {
      setIsProcessing(false);
      setProgressLabel("");
    }
  }

  async function downloadZip() {
    if (!results.length || !file || isZipping) return;
    setIsZipping(true);
    setError("");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      results.forEach((result) => zip.file(result.filename, result.blob));
      const blob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE" },
        (metadata) => {
          setProgress(metadata.percent);
          setProgressLabel("ZIP hazırlanır");
        },
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${sanitizeDownloadBaseName(file.name)}-images.zip`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      setError("ZIP faylı yaradıla bilmədi.");
    } finally {
      setIsZipping(false);
      setProgressLabel("");
      setProgress(0);
    }
  }

  function reset() {
    setFile(null);
    setPageCount(0);
    setRange("");
    revoke(thumbnailUrls.current);
    setThumbnails([]);
    clearResults();
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
      <ToolCard title="PDF və çıxış seçimləri">
        <FilePicker
          inputRef={inputRef}
          accept="application/pdf,.pdf"
          title={file ? "Başqa PDF seç" : "PDF seç"}
          hint="Bir PDF · fayl cihazınızdan çıxmır"
          onChange={handleFile}
        />
        {file ? (
          <p className="mt-3 rounded-xl bg-surface-soft p-3 text-sm">
            <strong>{file.name}</strong>
            <br />
            <span className="text-muted">
              {formatBytes(file.size)} · {pageCount || "..."} səhifə
            </span>
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Format
            <select
              className={`${inputClass} mt-2`}
              value={format}
              onChange={(event) => {
                setFormat(event.target.value as OutputFormat);
                clearResults();
              }}
            >
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Resolution
            <select
              className={`${inputClass} mt-2`}
              value={resolution}
              onChange={(event) => {
                setResolution(event.target.value as Resolution);
                clearResults();
              }}
            >
              <option value="normal">Normal</option>
              <option value="high">Yüksək</option>
              <option value="very-high">Çox yüksək</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm font-semibold">
          Səhifələr
          <input
            className={`${inputClass} mt-2`}
            value={range}
            onChange={(event) => {
              setRange(event.target.value);
              clearResults();
            }}
            placeholder={
              pageCount
                ? `Boş saxla və ya 1-${pageCount}, məsələn 1-3, 5`
                : "Məsələn: 1-3, 5"
            }
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className={primaryButtonClass}
            type="button"
            onClick={processPages}
            disabled={!file || !pageCount || isProcessing}
          >
            {isProcessing ? "Emal olunur..." : "Şəkilləri hazırla"}
          </button>
          <button
            className={secondaryButtonClass}
            type="button"
            onClick={reset}
          >
            <RotateCcw size={16} />
            Təmizlə
          </button>
        </div>
        {progressLabel ? (
          <ProgressBar value={progress} label={progressLabel} />
        ) : null}
        <StatusMessage error={error} success={success} />
        <div className="mt-4">
          <PrivacyNotice />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          Çox yüksək resolution və uzun PDF-lər cihaz yaddaşını çox istifadə edə
          bilər. Problem olarsa daha az səhifə və ya aşağı resolution seçin.
        </p>
      </ToolCard>

      <div className="grid min-w-0 gap-5">
        <ToolCard title="Səhifə önizləmələri">
          {thumbnails.length ? (
            <div className="grid max-h-80 grid-cols-3 gap-3 overflow-auto sm:grid-cols-4 md:grid-cols-5">
              {thumbnails.map((item) => (
                <figure
                  key={item.page}
                  className="rounded-xl border border-line bg-surface-soft p-2"
                >
                  <NextImage
                    src={item.url}
                    alt={`Səhifə ${item.page} önizləməsi`}
                    width={item.width}
                    height={item.height}
                    unoptimized
                    className="mx-auto h-auto max-h-36 w-auto"
                  />
                  <figcaption className="mt-2 text-center text-xs text-muted">
                    Səhifə {item.page}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-surface-soft p-5 text-center text-sm text-muted">
              PDF seçildikdə səhifələr burada görünəcək.
            </p>
          )}
        </ToolCard>
        <ToolCard title="Hazır şəkillər">
          {results.length ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  {results.length} fayl hazırdır
                </p>
                <button
                  type="button"
                  className={primaryButtonClass}
                  onClick={downloadZip}
                  disabled={isZipping}
                >
                  <FileArchive size={16} />
                  {isZipping ? "ZIP hazırlanır..." : "Hamısını ZIP yüklə"}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.map((result) => (
                  <article
                    key={result.page}
                    className="rounded-xl border border-line bg-surface-soft p-3"
                  >
                    <NextImage
                      src={result.url}
                      alt={`Səhifə ${result.page}`}
                      width={result.width}
                      height={result.height}
                      unoptimized
                      className="mx-auto h-auto max-h-64 w-auto rounded border border-line bg-white"
                    />
                    <p className="mt-3 truncate text-sm font-semibold">
                      {result.filename}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {result.width}×{result.height} ·{" "}
                      {formatBytes(result.blob.size)}
                    </p>
                    <a
                      href={result.url}
                      download={result.filename}
                      className={`${secondaryButtonClass} mt-3 w-full`}
                    >
                      <Download size={16} />
                      Bu səhifəni yüklə
                    </a>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="rounded-xl bg-surface-soft p-5 text-center text-sm text-muted">
              Emal edilmiş səhifələr burada görünəcək.
            </p>
          )}
        </ToolCard>
      </div>
    </div>
  );
}
