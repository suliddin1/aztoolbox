"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolCard } from "@/components/ToolCard";
import { ToolListItem } from "@/components/ToolListItem";
import {
  searchTools,
  toolCategories,
  tools,
  type Tool,
  type ToolCategory,
  type ToolSlug,
} from "@/lib/tools";

type CategoryFilter = "Hamısı" | ToolCategory;

const featuredOrder: ToolSlug[] = [
  "pdf-tools",
  "image-tools",
  "az-keyboard-fixer",
  "whatsapp-link-generator",
  "invoice-generator",
  "linkedin-headline-generator",
];

function toolsByOrder(slugs: ToolSlug[]) {
  return slugs
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is Tool => Boolean(tool));
}

export function ToolsIndex() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("Hamısı");

  const featuredTools = useMemo(() => toolsByOrder(featuredOrder), []);
  const visibleTools = useMemo(() => {
    const categoryTools =
      activeCategory === "Hamısı"
        ? tools
        : tools.filter((tool) => tool.category === activeCategory);

    return searchTools(query, categoryTools);
  }, [activeCategory, query]);

  const groupedTools = useMemo(() => {
    return toolCategories
      .map((category) => ({
        category,
        tools: visibleTools.filter((tool) => tool.category === category),
      }))
      .filter((group) => group.tools.length > 0);
  }, [visibleTools]);

  return (
    <div className="grid gap-10">
      <section className="rounded-lg border border-line bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3 rounded-md border border-line bg-surface-soft px-3 py-3">
          <Search className="text-muted" size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Alət axtar: PDF, CV, WhatsApp, QR, şəkil..."
            aria-label="Alət axtar"
            className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["Hamısı", ...toolCategories] as CategoryFilter[]).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                activeCategory === category
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-line bg-white text-muted hover:border-accent hover:text-accent-strong"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-sm font-semibold text-accent-strong">Seçilmiş</p>
          <h2 className="mt-2 text-2xl font-semibold">Önə çıxan alətlər</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-accent-strong">Kataloq</p>
            <h2 className="mt-2 text-2xl font-semibold">Bütün alətlər</h2>
          </div>
          <p className="text-sm text-muted">{visibleTools.length} alət</p>
        </div>

        {groupedTools.length ? (
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
        ) : (
          <p className="rounded-lg border border-line bg-surface p-6 text-sm text-muted shadow-sm">
            Bu filtrə uyğun alət tapılmadı.
          </p>
        )}
      </section>
    </div>
  );
}
