"use client";

import { Download, RotateCcw } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/browser/download";
import {
  canvasToBlob,
  decodeImage,
  imageDimensions,
  isAnimatedImage,
} from "@/lib/image-tools";
import { sanitizeDownloadBaseName } from "@/lib/pdf/filename";
import {
  FilePicker,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

type Metadata = Record<string, unknown>;

function displayableMetadata(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[mürəkkəb məlumat]";
  if (value instanceof Uint8Array || value instanceof ArrayBuffer)
    return `[${value.byteLength} bayt]`;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value))
    return value
      .slice(0, 30)
      .map((item) => displayableMetadata(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !/makerNote|thumbnail|icc/i.test(key))
        .slice(0, 80)
        .map(([key, item]) => [key, displayableMetadata(item, depth + 1)]),
    );
  }
  if (typeof value === "string" && value.length > 300)
    return `${value.slice(0, 300)}…`;
  return value;
}

export function ImageMetadataRemover() {
  const inputRef = useRef<HTMLInputElement>(null);
  const sourceUrlRef = useRef("");
  const resultUrlRef = useRef("");
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [metadata, setMetadata] = useState<Metadata>({});
  const [quality, setQuality] = useState(0.9);
  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    filename: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(
    () => () => {
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    },
    [],
  );

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResult(null);
    setSuccess("");
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    setError("");
    clearResult();
    if (!selected) return;
    if (!/^image\/(jpeg|png|webp)$/.test(selected.type)) {
      setError(
        "Yalnız JPG, PNG və ya WebP şəkli seçin. Animasiya dəstəklənmir.",
      );
      return;
    }
    setIsProcessing(true);
    try {
      const buffer = await selected.arrayBuffer();
      if (isAnimatedImage(buffer, selected.type)) {
        throw new Error(
          "Animasiya edilmiş PNG və WebP bu alətdə dəstəklənmir.",
        );
      }
      const image = await decodeImage(selected);
      const size = imageDimensions(image);
      if ("close" in image) image.close();
      let parsed: Metadata = {};
      try {
        const exifr = await import("exifr");
        parsed =
          (await exifr.parse(selected, {
            gps: true,
            tiff: true,
            exif: true,
          })) ?? {};
      } catch {
        parsed = {};
      }
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      const url = URL.createObjectURL(selected);
      sourceUrlRef.current = url;
      setSourceUrl(url);
      setFile(selected);
      setDimensions(size);
      setMetadata(displayableMetadata(parsed) as Metadata);
    } catch (caught) {
      setFile(null);
      setSourceUrl("");
      setMetadata({});
      setError(
        caught instanceof Error ? caught.message : "Şəkil oxuna bilmədi.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function cleanImage() {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setError("");
    clearResult();
    try {
      const image = await decodeImage(file);
      const size = imageDimensions(image);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas yaradıla bilmədi.");
      context.drawImage(image, 0, 0, size.width, size.height);
      if ("close" in image) image.close();
      const blob = await canvasToBlob(
        canvas,
        file.type,
        file.type === "image/png" ? undefined : quality,
      );
      const extension =
        file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
      const filename = `${sanitizeDownloadBaseName(file.name)}-cleaned.${extension}`;
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url, filename });
      setSuccess("Görünən orientasiya saxlanılaraq şəkil yenidən kodlandı.");
    } catch {
      setError(
        "Metadata-sız şəkil yaradıla bilmədi. Daha kiçik faylla yenidən sınayın.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function reset() {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = "";
    setSourceUrl("");
    setFile(null);
    setDimensions({ width: 0, height: 0 });
    setMetadata({});
    setError("");
    clearResult();
    if (inputRef.current) inputRef.current.value = "";
  }

  const latitude = metadata.latitude;
  const longitude = metadata.longitude;
  const hasGps =
    typeof latitude === "number" ||
    typeof longitude === "number" ||
    Object.keys(metadata).some((key) => /gps/i.test(key));

  return (
    <div className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
      <ToolCard title="Şəkil və çıxış">
        <FilePicker
          inputRef={inputRef}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          title={file ? "Başqa şəkil seç" : "Şəkil seç"}
          hint="JPG, PNG və WebP · animasiya qəbul edilmir"
          onChange={handleFile}
        />
        {file ? (
          <div className="mt-3 rounded-xl bg-surface-soft p-3 text-sm">
            <p className="font-semibold">{file.name}</p>
            <p className="mt-1 text-muted">
              {dimensions.width}×{dimensions.height} · {formatBytes(file.size)}
            </p>
          </div>
        ) : null}
        {file && file.type !== "image/png" ? (
          <label className="mt-4 block text-sm font-semibold">
            Çıxış keyfiyyəti: {Math.round(quality * 100)}%
            <input
              className="mt-2 w-full accent-[var(--accent)]"
              type="range"
              min="0.4"
              max="1"
              step="0.05"
              value={quality}
              onChange={(event) => {
                setQuality(Number(event.target.value));
                clearResult();
              }}
            />
          </label>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!file || isProcessing}
            onClick={cleanImage}
          >
            {isProcessing ? "Emal olunur..." : "Metadata-nı sil"}
          </button>
          {result ? (
            <a
              href={result.url}
              download={result.filename}
              className={secondaryButtonClass}
            >
              <Download size={16} />
              Təmiz şəkli yüklə
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
        <StatusMessage error={error} success={success} />
        {result && file ? (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-surface-soft p-3">
              <span className="text-muted">Orijinal</span>
              <strong className="mt-1 block">{formatBytes(file.size)}</strong>
            </div>
            <div className="rounded-xl bg-accent-soft p-3">
              <span className="text-accent-strong">Təmizlənmiş</span>
              <strong className="mt-1 block">
                {formatBytes(result.blob.size)}
              </strong>
            </div>
          </div>
        ) : null}
        <div className="mt-4">
          <PrivacyNotice />
        </div>
      </ToolCard>
      <div className="grid gap-5">
        <ToolCard title="Önizləmə">
          {sourceUrl ? (
            <NextImage
              src={result?.url || sourceUrl}
              alt="Şəkil önizləməsi"
              width={dimensions.width}
              height={dimensions.height}
              unoptimized
              className="mx-auto h-auto max-h-[28rem] max-w-full rounded-xl object-contain"
            />
          ) : (
            <p className="rounded-xl bg-surface-soft p-5 text-center text-sm text-muted">
              Şəkil seçildikdə önizləmə burada görünəcək.
            </p>
          )}
        </ToolCard>
        <ToolCard title="Aşkar edilən EXIF məlumatı">
          {hasGps ? (
            <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
              Şəkildə GPS/yer məlumatı aşkar edilib. Paylaşmazdan əvvəl
              təmizlənmiş surəti istifadə edin.
              {typeof latitude === "number" && typeof longitude === "number"
                ? ` Koordinatlar: ${latitude}, ${longitude}.`
                : ""}
            </p>
          ) : null}
          {Object.keys(metadata).length ? (
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          ) : (
            <p className="rounded-xl bg-surface-soft p-4 text-sm text-muted">
              {file
                ? "Oxuna bilən EXIF məlumatı tapılmadı."
                : "Şəkil seçilməyib."}
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-muted">
            Təmizləmə decode və yenidən encode yolu ilə EXIF, GPS və kamera
            bloklarını çıxarır. Rəng profili fərqlərinə görə bəzi brauzerlərdə
            çox cüzi vizual fərq yarana bilər.
          </p>
        </ToolCard>
      </div>
    </div>
  );
}
