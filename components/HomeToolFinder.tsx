"use client";

import Link from "next/link";
import { ArrowRight, Command, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { tools } from "@/lib/tools";

const quickTools = [
  "pdf-tools",
  "image-compressor",
  "az-keyboard-fixer",
  "invoice-generator",
];

export function HomeToolFinder() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return tools.filter((tool) => quickTools.includes(tool.slug));
    }

    return tools.filter((tool) => {
      const searchable =
        `${tool.title} ${tool.description} ${tool.category} ${tool.slug}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="rounded-lg border border-line bg-surface p-2 shadow-[0_24px_80px_rgba(23,33,29,0.08)]">
      <div className="flex items-center gap-3 border-b border-line px-3 py-3">
        <Search className="text-muted" size={19} />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Alət axtar: PDF, şəkil, QR, mətn..."
          aria-label="Alət axtar"
          className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted"
        />
        <span className="hidden items-center gap-1 rounded-md border border-line bg-surface-soft px-2 py-1 font-mono text-[11px] text-muted sm:inline-flex">
          <Command size={12} /> K
        </span>
      </div>

      <div className="grid gap-1 p-2">
        {results.length ? (
          results.slice(0, 6).map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-md px-3 py-3 transition hover:bg-surface-soft"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-accent-strong">
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {tool.title}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {tool.category}
                  </span>
                </span>
                <ArrowRight
                  className="text-muted transition group-hover:translate-x-0.5 group-hover:text-accent-strong"
                  size={17}
                />
              </Link>
            );
          })
        ) : (
          <p className="px-3 py-8 text-center text-sm text-muted">
            Bu axtarışa uyğun alət tapılmadı.
          </p>
        )}
      </div>
    </div>
  );
}
