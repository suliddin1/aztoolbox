"use client";

import { Download, ImagePlus, RotateCcw } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { sanitizeFileName } from "@/lib/utils";

const presets = [
  { label: "LinkedIn banner - 1584 x 396", width: 1584, height: 396 },
  { label: "LinkedIn post - 1200 x 627", width: 1200, height: 627 },
  { label: "Instagram post - 1080 x 1080", width: 1080, height: 1080 },
  { label: "Instagram story - 1080 x 1920", width: 1080, height: 1920 },
  { label: "WhatsApp profile - 500 x 500", width: 500, height: 500 },
  { label: "CV photo - 600 x 600", width: 600, height: 600 },
  { label: "Custom size", width: 0, height: 0 },
];

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Şəkil oxuna bilmədi."));
    image.src = src;
  });
}

export function ImageResizer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceUrlRef = useRef("");
  const resultUrlRef = useRef("");
  const [fileName, setFileName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [presetIndex, setPresetIndex] = useState(2);
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1080");
  const [format, setFormat] = useState<OutputFormat>("image/png");
  const [quality, setQuality] = useState(0.9);
  const [crop, setCrop] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPreset = presets[presetIndex];
  const width = selectedPreset.width || Number(customWidth);
  const height = selectedPreset.height || Number(customHeight);
  const isCustom = selectedPreset.width === 0;
  const extension = format.split("/")[1];
  const downloadName = useMemo(() => {
    const base = fileName
      ? sanitizeFileName(fileName.replace(/\.[^.]+$/, ""))
      : "aztoolbox-image";
    return `${base || "aztoolbox-image-resized"}-resized.${extension}`;
  }, [extension, fileName]);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
      }
    };
  }, []);

  function replaceSourceUrl(nextUrl: string) {
    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }
    sourceUrlRef.current = nextUrl;
    setSourceUrl(nextUrl);
  }

  function replaceResultUrl(nextUrl: string) {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
    }
    resultUrlRef.current = nextUrl;
    setResultUrl(nextUrl);
  }

  function resetResult() {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
    }
    resultUrlRef.current = "";
    setResultUrl("");
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";
    setError("");
    setSuccess("");
    resetResult();

    if (!selected) {
      return;
    }

    if (!selected.type.startsWith("image/")) {
      setFileName("");
      setError("Zəhmət olmasa şəkil faylı seçin.");
      return;
    }

    setFileName(selected.name);
    replaceSourceUrl(URL.createObjectURL(selected));
  }

  async function resize() {
    setError("");
    setSuccess("");

    if (!sourceUrl) {
      setError("Əvvəlcə şəkil seçin.");
      return;
    }

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 50 ||
      height < 50
    ) {
      setError("Ölçü ən azı 50 x 50 olmalıdır.");
      return;
    }

    setIsProcessing(true);
    try {
      const image = await loadImage(sourceUrl);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas yaradıla bilmədi.");
      }

      context.clearRect(0, 0, width, height);
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }

      const ratio = crop
        ? Math.max(width / image.width, height / image.height)
        : Math.min(width / image.width, height / image.height);
      const drawWidth = image.width * ratio;
      const drawHeight = image.height * ratio;
      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, x, y, drawWidth, drawHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Şəkil hazırlana bilmədi.");
            setIsProcessing(false);
            return;
          }

          replaceResultUrl(URL.createObjectURL(blob));
          setSuccess(
            "Şəkil hazırdır. Dəyişiklik edib yenidən hazırlaya bilərsiniz.",
          );
          setIsProcessing(false);
        },
        format,
        format === "image/png" ? undefined : quality,
      );
    } catch (resizeError) {
      setError(
        resizeError instanceof Error
          ? resizeError.message
          : "Şəkil emalı zamanı xəta baş verdi.",
      );
      setIsProcessing(false);
    }
  }

  function clear() {
    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }
    sourceUrlRef.current = "";
    setSourceUrl("");
    resetResult();
    setFileName("");
    setPresetIndex(2);
    setCustomWidth("1080");
    setCustomHeight("1080");
    setFormat("image/png");
    setQuality(0.9);
    setCrop(false);
    setError("");
    setSuccess("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-4">
          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-soft p-6 text-center transition hover:border-accent">
            <ImagePlus className="mb-3 text-accent-strong" size={28} />
            <span className="font-semibold">
              {fileName ? "Yeni şəkil seç" : "Şəkil seç"}
            </span>
            <span className="mt-1 text-sm text-muted">
              PNG, JPEG, WEBP və digər brauzer formatları
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFile}
            />
          </label>

          {fileName ? (
            <p className="rounded-md bg-accent-soft px-3 py-2 text-sm font-medium text-accent-strong">
              Seçilmiş şəkil: {fileName}
            </p>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Hazır ölçü
            </label>
            <select
              value={presetIndex}
              onChange={(event) => {
                setPresetIndex(Number(event.target.value));
                setSuccess("");
              }}
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            >
              {presets.map((preset, index) => (
                <option key={preset.label} value={index}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {isCustom ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-semibold">En</label>
                <input
                  type="number"
                  min={50}
                  value={customWidth}
                  onChange={(event) => {
                    setCustomWidth(event.target.value);
                    setSuccess("");
                  }}
                  className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Hündürlük
                </label>
                <input
                  type="number"
                  min={50}
                  value={customHeight}
                  onChange={(event) => {
                    setCustomHeight(event.target.value);
                    setSuccess("");
                  }}
                  className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
                />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-semibold">Format</label>
              <select
                value={format}
                onChange={(event) => {
                  setFormat(event.target.value as OutputFormat);
                  setSuccess("");
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
                min={0.4}
                max={1}
                step={0.05}
                value={quality}
                disabled={format === "image/png"}
                onChange={(event) => {
                  setQuality(Number(event.target.value));
                  setSuccess("");
                }}
                className="h-11 w-full accent-[var(--accent)] disabled:opacity-45"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-md border border-line bg-surface-soft px-3 py-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={crop}
              onChange={(event) => {
                setCrop(event.target.checked);
                setSuccess("");
              }}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Ölçüyə tam doldur / crop et
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resize}
            disabled={isProcessing || !sourceUrl}
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isProcessing ? "Hazırlanır..." : "Şəkli hazırla"}
          </button>
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
          Şəkil yalnız brauzerinizdə emal olunur. Eyni orijinal şəkli saxlayıb
          ölçü, format, keyfiyyət və crop rejimini dəyişərək yenidən hazırlaya
          bilərsiniz.
        </p>
      </div>

      <div className="grid gap-5">
        <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          <h2 className="font-semibold">Orijinal</h2>
          <div className="mt-3 flex min-h-64 items-center justify-center rounded-md border border-line bg-surface-soft p-3">
            {sourceUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sourceUrl}
                alt="Seçilmiş şəkil"
                className="max-h-80 max-w-full rounded-md object-contain"
              />
            ) : (
              <p className="text-center text-muted">
                Şəkil seçdikdən sonra preview burada görünəcək.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Hazır şəkil</h2>
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
          </div>
          <div className="mt-3 flex min-h-64 items-center justify-center rounded-md border border-line bg-surface-soft p-3">
            {resultUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resultUrl}
                alt="Ölçüləndirilmiş şəkil"
                className="max-h-80 max-w-full rounded-md object-contain"
              />
            ) : (
              <p className="text-center text-muted">
                Şəkli hazırladıqdan sonra nəticə burada görünəcək.
              </p>
            )}
          </div>
          <p className="mt-3 text-sm text-muted">
            Çıxış ölçüsü: {width || "-"} x {height || "-"}
          </p>
        </div>
      </div>
    </section>
  );
}
