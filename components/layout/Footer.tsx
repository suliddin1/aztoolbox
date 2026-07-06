import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 text-sm text-muted sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-base font-semibold text-foreground">AzToolbox</p>
          <p className="mt-2 max-w-xl leading-6">
            AzToolbox — Azərbaycan üçün pulsuz mini alətlər.
          </p>
          <p className="mt-3 rounded-md border border-line bg-surface-soft px-3 py-2 text-xs">
            Fayllar mümkün olduğu qədər brauzerinizdə emal olunur.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Link className="transition hover:text-foreground" href="/tools">
            Alətlər
          </Link>
          <Link className="transition hover:text-foreground" href="/about">
            Haqqında
          </Link>
          <Link className="transition hover:text-foreground" href="/privacy">
            Məxfilik
          </Link>
          <Link className="transition hover:text-foreground" href="/feedback">
            Feedback
          </Link>
        </div>
      </div>
    </footer>
  );
}
