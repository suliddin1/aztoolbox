"use client";

import { Star } from "lucide-react";
import type { MouseEvent } from "react";
import { favoritesStorageKey } from "@/lib/tool-storage";
import type { ToolSlug } from "@/lib/tools";
import { useToolSlugs } from "@/components/useToolSlugs";

export function FavoriteButton({ slug }: { slug: ToolSlug }) {
  const [favorites, setFavorites] = useToolSlugs(favoritesStorageKey);
  const isFavorite = favorites.includes(slug);

  function toggleFavorite(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    setFavorites(
      isFavorite
        ? favorites.filter((favorite) => favorite !== slug)
        : [slug, ...favorites],
    );
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-label={isFavorite ? "Favoritlərdən çıxar" : "Favoritlərə əlavə et"}
      aria-pressed={isFavorite}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
        isFavorite
          ? "border-accent/35 bg-accent-soft text-accent"
          : "border-line bg-white text-muted hover:border-accent/45 hover:text-accent"
      }`}
    >
      <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
}
