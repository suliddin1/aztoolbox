"use client";

import { useEffect } from "react";
import { addRecentTool } from "@/lib/tool-storage";
import type { ToolSlug } from "@/lib/tools";

export function RecentToolTracker({ slug }: { slug: ToolSlug }) {
  useEffect(() => {
    addRecentTool(slug);
  }, [slug]);

  return null;
}
