"use client";

import type { PDFImage } from "pdf-lib";
import { Download, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createTextPng } from "@/lib/pdf/canvas-marks";
import {
  formatPageNumber,
  getPageNumberPosition,
  type PageNumberFormat,
  type PageNumberPosition,
} from "@/lib/pdf/layout";
import { parsePageRanges } from "@/lib/pdf/page-ranges";
import { usePdfPreview } from "@/components/tools/shared/usePdfPreview";
import {
  FilePicker,
  inputClass,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

const positions: Array<{ value: PageNumberPosition; label: string }> = [
  { value: "top-left", label: "Yuxarı sol" },
  { value: "top-center", label: "Yuxarı orta" },
  { value: "top-right", label: "Yuxarı sağ" },
  { value: "bottom-left", label: "Aşağı sol" },
  { value: "bottom-center", label: "Aşağı orta" },
  { value: "bottom-right", label: "Aşağı sağ" },
];

function previewStyle(position: PageNumberPosition, margin: number) {
  const [vertical, horizontal] = position.split("-");
  return {
    top: vertical === "top" ? `${Math.max(3, margin / 3)}px` : undefined,
    bottom: vertical === "bottom" ? `${Math.max(3, margin / 3)}px` : undefined,
    left:
      horizontal === "left"
        ? `${Math.max(3, margin / 3)}px`
        : horizontal === "center"
          ? "50%"
          : undefined,
    right: horizontal === "right" ? `${Math.max(3, margin / 3)}px` : undefined,
    transform: horizontal === "center" ? "translateX(-50%)" : undefined,
  };
}

export function PdfPageNumbers() {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultUrlRef = useRef("");
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<PageNumberFormat>("number");
  const [startingNumber, setStartingNumber] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState("#111827");
  const [margin, setMargin] = useState(24);
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [excludeFirst, setExcludeFirst] = useState(false);
  const [range, setRange] = useState("");
  const [previewPage, setPreviewPage] = useState(1);
  const [resultUrl, setResultUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const preview = usePdfPreview(file, previewPage, canvasRef);

  useEffect(
    () => () => {
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    },
    [],
  );

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResultUrl("");
    setSuccess("");
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    setError("");
    clearResult();
    if (!selected) return;
    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Yalnız PDF faylı seçin.");
      return;
    }
    setFile(selected);
    setPreviewPage(1);
    setRange("");
  }

  async function exportPdf() {
    if (!file || isProcessing) return;
    const parsed = parsePageRanges(range, preview.pageCount);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setIsProcessing(true);
    setError("");
    clearResult();
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.load(await file.arrayBuffer(), {
        updateMetadata: false,
      });
      const selected = new Set(parsed.pages);
      const embedded = new Map<
        string,
        { image: PDFImage; width: number; height: number }
      >();
      for (let index = 0; index < pdf.getPageCount(); index += 1) {
        const pageNumber = index + 1;
        if (!selected.has(pageNumber) || (excludeFirst && pageNumber === 1))
          continue;
        const label = formatPageNumber(
          startingNumber + index,
          pdf.getPageCount(),
          format,
        );
        let mark = embedded.get(label);
        if (!mark) {
          const png = await createTextPng(label, fontSize, color);
          mark = {
            image: await pdf.embedPng(png.bytes),
            width: png.width,
            height: png.height,
          };
          embedded.set(label, mark);
        }
        const page = pdf.getPage(index);
        const size = page.getSize();
        const point = getPageNumberPosition(
          size.width,
          size.height,
          mark.width,
          mark.height,
          position,
          margin,
        );
        page.drawImage(mark.image, {
          x: point.x,
          y: point.y,
          width: mark.width,
          height: mark.height,
        });
      }
      const bytes = await pdf.save();
      const blob = new Blob(
        [
          bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ) as ArrayBuffer,
        ],
        { type: "application/pdf" },
      );
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
      setSuccess("Səhifə nömrələri əlavə edildi.");
    } catch {
      setError(
        "PDF emal edilə bilmədi. Fayl şifrəli və ya zədələnmiş ola bilər.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function reset() {
    setFile(null);
    setRange("");
    setPreviewPage(1);
    setError("");
    clearResult();
    if (inputRef.current) inputRef.current.value = "";
  }

  const previewLabel = formatPageNumber(
    startingNumber + previewPage - 1,
    preview.pageCount || 1,
    format,
  );
  const showPreviewNumber = !(excludeFirst && previewPage === 1);

  return (
    <div className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
      <ToolCard title="PDF və nömrələmə">
        <FilePicker
          inputRef={inputRef}
          accept="application/pdf,.pdf"
          title={file ? "Başqa PDF seç" : "PDF seç"}
          hint="Portret və albom səhifələr ayrıca ölçülür"
          onChange={handleFile}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Format
            <select
              className={`${inputClass} mt-2`}
              value={format}
              onChange={(event) => {
                setFormat(event.target.value as PageNumberFormat);
                clearResult();
              }}
            >
              <option value="number">1</option>
              <option value="page-number">Səhifə 1</option>
              <option value="number-total">1 / 10</option>
              <option value="page-number-total">Səhifə 1 / 10</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Başlanğıc nömrə
            <input
              className={`${inputClass} mt-2`}
              type="number"
              min="-999999"
              max="999999"
              value={startingNumber}
              onChange={(event) => {
                setStartingNumber(Number(event.target.value));
                clearResult();
              }}
            />
          </label>
          <label className="text-sm font-semibold">
            Şrift ölçüsü
            <input
              className={`${inputClass} mt-2`}
              type="number"
              min="6"
              max="72"
              value={fontSize}
              onChange={(event) => {
                setFontSize(Number(event.target.value));
                clearResult();
              }}
            />
          </label>
          <label className="text-sm font-semibold">
            Mətn rəngi
            <input
              className={`${inputClass} mt-2 p-1`}
              type="color"
              value={color}
              onChange={(event) => {
                setColor(event.target.value);
                clearResult();
              }}
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Kənar məsafə: {margin} pt
            <input
              className="mt-2 w-full accent-[var(--accent)]"
              type="range"
              min="6"
              max="72"
              value={margin}
              onChange={(event) => {
                setMargin(Number(event.target.value));
                clearResult();
              }}
            />
          </label>
        </div>
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">Yerləşmə</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {positions.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => {
                  setPosition(item.value);
                  clearResult();
                }}
                className={`min-h-10 rounded-lg border px-2 text-xs font-semibold ${position === item.value ? "border-accent bg-accent-soft text-accent" : "border-line bg-white"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface-soft p-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={excludeFirst}
            onChange={(event) => {
              setExcludeFirst(event.target.checked);
              clearResult();
            }}
          />
          Birinci səhifəni istisna et
        </label>
        <label className="mt-4 block text-sm font-semibold">
          Səhifələr
          <input
            className={`${inputClass} mt-2`}
            value={range}
            onChange={(event) => {
              setRange(event.target.value);
              clearResult();
            }}
            placeholder="Boş = hamısı; məsələn 2-5, 8"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!file || !preview.pageCount || isProcessing}
            onClick={exportPdf}
          >
            {isProcessing ? "Hazırlanır..." : "Nömrələri əlavə et"}
          </button>
          {resultUrl ? (
            <a
              href={resultUrl}
              download="numbered-document.pdf"
              className={secondaryButtonClass}
            >
              <Download size={16} />
              PDF yüklə
            </a>
          ) : null}
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={reset}
          >
            <RotateCcw size={16} />
            Təmizlə
          </button>
        </div>
        <StatusMessage error={error || preview.error} success={success} />
        <div className="mt-4">
          <PrivacyNotice />
        </div>
      </ToolCard>
      <ToolCard title="Önizləmə">
        <div className="mb-3 flex items-center gap-3">
          <label className="text-sm font-semibold">
            Səhifə{" "}
            <input
              className="ml-2 h-9 w-20 rounded-lg border border-line px-2"
              type="number"
              min="1"
              max={preview.pageCount || 1}
              value={previewPage}
              onChange={(event) =>
                setPreviewPage(Math.max(1, Number(event.target.value)))
              }
            />
          </label>
          <span className="text-sm text-muted">/ {preview.pageCount || 0}</span>
        </div>
        <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-xl border border-line bg-surface-soft">
          <canvas
            ref={canvasRef}
            className="block h-auto max-h-[70vh] max-w-full"
            aria-label="PDF önizləməsi"
          />
          {file && showPreviewNumber && !preview.isLoading ? (
            <span
              className="pointer-events-none absolute whitespace-nowrap font-semibold"
              style={{
                ...previewStyle(position, margin),
                color,
                fontSize: `${Math.max(9, fontSize * 0.85)}px`,
              }}
            >
              {previewLabel}
            </span>
          ) : null}
          {preview.isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-muted">
              Önizləmə hazırlanır...
            </div>
          ) : null}
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">
          Ümumi səhifə sayı fiziki PDF səhifələrinin sayıdır. Seçilmiş aralıq
          yalnız nömrə əlavə ediləcək səhifələri dəyişir.
        </p>
      </ToolCard>
    </div>
  );
}
