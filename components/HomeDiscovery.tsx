"use client";

import Link from "next/link";
import { Command, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolCard } from "@/components/ToolCard";
import { ToolListItem } from "@/components/ToolListItem";
import { useToolSlugs } from "@/components/useToolSlugs";
import {
  favoritesStorageKey,
  recentToolsStorageKey,
  toolsFromSlugs,
} from "@/lib/tool-storage";
import {
  getToolsByCategory,
  searchTools,
  tools,
  type Tool,
  type ToolSlug,
} from "@/lib/tools";

const featuredOrder: ToolSlug[] = [
  "az-keyboard-fixer",
  "image-tools",
  "pdf-tools",
  "whatsapp-link-generator",
  "invoice-generator",
  "linkedin-headline-generator",
];

const popularOrder: ToolSlug[] = [
  "pdf-tools",
  "image-tools",
  "qr-code-generator",
  "text-cleaner",
  "word-counter",
];

function toolsByOrder(slugs: ToolSlug[]) {
  return slugs
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is Tool => Boolean(tool));
}

export function HomeDiscovery() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [favoriteSlugs] = useToolSlugs(favoritesStorageKey);
  const [recentSlugs] = useToolSlugs(recentToolsStorageKey);

  const results = useMemo(() => searchTools(query), [query]);
  const favoriteTools = useMemo(() => toolsFromSlugs(favoriteSlugs), [favoriteSlugs]);
  const recentTools = useMemo(() => toolsFromSlugs(recentSlugs), [recentSlugs]);
  const featuredTools = useMemo(() => toolsByOrder(featuredOrder), []);
  const popularTools = useMemo(() => toolsByOrder(popularOrder), []);
  const groupedTools = useMemo(() => getToolsByCategory(), []);

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
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-lg border border-line focus-within:border-accent/40 bg-surface p-2 shadow-[0_24px_80px_rgba(23,33,29,0.08)] focus-within:shadow-[0_24px_80px_rgba(18,113,91,0.08)] transition-all duration-200 ease-out">
          <div className="flex items-center gap-3 border-b border-line px-3 py-3">
            <Search className="text-muted" size={19} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Alət axtar: PDF, CV, WhatsApp, QR, şəkil..."
              aria-label="Alət axtar"
              className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted"
            />
            <span className="hidden items-center gap-1 rounded-md border border-line bg-surface-soft px-2 py-1 font-mono text-[11px] text-muted sm:inline-flex">
              <Command size={12} /> K
            </span>
          </div>

          {query.trim() ? (
            <div className="grid gap-2 p-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <p className="text-sm font-semibold">Axtarış nəticələri</p>
                <p className="text-xs text-muted">{results.length} alət</p>
              </div>
              {results.length ? (
                <div className="grid gap-2 lg:grid-cols-2">
                  {results.map((tool) => (
                    <ToolListItem key={tool.slug} tool={tool} />
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-line bg-surface-soft p-4 text-sm text-muted">
                  Bu axtarışa uyğun alət tapılmadı.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {favoriteTools.length ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <SectionHeader
            eyebrow="Sənin seçimin"
            title="Favorit alətlər"
            description="Favorit etdiyin alətlər bu brauzerdə yadda qalır."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} compact />
            ))}
          </div>
        </section>
      ) : null}

      {recentTools.length ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <SectionHeader
            eyebrow="Lokal tarixçə"
            title="Son istifadə edilənlər"
            description="Açdığın son alətlər yalnız bu brauzerdə saxlanılır."
          />
          <div className="grid gap-2 lg:grid-cols-2">
            {recentTools.map((tool) => (
              <ToolListItem key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      ) : null}

      <section id="tools" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <SectionHeader
          eyebrow="Lokal və fokuslanmış"
          title="Önə çıxan lokal alətlər"
          description="Azərbaycan dili, CV, karyera və gündəlik biznes işləri üçün ən vacib alətlər."
          action={<Link href="/tools" className="text-sm font-semibold text-accent-strong hover:underline">Bütün alətlər</Link>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white/70">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <SectionHeader
            eyebrow="Praktik istifadə"
            title="Ən çox istifadə olunan alətlər"
            description="PDF, şəkil və QR kimi tez-tez lazım olan gündəlik işlər."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <SectionHeader
          eyebrow="Kateqoriyalar"
          title="Bütün alətlər"
          description="Alətləri iş tipinə görə seçin."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {groupedTools.map(({ category, tools: categoryTools }) => (
            <div key={category} className="rounded-lg border border-line bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{category}</h3>
                <span className="rounded-md border border-line bg-surface-soft px-2.5 py-1 text-xs font-medium text-muted">
                  {categoryTools.length} alət
                </span>
              </div>
              <div className="grid gap-2">
                {categoryTools.map((tool) => (
                  <ToolListItem key={tool.slug} tool={tool} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold text-accent-strong">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl leading-7 text-muted">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
