"use client";

import { Download, ImagePlus, RotateCcw } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { sanitizeFileName } from "@/lib/utils";

type Preset = {
  label: string;
  width: number;
  height: number;
};

type BgMode = "original" | "white" | "gray" | "blue";
type FitMode = "contain" | "cover";
type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

const presets: Preset[] = [
  { label: "CV photo - 600 x 600", width: 600, height: 600 },
  { label: "LinkedIn profile - 800 x 800", width: 800, height: 800 },
  { label: "WhatsApp profile - 500 x 500", width: 500, height: 500 },
  { label: "3x4 style - 900 x 1200", width: 900, height: 1200 },
];

const backgrounds: Record<BgMode, string | null> = {
  original: null,
  white: "#ffffff",
  gray: "#f1f5f9",
  blue: "#eaf4ff",
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Şəkil oxuna bilmədi."));
    image.src = src;
  });
}

export function CvPhotoMaker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const sourceUrlRef = useRef("");
  const resultUrlRef = useRef("");
  const [fileName, setFileName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [presetIndex, setPresetIndex] = useState(0);
  const [background, setBackground] = useState<BgMode>("white");
  const [fitMode, setFitMode] = useState<FitMode>("cover");
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(0.9);
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const preset = presets[presetIndex];
  const extension = format.split("/")[1];
  const downloadName = useMemo(() => {
    const base = fileName ? sanitizeFileName(fileName.replace(/\.[^.]+$/, "")) : "cv-photo";
    return `${base || "aztoolbox-cv-photo"}-cv-photo.${extension}`;
  }, [extension, fileName]);

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
    setResultSize("");
  }

  function replaceResultUrl(url: string, size: number) {
    clearResult();
    resultUrlRef.current = url;
    setResultUrl(url);
    setResultSize(size < 1024 * 1024 ? `${Math.round(size / 1024)} KB` : `${(size / 1024 / 1024).toFixed(2)} MB`);
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
    setFileName(selected.name);
  }

  async function generate() {
    setError("");
    setSuccess("");

    if (!sourceUrl) {
      setError("Əvvəlcə şəkil seçin.");
      return;
    }

    setIsProcessing(true);
    try {
      const image = await loadImage(sourceUrl);
      const canvas = document.createElement("canvas");
      canvas.width = preset.width;
      canvas.height = preset.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas yaradıla bilmədi.");

      const bg = backgrounds[background];
      if (bg || format === "image/jpeg") {
        context.fillStyle = bg ?? "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      const ratio =
        fitMode === "cover"
          ? Math.max(canvas.width / image.width, canvas.height / image.height)
          : Math.min(canvas.width / image.width, canvas.height / image.height);
      const drawWidth = image.width * ratio;
      const drawHeight = image.height * ratio;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Şəkil hazırlana bilmədi.");
            setIsProcessing(false);
            return;
          }
          replaceResultUrl(URL.createObjectURL(blob), blob.size);
          setSuccess("Şəkil hazırdır.");
          setIsProcessing(false);
        },
        format,
        format === "image/png" ? undefined : quality,
      );
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Şəkil hazırlana bilmədi.");
      setIsProcessing(false);
    }
  }

  function clear() {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = "";
    setSourceUrl("");
    setFileName("");
    clearResult();
    setPresetIndex(0);
    setBackground("white");
    setFitMode("cover");
    setFormat("image/jpeg");
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
          <span className="font-semibold">{fileName ? "Yeni şəkil seç" : "Şəkil seç"}</span>
          <span className="mt-1 text-sm text-muted">AI background removal yoxdur; crop, resize və export edilir</span>
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">Preset</label>
            <select value={presetIndex} onChange={(event) => { setPresetIndex(Number(event.target.value)); clearResult(); }} className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent">
              {presets.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Fon</label>
            <select value={background} onChange={(event) => { setBackground(event.target.value as BgMode); clearResult(); }} className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent">
              <option value="original">Original</option>
              <option value="white">White</option>
              <option value="gray">Light gray</option>
              <option value="blue">Light blue</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Crop davranışı</label>
            <select value={fitMode} onChange={(event) => { setFitMode(event.target.value as FitMode); clearResult(); }} className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent">
              <option value="contain">Contain</option>
              <option value="cover">Cover / crop</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Format</label>
            <select value={format} onChange={(event) => { setFormat(event.target.value as OutputFormat); clearResult(); }} className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent">
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WEBP</option>
            </select>
          </div>
        </div>

        <label className="mt-4 block text-sm font-semibold">Keyfiyyət {Math.round(quality * 100)}%</label>
        <input type="range" min={0.4} max={1} step={0.05} value={quality} disabled={format === "image/png"} onChange={(event) => { setQuality(Number(event.target.value)); clearResult(); }} className="h-11 w-full accent-[var(--accent)] disabled:opacity-45" />

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={generate} disabled={isProcessing || !sourceUrl} className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55">{isProcessing ? "Hazırlanır..." : "Şəkli hazırla"}</button>
          {resultUrl ? <a href={resultUrl} download={downloadName} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"><Download size={16} />Yüklə</a> : null}
          <button type="button" onClick={clear} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent"><RotateCcw size={16} />Təmizlə</button>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-accent-strong">{success}</p> : null}
        <p className="mt-4 text-sm leading-6 text-muted">Fayllarınız serverə göndərilmir. Əməliyyat brauzerinizdə aparılır.</p>
      </div>

      <div className="grid gap-5">
        <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          <h2 className="font-semibold">Preview</h2>
          <div className="mt-3 flex min-h-80 items-center justify-center rounded-md border border-line bg-surface-soft p-3">
            {resultUrl || sourceUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resultUrl || sourceUrl} alt="CV şəkli preview" className="max-h-96 max-w-full rounded-md object-contain" />
            ) : (
              <p className="text-center text-muted">Şəkil seçdikdən sonra preview burada görünəcək.</p>
            )}
          </div>
          {resultSize ? <p className="mt-3 text-sm text-muted">Hazır fayl: {resultSize}</p> : null}
        </div>
      </div>
    </section>
  );
}
