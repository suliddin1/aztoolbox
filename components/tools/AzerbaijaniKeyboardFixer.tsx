"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { fixAzerbaijaniKeyboard } from "@/lib/azKeyboard";

const exampleInput = "m'n bel' yaz;ram";

export function AzerbaijaniKeyboardFixer() {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const output = useMemo(
    () => (submitted ? fixAzerbaijaniKeyboard(input) : ""),
    [input, submitted],
  );

  function clear() {
    setInput("");
    setSubmitted(false);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <label htmlFor="wrong-text" className="font-semibold">
            Mətn
          </label>
          <span className="text-sm text-muted">{input.length} simvol</span>
        </div>
        <textarea
          id="wrong-text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setSubmitted(false);
          }}
          rows={10}
          placeholder="Səhv klaviatura ilə yazılmış mətni daxil edin..."
          className="w-full resize-y rounded-md border border-line bg-white p-3 leading-7 outline-none transition focus:border-accent"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            disabled={!input.trim()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50"
          >
            <Sparkles size={16} />
            Düzəlt
          </button>
          <button
            type="button"
            onClick={() => {
              setInput(exampleInput);
              setSubmitted(true);
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
            <p className="mt-1 text-sm text-muted">{output.length} simvol</p>
          </div>
          <CopyButton value={output} />
        </div>
        <div className="min-h-64 rounded-md border border-line bg-surface-soft p-4 leading-7">
          {output ? (
            <p className="whitespace-pre-wrap">{output}</p>
          ) : (
            <p className="text-muted">
              Mətn daxil edib “Düzəlt” düyməsinə basın. Nəticə burada görünəcək.
            </p>
          )}
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">
          Bu alət ən çox Azərbaycan klaviaturası olmadan yazılmış mətnlər üçün
          uyğundur. Normal cümlə sonluğu və vergüllər mümkün qədər qorunur.
          Nəticəni göndərməzdən əvvəl yoxlayın.
        </p>
      </div>
    </section>
  );
}
