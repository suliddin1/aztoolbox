import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/88 backdrop-blur">
      <nav className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-normal">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-sm font-bold text-white">
            Az
          </span>
          AzToolbox
        </Link>
        <div className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap text-sm font-medium text-muted sm:gap-2">
          <Link className="rounded-md px-3 py-2 transition hover:bg-surface hover:text-foreground" href="/tools">
            Alətlər
          </Link>
          <Link className="rounded-md px-3 py-2 transition hover:bg-surface hover:text-foreground" href="/about">
            Haqqında
          </Link>
          <Link className="rounded-md px-3 py-2 transition hover:bg-surface hover:text-foreground" href="/privacy">
            Məxfilik
          </Link>
          <Link className="rounded-md px-3 py-2 transition hover:bg-surface hover:text-foreground" href="/feedback">
            Feedback
          </Link>
        </div>
      </nav>
    </header>
  );
}
