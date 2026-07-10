"use client";

import { Copy, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { copyText } from "@/lib/browser/download";
import {
  decodeUrlComponent,
  parseCompleteUrl,
  rebuildUrl,
  type ParsedUrl,
  type QueryEntry,
} from "@/lib/url-tools";
import {
  inputClass,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  textareaClass,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

type Mode = "encode" | "decode" | "parse" | "build";

export function UrlEncoderDecoder() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [parsed, setParsed] = useState<ParsedUrl | null>(null);
  const [entries, setEntries] = useState<QueryEntry[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetResult() {
    setOutput("");
    setParsed(null);
    setEntries([]);
    setError("");
    setSuccess("");
  }

  function changeMode(next: Mode) {
    setMode(next);
    setInput("");
    resetResult();
  }

  function process() {
    setError("");
    setSuccess("");
    try {
      if (!input.trim()) throw new Error("Mətn və ya URL daxil edin.");
      if (mode === "encode") {
        setOutput(encodeURIComponent(input));
        setSuccess("URL komponenti encode edildi.");
      } else if (mode === "decode") {
        setOutput(decodeUrlComponent(input));
        setSuccess("URL komponenti decode edildi.");
      } else {
        const result = parseCompleteUrl(input);
        setParsed(result);
        setEntries(
          result.entries.map((entry) => ({
            ...entry,
            id: crypto.randomUUID(),
          })),
        );
        setSuccess(
          mode === "parse"
            ? "URL hissələrə ayrıldı."
            : "Əsas URL hazırdır; query parametrlərini redaktə edin.",
        );
      }
    } catch (caught) {
      setOutput("");
      setParsed(null);
      setEntries([]);
      setError(
        caught instanceof Error ? caught.message : "Əməliyyat alınmadı.",
      );
    }
  }

  function updateEntry(id: string, field: "key" | "value", value: string) {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  const finalUrl = useMemo(() => {
    if (!parsed) return "";
    try {
      return rebuildUrl(input, entries);
    } catch {
      return "";
    }
  }, [entries, input, parsed]);

  return (
    <div className="grid gap-5">
      <ToolCard>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(["encode", "decode", "parse", "build"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={
                mode === item ? primaryButtonClass : secondaryButtonClass
              }
              onClick={() => changeMode(item)}
            >
              {item === "encode"
                ? "Komponenti encode et"
                : item === "decode"
                  ? "Komponenti decode et"
                  : item === "parse"
                    ? "Tam URL-i parse et"
                    : "Query qur"}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm font-semibold">
          {mode === "encode"
            ? "Encode ediləcək mətn"
            : mode === "decode"
              ? "Decode ediləcək komponent"
              : "Tam URL"}
          <textarea
            className={`${textareaClass} mt-2 min-h-36`}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              resetResult();
            }}
            spellCheck={false}
            placeholder={
              mode === "encode"
                ? "Bakı şəhəri & alətlər"
                : mode === "decode"
                  ? "Bak%C4%B1%20%C5%9F%C9%99h%C9%99ri"
                  : "https://example.com/path?tag=az&tag=pdf#section"
            }
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={process}
            disabled={!input.trim()}
          >
            {mode === "encode"
              ? "Encode et"
              : mode === "decode"
                ? "Decode et"
                : "URL-i oxu"}
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => {
              setInput("");
              resetResult();
            }}
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
      {output ? (
        <ToolCard title="Nəticə">
          <pre className="overflow-auto whitespace-pre-wrap break-all rounded-xl bg-surface-soft p-4 text-sm leading-6">
            {output}
          </pre>
          <button
            type="button"
            className={`${primaryButtonClass} mt-3`}
            onClick={() => copyText(output)}
          >
            <Copy size={16} />
            Kopyala
          </button>
        </ToolCard>
      ) : null}
      {parsed ? (
        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <ToolCard title="URL hissələri">
            <dl className="grid gap-3 text-sm">
              {[
                ["Protokol", parsed.protocol],
                ["Hostname", parsed.hostname],
                ["Port", parsed.port || "standart"],
                ["Path", parsed.path],
                ["Hash", parsed.hash || "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-surface-soft p-3">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="mt-1 flex items-start gap-2 break-all font-mono">
                    <span className="min-w-0 flex-1">{value}</span>
                    <button
                      type="button"
                      className="text-accent"
                      onClick={() => copyText(value)}
                      aria-label={`${label} kopyala`}
                    >
                      <Copy size={14} />
                    </button>
                  </dd>
                </div>
              ))}
            </dl>
          </ToolCard>
          <ToolCard title="Query parametrləri">
            <div className="grid gap-2">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="grid gap-2 rounded-xl border border-line bg-surface-soft p-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <label className="text-xs text-muted">
                    Açar
                    <input
                      className={`${inputClass} mt-1`}
                      value={entry.key}
                      onChange={(event) =>
                        updateEntry(entry.id, "key", event.target.value)
                      }
                    />
                  </label>
                  <label className="text-xs text-muted">
                    Dəyər
                    <input
                      className={`${inputClass} mt-1`}
                      value={entry.value}
                      onChange={(event) =>
                        updateEntry(entry.id, "value", event.target.value)
                      }
                    />
                  </label>
                  <div className="flex items-end gap-1">
                    <button
                      type="button"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-accent"
                      onClick={() => copyText(entry.value)}
                      aria-label={`${index + 1}-ci dəyəri kopyala`}
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-danger"
                      onClick={() =>
                        setEntries((current) =>
                          current.filter((item) => item.id !== entry.id),
                        )
                      }
                      aria-label={`${index + 1}-ci parametri sil`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={`${secondaryButtonClass} mt-3`}
              onClick={() =>
                setEntries((current) => [
                  ...current,
                  { id: crypto.randomUUID(), key: "", value: "" },
                ])
              }
            >
              <Plus size={16} />
              Parametr əlavə et
            </button>
            <div className="mt-4 rounded-xl border border-accent/20 bg-accent-soft p-4">
              <span className="text-sm text-accent-strong">
                Yenidən qurulmuş URL
              </span>
              <p className="mt-2 break-all font-mono text-sm leading-6">
                {finalUrl}
              </p>
              <button
                type="button"
                className={`${primaryButtonClass} mt-3`}
                disabled={!finalUrl}
                onClick={() => copyText(finalUrl)}
              >
                <Copy size={16} />
                Final URL-i kopyala
              </button>
            </div>
          </ToolCard>
        </div>
      ) : null}
      <p className="rounded-xl border border-line bg-white/90 p-4 text-sm leading-6 text-muted">
        Query cədvəlində təkrarlanan açarlar ayrıca saxlanılır. Unicode
        URLSearchParams qaydaları ilə encode edilir. Alət URL-i fetch etmir və
        avtomatik açmır.
      </p>
    </div>
  );
}
