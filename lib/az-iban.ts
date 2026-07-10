export type IbanValidation = {
  normalized: string;
  formatted: string;
  valid: boolean;
  errors: string[];
};

export function normalizeIban(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function formatIban(value: string) {
  return normalizeIban(value).replace(/(.{4})(?=.)/g, "$1 ");
}

export function ibanMod97(iban: string) {
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;
  for (const character of rearranged) {
    const digits = /[A-Z]/.test(character)
      ? String(character.charCodeAt(0) - 55)
      : character;
    if (!/^\d+$/.test(digits)) return -1;
    for (const digit of digits)
      remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder;
}

export function validateAzerbaijaniIban(value: string): IbanValidation {
  const normalized = normalizeIban(value);
  const errors: string[] = [];
  if (!normalized) errors.push("IBAN daxil edilməyib.");
  if (normalized && !normalized.startsWith("AZ"))
    errors.push("Ölkə prefiksi “AZ” olmalıdır.");
  if (normalized.length !== 28)
    errors.push("Azərbaycan IBAN-ı düz 28 simvoldan ibarət olmalıdır.");
  if (normalized.length >= 4 && !/^\d{2}$/.test(normalized.slice(2, 4))) {
    errors.push("AZ-dan sonrakı iki yoxlama simvolu rəqəm olmalıdır.");
  }
  if (normalized.length >= 8 && !/^[A-Z]{4}$/.test(normalized.slice(4, 8))) {
    errors.push("Bank kodu dörd latın hərfindən ibarət olmalıdır.");
  }
  if (normalized.length >= 8 && !/^[A-Z0-9]{20}$/.test(normalized.slice(8))) {
    errors.push(
      "Hesab hissəsi iyirmi hərf-rəqəm simvolundan ibarət olmalıdır.",
    );
  }
  if (
    /^AZ\d{2}[A-Z]{4}[A-Z0-9]{20}$/.test(normalized) &&
    ibanMod97(normalized) !== 1
  ) {
    errors.push("MOD-97 yoxlama cəmi uyğun gəlmir.");
  }
  return {
    normalized,
    formatted: formatIban(normalized),
    valid: errors.length === 0,
    errors,
  };
}
