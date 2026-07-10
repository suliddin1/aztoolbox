"use client";

import { Copy, Download, RotateCcw } from "lucide-react";
import { useState } from "react";
import { copyText, downloadText } from "@/lib/browser/download";
import { generateUuidV4, secureRandomId } from "@/lib/secure-id";
import {
  inputClass,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const numbers = "0123456789";
const safeSymbols = "-_~!";

export function UuidGenerator() {
  const [mode, setMode] = useState<"uuid" | "random">("uuid");
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [length, setLength] = useState(24);
  const [charset, setCharset] = useState<
    "letters" | "numbers" | "alphanumeric"
  >("alphanumeric");
  const [symbols, setSymbols] = useState(false);
  const [values, setValues] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function generate() {
    setError("");
    setSuccess("");
    try {
      const safeCount = Math.max(1, Math.min(100, Math.round(count)));
      const next = Array.from({ length: safeCount }, () => {
        if (mode === "uuid") {
          let value = generateUuidV4();
          if (!hyphens) value = value.replace(/-/g, "");
          return uppercase ? value.toUpperCase() : value.toLowerCase();
        }
        const base =
          charset === "letters"
            ? letters
            : charset === "numbers"
              ? numbers
              : letters + numbers;
        return secureRandomId(length, base + (symbols ? safeSymbols : ""));
      });
      setCount(safeCount);
      setValues(next);
      setSuccess(
        `${next.length} təhlükəsiz ${mode === "uuid" ? "UUID v4" : "random ID"} yaradıldı.`,
      );
    } catch (caught) {
      setValues([]);
      setError(
        caught instanceof Error ? caught.message : "ID-lər yaradıla bilmədi.",
      );
    }
  }

  function reset() {
    setValues([]);
    setError("");
    setSuccess("");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
      <ToolCard title="Generator seçimləri">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={
              mode === "uuid" ? primaryButtonClass : secondaryButtonClass
            }
            onClick={() => {
              setMode("uuid");
              reset();
            }}
          >
            UUID v4
          </button>
          <button
            type="button"
            className={
              mode === "random" ? primaryButtonClass : secondaryButtonClass
            }
            onClick={() => {
              setMode("random");
              reset();
            }}
          >
            Secure random ID
          </button>
        </div>
        <label className="mt-4 block text-sm font-semibold">
          Say (1–100)
          <input
            className={`${inputClass} mt-2`}
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(event) => {
              setCount(Number(event.target.value));
              reset();
            }}
          />
        </label>
        {mode === "uuid" ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-line bg-surface-soft p-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(event) => {
                  setUppercase(event.target.checked);
                  reset();
                }}
              />
              Böyük hərflər
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-line bg-surface-soft p-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={hyphens}
                onChange={(event) => {
                  setHyphens(event.target.checked);
                  reset();
                }}
              />
              Defisləri saxla
            </label>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <label className="text-sm font-semibold">
              Uzunluq
              <input
                className={`${inputClass} mt-2`}
                type="number"
                min="1"
                max="4096"
                value={length}
                onChange={(event) => {
                  setLength(Number(event.target.value));
                  reset();
                }}
              />
            </label>
            <label className="text-sm font-semibold">
              Simvol dəsti
              <select
                className={`${inputClass} mt-2`}
                value={charset}
                onChange={(event) => {
                  setCharset(event.target.value as typeof charset);
                  reset();
                }}
              >
                <option value="letters">Hərflər</option>
                <option value="numbers">Rəqəmlər</option>
                <option value="alphanumeric">Hərf + rəqəm</option>
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-line bg-surface-soft p-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={symbols}
                onChange={(event) => {
                  setSymbols(event.target.checked);
                  reset();
                }}
              />
              Təhlükəsiz simvolları əlavə et ({safeSymbols})
            </label>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={generate}
          >
            Yarat
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={reset}
          >
            <RotateCcw size={16} />
            Nəticəni sil
          </button>
        </div>
        <StatusMessage error={error} success={success} />
        <div className="mt-4">
          <PrivacyNotice />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          UUID v4 üçün crypto.randomUUID(), dəstəklənmədikdə Web Crypto fallback
          istifadə olunur. Xüsusi random ID-lər UUID adlandırılmır və heç bir
          rejim Math.random() istifadə etmir.
        </p>
      </ToolCard>
      <ToolCard title="Hazır ID-lər">
        {values.length ? (
          <>
            <div className="grid max-h-[36rem] gap-2 overflow-auto">
              {values.map((value, index) => (
                <div
                  key={`${value}-${index}`}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-surface-soft p-2"
                >
                  <code className="min-w-0 flex-1 break-all text-sm">
                    {value}
                  </code>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white hover:border-accent"
                    aria-label={`${index + 1}-ci ID-ni kopyala`}
                    onClick={() => copyText(value)}
                  >
                    <Copy size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => copyText(values.join("\n"))}
              >
                <Copy size={16} />
                Hamısını kopyala
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() =>
                  downloadText(
                    values.join("\n"),
                    mode === "uuid" ? "uuid-v4.txt" : "secure-random-ids.txt",
                  )
                }
              >
                <Download size={16} />
                TXT yüklə
              </button>
            </div>
          </>
        ) : (
          <p className="rounded-xl bg-surface-soft p-5 text-center text-sm text-muted">
            Kriptoqrafik təhlükəsiz generatorun nəticələri burada görünəcək.
          </p>
        )}
      </ToolCard>
    </div>
  );
}
