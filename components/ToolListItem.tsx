import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import type { Tool } from "@/lib/tools";

export function ToolListItem({ tool }: { tool: Tool }) {
  const Icon = tool.icon;

  return (
    <div className="grid grid-cols-[2.5rem_1fr_auto_auto] items-center gap-3 rounded-2xl border border-line bg-white/82 px-3 py-3 shadow-sm shadow-slate-200/40 transition-all duration-200 ease-out hover:border-accent/45 hover:bg-white hover:shadow-[0_16px_38px_rgba(15,23,42,0.07)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{tool.title}</p>
        <p className="mt-1 text-xs leading-5 text-muted">{tool.description}</p>
      </div>
      <FavoriteButton slug={tool.slug} />
      <Link
        href={tool.href}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-muted transition-all duration-200 ease-out hover:border-accent/45 hover:bg-accent hover:text-white"
        aria-label={`${tool.title} aç`}
      >
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
