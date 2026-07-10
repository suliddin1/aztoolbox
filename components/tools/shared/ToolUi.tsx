import { FileUp, ShieldCheck } from "lucide-react";
import type { ChangeEvent, ReactNode, RefObject } from "react";

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-55";
export const textareaClass =
  "min-h-40 w-full resize-y rounded-xl border border-line bg-white p-3 font-mono text-sm leading-6 outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-55";
export const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55";
export const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-55";

export function ToolCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-white/92 p-4 shadow-sm sm:p-5 ${className}`}
    >
      {title ? <h2 className="mb-4 text-lg font-bold">{title}</h2> : null}
      {children}
    </section>
  );
}

export function FilePicker({
  inputRef,
  accept,
  title,
  hint,
  onChange,
  multiple = false,
}: {
  inputRef?: RefObject<HTMLInputElement | null>;
  accept: string;
  title: string;
  hint: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
}) {
  return (
    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-soft p-5 text-center transition hover:border-accent focus-within:border-accent">
      <FileUp className="mb-3 text-accent" size={28} aria-hidden="true" />
      <span className="font-semibold">{title}</span>
      <span className="mt-1 text-sm leading-6 text-muted">{hint}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={onChange}
      />
    </label>
  );
}

export function PrivacyNotice() {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-accent/20 bg-accent-soft p-3 text-sm leading-6 text-accent-strong">
      <ShieldCheck className="mt-0.5 shrink-0" size={17} aria-hidden="true" />
      Məlumatlarınız cihazınızda emal olunur və serverə göndərilmir.
    </p>
  );
}

export function StatusMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (error)
    return (
      <p
        role="alert"
        className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-danger"
      >
        {error}
      </p>
    );
  if (success)
    return (
      <p
        role="status"
        className="mt-3 rounded-xl bg-accent-soft p-3 text-sm text-accent-strong"
      >
        {success}
      </p>
    );
  return null;
}

export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const normalized = Math.max(0, Math.min(100, value));
  return (
    <div className="mt-4" aria-live="polite">
      <div className="mb-2 flex justify-between gap-3 text-sm text-muted">
        <span>{label}</span>
        <span>{Math.round(normalized)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-soft">
        <div
          className="h-full rounded-full bg-accent transition-[width] motion-reduce:transition-none"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}
