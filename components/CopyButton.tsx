"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
  disabled?: boolean;
};

export function CopyButton({
  value,
  label = "Kopyala",
  disabled,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value || disabled) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value || disabled}
      aria-live="polite"
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent-strong disabled:opacity-50"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "Kopyalandı" : label}
    </button>
  );
}
