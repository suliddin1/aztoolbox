const ones = [
  "",
  "bir",
  "iki",
  "üç",
  "dörd",
  "beş",
  "altı",
  "yeddi",
  "səkkiz",
  "doqquz",
];
const tens = [
  "",
  "on",
  "iyirmi",
  "otuz",
  "qırx",
  "əlli",
  "altmış",
  "yetmiş",
  "səksən",
  "doxsan",
];
const scales = ["", "min", "milyon", "milyard", "trilyon", "kvadrilyon"];
const ZERO = BigInt(0);
const ONE = BigInt(1);
const THOUSAND = BigInt(1_000);
const MAX_VALUE = BigInt("999999999999999999");

function groupToWords(value: number) {
  const parts: string[] = [];
  const hundred = Math.floor(value / 100);
  const remainder = value % 100;
  if (hundred) {
    if (hundred > 1) parts.push(ones[hundred]);
    parts.push("yüz");
  }
  const ten = Math.floor(remainder / 10);
  const one = remainder % 10;
  if (ten) parts.push(tens[ten]);
  if (one) parts.push(ones[one]);
  return parts.join(" ");
}

export function integerToAzerbaijani(value: bigint) {
  if (value === ZERO) return "sıfır";
  const negative = value < ZERO;
  let remaining = negative ? -value : value;
  if (remaining > MAX_VALUE) {
    throw new Error("Ədəd dəstəklənən kvadrilyon aralığını keçir.");
  }

  const groups: number[] = [];
  while (remaining > ZERO) {
    groups.push(Number(remaining % THOUSAND));
    remaining /= THOUSAND;
  }

  const result: string[] = [];
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index];
    if (!group) continue;
    if (index === 1 && group === 1) {
      result.push("min");
      continue;
    }
    const words = groupToWords(group);
    result.push(index ? `${words} ${scales[index]}` : words);
  }
  return `${negative ? "mənfi " : ""}${result.join(" ")}`;
}

export function parseIntegerInput(input: string) {
  const normalized = input.trim().replace(/[\s_']/g, "");
  if (!/^[+-]?\d+$/.test(normalized)) {
    throw new Error(
      "Tam ədəd daxil edin. Onluq hissə bu rejimdə qəbul edilmir.",
    );
  }
  const value = BigInt(normalized);
  if (value > MAX_VALUE || value < -MAX_VALUE) {
    throw new Error("Ədəd dəstəklənən kvadrilyon aralığını keçir.");
  }
  return {
    value,
    normalized: value.toString(),
    words: integerToAzerbaijani(value),
  };
}

function splitAmount(value: string) {
  const sign = value.startsWith("-") ? -1 : 1;
  const unsigned = value.replace(/^[+-]/, "");
  const comma = unsigned.lastIndexOf(",");
  const dot = unsigned.lastIndexOf(".");
  const separator = Math.max(comma, dot);
  if (separator < 0) return { sign, integer: unsigned, fraction: "" };
  const integer = unsigned.slice(0, separator).replace(/[.,]/g, "");
  const fraction = unsigned.slice(separator + 1);
  return { sign, integer, fraction };
}

export function parseAznAmount(input: string) {
  const compact = input.trim().replace(/[\s_']/g, "");
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[.,]\d+)*$/.test(compact)) {
    throw new Error("Məbləği rəqəmlə daxil edin. Məsələn: 123,45.");
  }
  const { sign, integer: integerPart, fraction } = splitAmount(compact);
  if (!/^\d*$/.test(integerPart) || !/^\d*$/.test(fraction)) {
    throw new Error("Məbləğin formatı düzgün deyil.");
  }

  let manat = BigInt(integerPart || "0");
  const padded = `${fraction}000`;
  let qepik = Number(padded.slice(0, 2));
  if (Number(padded[2]) >= 5) qepik += 1;
  if (qepik === 100) {
    manat += ONE;
    qepik = 0;
  }
  if (manat > MAX_VALUE) throw new Error("Məbləğ dəstəklənən aralığı keçir.");
  const isNegative = sign < 0 && (manat > ZERO || qepik > 0);
  const normalized = `${isNegative ? "-" : ""}${manat}.${String(qepik).padStart(2, "0")}`;
  const words = `${isNegative ? "mənfi " : ""}${integerToAzerbaijani(manat)} manat ${integerToAzerbaijani(BigInt(qepik))} qəpik`;
  return { manat, qepik, normalized, words };
}
