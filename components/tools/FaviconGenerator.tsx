"use client";

import { Download, FileArchive, RotateCcw } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { copyText, downloadBlob, formatBytes } from "@/lib/browser/download";
import { createPngIco } from "@/lib/ico";
import {
  canvasToBlob,
  decodeImage,
  drawContainedImage,
  imageDimensions,
} from "@/lib/image-tools";
import { optimizeSvg } from "@/lib/svg-tools";
import {
  FilePicker,
  inputClass,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

const sizes = [16, 32, 48, 180, 192, 512] as const;
type IconResult = { size: number; blob: Blob; url: string; filename: string };

export function FaviconGenerator() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef("");
  const outputUrlsRef = useRef<string[]>([]);
  const imageRef = useRef<ImageBitmap | HTMLImageElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fit, setFit] = useState<"crop" | "pad">("crop");
  const [transparent, setTransparent] = useState(true);
  const [background, setBackground] = useState("#ffffff");
  const [icons, setIcons] = useState<IconResult[]>([]);
  const [ico, setIco] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function revokeOutputs() {
    outputUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    outputUrlsRef.current = [];
    setIcons([]);
    setIco(null);
    setSuccess("");
  }

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      outputUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      const image = imageRef.current;
      if (image && "close" in image) image.close();
    },
    [],
  );

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    setError("");
    revokeOutputs();
    if (!selected) return;
    const isSvg =
      selected.type === "image/svg+xml" ||
      selected.name.toLowerCase().endsWith(".svg");
    if (!isSvg && !/^image\/(png|jpeg|webp)$/.test(selected.type)) {
      setError("PNG, JPG, WebP və ya SVG faylı seçin.");
      return;
    }
    setIsProcessing(true);
    try {
      let safeBlob: Blob = selected;
      if (isSvg) {
        const source = await selected.text();
        const safe = optimizeSvg(source).sanitizedOriginal;
        safeBlob = new Blob([safe], { type: "image/svg+xml" });
      }
      const image = await decodeImage(safeBlob);
      const previous = imageRef.current;
      if (previous && "close" in previous) previous.close();
      imageRef.current = image;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(safeBlob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      setFile(selected);
    } catch {
      setFile(null);
      setError("Şəkil və ya SVG oxuna bilmədi.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function generate() {
    const image = imageRef.current;
    if (!image || isProcessing) return;
    setIsProcessing(true);
    setError("");
    revokeOutputs();
    try {
      const source = imageDimensions(image);
      const next: IconResult[] = [];
      for (const size of sizes) {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas yaradıla bilmədi.");
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        if (!transparent) {
          context.fillStyle = background;
          context.fillRect(0, 0, size, size);
        }
        drawContainedImage(
          context,
          image,
          source.width,
          source.height,
          size,
          size,
          fit,
        );
        const blob = await canvasToBlob(canvas, "image/png");
        const url = URL.createObjectURL(blob);
        outputUrlsRef.current.push(url);
        next.push({ size, blob, url, filename: `icon-${size}x${size}.png` });
      }
      const favicon = await createPngIco(
        next.filter((item) => item.size <= 48),
      );
      setIcons(next);
      setIco(favicon);
      setSuccess("Bütün PNG ikonları və favicon.ico hazırdır.");
    } catch {
      setError("İkonlar yaradıla bilmədi.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function downloadZip() {
    if (!icons.length || !ico) return;
    setIsProcessing(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      icons.forEach((icon) => zip.file(icon.filename, icon.blob));
      zip.file("favicon.ico", ico);
      zip.file("README-snippets.txt", `${htmlTags}\n\n${manifestSnippet}\n`);
      downloadBlob(
        await zip.generateAsync({ type: "blob" }),
        "favicon-and-app-icons.zip",
      );
    } catch {
      setError("ZIP yaradıla bilmədi.");
    } finally {
      setIsProcessing(false);
    }
  }

  function reset() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = "";
    setPreviewUrl("");
    const image = imageRef.current;
    if (image && "close" in image) image.close();
    imageRef.current = null;
    setFile(null);
    revokeOutputs();
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const htmlTags = `<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png">\n<link rel="apple-touch-icon" sizes="180x180" href="/icon-180x180.png">`;
  const manifestSnippet = `"icons": [\n  { "src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png" },\n  { "src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png" }\n]`;

  return (
    <div className="grid gap-5 lg:grid-cols-[0.84fr_1.16fr]">
      <ToolCard title="Mənbə və çərçivə">
        <FilePicker
          inputRef={inputRef}
          accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
          title={file ? "Başqa şəkil seç" : "Şəkil və ya SVG seç"}
          hint="SVG təhlükəsiz şəkildə sanitizasiya olunur"
          onChange={handleFile}
        />
        {previewUrl ? (
          <div className="relative mx-auto mt-4 h-40 w-40 overflow-hidden rounded-xl border border-line">
            <NextImage
              src={previewUrl}
              alt="İkon mənbə önizləməsi"
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Kvadratlaşdırma
            <select
              className={`${inputClass} mt-2`}
              value={fit}
              onChange={(event) => {
                setFit(event.target.value as "crop" | "pad");
                revokeOutputs();
              }}
            >
              <option value="crop">Kvadrat crop</option>
              <option value="pad">Kənar əlavə et</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Fon
            <select
              className={`${inputClass} mt-2`}
              value={transparent ? "transparent" : "color"}
              onChange={(event) => {
                setTransparent(event.target.value === "transparent");
                revokeOutputs();
              }}
            >
              <option value="transparent">Şəffaf</option>
              <option value="color">Xüsusi rəng</option>
            </select>
          </label>
        </div>
        {!transparent ? (
          <label className="mt-4 block text-sm font-semibold">
            Fon rəngi
            <input
              className={`${inputClass} mt-2 p-1`}
              type="color"
              value={background}
              onChange={(event) => {
                setBackground(event.target.value);
                revokeOutputs();
              }}
            />
          </label>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={generate}
            disabled={!file || isProcessing}
          >
            {isProcessing ? "Hazırlanır..." : "İkonları yarat"}
          </button>
          {icons.length && ico ? (
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={downloadZip}
            >
              <FileArchive size={16} />
              Hamısını ZIP yüklə
            </button>
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
        <div className="mt-4">
          <PrivacyNotice />
        </div>
      </ToolCard>
      <div className="grid gap-5">
        <ToolCard title="Hazır ikonlar">
          {icons.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {icons.map((icon) => (
                <article
                  key={icon.size}
                  className="rounded-xl border border-line bg-surface-soft p-3 text-center"
                >
                  <div className="flex h-28 items-center justify-center">
                    <NextImage
                      src={icon.url}
                      alt={`${icon.size}×${icon.size} ikon`}
                      width={icon.size}
                      height={icon.size}
                      unoptimized
                      style={{
                        width: Math.min(icon.size, 96),
                        height: Math.min(icon.size, 96),
                      }}
                    />
                  </div>
                  <p className="text-sm font-semibold">
                    {icon.size}×{icon.size}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatBytes(icon.blob.size)}
                  </p>
                  <a
                    href={icon.url}
                    download={icon.filename}
                    className={`${secondaryButtonClass} mt-2 w-full`}
                  >
                    <Download size={15} />
                    PNG
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-surface-soft p-5 text-center text-sm text-muted">
              16, 32, 48, 180, 192 və 512 px çıxışlar burada görünəcək.
            </p>
          )}
          {ico ? (
            <button
              type="button"
              className={`${primaryButtonClass} mt-4`}
              onClick={() => downloadBlob(ico, "favicon.ico")}
            >
              <Download size={16} />
              favicon.ico yüklə
            </button>
          ) : null}
        </ToolCard>
        <ToolCard title="HTML və manifest nümunəsi">
          <div className="grid gap-3">
            <div>
              <div className="mb-2 flex justify-between gap-2">
                <span className="text-sm font-semibold">HTML link teqləri</span>
                <button
                  type="button"
                  className="text-sm font-semibold text-accent"
                  onClick={() => copyText(htmlTags)}
                >
                  Kopyala
                </button>
              </div>
              <pre className="overflow-auto rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                {htmlTags}
              </pre>
            </div>
            <div>
              <div className="mb-2 flex justify-between gap-2">
                <span className="text-sm font-semibold">
                  Web app manifest icons
                </span>
                <button
                  type="button"
                  className="text-sm font-semibold text-accent"
                  onClick={() => copyText(manifestSnippet)}
                >
                  Kopyala
                </button>
              </div>
              <pre className="overflow-auto rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                {manifestSnippet}
              </pre>
            </div>
          </div>
        </ToolCard>
      </div>
    </div>
  );
}
