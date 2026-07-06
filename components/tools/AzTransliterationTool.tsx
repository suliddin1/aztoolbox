"use client";

import { RotateCcw, Wand2 } from "lucide-react";
import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import {
  azTransliterationExamples,
  fixAzerbaijaniTransliteration,
} from "@/lib/azTransliteration";

export function AzTransliterationTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  function fixText() {
    setOutput(fixAzerbaijaniTransliteration(input));
  }

  function clear() {
    setInput("");
    setOutput("");
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <label htmlFor="translit-input" className="font-semibold">
            Mətn
          </label>
          <span className="text-sm text-muted">{input.length} simvol</span>
        </div>
        <textarea
          id="translit-input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setOutput("");
          }}
          rows={12}
          placeholder="Məsələn: men yaxsiyam, cox sag ol..."
          className="w-full resize-y rounded-md border border-line bg-white p-3 leading-7 outline-none transition focus:border-accent"
        />
        <p className="mt-3 rounded-md border border-line bg-surface-soft px-4 py-3 text-sm leading-6 text-muted">
          Bu alət qayda əsaslı işləyir. Nəticəni göndərməzdən əvvəl yoxlayın.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fixText}
            disabled={!input.trim()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50"
          >
            <Wand2 size={16} />
            Düzəlt
          </button>
          <button
            type="button"
            onClick={() => {
              setInput(azTransliterationExamples);
              setOutput("");
            }}
            className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent"
          >
            Nümunə
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
        <textarea
          value={output}
          readOnly
          rows={14}
          placeholder="Düzəldilmiş mətn burada görünəcək."
          className="w-full resize-y rounded-md border border-line bg-surface-soft p-3 leading-7 outline-none"
        />
      </div>
    </section>
  );
}
