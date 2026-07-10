import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { tools } from "@/lib/tools";

const staticRoutes = ["/", "/tools", "/about", "/privacy", "/feedback"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route),
      lastModified,
      changeFrequency:
        route === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "/" ? 1 : 0.8,
    })),
    ...tools.map((tool) => ({
      url: absoluteUrl(tool.href),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: tool.isFeatured || tool.isPopular ? 0.8 : 0.7,
    })),
  ];
}
