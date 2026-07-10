"use client";

import { RotateCcw, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { cleanText, type TextCleanOptions } from "@/lib/textUtils";

const exampleText = `  “SALAM   DÜNYA!”\n\n\nBu    mətndə   artıq boşluqlar var.\r\nikinci cümlə yeni sətrə düşüb...  `;

const defaultOptions: TextCleanOptions = {
  trimExtraSpaces: true,
  removeEmptyLines: true,
  fixLineEndings: true,
  lowercase: false,
  uppercase: false,
  sentenceCase: false,
  titleCase: false,
  normalizeQuotes: true,
};

const optionLabels: Array<{ key: keyof TextCleanOptions; label: string }> = [
  { key: "trimExtraSpaces", label: "Artıq boşluqları sil" },
  { key: "removeEmptyLines", label: "Boş sətirləri sil" },
  { key: "fixLineEndings", label: "Sətir sonlarını düzəlt" },
  { key: "lowercase", label: "Hamısını kiçik hərflə yaz" },
  { key: "uppercase", label: "Hamısını böyük hərflə yaz" },
  { key: "sentenceCase", label: "Cümlə formatı" },
  { key: "titleCase", label: "Title Case" },
  {
    key: "normalizeQuotes",
    label: "Dırnaq və apostrof simvollarını sadələşdir",
  },
];

export function TextCleaner() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState<TextCleanOptions>(defaultOptions);
  const inputCount = input.length;
  const outputCount = output.length;
  const hasCaseOption = useMemo(
    () =>
      options.lowercase ||
      options.uppercase ||
      options.sentenceCase ||
      options.titleCase,
    [options],
  );

  function updateOption(key: keyof TextCleanOptions, value: boolean) {
    setOptions((current) => {
      const next = { ...current, [key]: value };
      if (
        value &&
        ["lowercase", "uppercase", "sentenceCase", "titleCase"].includes(key)
      ) {
        next.lowercase = key === "lowercase";
        next.uppercase = key === "uppercase";
        next.sentenceCase = key === "sentenceCase";
        next.titleCase = key === "titleCase";
      }
      return next;
    });
  }

  function runCleaner() {
    setOutput(cleanText(input, options));
  }

  function clear() {
    setInput("");
    setOutput("");
    setOptions(defaultOptions);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <label htmlFor="dirty-text" className="font-semibold">
            Təmizlənəcək mətn
          </label>
          <span className="text-sm text-muted">{inputCount} simvol</span>
        </div>
        <textarea
          id="dirty-text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={10}
          placeholder="Qarışıq və ya kopyalanmış mətni bura yazın..."
          className="w-full resize-y rounded-md border border-line bg-white p-3 leading-7 outline-none transition focus:border-accent"
        />

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {optionLabels.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 rounded-md border border-line bg-surface-soft px-3 py-3 text-sm font-medium"
            >
              <input
                type="checkbox"
                checked={options[item.key]}
                onChange={(event) =>
                  updateOption(item.key, event.target.checked)
                }
                className="h-4 w-4 accent-[var(--accent)]"
              />
              {item.label}
            </label>
          ))}
        </div>

        {!hasCaseOption ? (
          <p className="mt-3 text-sm text-muted">
            Hərf formatı seçilməsə, mətnin mənası və hərfləri dəyişdirilmir.
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runCleaner}
            disabled={!input}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50"
          >
            <Wand2 size={16} />
            Təmizlə
          </button>
          <button
            type="button"
            onClick={() => {
              setInput(exampleText);
              setOutput("");
            }}
            className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent"
          >
            Nümunəni doldur
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
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Nəticə</h2>
            <p className="mt-1 text-sm text-muted">{outputCount} simvol</p>
          </div>
          <CopyButton value={output} />
        </div>
        <textarea
          value={output}
          readOnly
          rows={14}
          placeholder="Təmizlənmiş mətn burada görünəcək."
          className="w-full resize-y rounded-md border border-line bg-surface-soft p-3 leading-7 outline-none"
        />
      </div>
    </section>
  );
}
