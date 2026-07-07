"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { formatMoney } from "@/lib/utils";

type Mode = "discount" | "percentage" | "change";

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function DiscountCalculator() {
  const [mode, setMode] = useState<Mode>("discount");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");

  const result = useMemo(() => {
    const a = parseNumber(first);
    const b = parseNumber(second);

    if (mode === "discount") {
      const saved = Math.max(0, a) * Math.max(0, b) / 100;
      return {
        title: "Endirim nəticəsi",
        lines: [
          `Son qiymət: ${formatMoney(Math.max(0, a) - saved)}`,
          `Qənaət: ${formatMoney(saved)}`,
        ],
        error: a < 0 || b < 0 ? "Qiymət və endirim faizi mənfi ola bilməz." : "",
      };
    }

    if (mode === "percentage") {
      const percentage = b ? (a / b) * 100 : 0;
      return {
        title: "Faiz nəticəsi",
        lines: [`Faiz: ${percentage.toFixed(2)}%`],
        error: b <= 0 ? "Total value 0-dan böyük olmalıdır." : "",
      };
    }

    const difference = b - a;
    const change = a ? (difference / a) * 100 : 0;
    return {
      title: "Dəyişiklik nəticəsi",
      lines: [
        `Fərq: ${difference.toFixed(2)}`,
        `Dəyişiklik: ${change.toFixed(2)}%`,
      ],
      error: a <= 0 ? "Old value 0-dan böyük olmalıdır." : "",
    };
  }, [first, mode, second]);

  function clear() {
    setFirst("");
    setSecond("");
  }

  const copyText = result.lines.join("\n");

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["discount", "Endirim hesabla"],
            ["percentage", "Faiz neçədir?"],
            ["change", "Faiz artımı/azalması"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value as Mode);
                setFirst("");
                setSecond("");
              }}
              className={`h-11 rounded-md border px-3 text-sm font-semibold transition ${mode === value ? "border-accent bg-accent-soft text-accent-strong" : "border-line bg-white text-muted hover:border-accent"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              {mode === "discount" ? "Original price" : mode === "percentage" ? "Part value" : "Old value"}
            </label>
            <input
              inputMode="decimal"
              value={first}
              onChange={(event) => setFirst(event.target.value.replace(",", "."))}
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">
              {mode === "discount" ? "Discount %" : mode === "percentage" ? "Total value" : "New value"}
            </label>
            <input
              inputMode="decimal"
              value={second}
              onChange={(event) => setSecond(event.target.value.replace(",", "."))}
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <CopyButton value={copyText} label="Nəticəni kopyala" disabled={Boolean(result.error)} />
          <button type="button" onClick={clear} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent">
            <RotateCcw size={16} />
            Təmizlə
          </button>
        </div>
        {result.error ? <p className="mt-3 text-sm text-danger">{result.error}</p> : null}
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">{result.title}</h2>
        <div className="mt-4 grid gap-3">
          {result.lines.map((line) => (
            <div key={line} className="rounded-md border border-line bg-surface-soft p-4">
              <p className="text-2xl font-semibold">{line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
