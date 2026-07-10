"use client";

import { ArrowLeftRight, Copy, Download, RotateCcw } from "lucide-react";
import { useState } from "react";
import { copyText, downloadText } from "@/lib/browser/download";
import {
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  textareaClass,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

type DiffMode = "line" | "word" | "character";
type ViewMode = "side" | "inline";
type DiffPart = {
  value: string;
  added?: boolean;
  removed?: boolean;
  count?: number;
};

function normalize(
  value: string,
  mode: DiffMode,
  options: { case: boolean; whitespace: boolean; empty: boolean },
) {
  let result = value.replace(/\r\n?/g, "\n");
  if (options.empty)
    result = result
      .split("\n")
      .filter((line) => line.trim())
      .join("\n");
  if (options.whitespace) {
    result =
      mode === "line"
        ? result
            .split("\n")
            .map((line) => line.replace(/\s+/g, " ").trim())
            .join("\n")
        : result.replace(/\s+/g, " ").trim();
  }
  if (options.case) result = result.toLocaleLowerCase("az");
  return result;
}

function metric(part: DiffPart, mode: DiffMode) {
  if (typeof part.count === "number") return part.count;
  if (mode === "line") return part.value.split("\n").filter(Boolean).length;
  if (mode === "word")
    return part.value.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu)?.length ?? 0;
  return Array.from(part.value).length;
}

function partClass(part: DiffPart) {
  if (part.added) return "bg-emerald-100 text-emerald-950";
  if (part.removed)
    return "bg-red-100 text-red-950 line-through decoration-red-400";
  return "text-foreground";
}

