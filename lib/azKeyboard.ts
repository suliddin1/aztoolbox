type ReplacementRule = {
  from: string;
  to: string;
  onlyInsideWord?: boolean;
};

const rules: ReplacementRule[] = [
  { from: "'", to: "ə", onlyInsideWord: true },
  { from: '"', to: "Ə", onlyInsideWord: true },
  { from: ";", to: "ı" },
  { from: ":", to: "I" },
  { from: "[", to: "ü" },
  { from: "{", to: "Ü" },
  { from: "]", to: "ğ" },
  { from: "}", to: "Ğ" },
  { from: ",", to: "ö", onlyInsideWord: true },
  { from: "<", to: "Ö" },
  { from: ".", to: "ç", onlyInsideWord: true },
  { from: ">", to: "Ç" },
];

const wordLike = /[\p{L}\p{N}]/u;

function isWordBoundaryReplacement(input: string, index: number) {
  const previous = input[index - 1] ?? "";
  const next = input[index + 1] ?? "";
  return wordLike.test(previous) || wordLike.test(next);
}

export function fixAzerbaijaniKeyboard(input: string) {
  if (!input.trim()) {
    return "";
  }

  return Array.from(input)
    .map((char, index) => {
      const rule = rules.find((item) => item.from === char);
      if (!rule) {
        return char;
      }

      if (rule.onlyInsideWord && !isWordBoundaryReplacement(input, index)) {
        return char;
      }

      return rule.to;
    })
    .join("");
}
