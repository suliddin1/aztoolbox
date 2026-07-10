import { tools, type Tool, type ToolSlug } from "@/lib/tools";

export const favoritesStorageKey = "aztoolbox:favorites";
export const recentToolsStorageKey = "aztoolbox:recent-tools";
export const toolStorageEventName = "aztoolbox-tool-storage";

export function isToolSlug(value: string): value is ToolSlug {
  return tools.some((tool) => tool.slug === value);
}

export function toolsFromSlugs(slugs: ToolSlug[]) {
  return slugs
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is Tool => Boolean(tool));
}

export function readToolSlugs(key: string): ToolSlug[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (value): value is ToolSlug =>
        typeof value === "string" && isToolSlug(value),
    );
  } catch {
    return [];
  }
}

export function writeToolSlugs(key: string, slugs: ToolSlug[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(slugs));
  window.dispatchEvent(new Event(toolStorageEventName));
}

export function addRecentTool(slug: ToolSlug) {
  const next = [
    slug,
    ...readToolSlugs(recentToolsStorageKey).filter((item) => item !== slug),
  ].slice(0, 6);
  writeToolSlugs(recentToolsStorageKey, next);
}
