"use client";

import type { PDFImage } from "pdf-lib";
import { Download, ImagePlus, RotateCcw } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/browser/download";
import { createTextPng, rotatedPlacement } from "@/lib/pdf/canvas-marks";
import { getWatermarkPosition, type WatermarkPosition } from "@/lib/pdf/layout";
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

type WatermarkType = "text" | "image";
const positions: WatermarkPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "middle-center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];
const positionLabels: Record<WatermarkPosition, string> = {
  "top-left": "Yuxarı sol",
  "top-center": "Yuxarı orta",
  "top-right": "Yuxarı sağ",
  "middle-left": "Orta sol",
  "middle-center": "Mərkəz",
  "middle-right": "Orta sağ",
  "bottom-left": "Aşağı sol",
  "bottom-center": "Aşağı orta",
  "bottom-right": "Aşağı sağ",
};

function previewPosition(position: WatermarkPosition) {
  const [vertical, horizontal] = position.split("-");
  return {
    top: vertical === "top" ? "12%" : vertical === "middle" ? "50%" : "88%",
    left:
      horizontal === "left" ? "12%" : horizontal === "center" ? "50%" : "88%",
  };
}

export function PdfWatermark() {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultUrlRef = useRef("");
  const imageUrlRef = useRef("");
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<WatermarkType>("text");
  const [text, setText] = useState("NÜMUNƏ");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [fontSize, setFontSize] = useState(36);
  const [color, setColor] = useState("#1d4ed8");
  const [opacity, setOpacity] = useState(0.25);
  const [rotation, setRotation] = useState(-35);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<WatermarkPosition>("middle-center");
  const [tiled, setTiled] = useState(false);
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
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    },
    [],
  );

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResultUrl("");
    setSuccess("");
  }

  function handlePdf(event: React.ChangeEvent<HTMLInputElement>) {
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

  function handleImage(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    setError("");
    clearResult();
    if (!selected) return;
    if (!/^image\/(png|jpeg)$/.test(selected.type)) {
      setError("Su nişanı üçün PNG və ya JPG seçin.");
      return;
    }
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    const url = URL.createObjectURL(selected);
    imageUrlRef.current = url;
    setImageFile(selected);
    setImageUrl(url);
  }

  async function exportPdf() {
    if (!file || isProcessing) return;
    if (type === "text" && !text.trim()) {
      setError("Su nişanı mətnini daxil edin.");
      return;
    }
    if (type === "image" && !imageFile) {
      setError("Su nişanı şəklini seçin.");
      return;
    }
    const parsed = parsePageRanges(range, preview.pageCount);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setIsProcessing(true);
    setError("");
    clearResult();
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const pdf = await PDFDocument.load(await file.arrayBuffer(), {
        updateMetadata: false,
      });
      let baseWidth = 0;
      let baseHeight = 0;
      let embedded: PDFImage;
      if (type === "text") {
        const mark = await createTextPng(text.trim(), fontSize, color);
        embedded = await pdf.embedPng(mark.bytes);
        baseWidth = mark.width;
        baseHeight = mark.height;
      } else {
        const bytes = await imageFile!.arrayBuffer();
        embedded =
          imageFile!.type === "image/jpeg"
            ? await pdf.embedJpg(bytes)
            : await pdf.embedPng(bytes);
        baseWidth = embedded.width;
        baseHeight = embedded.height;
      }

      const selected = new Set(parsed.pages);
      pdf.getPages().forEach((page, index) => {
        if (!selected.has(index + 1)) return;
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const width =
          type === "image" ? pageWidth * 0.25 * scale : baseWidth * scale;
        const height = width * (baseHeight / baseWidth);
        const bounds = rotatedPlacement(0, 0, width, height, rotation);
        const drawAt = (boxX: number, boxY: number) => {
          const placement = rotatedPlacement(
            boxX,
            boxY,
            width,
            height,
            rotation,
          );
          page.drawImage(embedded, {
            x: placement.originX,
            y: placement.originY,
            width,
            height,
            rotate: degrees(rotation),
            opacity,
          });
        };
        if (tiled) {
          const gap = 50;
          for (
            let y = 24;
            y < pageHeight - 12;
            y += bounds.boundingHeight + gap
          ) {
            for (
              let x = 24;
              x < pageWidth - 12;
              x += bounds.boundingWidth + gap
            )
              drawAt(x, y);
          }
        } else {
          const point = getWatermarkPosition(
            pageWidth,
            pageHeight,
            bounds.boundingWidth,
            bounds.boundingHeight,
            position,
            24,
          );
          drawAt(point.x, point.y);
        }
      });
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
      setSuccess("Su nişanlı PDF hazırdır.");
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
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }

  const marker =
    type === "text" ? (
      <span
        className="whitespace-nowrap font-sans font-semibold"
        style={{ color, fontSize: `${Math.max(12, fontSize * 0.55)}px` }}
      >
        {text || "Su nişanı"}
      </span>
    ) : imageUrl ? (
      <span className="relative block h-24 w-32">
        <NextImage
          src={imageUrl}
          alt="Su nişanı"
          fill
          unoptimized
          className="object-contain"
        />
      </span>
    ) : (
      <span className="text-xs">Şəkil seçin</span>
    );
  const markerTransform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;

  return (
    <div className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
      <ToolCard title="PDF və su nişanı">
        <FilePicker
          inputRef={pdfInputRef}
          accept="application/pdf,.pdf"
          title={file ? "Başqa PDF seç" : "PDF seç"}
          hint="Orijinal səhifələr rasterləşdirilmir"
          onChange={handlePdf}
        />
        {file ? (
          <p className="mt-3 rounded-xl bg-surface-soft p-3 text-sm">
            <strong>{file.name}</strong> · {formatBytes(file.size)}
          </p>
        ) : null}
        <div
          className="mt-4 grid grid-cols-2 gap-2"
          role="group"
          aria-label="Su nişanı növü"
        >
          {(["text", "image"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setType(item);
                clearResult();
              }}
              className={
                item === type ? primaryButtonClass : secondaryButtonClass
              }
            >
              {item === "text" ? "Mətn" : "Şəkil"}
            </button>
          ))}
        </div>
        {type === "text" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2">
              Mətn
              <input
                className={`${inputClass} mt-2`}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  clearResult();
                }}
              />
            </label>
            <label className="text-sm font-semibold">
              Şrift ölçüsü
              <input
                className={`${inputClass} mt-2`}
                type="number"
                min="10"
                max="144"
                value={fontSize}
                onChange={(event) => {
                  setFontSize(Number(event.target.value));
                  clearResult();
                }}
              />
            </label>
            <label className="text-sm font-semibold">
              Rəng
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
          </div>
        ) : (
          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-soft p-4 text-sm font-semibold hover:border-accent">
            <ImagePlus size={18} />
            {imageFile ? imageFile.name : "PNG və ya JPG seç"}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              className="sr-only"
              onChange={handleImage}
            />
          </label>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Şəffaflıq: {Math.round(opacity * 100)}%
            <input
              className="mt-2 w-full accent-[var(--accent)]"
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(event) => {
                setOpacity(Number(event.target.value));
                clearResult();
              }}
            />
          </label>
          <label className="text-sm font-semibold">
            Miqyas: {Math.round(scale * 100)}%
            <input
              className="mt-2 w-full accent-[var(--accent)]"
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={scale}
              onChange={(event) => {
                setScale(Number(event.target.value));
                clearResult();
              }}
            />
          </label>
          <label className="text-sm font-semibold">
            Dönmə: {rotation}°
            <input
              className="mt-2 w-full accent-[var(--accent)]"
              type="range"
              min="-180"
              max="180"
              step="5"
              value={rotation}
              onChange={(event) => {
                setRotation(Number(event.target.value));
                clearResult();
              }}
            />
          </label>
          <label className="flex items-center gap-2 self-end rounded-xl border border-line bg-surface-soft px-3 py-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={tiled}
              onChange={(event) => {
                setTiled(event.target.checked);
                clearResult();
              }}
            />
            Təkrarlanan / tiled
          </label>
        </div>
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">Yerləşmə</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {positions.map((item) => (
              <button
                key={item}
                type="button"
                disabled={tiled}
                title={positionLabels[item]}
                aria-label={positionLabels[item]}
                onClick={() => {
                  setPosition(item);
                  clearResult();
                }}
                className={`h-10 rounded-lg border text-xs font-semibold ${position === item ? "border-accent bg-accent-soft text-accent" : "border-line bg-white"} disabled:opacity-45`}
              >
                {positionLabels[item]
                  .split(" ")
                  .map((word) => word[0])
                  .join("")}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="mt-4 block text-sm font-semibold">
          Səhifələr
          <input
            className={`${inputClass} mt-2`}
            value={range}
            onChange={(event) => {
              setRange(event.target.value);
              clearResult();
            }}
            placeholder="Boş = hamısı; məsələn 1-3, 5"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!file || isProcessing || !preview.pageCount}
            onClick={exportPdf}
          >
            {isProcessing ? "Hazırlanır..." : "Su nişanı əlavə et"}
          </button>
          {resultUrl ? (
            <a
              className={secondaryButtonClass}
              href={resultUrl}
              download="watermarked-document.pdf"
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
          {file && !preview.isLoading ? (
            tiled ? (
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-4 overflow-hidden">
                {Array.from({ length: 12 }, (_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center"
                    style={{ opacity }}
                  >
                    <span
                      className="block"
                      style={{
                        transform: `rotate(${rotation}deg) scale(${scale})`,
                      }}
                    >
                      {marker}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="pointer-events-none absolute"
                style={{
                  ...previewPosition(position),
                  opacity,
                  transform: markerTransform,
                  transformOrigin: "center",
                }}
              >
                {marker}
              </div>
            )
          ) : null}
          {preview.isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-muted">
              Önizləmə hazırlanır...
            </div>
          ) : null}
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">
          Mətn Azərbaycan hərflərini dəstəkləyən brauzer sistem şrifti ilə şəkil
          kimi əlavə olunur; PDF-in mövcud görünən məzmunu rasterləşdirilmir.
        </p>
      </ToolCard>
    </div>
  );
}
