export type AzerbaijaniAlphabetDirection =
  "cyrillic-to-latin" | "latin-to-cyrillic";

const pairs = [
  ["А", "A"],
  ["а", "a"],
  ["Б", "B"],
  ["б", "b"],
  ["В", "V"],
  ["в", "v"],
  ["Г", "Q"],
  ["г", "q"],
  ["Ғ", "Ğ"],
  ["ғ", "ğ"],
  ["Д", "D"],
  ["д", "d"],
  ["Е", "E"],
  ["е", "e"],
  ["Ә", "Ə"],
  ["ә", "ə"],
  ["Ж", "J"],
  ["ж", "j"],
  ["З", "Z"],
  ["з", "z"],
  ["И", "İ"],
  ["и", "i"],
  ["Ы", "I"],
  ["ы", "ı"],
  ["Ј", "Y"],
  ["ј", "y"],
  ["К", "K"],
  ["к", "k"],
  ["Ҝ", "G"],
  ["ҝ", "g"],
  ["Л", "L"],
  ["л", "l"],
  ["М", "M"],
  ["м", "m"],
  ["Н", "N"],
  ["н", "n"],
  ["О", "O"],
  ["о", "o"],
  ["Ө", "Ö"],
  ["ө", "ö"],
  ["П", "P"],
  ["п", "p"],
  ["Р", "R"],
  ["р", "r"],
  ["С", "S"],
  ["с", "s"],
  ["Т", "T"],
  ["т", "t"],
  ["У", "U"],
  ["у", "u"],
  ["Ү", "Ü"],
  ["ү", "ü"],
  ["Ф", "F"],
  ["ф", "f"],
  ["Х", "X"],
  ["х", "x"],
  ["Һ", "H"],
  ["һ", "h"],
  ["Ч", "Ç"],
  ["ч", "ç"],
  ["Ҹ", "C"],
  ["ҹ", "c"],
  ["Ш", "Ş"],
  ["ш", "ş"],
] as const;

const cyrillicToLatin = new Map<string, string>(pairs);
const latinToCyrillic = new Map<string, string>(
  pairs.map(([cyrillic, latin]) => [latin, cyrillic]),
);

export function detectAzerbaijaniAlphabet(
  input: string,
): AzerbaijaniAlphabetDirection {
  let cyrillic = 0;
  let latin = 0;
  for (const character of input) {
    if (cyrillicToLatin.has(character)) cyrillic += 1;
    if (latinToCyrillic.has(character)) latin += 1;
  }
  return cyrillic > latin ? "cyrillic-to-latin" : "latin-to-cyrillic";
}

export function transliterateAzerbaijani(
  input: string,
  direction: AzerbaijaniAlphabetDirection,
) {
  const map =
    direction === "cyrillic-to-latin" ? cyrillicToLatin : latinToCyrillic;
  return Array.from(input, (character) => map.get(character) ?? character).join(
    "",
  );
}
