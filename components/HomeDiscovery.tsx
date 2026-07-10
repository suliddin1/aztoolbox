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
import { homeNewToolSlugs, isNewToolSlug } from "@/lib/tool-content";
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
  const favoriteTools = useMemo(
    () => toolsFromSlugs(favoriteSlugs),
    [favoriteSlugs],
  );
  const recentTools = useMemo(() => toolsFromSlugs(recentSlugs), [recentSlugs]);
  const featuredTools = useMemo(() => toolsByOrder(featuredOrder), []);
  const popularTools = useMemo(() => toolsByOrder(popularOrder), []);
  const newTools = useMemo(() => toolsByOrder([...homeNewToolSlugs]), []);
  const groupedTools = useMemo(
    () =>
      getToolsByCategory()
        .map((group) => ({
          ...group,
          tools: group.tools.filter((tool) => !isNewToolSlug(tool.slug)),
        }))
        .filter((group) => group.tools.length > 0),
    [],
  );

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
      <section className="mx-auto -mt-7 w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-white p-2 shadow-[0_18px_55px_rgba(15,23,42,0.10)] transition-all duration-200 ease-out focus-within:border-accent/40 focus-within:shadow-[0_22px_70px_rgba(11,111,232,0.12)]">
          <div className="flex items-center gap-3 px-3 py-3">
            <Search className="text-muted" size={20} />
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
            <div className="grid gap-2 border-t border-line p-3">
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
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

      <section
        id="tools"
        className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
      >
        <SectionHeader
          eyebrow="Yeni"
          title="Yeni əlavə olunan alətlər"
          description="PDF, QR, Azərbaycan dili və developer işləri üçün altı yeni lokal alət. Digər yeniliklər tam kataloqdadır."
          action={
            <Link
              href="/tools"
              className="text-sm font-semibold text-accent-strong hover:underline"
            >
              Bütün yeni alətlər
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {newTools.map((tool) => (
            <ToolListItem key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <SectionHeader
          eyebrow="Seçilmiş"
          title="Seçilmiş Alətlər"
          description="Azərbaycan dili, CV, karyera və gündəlik biznes işləri üçün ən vacib alətlər."
          action={
            <Link
              href="/tools"
              className="text-sm font-semibold text-accent-strong hover:underline"
            >
              Bütün alətlər
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="bg-transparent">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
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

      <section
        id="categories"
        className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
      >
        <SectionHeader
          eyebrow="Kateqoriyalar"
          title="Bütün alətlər"
          description="Alətləri iş tipinə görə seçin."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {groupedTools.map(({ category, tools: categoryTools }) => (
            <div
              key={category}
              className="rounded-2xl border border-line bg-white/82 p-5 shadow-sm shadow-slate-200/50"
            >
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
        <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl leading-7 text-muted">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
