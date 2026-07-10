export type JsonIndent = 2 | 4 | "tab";

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortValue(item)]),
    );
  }
  return value;
}

export function parseJsonWithLocation(input: string) {
  try {
    return { value: JSON.parse(input) as unknown, error: null };
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "JSON oxuna bilmədi.";
    const positionMatch = /position\s+(\d+)/i.exec(message);
    const position = positionMatch ? Number(positionMatch[1]) : null;
    if (position === null) return { value: null, error: message };
    const before = input.slice(0, position);
    const line = before.split("\n").length;
    const column = position - before.lastIndexOf("\n");
    return {
      value: null,
      error: `${message} (sətir ${line}, sütun ${column})`,
    };
  }
}

export function formatJson(
  input: string,
  options: { indent?: JsonIndent; minify?: boolean; sortKeys?: boolean } = {},
) {
  const parsed = parseJsonWithLocation(input);
  if (parsed.error) throw new Error(parsed.error);
  const value = options.sortKeys ? sortValue(parsed.value) : parsed.value;
  const spacing = options.minify
    ? undefined
    : options.indent === "tab"
      ? "\t"
      : (options.indent ?? 2);
  return JSON.stringify(value, null, spacing);
}
