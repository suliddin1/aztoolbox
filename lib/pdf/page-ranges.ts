export type PageRangeResult =
  { pages: number[]; error: null } | { pages: []; error: string };

export function parsePageRanges(
  input: string,
  totalPages: number,
): PageRangeResult {
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    return { pages: [], error: "PDF-də səhifə yoxdur." };
  }

  const value = input.trim();
  if (!value) {
    return {
      pages: Array.from({ length: totalPages }, (_, index) => index + 1),
      error: null,
    };
  }

  const selected = new Set<number>();
  const parts = value.split(",").map((part) => part.trim());

  for (const part of parts) {
    if (!part) {
      return { pages: [], error: "Səhifə aralığında boş hissə var." };
    }

    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!match) {
      return {
        pages: [],
        error: `“${part}” düzgün aralıq deyil. Nümunə: 1-3, 5, 8-10.`,
      };
    }

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;

    if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
      return {
        pages: [],
        error: `Səhifə nömrələri 1–${totalPages} aralığında olmalıdır.`,
      };
    }
    if (start > end) {
      return {
        pages: [],
        error: `“${part}” aralığında başlanğıc sondan böyükdür.`,
      };
    }

    for (let page = start; page <= end; page += 1) selected.add(page);
  }

  return { pages: [...selected].sort((a, b) => a - b), error: null };
}
