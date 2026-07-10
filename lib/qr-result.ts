export type QrResultType =
  "url" | "wifi" | "email" | "phone" | "sms" | "vcard" | "text";

export type QrResult = {
  type: QrResultType;
  label: string;
  value: string;
  safeUrl?: string;
};

export function detectQrResult(value: string): QrResult {
  const trimmed = value.trim();
  if (/^WIFI:/i.test(trimmed))
    return { type: "wifi", label: "Wi-Fi konfiqurasiyası", value };
  if (/^BEGIN:VCARD/i.test(trimmed))
    return { type: "vcard", label: "vCard kontaktı", value };
  if (/^mailto:/i.test(trimmed))
    return { type: "email", label: "E-poçt", value, safeUrl: trimmed };
  if (/^tel:/i.test(trimmed))
    return { type: "phone", label: "Telefon nömrəsi", value, safeUrl: trimmed };
  if (/^sms:/i.test(trimmed))
    return { type: "sms", label: "SMS", value, safeUrl: trimmed };
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return { type: "url", label: "URL", value, safeUrl: url.toString() };
    }
  } catch {
    // Plain text is expected for many QR codes.
  }
  return { type: "text", label: "Adi mətn", value };
}
