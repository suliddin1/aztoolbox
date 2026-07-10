"use client";

import { Copy, Download, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { copyText, downloadText, formatBytes } from "@/lib/browser/download";
import {
  formatJson,
  parseJsonWithLocation,
  type JsonIndent,
} from "@/lib/json-tools";
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

const sample = `{
  "şəhər": "Bakı",
  "aktiv": true,
  "etiketlər": ["JSON", "Azərbaycan"],
  "məlumat": { "il": 2026, "say": 3 }
}`;

export function JsonFormatter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState<JsonIndent>(2);
  const [filename, setFilename] = useState("formatted.json");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!file) return;
    if (
      file.type !== "application/json" &&
      !file.name.toLowerCase().endsWith(".json")
    ) {
      setError("Yalnız JSON faylı seçin.");
      return;
    }
    setInput(await file.text());
    setFilename(file.name);
    setOutput("");
    setError("");
    setSuccess(`${file.name} (${formatBytes(file.size)}) oxundu.`);
  }

  function process(action: "validate" | "beautify" | "minify" | "sort") {
    if (!input.trim()) {
      setError("JSON mətni daxil edin.");
      return;
    }
    setIsProcessing(true);
    setError("");
    setSuccess("");
    window.setTimeout(() => {
      try {
        if (action === "validate") {
          const parsed = parseJsonWithLocation(input);
          if (parsed.error) throw new Error(parsed.error);
          setOutput(formatJson(input, { indent }));
          setSuccess("JSON etibarlıdır.");
        } else {
          setOutput(
            formatJson(input, {
              indent,
              minify: action === "minify",
              sortKeys: action === "sort",
            }),
          );
          setSuccess(
            action === "minify"
              ? "JSON minify edildi."
              : action === "sort"
                ? "Obyekt açarları rekursiv sıralandı."
                : "JSON formatlandı.",
          );
        }
      } catch (caught) {
        setOutput("");
        setError(
          caught instanceof Error ? caught.message : "JSON emal edilə bilmədi.",
        );
      } finally {
        setIsProcessing(false);
      }
    }, 0);
  }

  function reset() {
    setInput("");
    setOutput("");
    setError("");
    setSuccess("");
    setFilename("formatted.json");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-5">
      <ToolCard>
        <div className="grid gap-4 lg:grid-cols-[0.35fr_0.65fr]">
          <div>
            <FilePicker
              inputRef={inputRef}
              accept="application/json,.json"
              title="JSON faylı seç"
              hint="və ya kodu mətn sahəsinə yapışdırın"
              onChange={handleFile}
            />
            <label className="mt-4 block text-sm font-semibold">
              Indent
              <select
                className={`${inputClass} mt-2`}
                value={String(indent)}
                onChange={(event) =>
                  setIndent(
                    event.target.value === "tab"
                      ? "tab"
                      : (Number(event.target.value) as JsonIndent),
                  )
                }
              >
                <option value="2">2 boşluq</option>
                <option value="4">4 boşluq</option>
                <option value="tab">Tab</option>
              </select>
            </label>
            <button
              type="button"
              className={`${secondaryButtonClass} mt-3 w-full`}
              onClick={() => {
                setInput(sample);
                setOutput("");
                setError("");
              }}
            >
              Nümunə JSON
            </button>
          </div>
          <label className="text-sm font-semibold">
            JSON girişi
            <textarea
              className={`${textareaClass} mt-2 min-h-80`}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setOutput("");
                setError("");
                setSuccess("");
              }}
              spellCheck={false}
              placeholder='{"ad":"AzToolbox"}'
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            disabled={isProcessing}
            onClick={() => process("beautify")}
          >
            Formatla
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={isProcessing}
            onClick={() => process("validate")}
          >
            Yoxla
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={isProcessing}
            onClick={() => process("minify")}
          >
            Minify
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={isProcessing}
            onClick={() => process("sort")}
          >
            Açarları sırala
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
      <ToolCard title="Nəticə">
        {output ? (
          <>
            <textarea
              className={`${textareaClass} min-h-80`}
              value={output}
              readOnly
              spellCheck={false}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => copyText(output)}
              >
                <Copy size={16} />
                Kopyala
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() =>
                  downloadText(
                    output,
                    filename,
                    "application/json;charset=utf-8",
                  )
                }
              >
                <Download size={16} />
                JSON yüklə
              </button>
            </div>
          </>
        ) : (
          <p className="rounded-xl bg-surface-soft p-5 text-center text-sm text-muted">
            Nəticə böyük mətnlər üçün sintaksis rəngləməsi olmadan yüngül
            textarea-da göstərilir. Heç vaxt eval istifadə edilmir.
          </p>
        )}
      </ToolCard>
    </div>
  );
}
