"use client";

import { Download, ImagePlus, RotateCcw } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { sanitizeFileName } from "@/lib/utils";

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

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

export function ImageFormatConverter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const sourceUrlRef = useRef("");
  const resultUrlRef = useRef("");
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [format, setFormat] = useState<OutputFormat>("image/png");
  const [quality, setQuality] = useState(0.9);
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const extension = format.split("/")[1];
  const downloadName = useMemo(() => {
    const base = file ? sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) : "converted-image";
    return `${base || "converted-image"}.${extension}`;
  }, [extension, file]);

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
    setResultSize(0);
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

  async function convert() {
    setError("");
    setSuccess("");
    clearResult();

    if (!sourceUrl || !file) {
      setError("Əvvəlcə şəkil seçin.");
      return;
    }

    setIsProcessing(true);
    try {
      const image = await loadImage(sourceUrl);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas yaradıla bilmədi.");

      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Şəkil çevrilə bilmədi.");
            setIsProcessing(false);
            return;
          }

          const nextUrl = URL.createObjectURL(blob);
          resultUrlRef.current = nextUrl;
          setResultUrl(nextUrl);
          setResultSize(blob.size);
          setSuccess("Şəkil hazırdır.");
          setIsProcessing(false);
        },
        format,
        format === "image/png" ? undefined : quality,
      );
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : "Şəkil çevrilə bilmədi.");
      setIsProcessing(false);
    }
  }

  function clear() {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = "";
    setSourceUrl("");
    setFile(null);
    clearResult();
    setFormat("image/png");
    setQuality(0.9);
    setError("");
    setSuccess("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-soft p-6 text-center transition hover:border-accent">
          <ImagePlus className="mb-3 text-accent-strong" size={28} />
          <span className="font-semibold">{file ? "Yeni şəkil seç" : "Şəkil seç"}</span>
          <span className="mt-1 text-sm text-muted">PNG, JPEG və WEBP formatına çevir</span>
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
        </label>

        {file ? (
          <div className="mt-4 rounded-md border border-line bg-surface-soft p-4 text-sm">
            <p className="font-semibold">{file.name}</p>
            <p className="mt-1 text-muted">Original ölçü: {formatBytes(file.size)}</p>
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
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WEBP</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Keyfiyyət {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min={0.35}
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
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={convert} disabled={isProcessing || !file} className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55">
            {isProcessing ? "Çevrilir..." : "Format çevir"}
          </button>
          {resultUrl ? (
            <a href={resultUrl} download={downloadName} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-white transition hover:bg-accent-strong">
              <Download size={16} />
              Yüklə
            </a>
          ) : null}
          <button type="button" onClick={clear} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent">
            <RotateCcw size={16} />
            Təmizlə
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-accent-strong">{success}</p> : null}
        <p className="mt-4 text-sm leading-6 text-muted">
          Fayl serverə göndərilmir. Format çevirmə brauzerinizdə canvas ilə aparılır.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">Preview</h2>
        <div className="mt-3 flex min-h-80 items-center justify-center rounded-md border border-line bg-surface-soft p-3">
          {resultUrl || sourceUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resultUrl || sourceUrl} alt="Şəkil preview" className="max-h-96 max-w-full rounded-md object-contain" />
          ) : (
            <p className="text-center text-muted">Şəkil seçdikdən sonra preview burada görünəcək.</p>
          )}
        </div>
        {resultSize ? <p className="mt-3 text-sm text-muted">Hazır fayl: {formatBytes(resultSize)}</p> : null}
      </div>
    </section>
  );
}
