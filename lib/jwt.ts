import { base64ToText } from "@/lib/base64";

export type JwtSection = Record<string, unknown>;

export type DecodedJwt = {
  header: JwtSection;
  payload: JwtSection;
  signature: string;
  expired: boolean | null;
};

export function decodeJwt(token: string, now = Date.now()): DecodedJwt {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new Error("JWT üç nöqtə ilə ayrılmış hissədən ibarət olmalıdır.");
  }
  try {
    const header = JSON.parse(base64ToText(parts[0], true)) as unknown;
    const payload = JSON.parse(base64ToText(parts[1], true)) as unknown;
    if (!header || typeof header !== "object" || Array.isArray(header))
      throw new Error();
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      throw new Error();
    const exp = (payload as JwtSection).exp;
    const expired = typeof exp === "number" ? exp * 1_000 <= now : null;
    return {
      header: header as JwtSection,
      payload: payload as JwtSection,
      signature: parts[2],
      expired,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Base64"))
      throw error;
    throw new Error("JWT header və ya payload hissəsi etibarlı JSON deyil.");
  }
}

export function formatJwtTimestamp(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const date = new Date(value * 1_000);
  if (Number.isNaN(date.getTime())) return null;
  return {
    local: date.toLocaleString("az-AZ"),
    utc: date.toUTCString(),
    iso: date.toISOString(),
  };
}
