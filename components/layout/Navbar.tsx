import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-white/58 backdrop-blur-xl">
      <nav className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-normal">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white shadow-sm">
            Az
          </span>
          AzToolbox
        </Link>
        <div className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap text-sm font-medium text-muted sm:gap-2">
          <Link className="rounded-full px-3 py-2 transition hover:bg-surface hover:text-foreground" href="/tools">
            Bütün alətlər
          </Link>
          <Link className="rounded-full px-3 py-2 transition hover:bg-surface hover:text-foreground" href="/about">
            Haqqında
          </Link>
          <Link className="rounded-full px-3 py-2 transition hover:bg-surface hover:text-foreground" href="/privacy">
            Məxfilik
          </Link>
          <Link className="rounded-full px-3 py-2 transition hover:bg-surface hover:text-foreground" href="/feedback">
            Feedback
          </Link>
        </div>
      </nav>
    </header>
  );
}
