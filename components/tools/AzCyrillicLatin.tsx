"use client";

import { ArrowLeftRight, Copy, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  detectAzerbaijaniAlphabet,
  transliterateAzerbaijani,
  type AzerbaijaniAlphabetDirection,
} from "@/lib/az-cyrillic-latin";
import { copyText } from "@/lib/browser/download";
import {
  inputClass,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  textareaClass,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

type DirectionChoice = "auto" | AzerbaijaniAlphabetDirection;

export function AzCyrillicLatin() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<DirectionChoice>("auto");
  const actualDirection =
    direction === "auto" ? detectAzerbaijaniAlphabet(input) : direction;
  const output = useMemo(
    () => transliterateAzerbaijani(input, actualDirection),
    [actualDirection, input],
  );

  function swap() {
    setInput(output);
    setDirection(
      actualDirection === "cyrillic-to-latin"
        ? "latin-to-cyrillic"
        : "cyrillic-to-latin",
    );
  }

  return (
    <div className="grid gap-5">
      <ToolCard>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-64 flex-1 text-sm font-semibold">
            İstiqamət
            <select
              className={`${inputClass} mt-2`}
              value={direction}
              onChange={(event) =>
                setDirection(event.target.value as DirectionChoice)
              }
            >
              <option value="auto">Avtomatik aşkar et</option>
              <option value="cyrillic-to-latin">Kiril → Latın</option>
              <option value="latin-to-cyrillic">Latın → Kiril</option>
            </select>
          </label>
          <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-strong">
            Hazırkı istiqamət:{" "}
            {actualDirection === "cyrillic-to-latin"
              ? "Kiril → Latın"
              : "Latın → Kiril"}
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="text-sm font-semibold">
            Mənbə mətn
            <textarea
              className={`${textareaClass} mt-2 min-h-72`}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Азәрбајҹан və ya Azərbaycan"
              autoFocus
            />
          </label>
          <label className="text-sm font-semibold">
            Nəticə
            <textarea
              className={`${textareaClass} mt-2 min-h-72 bg-surface-soft`}
              value={output}
              readOnly
              placeholder="Nəticə burada görünəcək"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => copyText(output)}
            disabled={!output}
          >
            <Copy size={16} />
            Nəticəni kopyala
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={swap}
            disabled={!input}
          >
            <ArrowLeftRight size={16} />
            Dəyiş və çevir
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
      <p className="rounded-xl border border-line bg-white/90 p-4 text-sm leading-6 text-muted">
        Bu alət transliterasiya edir, tərcümə etmir. Böyük/kiçik hərflər,
        rəqəmlər, durğu işarələri, sətirlər və abzaslar qorunur. Xəritədə
        olmayan Kiril simvolları səssizcə silinmir, olduğu kimi saxlanılır.
      </p>
    </div>
  );
}
