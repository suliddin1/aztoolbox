import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import type { Tool } from "@/lib/tools";

export function ToolCard({
  tool,
  compact = false,
}: {
  tool: Tool;
  compact?: boolean;
}) {
  const Icon = tool.icon;

  return (
    <article className="group flex min-h-52 flex-col rounded-2xl border border-line bg-white/88 p-5 shadow-sm shadow-slate-200/50 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/45 hover:bg-white hover:shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon size={19} />
        </div>
        <div className="flex items-center gap-2">
          {!compact ? (
            <span className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-muted">
              {tool.category}
            </span>
          ) : null}
          <FavoriteButton slug={tool.slug} />
        </div>
      </div>
      <h3 className="mt-5 text-lg font-bold">{tool.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">
        {tool.description}
      </p>
      <Link
        href={tool.href}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface-soft px-4 text-sm font-semibold text-foreground transition-all duration-200 ease-out group-hover:border-accent/45 group-hover:bg-accent group-hover:text-white"
      >
        Aç
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}
