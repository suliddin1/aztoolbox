"use client";

import { Download, Eraser, RotateCcw } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { canvasToBlob, decodeImage, imageDimensions } from "@/lib/image-tools";
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

type SignatureSource = "draw" | "type" | "upload";

function measureTypedSignatureAspect(value: string) {
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return 3.3;
  context.font = '72px "Segoe Script", "Brush Script MT", cursive';
  return (
    Math.max(240, Math.ceil(context.measureText(value || "İmza").width + 48)) /
    130
  );
}

async function typedSignaturePng(value: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("İmza yaradıla bilmədi.");
  context.font = '72px "Segoe Script", "Brush Script MT", cursive';
  const width = Math.ceil(context.measureText(value).width + 48);
  canvas.width = Math.max(240, width);
  canvas.height = 130;
  const draw = canvas.getContext("2d");
  if (!draw) throw new Error("İmza yaradıla bilmədi.");
  draw.font = '72px "Segoe Script", "Brush Script MT", cursive';
  draw.fillStyle = "#111827";
  draw.textBaseline = "middle";
  draw.fillText(value, 24, canvas.height / 2);
  const blob = await canvasToBlob(canvas, "image/png");
  return {
    bytes: await blob.arrayBuffer(),
    aspect: canvas.width / canvas.height,
  };
}

