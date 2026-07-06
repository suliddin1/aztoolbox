"use client";

import { useEffect, useState } from "react";
import {
  readToolSlugs,
  toolStorageEventName,
  writeToolSlugs,
} from "@/lib/tool-storage";
import type { ToolSlug } from "@/lib/tools";

export function useToolSlugs(key: string) {
  const [slugs, setSlugs] = useState<ToolSlug[]>([]);

  useEffect(() => {
    function sync() {
      setSlugs(readToolSlugs(key));
    }

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(toolStorageEventName, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(toolStorageEventName, sync);
    };
  }, [key]);

  function save(nextSlugs: ToolSlug[]) {
    setSlugs(nextSlugs);
    writeToolSlugs(key, nextSlugs);
  }

  return [slugs, save] as const;
}
