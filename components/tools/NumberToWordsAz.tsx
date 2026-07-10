"use client";

import { Copy, RotateCcw } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/browser/download";
import { parseAznAmount, parseIntegerInput } from "@/lib/number-to-words-az";
import {
  inputClass,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

export function NumberToWordsAz() {
  const [mode, setMode] = useState<"integer" | "azn">("integer");
  const [input, setInput] = useState("");
  const [normalized, setNormalized] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function convert() {
    setError("");
    setSuccess("");
    setOutput("");
    setNormalized("");
    try {
      const result =
        mode === "integer" ? parseIntegerInput(input) : parseAznAmount(input);
      setNormalized(result.normalized);
      setOutput(result.words);
      setSuccess("Ədəd Azərbaycan dilində yazı ilə hazırdır.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Ədəd çevrilə bilmədi.",
      );
    }
  }

  function reset() {
    setInput("");
    setNormalized("");
    setOutput("");
    setError("");
    setSuccess("");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
      <ToolCard title="Ədədi daxil edin">
        <div className="grid grid-cols-2 gap-2">
          {(["integer", "azn"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={
                mode === item ? primaryButtonClass : secondaryButtonClass
              }
              onClick={() => {
                setMode(item);
                reset();
              }}
            >
              {item === "integer" ? "Tam ədəd" : "AZN məbləği"}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm font-semibold">
          {mode === "integer" ? "Tam ədəd" : "Məbləğ"}
          <input
            className={`${inputClass} mt-2 font-mono text-base`}
            inputMode={mode === "integer" ? "numeric" : "decimal"}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setOutput("");
              setError("");
              setSuccess("");
            }}
            placeholder={
              mode === "integer" ? "Məsələn: -1000000" : "Məsələn: 123,45"
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") convert();
            }}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {(mode === "integer"
            ? ["0", "101", "1000000", "-42"]
            : ["123.45", "0,05", "1000"]
          ).map((sample) => (
            <button
              type="button"
              key={sample}
              className="rounded-lg border border-line bg-surface-soft px-3 py-1.5 hover:border-accent"
              onClick={() => setInput(sample)}
            >
              {sample}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={convert}
            disabled={!input.trim()}
          >
            Yazı ilə göstər
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
          <div className="grid gap-4">
            <div className="rounded-xl bg-surface-soft p-4">
              <span className="text-sm text-muted">
                Normallaşdırılmış rəqəm
              </span>
              <p className="mt-1 break-all font-mono text-lg font-semibold">
                {normalized}
              </p>
            </div>
            <div className="rounded-xl border border-accent/20 bg-accent-soft p-5">
              <span className="text-sm text-accent-strong">
                Azərbaycan dilində
              </span>
              <p className="mt-2 text-xl font-bold leading-8">{output}</p>
            </div>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => copyText(output)}
            >
              <Copy size={16} />
              Nəticəni kopyala
            </button>
          </div>
        ) : (
          <p className="rounded-xl bg-surface-soft p-5 text-center text-sm text-muted">
            Sıfır, mənfi ədədlər və kvadrilyon miqyası dəstəklənir. AZN
            rejimində qəpik iki rəqəmə normallaşdırılır.
          </p>
        )}
      </ToolCard>
    </div>
  );
}
