"use client";

import { Download, ImagePlus, RotateCcw } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { sanitizeFileName } from "@/lib/utils";

type OutputFormat = "image/jpeg" | "image/webp" | "image/png";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Şəkil oxuna bilmədi."));
    image.src = src;
  });
}

export function ImageCompressor() {
  const inputRef = useRef<HTMLInputElement>(null);
  const sourceUrlRef = useRef("");
  const resultUrlRef = useRef("");
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(0.75);
  const [maxWidth, setMaxWidth] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [compressedSize, setCompressedSize] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const extension = format.split("/")[1];
  const downloadName = useMemo(() => {
    const base = file
      ? sanitizeFileName(file.name.replace(/\.[^.]+$/, ""))
      : "compressed-image";
    return `${base || "aztoolbox-compressed"}-compressed.${extension}`;
  }, [extension, file]);

  const savedPercent =
    file && compressedSize
      ? Math.round(((file.size - compressedSize) / file.size) * 100)
      : 0;

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResultUrl("");
    setCompressedSize(0);
  }

  function replaceResultUrl(url: string, size: number) {
    clearResult();
    resultUrlRef.current = url;
    setResultUrl(url);
    setCompressedSize(size);
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";
    setError("");
    setSuccess("");
    clearResult();

    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Zəhmət olmasa şəkil faylı seçin.");
      return;
    }

    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    const url = URL.createObjectURL(selected);
    sourceUrlRef.current = url;
    setSourceUrl(url);
    setFile(selected);
  }

  async function compress() {
    setError("");
    setSuccess("");

    if (!sourceUrl || !file) {
      setError("Əvvəlcə şəkil seçin.");
      return;
    }

    const maxWidthNumber = maxWidth.trim() ? Number(maxWidth) : 0;
    if (
      maxWidth.trim() &&
      (!Number.isFinite(maxWidthNumber) || maxWidthNumber < 50)
    ) {
      setError("Max width boş saxlanmalı və ya ən azı 50 olmalıdır.");
      return;
    }

    setIsProcessing(true);
    try {
      const image = await loadImage(sourceUrl);
      const ratio =
        maxWidthNumber && image.width > maxWidthNumber
          ? maxWidthNumber / image.width
          : 1;
      const width = Math.round(image.width * ratio);
      const height = Math.round(image.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas yaradıla bilmədi.");

      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }

      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Şəkil sıxışdırıla bilmədi.");
            setIsProcessing(false);
            return;
          }
          replaceResultUrl(URL.createObjectURL(blob), blob.size);
          setSuccess("Şəkil sıxışdırıldı.");
          setIsProcessing(false);
        },
        format,
        format === "image/png" ? undefined : quality,
      );
    } catch (compressError) {
      setError(
        compressError instanceof Error
          ? compressError.message
          : "Şəkil sıxışdırıla bilmədi.",
      );
      setIsProcessing(false);
    }
  }

  function clear() {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = "";
    setSourceUrl("");
    setFile(null);
    clearResult();
    setFormat("image/jpeg");
    setQuality(0.75);
    setMaxWidth("");
    setError("");
    setSuccess("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-soft p-6 text-center transition hover:border-accent">
          <ImagePlus className="mb-3 text-accent-strong" size={28} />
          <span className="font-semibold">
            {file ? "Yeni şəkil seç" : "Şəkil seç"}
          </span>
          <span className="mt-1 text-sm text-muted">
            Email, form və sayt üçün ölçünü azaldın
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFile}
          />
        </label>

        {file ? (
          <div className="mt-4 rounded-md border border-line bg-surface-soft p-4 text-sm">
            <p className="font-semibold">{file.name}</p>
            <p className="mt-1 text-muted">
              Original ölçü: {formatBytes(file.size)}
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">Format</label>
            <select
              value={format}
              onChange={(event) => {
                setFormat(event.target.value as OutputFormat);
                clearResult();
              }}
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            >
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WEBP</option>
              <option value="image/png">PNG</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Max width
            </label>
            <input
              value={maxWidth}
              onChange={(event) => {
                setMaxWidth(event.target.value.replace(/\D/g, ""));
                clearResult();
              }}
              placeholder="Məsələn: 1200"
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            />
          </div>
        </div>

        <label className="mt-4 block text-sm font-semibold">
          Keyfiyyət {Math.round(quality * 100)}%
        </label>
        <input
          type="range"
          min={0.3}
          max={1}
          step={0.05}
          value={quality}
          disabled={format === "image/png"}
          onChange={(event) => {
            setQuality(Number(event.target.value));
            clearResult();
          }}
          className="h-11 w-full accent-[var(--accent)] disabled:opacity-45"
        />

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={compress}
            disabled={isProcessing || !file}
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isProcessing ? "Sıxışdırılır..." : "Sıxışdır"}
          </button>
          {resultUrl ? (
            <a
              href={resultUrl}
              download={downloadName}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
            >
              <Download size={16} />
              Yüklə
            </a>
          ) : null}
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent"
          >
            <RotateCcw size={16} />
            Təmizlə
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {success ? (
          <p className="mt-3 text-sm text-accent-strong">{success}</p>
        ) : null}
        <p className="mt-4 text-sm leading-6 text-muted">
          Fayllarınız serverə göndərilmir. Əməliyyat brauzerinizdə aparılır.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">Nəticə</h2>
        <div className="mt-3 flex min-h-80 items-center justify-center rounded-md border border-line bg-surface-soft p-3">
          {resultUrl || sourceUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resultUrl || sourceUrl}
              alt="Şəkil preview"
              className="max-h-96 max-w-full rounded-md object-contain"
            />
          ) : (
            <p className="text-center text-muted">
              Şəkil seçdikdən sonra preview burada görünəcək.
            </p>
          )}
        </div>
        {file && compressedSize ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-line bg-surface-soft p-3">
              <p className="text-xs text-muted">Original</p>
              <p className="mt-1 font-semibold">{formatBytes(file.size)}</p>
            </div>
            <div className="rounded-md border border-line bg-surface-soft p-3">
              <p className="text-xs text-muted">Sıxışdırılmış</p>
              <p className="mt-1 font-semibold">
                {formatBytes(compressedSize)}
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface-soft p-3">
              <p className="text-xs text-muted">Qənaət</p>
              <p className="mt-1 font-semibold">{savedPercent}%</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
