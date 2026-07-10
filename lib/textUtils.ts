export type TextCleanOptions = {
  trimExtraSpaces: boolean;
  removeEmptyLines: boolean;
  fixLineEndings: boolean;
  lowercase: boolean;
  uppercase: boolean;
  sentenceCase: boolean;
  titleCase: boolean;
  normalizeQuotes: boolean;
};

const sentenceStart = /(^|[.!?]\s+)([\p{L}])/gu;

export function normalizeQuoteCharacters(value: string) {
  return value.replace(/[“”„]/g, '"').replace(/[‘’‚`´]/g, "'");
}

export function removeExtraSpaces(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");
}

export function removeEmptyLines(value: string) {
  return value
    .split("\n")
    .filter((line) => line.trim())
    .join("\n");
}

export function fixLineEndings(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n");
}

export function toSentenceCase(value: string) {
  const lower = value.toLocaleLowerCase("az-AZ");
  return lower.replace(
    sentenceStart,
    (match, prefix: string, letter: string) => {
      return `${prefix}${letter.toLocaleUpperCase("az-AZ")}`;
    },
  );
}

export function toTitleCase(value: string) {
  return value
    .toLocaleLowerCase("az-AZ")
    .replace(
      /(^|[\s\-–—/])([\p{L}])/gu,
      (match, prefix: string, letter: string) => {
        return `${prefix}${letter.toLocaleUpperCase("az-AZ")}`;
      },
    );
}

export function cleanText(value: string, options: TextCleanOptions) {
  let result = value;

  if (options.fixLineEndings) {
    result = fixLineEndings(result);
  }
  if (options.normalizeQuotes) {
    result = normalizeQuoteCharacters(result);
  }
  if (options.trimExtraSpaces) {
    result = removeExtraSpaces(result);
  }
  if (options.removeEmptyLines) {
    result = removeEmptyLines(result);
  }
  if (options.lowercase) {
    result = result.toLocaleLowerCase("az-AZ");
  }
  if (options.uppercase) {
    result = result.toLocaleUpperCase("az-AZ");
  }
  if (options.sentenceCase) {
    result = toSentenceCase(result);
  }
  if (options.titleCase) {
    result = toTitleCase(result);
  }

  return result;
}

export function getTextStats(value: string) {
  const trimmed = value.trim();
  const words = trimmed.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?/gu) ?? [];
  const sentences =
    trimmed
      .match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/gu)
      ?.filter((item) => item.trim()) ?? [];
  const paragraphs = trimmed
    ? trimmed.split(/\n{2,}/).filter((paragraph) => paragraph.trim()).length
    : 0;

  return {
    characters: value.length,
    charactersNoSpaces: value.replace(/\s/g, "").length,
    words: words.length,
    sentences: sentences.length,
    paragraphs,
    readingMinutes:
      words.length === 0 ? 0 : Math.max(1, Math.ceil(words.length / 200)),
  };
}
