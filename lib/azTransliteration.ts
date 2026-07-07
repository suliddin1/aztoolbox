const replacements: Record<string, string> = {
  men: "mən",
  sen: "sən",
  cox: "çox",
  chox: "çox",
  sag: "sağ",
  sagol: "sağ ol",
  yaxsi: "yaxşı",
  yaxsiyam: "yaxşıyam",
  necesen: "necəsən",
  necesiz: "necəsiz",
  bugun: "bugün",
  ucun: "üçün",
  yaziram: "yazıram",
  gedirem: "gedirəm",
  gelirem: "gəlirəm",
  dusunurem: "düşünürəm",
  azerbaycan: "Azərbaycan",
  telebe: "tələbə",
  telebeler: "tələbələr",
  muellim: "müəllim",
  komek: "kömək",
  is: "iş",
  ish: "iş",
  isi: "işi",
  isler: "işlər",
  layihe: "layihə",
  layiheler: "layihələr",
  universitet: "universitet",
  olacam: "olacam",
};

function preserveCapitalization(source: string, target: string) {
  if (source === source.toLocaleUpperCase("az")) {
    return target.toLocaleUpperCase("az");
  }

  if (source[0] === source[0]?.toLocaleUpperCase("az")) {
    return target.charAt(0).toLocaleUpperCase("az") + target.slice(1);
  }

  return target;
}

export function fixAzerbaijaniTransliteration(input: string) {
  return input.replace(/[A-Za-zƏəÖöÜüĞğÇçŞşİı]+/g, (word) => {
    const key = word.toLocaleLowerCase("az");
    const replacement = replacements[key];

    if (!replacement) {
      return word;
    }

    return preserveCapitalization(word, replacement);
  });
}

export const azTransliterationExamples = [
  "salam necesen",
  "men yaxsiyam",
  "cox sag ol",
  "Azerbaycan universitet telebesiyem",
  "men layiheler yaziram ve komek isteyirem",
].join("\n");
