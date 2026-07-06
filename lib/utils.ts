export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatMoney(value: number, currency = "AZN") {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(2)} ${currency}`;
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
