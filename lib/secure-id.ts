export function uuidV4FromBytes(source: Uint8Array) {
  if (source.length < 16)
    throw new Error("UUID üçün ən azı 16 təsadüfi bayt lazımdır.");
  const bytes = source.slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

export function generateUuidV4(forceFallback = false) {
  if (!forceFallback && typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return uuidV4FromBytes(bytes);
}

export function secureRandomId(length: number, alphabet: string) {
  if (!Number.isInteger(length) || length < 1 || length > 4_096) {
    throw new Error("Uzunluq 1–4096 aralığında tam ədəd olmalıdır.");
  }
  const uniqueAlphabet = [...new Set(alphabet)].join("");
  if (uniqueAlphabet.length < 2 || uniqueAlphabet.length > 256) {
    throw new Error(
      "Simvol dəsti ən azı 2, ən çoxu 256 fərqli simvol saxlamalıdır.",
    );
  }
  const limit = Math.floor(256 / uniqueAlphabet.length) * uniqueAlphabet.length;
  let result = "";
  const buffer = new Uint8Array(Math.max(32, Math.min(4_096, length * 2)));
  while (result.length < length) {
    crypto.getRandomValues(buffer);
    for (const byte of buffer) {
      if (byte < limit) result += uniqueAlphabet[byte % uniqueAlphabet.length];
      if (result.length === length) break;
    }
  }
  return result;
}
