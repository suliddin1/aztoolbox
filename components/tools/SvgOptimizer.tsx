"use client";

import { Copy, Download, RotateCcw } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { copyText, downloadText, formatBytes } from "@/lib/browser/download";
import { optimizeSvg, type SvgOptimizationResult } from "@/lib/svg-tools";
import {
  FilePicker,
  inputClass,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  textareaClass,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

export function SvgOptimizer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useRef<string[]>([]);
  const [source, setSource] = useState("");
  const [filename, setFilename] = useState("optimized.svg");
  const [precision, setPrecision] = useState(3);
  const [result, setResult] = useState<SvgOptimizationResult | null>(null);
  const [originalPreview, setOriginalPreview] = useState("");
  const [optimizedPreview, setOptimizedPreview] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function revokePreviews() {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current = [];
    setOriginalPreview("");
    setOptimizedPreview("");
  }

  useEffect(() => () => revokePreviews(), []);

  function clearResult() {
    revokePreviews();
    setResult(null);
    setSuccess("");
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    setError("");
    clearResult();
    if (!file) return;
    if (
      file.type !== "image/svg+xml" &&
      !file.name.toLowerCase().endsWith(".svg")
    ) {
      setError("Yalnız .svg faylı seçin.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("SVG faylı 5 MB-dan böyükdür.");
      return;
    }
    setSource(await file.text());
    setFilename(file.name.replace(/\.svg$/i, "-optimized.svg"));
  }

  function runOptimization() {
    if (!source.trim() || isProcessing) {
      if (!source.trim()) setError("SVG kodunu daxil edin və ya fayl seçin.");
      return;
    }
    setIsProcessing(true);
    setError("");
    clearResult();
    try {
      const next = optimizeSvg(source, precision);
      const originalUrl = URL.createObjectURL(
        new Blob([next.sanitizedOriginal], { type: "image/svg+xml" }),
      );
      const optimizedUrl = URL.createObjectURL(
        new Blob([next.optimized], { type: "image/svg+xml" }),
      );
      previewUrls.current = [originalUrl, optimizedUrl];
      setOriginalPreview(originalUrl);
      setOptimizedPreview(optimizedUrl);
      setResult(next);
      setSuccess(
        "SVG yoxlanıldı, təhlükəli məzmun təmizləndi və optimallaşdırıldı.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "SVG optimallaşdırıla bilmədi.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function reset() {
    setSource("");
    setFilename("optimized.svg");
    setPrecision(3);
    setError("");
    clearResult();
    if (inputRef.current) inputRef.current.value = "";
  }

  const saving =
    result && result.originalBytes > 0
      ? ((result.originalBytes - result.optimizedBytes) /
          result.originalBytes) *
        100
      : 0;

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <ToolCard title="SVG daxil edin">
          <FilePicker
            inputRef={inputRef}
            accept="image/svg+xml,.svg"
            title="SVG faylı seç"
            hint="və ya kodu sağdakı sahəyə yapışdırın"
            onChange={handleFile}
          />
          <label className="mt-4 block text-sm font-semibold">
            Rəqəm dəqiqliyi
            <select
              className={`${inputClass} mt-2`}
              value={precision}
              onChange={(event) => {
                setPrecision(Number(event.target.value));
                clearResult();
              }}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} onluq rəqəm
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={primaryButtonClass}
              onClick={runOptimization}
              disabled={!source.trim() || isProcessing}
            >
              {isProcessing ? "Yoxlanılır..." : "SVG-ni optimallaşdır"}
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
          <div className="mt-4">
            <PrivacyNotice />
          </div>
        </ToolCard>
        <ToolCard title="SVG kodu">
          <textarea
            className={`${textareaClass} min-h-80`}
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              clearResult();
            }}
            spellCheck={false}
            placeholder={'<svg viewBox="0 0 100 100">...</svg>'}
          />
        </ToolCard>
      </div>
      {result ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-white p-4">
              <span className="text-sm text-muted">Orijinal</span>
              <strong className="mt-1 block text-xl">
                {formatBytes(result.originalBytes)}
              </strong>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <span className="text-sm text-muted">Optimallaşdırılmış</span>
              <strong className="mt-1 block text-xl">
                {formatBytes(result.optimizedBytes)}
              </strong>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <span className="text-sm text-muted">Qənaət</span>
              <strong className="mt-1 block text-xl">
                {saving.toFixed(1)}%
              </strong>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <ToolCard title="Təhlükəsiz orijinal önizləmə">
              <div className="relative min-h-64 overflow-hidden rounded-xl bg-[linear-gradient(45deg,#eef2f7_25%,transparent_25%),linear-gradient(-45deg,#eef2f7_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eef2f7_75%),linear-gradient(-45deg,transparent_75%,#eef2f7_75%)] bg-[length:20px_20px]">
                <NextImage
                  src={originalPreview}
                  alt="Sanitizasiya edilmiş orijinal SVG"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            </ToolCard>
            <ToolCard title="Optimallaşdırılmış önizləmə">
              <div className="relative min-h-64 overflow-hidden rounded-xl bg-[linear-gradient(45deg,#eef2f7_25%,transparent_25%),linear-gradient(-45deg,#eef2f7_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eef2f7_75%),linear-gradient(-45deg,transparent_75%,#eef2f7_75%)] bg-[length:20px_20px]">
                <NextImage
                  src={optimizedPreview}
                  alt="Optimallaşdırılmış SVG"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            </ToolCard>
          </div>
          <ToolCard title="Optimallaşdırılmış kod">
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => copyText(result.optimized)}
              >
                <Copy size={16} />
                Kodu kopyala
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() =>
                  downloadText(
                    result.optimized,
                    filename,
                    "image/svg+xml;charset=utf-8",
                  )
                }
              >
                <Download size={16} />
                SVG yüklə
              </button>
            </div>
            <textarea
              className={`${textareaClass} min-h-72`}
              value={result.optimized}
              readOnly
              spellCheck={false}
            />
          </ToolCard>
        </>
      ) : null}
      <p className="rounded-xl border border-line bg-white/90 p-4 text-sm leading-6 text-muted">
        Scriptlər, hadisə atributları, təhlükəli xarici istinadlar və editor
        metadata-sı silinir. Sanitizasiya edilmiş SVG birbaşa HTML kimi DOM-a
        yerləşdirilmir; önizləmə şəkil resursu kimi göstərilir. Çox mürəkkəb
        SVG-lərdə görünüşü yükləməzdən əvvəl müqayisə edin.
      </p>
    </div>
  );
}