export function TextDiff() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [mode, setMode] = useState<DiffMode>("line");
  const [view, setView] = useState<ViewMode>("side");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreEmpty, setIgnoreEmpty] = useState(false);
  const [parts, setParts] = useState<DiffPart[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function invalidate() {
    setParts([]);
    setSuccess("");
  }

  async function compare() {
    if (!left && !right) {
      setError("Müqayisə üçün ən azı bir mətn daxil edin.");
      return;
    }
    setIsProcessing(true);
    setError("");
    setSuccess("");
    try {
      const diff = await import("diff");
      const options = {
        case: ignoreCase,
        whitespace: ignoreWhitespace,
        empty: ignoreEmpty,
      };
      const a = normalize(left, mode, options);
      const b = normalize(right, mode, options);
      const result =
        mode === "line"
          ? diff.diffLines(a, b)
          : mode === "word"
            ? diff.diffWordsWithSpace(a, b)
            : diff.diffChars(a, b);
      setParts(result);
      setSuccess("Müqayisə hazırdır.");
    } catch {
      setError("Mətnlər müqayisə edilə bilmədi.");
    } finally {
      setIsProcessing(false);
    }
  }

  function swap() {
    setLeft(right);
    setRight(left);
    invalidate();
  }

  function reset() {
    setLeft("");
    setRight("");
    setParts([]);
    setError("");
    setSuccess("");
  }

  const stats = parts.reduce(
    (total, part) => {
      const count = metric(part, mode);
      if (part.added) total.added += count;
      else if (part.removed) total.removed += count;
      else total.unchanged += count;
      return total;
    },
    { added: 0, removed: 0, unchanged: 0 },
  );
  const report = parts
    .map(
      (part) =>
        `${part.added ? "+ " : part.removed ? "- " : "  "}${part.value}`,
    )
    .join("");

  return (
    <div className="grid gap-5">
      <ToolCard>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="text-sm font-semibold">
            Birinci mətn
            <textarea
              className={`${textareaClass} mt-2 min-h-64`}
              value={left}
              onChange={(event) => {
                setLeft(event.target.value);
                invalidate();
              }}
              placeholder="Orijinal mətn"
            />
          </label>
          <label className="text-sm font-semibold">
            İkinci mətn
            <textarea
              className={`${textareaClass} mt-2 min-h-64`}
              value={right}
              onChange={(event) => {
                setRight(event.target.value);
                invalidate();
              }}
              placeholder="Dəyişdirilmiş mətn"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={compare}
            disabled={isProcessing}
          >
            {isProcessing ? "Müqayisə olunur..." : "Müqayisə et"}
          </button>
          <button type="button" className={secondaryButtonClass} onClick={swap}>
            <ArrowLeftRight size={16} />
            Yerlərini dəyiş
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm font-semibold">
            Müqayisə səviyyəsi
            <select
              className="mt-2 h-10 w-full rounded-lg border border-line bg-white px-2"
              value={mode}
              onChange={(event) => {
                setMode(event.target.value as DiffMode);
                invalidate();
              }}
            >
              <option value="line">Sətir</option>
              <option value="word">Söz</option>
              <option value="character">Simvol</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Görünüş
            <select
              className="mt-2 h-10 w-full rounded-lg border border-line bg-white px-2"
              value={view}
              onChange={(event) => setView(event.target.value as ViewMode)}
            >
              <option value="side">Yan-yana</option>
              <option value="inline">Inline</option>
            </select>
          </label>
          {[
            [ignoreCase, setIgnoreCase, "Böyük/kiçik hərfi sayma"],
            [ignoreWhitespace, setIgnoreWhitespace, "Boşluğu sayma"],
            [ignoreEmpty, setIgnoreEmpty, "Boş sətiri sayma"],
          ].map(([checked, setter, label]) => (
            <label
              key={String(label)}
              className="flex items-center gap-2 self-end rounded-lg border border-line bg-surface-soft p-2 text-xs font-semibold"
            >
              <input
                type="checkbox"
                checked={checked as boolean}
                onChange={(event) => {
                  (setter as (value: boolean) => void)(event.target.checked);
                  invalidate();
                }}
              />
              {label as string}
            </label>
          ))}
        </div>
        <StatusMessage error={error} success={success} />
        <div className="mt-4">
          <PrivacyNotice />
        </div>
      </ToolCard>
      <ToolCard title="Müqayisə nəticəsi">
        {parts.length ? (
          <>
            <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-emerald-50 p-3">
                <span className="text-emerald-800">Əlavə</span>
                <strong className="block text-lg">{stats.added}</strong>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <span className="text-red-800">Silinib</span>
                <strong className="block text-lg">{stats.removed}</strong>
              </div>
              <div className="rounded-xl bg-surface-soft p-3">
                <span className="text-muted">Dəyişməyib</span>
                <strong className="block text-lg">{stats.unchanged}</strong>
              </div>
            </div>
            {view === "inline" ? (
              <pre className="max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-white p-4 font-mono text-sm leading-6">
                {parts.map((part, index) => (
                  <span key={index} className={partClass(part)}>
                    {part.value}
                  </span>
                ))}
              </pre>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                <pre className="max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-white p-4 font-mono text-sm leading-6">
                  {parts
                    .filter((part) => !part.added)
                    .map((part, index) => (
                      <span key={index} className={partClass(part)}>
                        {part.value}
                      </span>
                    ))}
                </pre>
                <pre className="max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-white p-4 font-mono text-sm leading-6">
                  {parts
                    .filter((part) => !part.removed)
                    .map((part, index) => (
                      <span key={index} className={partClass(part)}>
                        {part.value}
                      </span>
                    ))}
                </pre>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => copyText(report)}
              >
                <Copy size={16} />
                Nəticəni kopyala
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => downloadText(report, "text-comparison.txt")}
              >
                <Download size={16} />
                TXT yüklə
              </button>
            </div>
          </>
        ) : (
          <p className="rounded-xl bg-surface-soft p-5 text-center text-sm text-muted">
            Mətnləri daxil edib müqayisə etdikdən sonra fərqlər burada
            görünəcək.
          </p>
        )}
      </ToolCard>
    </div>
  );
}
