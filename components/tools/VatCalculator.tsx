"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { formatMoney } from "@/lib/utils";

type Mode = "add" | "extract";

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function VatCalculator() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("18");
  const [mode, setMode] = useState<Mode>("add");

  const result = useMemo(() => {
    const value = Math.max(0, parseNumber(amount));
    const vatRate = Math.max(0, parseNumber(rate)) / 100;

    if (mode === "extract") {
      const net = vatRate ? value / (1 + vatRate) : value;
      const vat = value - net;
      return { net, vat, gross: value };
    }

    const vat = value * vatRate;
    return { net: value, vat, gross: value + vat };
  }, [amount, mode, rate]);

  const copyText = [
    `ƏDV-siz məbləğ: ${formatMoney(result.net)}`,
    `ƏDV məbləği: ${formatMoney(result.vat)}`,
    `ƏDV-li məbləğ: ${formatMoney(result.gross)}`,
  ].join("\n");

  function clear() {
    setAmount("");
    setRate("18");
    setMode("add");
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">Məbləğ</label>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(",", "."))}
              placeholder="100"
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">ƏDV faizi</label>
            <input
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRate(event.target.value.replace(",", "."))}
              placeholder="18"
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("add")}
              className={`h-11 rounded-md border px-3 text-sm font-semibold transition ${mode === "add" ? "border-accent bg-accent-soft text-accent-strong" : "border-line bg-white text-muted hover:border-accent"}`}
            >
              Qiymətə ƏDV əlavə et
            </button>
            <button
              type="button"
              onClick={() => setMode("extract")}
              className={`h-11 rounded-md border px-3 text-sm font-semibold transition ${mode === "extract" ? "border-accent bg-accent-soft text-accent-strong" : "border-line bg-white text-muted hover:border-accent"}`}
            >
              Qiymətin içindən ƏDV-ni çıxart
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <CopyButton value={copyText} label="Nəticəni kopyala" />
          <button type="button" onClick={clear} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent">
            <RotateCcw size={16} />
            Təmizlə
          </button>
        </div>
        <p className="mt-4 text-sm text-muted">Bu kalkulyator məlumat xarakterlidir.</p>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">Nəticə</h2>
        <div className="mt-4 grid gap-3">
          <Result label="ƏDV-siz məbləğ" value={formatMoney(result.net)} />
          <Result label="ƏDV məbləği" value={formatMoney(result.vat)} />
          <Result label="ƏDV-li məbləğ" value={formatMoney(result.gross)} />
        </div>
      </div>
    </section>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface-soft p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