export function PdfSignature() {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const signatureUrlRef = useRef("");
  const resultUrlRef = useRef("");
  const drawingRef = useRef(false);
  const dragRef = useRef<{
    mode: "move" | "resize";
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<SignatureSource>("draw");
  const [typed, setTyped] = useState("");
  const [uploaded, setUploaded] = useState<File | null>(null);
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [aspect, setAspect] = useState(3.3);
  const [page, setPage] = useState(1);
  const [applyRange, setApplyRange] = useState("");
  const [x, setX] = useState(55);
  const [y, setY] = useState(72);
  const [width, setWidth] = useState(30);
  const [resultUrl, setResultUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const preview = usePdfPreview(file, page, pdfCanvasRef);

  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    canvas.width = 800;
    canvas.height = 240;
    const context = canvas.getContext("2d");
    if (context) {
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 5;
      context.strokeStyle = "#111827";
    }
  }, []);

  useEffect(
    () => () => {
      if (signatureUrlRef.current) URL.revokeObjectURL(signatureUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    },
    [],
  );

  function replaceSignature(blob: Blob, nextAspect = 3.3) {
    if (signatureUrlRef.current) URL.revokeObjectURL(signatureUrlRef.current);
    const url = URL.createObjectURL(blob);
    signatureUrlRef.current = url;
    setSignatureBlob(blob);
    setSignatureUrl(url);
    setAspect(nextAspect);
  }

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
    setPage(1);
    setApplyRange("");
  }

  function canvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const point = canvasPoint(event);
    const context = event.currentTarget.getContext("2d");
    context?.beginPath();
    context?.moveTo(point.x, point.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const point = canvasPoint(event);
    const context = event.currentTarget.getContext("2d");
    context?.lineTo(point.x, point.y);
    context?.stroke();
  }

  async function stopDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const blob = await canvasToBlob(event.currentTarget, "image/png");
    replaceSignature(
      blob,
      event.currentTarget.width / event.currentTarget.height,
    );
    clearResult();
  }

  function clearDrawnSignature() {
    const canvas = drawCanvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    if (signatureUrlRef.current) URL.revokeObjectURL(signatureUrlRef.current);
    signatureUrlRef.current = "";
    setSignatureBlob(null);
    setSignatureUrl("");
    clearResult();
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    setError("");
    clearResult();
    if (!selected) return;
    if (selected.type !== "image/png") {
      setError("Şəffaf fon üçün PNG imza faylı seçin.");
      return;
    }
    try {
      const image = await decodeImage(selected);
      const size = imageDimensions(image);
      setAspect(size.width / size.height);
      if ("close" in image) image.close();
      setUploaded(selected);
      replaceSignature(selected, size.width / size.height);
    } catch {
      setError("İmza şəkli oxuna bilmədi.");
    }
  }

  function startOverlayPointer(
    event: React.PointerEvent,
    mode: "move" | "resize",
  ) {
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      x,
      y,
      width,
    };
  }

  function moveOverlay(event: React.PointerEvent) {
    const drag = dragRef.current;
    const box = previewBoxRef.current?.getBoundingClientRect();
    if (!drag || !box) return;
    const dx = ((event.clientX - drag.startX) / box.width) * 100;
    const dy = ((event.clientY - drag.startY) / box.height) * 100;
    if (drag.mode === "move") {
      setX(Math.max(0, Math.min(100 - width, drag.x + dx)));
      setY(Math.max(0, Math.min(100 - width / aspect, drag.y + dy)));
    } else {
      setWidth(
        Math.max(10, Math.min(80, drag.width + Math.max(dx, dy * aspect))),
      );
    }
    clearResult();
  }

  function stopOverlayPointer(event: React.PointerEvent) {
    if (dragRef.current)
      (event.currentTarget as HTMLElement).releasePointerCapture(
        event.pointerId,
      );
    dragRef.current = null;
  }

  async function signatureBytes() {
    if (source === "type") {
      if (!typed.trim()) throw new Error("İmza mətnini daxil edin.");
      return typedSignaturePng(typed.trim());
    }
    if (source === "upload") {
      if (!uploaded) throw new Error("PNG imza faylı seçin.");
      return { bytes: await uploaded.arrayBuffer(), aspect };
    }
    if (!signatureBlob) throw new Error("Əvvəlcə imzanı çəkin.");
    return { bytes: await signatureBlob.arrayBuffer(), aspect };
  }

  async function exportPdf() {
    if (!file || isProcessing) return;
    setError("");
    clearResult();
    let pages: number[];
    if (applyRange.trim()) {
      const parsed = parsePageRanges(applyRange, preview.pageCount);
      if (parsed.error) {
        setError(parsed.error);
        return;
      }
      pages = parsed.pages;
    } else pages = [page];
    setIsProcessing(true);
    try {
      const signature = await signatureBytes();
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.load(await file.arrayBuffer(), {
        updateMetadata: false,
      });
      const embedded = await pdf.embedPng(signature.bytes);
      for (const pageNumber of pages) {
        const pdfPage = pdf.getPage(pageNumber - 1);
        const size = pdfPage.getSize();
        const drawWidth = size.width * (width / 100);
        const drawHeight = drawWidth / signature.aspect;
        pdfPage.drawImage(embedded, {
          x: size.width * (x / 100),
          y: size.height - size.height * (y / 100) - drawHeight,
          width: drawWidth,
          height: drawHeight,
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
      setSuccess(`İmza ${pages.length} səhifəyə əlavə edildi.`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "İmzalı PDF yaradıla bilmədi.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function reset() {
    setFile(null);
    setPage(1);
    setApplyRange("");
    setError("");
    clearResult();
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }

  const ready =
    source === "type"
      ? Boolean(typed.trim())
      : source === "upload"
        ? Boolean(uploaded)
        : Boolean(signatureBlob);
  const overlayContent =
    source === "type" ? (
      <span className="whitespace-nowrap font-[cursive] text-2xl text-slate-900">
        {typed || "İmza"}
      </span>
    ) : signatureUrl ? (
      <NextImage
        src={signatureUrl}
        alt="İmza önizləməsi"
        fill
        unoptimized
        className="object-contain"
      />
    ) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
      <div className="grid gap-5">
        <ToolCard>
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
            Bu alət PDF-ə vizual imza şəkli əlavə edir. Bu, kriptoqrafik və ya
            dövlət tərəfindən təsdiqlənmiş elektron imza deyil.
          </p>
        </ToolCard>
        <ToolCard title="PDF və imza">
          <FilePicker
            inputRef={pdfInputRef}
            accept="application/pdf,.pdf"
            title={file ? "Başqa PDF seç" : "PDF seç"}
            hint="Bir PDF faylı"
            onChange={handlePdf}
          />
          <div
            className="mt-4 grid grid-cols-3 gap-2"
            role="group"
            aria-label="İmza yaratma üsulu"
          >
            {(["draw", "type", "upload"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={
                  source === item ? primaryButtonClass : secondaryButtonClass
                }
                onClick={() => {
                  setSource(item);
                  clearResult();
                }}
              >
                {item === "draw"
                  ? "Çək"
                  : item === "type"
                    ? "Yaz"
                    : "PNG yüklə"}
              </button>
            ))}
          </div>
          {source === "draw" ? (
            <div className="mt-4">
              <canvas
                ref={drawCanvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                className="h-36 w-full touch-none rounded-xl border border-line bg-white"
                aria-label="İmza çəkmək üçün sahə"
              />
              <button
                type="button"
                className={`${secondaryButtonClass} mt-2`}
                onClick={clearDrawnSignature}
              >
                <Eraser size={16} />
                İmzanı sil
              </button>
            </div>
          ) : null}
          {source === "type" ? (
            <label className="mt-4 block text-sm font-semibold">
              İmza mətni
              <input
                className={`${inputClass} mt-2 font-[cursive] text-xl`}
                value={typed}
                onChange={(event) => {
                  setTyped(event.target.value);
                  setAspect(measureTypedSignatureAspect(event.target.value));
                  clearResult();
                }}
                placeholder="Ad Soyad"
              />
            </label>
          ) : null}
          {source === "upload" ? (
            <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-line bg-surface-soft p-4 text-sm font-semibold hover:border-accent">
              {uploaded ? uploaded.name : "Şəffaf PNG imza seç"}
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/png,.png"
                className="sr-only"
                onChange={handleUpload}
              />
            </label>
          ) : null}
          <label className="mt-4 block text-sm font-semibold">
            İmzanın eni: {Math.round(width)}%
            <input
              className="mt-2 w-full accent-[var(--accent)]"
              type="range"
              min="10"
              max="80"
              value={width}
              onChange={(event) => {
                setWidth(Number(event.target.value));
                clearResult();
              }}
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Tətbiq ediləcək səhifələr
            <input
              className={`${inputClass} mt-2`}
              value={applyRange}
              onChange={(event) => {
                setApplyRange(event.target.value);
                clearResult();
              }}
              placeholder="Boş = hazırkı səhifə; 1-3, 5 və ya 1-10"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={primaryButtonClass}
              onClick={exportPdf}
              disabled={!file || !ready || !preview.pageCount || isProcessing}
            >
              {isProcessing ? "Hazırlanır..." : "İmzanı PDF-ə əlavə et"}
            </button>
            {resultUrl ? (
              <a
                href={resultUrl}
                download="signed-visual-document.pdf"
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
              PDF-i təmizlə
            </button>
          </div>
          <StatusMessage error={error || preview.error} success={success} />
          <div className="mt-4">
            <PrivacyNotice />
          </div>
        </ToolCard>
      </div>
      <ToolCard title="İmzanı yerləşdir">
        <div className="mb-3 flex items-center gap-3">
          <label className="text-sm font-semibold">
            PDF səhifəsi{" "}
            <input
              className="ml-2 h-9 w-20 rounded-lg border border-line px-2"
              type="number"
              min="1"
              max={preview.pageCount || 1}
              value={page}
              onChange={(event) =>
                setPage(
                  Math.max(
                    1,
                    Math.min(
                      preview.pageCount || 1,
                      Number(event.target.value),
                    ),
                  ),
                )
              }
            />
          </label>
          <span className="text-sm text-muted">/ {preview.pageCount || 0}</span>
        </div>
        <p className="mb-3 text-sm text-muted">
          İmzanı sürüşdürün; sağ-alt tutacaqla ölçüsünü dəyişin.
        </p>
        <div
          ref={previewBoxRef}
          className="relative mx-auto w-fit max-w-full overflow-hidden rounded-xl border border-line bg-surface-soft"
        >
          <canvas
            ref={pdfCanvasRef}
            className="block h-auto max-h-[72vh] max-w-full"
            aria-label="PDF səhifəsi"
          />
          {file && ready && !preview.isLoading ? (
            <div
              className="absolute cursor-move touch-none border border-dashed border-accent bg-white/10"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${width}%`,
                aspectRatio: String(aspect),
              }}
              onPointerDown={(event) => startOverlayPointer(event, "move")}
              onPointerMove={moveOverlay}
              onPointerUp={stopOverlayPointer}
              onPointerCancel={stopOverlayPointer}
            >
              {overlayContent}
              <button
                type="button"
                aria-label="İmzanın ölçüsünü dəyiş"
                className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize touch-none rounded-full border-2 border-white bg-accent"
                onPointerDown={(event) => startOverlayPointer(event, "resize")}
                onPointerMove={moveOverlay}
                onPointerUp={stopOverlayPointer}
                onPointerCancel={stopOverlayPointer}
              />
            </div>
          ) : null}
          {preview.isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-muted">
              Önizləmə hazırlanır...
            </div>
          ) : null}
        </div>
      </ToolCard>
    </div>
  );
}
