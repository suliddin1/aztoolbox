const CHUNK_SIZE = 0x8000;

export function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    const end = Math.min(offset + CHUNK_SIZE, bytes.length);
    for (let index = offset; index < end; index += 1)
      binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

export function toBase64Url(value: string) {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function normalizeBase64(value: string, urlSafe = false) {
  let normalized = value.trim().replace(/\s+/g, "");
  if (urlSafe || /[-_]/.test(normalized))
    normalized = normalized.replace(/-/g, "+").replace(/_/g, "/");
  if (
    !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) ||
    normalized.length % 4 === 1
  ) {
    throw new Error("Base64 mətni düzgün formatda deyil.");
  }
  normalized = normalized.replace(/=+$/, "");
  return normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
}

export function base64ToBytes(value: string, urlSafe = false) {
  const normalized = normalizeBase64(value, urlSafe);
  let binary: string;
  try {
    binary = atob(normalized);
  } catch {
    throw new Error("Base64 mətni decode edilə bilmədi.");
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function textToBase64(value: string, urlSafe = false) {
  const encoded = bytesToBase64(new TextEncoder().encode(value));
  return urlSafe ? toBase64Url(encoded) : encoded;
}

export function base64ToText(value: string, urlSafe = false) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      base64ToBytes(value, urlSafe),
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Base64"))
      throw error;
    throw new Error("Nəticə etibarlı UTF-8 mətni deyil.");
  }
}

export function parseDataUrl(value: string) {
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,([\s\S]+)$/i.exec(
    value.trim(),
  );
  if (!match)
    throw new Error("Data URL düzgün deyil və ya Base64 formatında deyil.");
  return { mimeType: match[1] || "application/octet-stream", data: match[2] };
}
