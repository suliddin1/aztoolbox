export type TimestampUnit = "seconds" | "milliseconds";

export function detectTimestampUnit(value: number): TimestampUnit {
  return Math.abs(value) < 100_000_000_000 ? "seconds" : "milliseconds";
}

export function timestampToDate(
  value: string | number,
  unit: TimestampUnit | "auto" = "auto",
) {
  const numeric = typeof value === "number" ? value : Number(value.trim());
  if (!Number.isFinite(numeric))
    throw new Error("Etibarlı Unix timestamp daxil edin.");
  const detectedUnit = unit === "auto" ? detectTimestampUnit(numeric) : unit;
  const milliseconds = detectedUnit === "seconds" ? numeric * 1_000 : numeric;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime()))
    throw new Error("Tarix brauzerin dəstəklədiyi aralıqdan kənardadır.");
  return { date, unit: detectedUnit };
}

export function formatRelativeTime(date: Date, now = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1_000);
  const absolute = Math.abs(seconds);
  const formatter = new Intl.RelativeTimeFormat("az", { numeric: "auto" });
  if (absolute < 60) return formatter.format(seconds, "second");
  if (absolute < 3_600)
    return formatter.format(Math.round(seconds / 60), "minute");
  if (absolute < 86_400)
    return formatter.format(Math.round(seconds / 3_600), "hour");
  if (absolute < 2_592_000)
    return formatter.format(Math.round(seconds / 86_400), "day");
  if (absolute < 31_536_000)
    return formatter.format(Math.round(seconds / 2_592_000), "month");
  return formatter.format(Math.round(seconds / 31_536_000), "year");
}

export function dateToTimestamps(date: Date) {
  const milliseconds = date.getTime();
  if (Number.isNaN(milliseconds)) throw new Error("Tarix düzgün deyil.");
  return { milliseconds, seconds: Math.floor(milliseconds / 1_000) };
}
