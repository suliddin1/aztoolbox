export type QueryEntry = { id: string; key: string; value: string };

export type ParsedUrl = {
  protocol: string;
  hostname: string;
  port: string;
  path: string;
  hash: string;
  entries: Array<Omit<QueryEntry, "id">>;
};

export function parseCompleteUrl(value: string): ParsedUrl {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(
      "Tam və etibarlı URL daxil edin (məsələn, https://example.com/path).",
    );
  }
  return {
    protocol: url.protocol.replace(/:$/, ""),
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    hash: url.hash.replace(/^#/, ""),
    entries: [...url.searchParams.entries()].map(([key, item]) => ({
      key,
      value: item,
    })),
  };
}

export function rebuildUrl(
  base: string,
  entries: Array<Pick<QueryEntry, "key" | "value">>,
) {
  let url: URL;
  try {
    url = new URL(base.trim());
  } catch {
    throw new Error("URL yenidən qurula bilmədi: əsas URL düzgün deyil.");
  }
  url.search = "";
  for (const entry of entries) {
    if (entry.key) url.searchParams.append(entry.key, entry.value);
  }
  return url.toString();
}

export function decodeUrlComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error("Mətn etibarlı percent-encoded URL komponenti deyil.");
  }
}
