import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white/42">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 text-sm text-muted sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8">
        <div>
          <p className="text-base font-bold text-foreground">AzToolbox</p>
          <p className="mt-2 max-w-xl leading-6">
            AzToolbox - Azərbaycan üçün pulsuz, sürətli və brauzer əsaslı mini alətlər.
          </p>
          <p className="mt-3 inline-flex rounded-full border border-line bg-surface-soft px-3 py-2 text-xs">
            Fayllar mümkün olduğu qədər brauzerinizdə emal olunur.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link className="rounded-full px-3 py-2 transition hover:bg-surface-soft hover:text-foreground" href="/tools">
            Alətlər
          </Link>
          <Link className="rounded-full px-3 py-2 transition hover:bg-surface-soft hover:text-foreground" href="/about">
            Haqqında
          </Link>
          <Link className="rounded-full px-3 py-2 transition hover:bg-surface-soft hover:text-foreground" href="/privacy">
            Məxfilik
          </Link>
          <Link className="rounded-full px-3 py-2 transition hover:bg-surface-soft hover:text-foreground" href="/feedback">
            Feedback
          </Link>
        </div>
      </div>
    </footer>
  );
}
