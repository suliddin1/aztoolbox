"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { getTextStats } from "@/lib/textUtils";

const statLabels = [
  ["characters", "Simvol sayı"],
  ["charactersNoSpaces", "Boşluqsuz simvol sayı"],
  ["words", "Söz sayı"],
  ["sentences", "Cümlə sayı"],
  ["paragraphs", "Abzas sayı"],
  ["readingMinutes", "Təxmini oxuma vaxtı"],
] as const;

export function WordCounter() {
  const [text, setText] = useState("");
  const stats = useMemo(() => getTextStats(text), [text]);

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="counter-text" className="font-semibold">
            Mətn
          </label>
          <div className="flex gap-2">
            <CopyButton value={text} />
            <button
              type="button"
              onClick={() => setText("")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-semibold transition hover:border-accent"
            >
              <RotateCcw size={16} />
              Təmizlə
            </button>
          </div>
        </div>
        <textarea
          id="counter-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={15}
          placeholder="Mətni yazın və statistikaya canlı baxın..."
          className="w-full resize-y rounded-md border border-line bg-white p-3 leading-7 outline-none transition focus:border-accent"
        />
        <p className="mt-4 text-sm leading-6 text-muted">
          Essay, LinkedIn post, CV bio və sosial media mətnləri üçün faydalıdır.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">Canlı statistika</h2>
        <div className="mt-4 grid gap-3">
          {statLabels.map(([key, label]) => (
            <div
              key={key}
              className="rounded-md border border-line bg-surface-soft p-4"
            >
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-2xl font-semibold">
                {key === "readingMinutes"
                  ? `${stats[key]} dəq`
                  : stats[key].toLocaleString("az-AZ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
