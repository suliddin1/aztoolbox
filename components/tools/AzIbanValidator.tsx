"use client";

import { CheckCircle2, Copy, RotateCcw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { validateAzerbaijaniIban } from "@/lib/az-iban";
import { copyText } from "@/lib/browser/download";
import {
  inputClass,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

export function AzIbanValidator() {
  const [input, setInput] = useState("");
  const result = useMemo(() => validateAzerbaijaniIban(input), [input]);

  return (
    <div className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
      <ToolCard title="Azərbaycan IBAN-ı">
        <label className="block text-sm font-semibold">
          IBAN
          <input
            className={`${inputClass} mt-2 font-mono uppercase tracking-wide`}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="AZ21 NABZ 0000 0000 1370 1000 1944"
          />
        </label>
        <p className="mt-2 text-xs leading-5 text-muted">
          Boşluqlar silinir və hərflər böyük formaya çevrilir.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => copyText(result.formatted)}
            disabled={!input.trim()}
          >
            <Copy size={16} />
            Formatlanmış IBAN-ı kopyala
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => setInput("")}
          >
            <RotateCcw size={16} />
            Təmizlə
          </button>
        </div>
        <div className="mt-4">
          <PrivacyNotice />
        </div>
      </ToolCard>
      <ToolCard title="Yoxlama nəticəsi">
        {input.trim() ? (
          <div className="grid gap-4">
            <div
              className={`rounded-xl border p-4 ${result.valid ? "border-emerald-300 bg-emerald-50" : "border-red-200 bg-red-50"}`}
            >
              <div className="flex items-center gap-2 font-bold">
                {result.valid ? (
                  <CheckCircle2 className="text-emerald-700" size={21} />
                ) : (
                  <XCircle className="text-danger" size={21} />
                )}
                {result.valid
                  ? "Format və yoxlama cəmi uyğundur"
                  : "IBAN yoxlamadan keçmədi"}
              </div>
              <p className="mt-3 break-all font-mono text-sm">
                {result.formatted || result.normalized}
              </p>
            </div>
            {result.errors.length ? (
              <ul className="grid gap-2">
                {result.errors.map((error) => (
                  <li
                    key={error}
                    className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-danger"
                  >
                    {error}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="grid gap-2 text-sm">
                <li className="rounded-xl bg-surface-soft p-3">
                  ✓ AZ ölkə prefiksi
                </li>
                <li className="rounded-xl bg-surface-soft p-3">
                  ✓ 28 simvol və iki rəqəmli check digit
                </li>
                <li className="rounded-xl bg-surface-soft p-3">
                  ✓ 4 hərfli bank kodu + 20 alfanumerik hesab hissəsi
                </li>
                <li className="rounded-xl bg-surface-soft p-3">
                  ✓ ISO IBAN MOD-97
                </li>
              </ul>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-surface-soft p-5 text-center text-sm text-muted">
            IBAN daxil etdikcə bütün format və MOD-97 addımları ayrıca
            yoxlanacaq.
          </p>
        )}
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Yoxlamadan keçmək yalnız format və checksum uyğunluğunu təsdiqləyir.
          Bu alət hesabın mövcudluğunu, bankda aktiv olmasını və ya hesab
          sahibini müəyyən etmir.
        </p>
      </ToolCard>
    </div>
  );
}
