"use client";

import { Copy, Download, Pipette, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  contrastRatio,
  extractDominantColors,
  rgbToHex,
  rgbToHsl,
  type PaletteColor,
  type RgbColor,
} from "@/lib/color-tools";
import { copyText, downloadBlob, downloadText } from "@/lib/browser/download";
import { canvasToBlob, decodeImage, imageDimensions } from "@/lib/image-tools";
import {
  FilePicker,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

export function ColorPaletteExtractor() {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<ImageBitmap | HTMLImageElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(8);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [selected, setSelected] = useState<number[]>([0, 1]);
  const [inspected, setInspected] = useState<
    (RgbColor & { x: number; y: number }) | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(
    () => () => {
      const image = imageRef.current;
      if (image && "close" in image) image.close();
    },
    [],
  );

  async function drawPreview(image: ImageBitmap | HTMLImageElement) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = imageDimensions(image);
    const ratio = Math.min(1, 1_200 / Math.max(size.width, size.height));
    canvas.width = Math.max(1, Math.round(size.width * ratio));
    canvas.height = Math.max(1, Math.round(size.height * ratio));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas yaradıla bilmədi.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    setError("");
    setSuccess("");
    setPalette([]);
    setInspected(null);
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      setError("Şəkil faylı seçin.");
      return;
    }
    setIsProcessing(true);
    try {
      const image = await decodeImage(selectedFile);
      const previous = imageRef.current;
      if (previous && "close" in previous) previous.close();
      imageRef.current = image;
      setFile(selectedFile);
      await drawPreview(image);
      await extract(image, count);
    } catch {
      setFile(null);
      setError("Şəkil oxuna bilmədi.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function extract(image = imageRef.current, amount = count) {
    if (!image) return;
    setIsProcessing(true);
    setError("");
    setSuccess("");
    try {
      const size = imageDimensions(image);
      const ratio = Math.min(1, 240 / Math.max(size.width, size.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(size.width * ratio));
      canvas.height = Math.max(1, Math.round(size.height * ratio));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Şəkil rəngləri oxuna bilmədi.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const colors = extractDominantColors(
        context.getImageData(0, 0, canvas.width, canvas.height),
        amount,
      );
      setPalette(colors);
      setSelected(colors.length > 1 ? [0, 1] : [0]);
      setSuccess(
        `${colors.length} dominant rəng deterministik olaraq çıxarıldı.`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Rəng palitrası çıxarıla bilmədi.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function inspectPixel(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(
        canvas.width - 1,
        Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width),
      ),
    );
    const y = Math.max(
      0,
      Math.min(
        canvas.height - 1,
        Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height),
      ),
    );
    const data = canvas
      .getContext("2d", { willReadFrequently: true })
      ?.getImageData(x, y, 1, 1).data;
    if (data) setInspected({ x, y, r: data[0], g: data[1], b: data[2] });
  }

  function selectForContrast(index: number) {
    setSelected((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current.slice(-1), index],
    );
  }

  async function downloadPreview() {
    if (!palette.length) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1_200;
    canvas.height = 240;
    const context = canvas.getContext("2d");
    if (!context) return;
    const width = canvas.width / palette.length;
    palette.forEach((color, index) => {
      context.fillStyle = color.hex;
      context.fillRect(index * width, 0, Math.ceil(width), canvas.height);
      context.fillStyle =
        contrastRatio(color, { r: 255, g: 255, b: 255 }) >= 4.5
          ? "#ffffff"
          : "#111827";
      context.font = "600 26px Arial";
      context.textAlign = "center";
      context.fillText(color.hex, index * width + width / 2, 130);
    });
    downloadBlob(await canvasToBlob(canvas, "image/png"), "color-palette.png");
  }

  function reset() {
    const image = imageRef.current;
    if (image && "close" in image) image.close();
    imageRef.current = null;
    setFile(null);
    setPalette([]);
    setInspected(null);
    setError("");
    setSuccess("");
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    if (inputRef.current) inputRef.current.value = "";
  }

  const contrast =
    selected.length === 2 && palette[selected[0]] && palette[selected[1]]
      ? contrastRatio(palette[selected[0]], palette[selected[1]])
      : null;
  const json = JSON.stringify(
    palette.map(({ hex, rgb, hsl }) => ({ hex, rgb, hsl })),
    null,
    2,
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <ToolCard title="Şəkil və seçimlər">
        <FilePicker
          inputRef={inputRef}
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          title={file ? "Başqa şəkil seç" : "Şəkil seç"}
          hint="Bütün analiz cihazınızda aparılır"
          onChange={handleFile}
        />
        <label className="mt-4 block text-sm font-semibold">
          Rəng sayı: {count}
          <input
            className="mt-2 w-full accent-[var(--accent)]"
            type="range"
            min="5"
            max="12"
            value={count}
            onChange={(event) => {
              const value = Number(event.target.value);
              setCount(value);
              setPalette([]);
              setSuccess("");
            }}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!file || isProcessing}
            onClick={() => extract()}
          >
            {isProcessing ? "Analiz olunur..." : "Palitranı çıxar"}
          </button>
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
        {palette.length ? (
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() =>
                copyText(palette.map((color) => color.hex).join(", "))
              }
            >
              <Copy size={16} />
              Tam palitranı kopyala
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() =>
                downloadText(
                  json,
                  "color-palette.json",
                  "application/json;charset=utf-8",
                )
              }
            >
              <Download size={16} />
              JSON yüklə
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={downloadPreview}
            >
              <Download size={16} />
              Palitra şəklini yüklə
            </button>
          </div>
        ) : null}
        <div className="mt-4">
          <PrivacyNotice />
        </div>
      </ToolCard>
      <div className="grid gap-5">
        <ToolCard title="Şəkildə rəng yoxla">
          <div className="relative mx-auto w-fit max-w-full">
            <canvas
              ref={canvasRef}
              onClick={inspectPixel}
              className="block h-auto max-h-[32rem] max-w-full cursor-crosshair rounded-xl border border-line bg-surface-soft"
              aria-label="Rəng yoxlamaq üçün şəklə klikləyin"
            />
            {!file ? (
              <p className="absolute inset-0 flex items-center justify-center p-5 text-center text-sm text-muted">
                Şəkil seçin
              </p>
            ) : null}
          </div>
          {inspected ? (
            (() => {
              const hsl = rgbToHsl(inspected);
              return (
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-surface-soft p-3 text-sm">
                  <span
                    className="h-10 w-10 rounded-lg border border-line"
                    style={{ background: rgbToHex(inspected) }}
                  />
                  <span>
                    <strong>{rgbToHex(inspected)}</strong>
                    <br />
                    <span className="text-muted">
                      rgb({inspected.r}, {inspected.g}, {inspected.b}) · hsl(
                      {hsl.h}, {hsl.s}%, {hsl.l}%) · x:{inspected.x}, y:
                      {inspected.y}
                    </span>
                  </span>
                </div>
              );
            })()
          ) : (
            <p className="mt-3 text-sm text-muted">
              <Pipette className="mr-1 inline" size={15} />
              Piksel rəngini görmək üçün şəklə klikləyin.
            </p>
          )}
        </ToolCard>
        <ToolCard title="Dominant rənglər">
          {palette.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {palette.map((color, index) => (
                <article
                  key={`${color.hex}-${index}`}
                  className={`rounded-xl border p-3 ${selected.includes(index) ? "border-accent bg-accent-soft" : "border-line bg-white"}`}
                >
                  <button
                    type="button"
                    onClick={() => selectForContrast(index)}
                    className="h-20 w-full rounded-lg border border-black/10"
                    style={{ background: color.hex }}
                    aria-label={`${color.hex} rəngini kontrast üçün seç`}
                  />
                  <div className="mt-3 grid gap-1 text-xs">
                    <button
                      className="text-left font-semibold hover:text-accent"
                      type="button"
                      onClick={() => copyText(color.hex)}
                    >
                      {color.hex} <Copy className="inline" size={12} />
                    </button>
                    <button
                      className="text-left text-muted hover:text-accent"
                      type="button"
                      onClick={() => copyText(color.rgb)}
                    >
                      {color.rgb}
                    </button>
                    <button
                      className="text-left text-muted hover:text-accent"
                      type="button"
                      onClick={() => copyText(color.hsl)}
                    >
                      {color.hsl}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-surface-soft p-4 text-sm text-muted">
              Palitra hazırlandıqda rənglər burada görünəcək.
            </p>
          )}
          {contrast !== null ? (
            <p className="mt-4 rounded-xl bg-surface-soft p-3 text-sm">
              <strong>Kontrast: {contrast.toFixed(2)}:1</strong>
              <br />
              <span className="text-muted">
                Normal mətn üçün WCAG AA: {contrast >= 4.5 ? "keçir" : "keçmir"}
                ; iri mətn: {contrast >= 3 ? "keçir" : "keçmir"}.
              </span>
            </p>
          ) : (
            <p className="mt-4 text-xs text-muted">
              Kontrastı müqayisə etmək üçün iki rəng seçin.
            </p>
          )}
        </ToolCard>
      </div>
    </div>
  );
}
