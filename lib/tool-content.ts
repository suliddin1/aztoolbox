import type { ToolSlug } from "@/lib/tools";

export const newToolSlugs = [
  "pdf-to-image",
  "pdf-watermark",
  "pdf-page-numbers",
  "pdf-signature",
  "pdf-metadata-cleaner",
  "image-metadata-remover",
  "color-palette-extractor",
  "favicon-generator",
  "svg-optimizer",
  "qr-scanner",
  "text-diff",
  "az-cyrillic-latin",
  "number-to-words-az",
  "az-iban-validator",
  "json-formatter",
  "base64",
  "jwt-decoder",
  "uuid-generator",
  "timestamp-converter",
  "url-encoder-decoder",
] as const satisfies readonly ToolSlug[];

export type NewToolSlug = (typeof newToolSlugs)[number];

export function isNewToolSlug(slug: ToolSlug): slug is NewToolSlug {
  return (newToolSlugs as readonly string[]).includes(slug);
}

type ToolGuide = {
  steps: readonly [string, string, string];
  faqs: readonly { question: string; answer: string }[];
  limitation: string;
  related: readonly ToolSlug[];
};

export const toolGuides: Record<NewToolSlug, ToolGuide> = {
  "pdf-to-image": {
    steps: [
      "PDF faylını seçin və səhifə önizləmələrinin hazırlanmasını gözləyin.",
      "JPG/PNG, resolution və lazım olan səhifə aralığını seçin.",
      "Səhifələri ayrı-ayrı və ya hamısını ZIP kimi yükləyin.",
    ],
    faqs: [
      {
        question: "Şifrəli PDF çevrilirmi?",
        answer:
          "Xeyr. Brauzer PDF-i aça bilmirsə, şifrəsiz surət seçilməlidir.",
      },
      {
        question: "Çox yüksək resolution nə edir?",
        answer:
          "Səhifəni daha çox piksel ilə render edir, amma daha çox yaddaş və vaxt istifadə edir.",
      },
    ],
    limitation:
      "Çox uzun PDF-lər və çox yüksək resolution mobil cihaz yaddaşını sürətlə istifadə edə bilər.",
    related: ["image-to-pdf", "pdf-watermark", "pdf-tools"],
  },
  "pdf-watermark": {
    steps: [
      "PDF-i və mətn və ya şəkil su nişanı növünü seçin.",
      "Rəng, şəffaflıq, dönmə, miqyas, yerləşmə və səhifələri tənzimləyin.",
      "Önizləməni yoxlayıb su nişanlı PDF-i yaradın.",
    ],
    faqs: [
      {
        question: "PDF səhifələri şəkilə çevrilir?",
        answer:
          "Xeyr. Mövcud səhifələr saxlanılır, yalnız su nişanı ayrıca əlavə olunur.",
      },
      {
        question: "Azərbaycan hərfləri işləyir?",
        answer:
          "Bəli. Mətn brauzerin Azərbaycan hərflərini dəstəkləyən sistem şrifti ilə hazırlanır.",
      },
    ],
    limitation:
      "Mətn su nişanı uyğun hərflər üçün şəffaf PNG qatı kimi PDF-ə yerləşdirilir.",
    related: ["pdf-page-numbers", "pdf-signature", "pdf-tools"],
  },
  "pdf-page-numbers": {
    steps: [
      "PDF faylını seçin və nömrə formatını müəyyən edin.",
      "Başlanğıc, şrift, rəng, kənar məsafə, mövqe və səhifə aralığını seçin.",
      "Önizləmədən sonra nömrələnmiş PDF-i yaradıb yükləyin.",
    ],
    faqs: [
      {
        question: "Albom səhifələr dəstəklənir?",
        answer: "Bəli. Hər səhifənin real eni və hündürlüyü ayrıca hesablanır.",
      },
      {
        question: "Birinci səhifəni nömrəsiz saxlamaq olar?",
        answer: "Bəli, birinci səhifəni istisna etmə seçimi var.",
      },
    ],
    limitation:
      "Ümumi səhifə sayı PDF-in fiziki səhifələrinin sayıdır; seçilmiş aralıq yalnız yazılacaq səhifələri məhdudlaşdırır.",
    related: ["pdf-watermark", "pdf-signature", "pdf-tools"],
  },
  "pdf-signature": {
    steps: [
      "PDF-i seçin, imzanı çəkin, yazın və ya şəffaf PNG yükləyin.",
      "Səhifədə imzanı sürüşdürün, ölçüsünü dəyişin və tətbiq səhifələrini yazın.",
      "Vizual imza şəkli əlavə edilmiş PDF-i yaradın.",
    ],
    faqs: [
      {
        question: "Bu rəqəmsal imzadır?",
        answer:
          "Xeyr. Alət yalnız görünən imza şəkli yerləşdirir və kriptoqrafik doğrulama yaratmır.",
      },
      {
        question: "Eyni imzanı bir neçə səhifəyə əlavə etmək olar?",
        answer: "Bəli, 1-3, 5 kimi səhifə aralığı daxil etmək mümkündür.",
      },
    ],
    limitation:
      "Bu çıxış hüquqi və ya dövlət təsdiqli elektron imza statusu daşımır.",
    related: ["pdf-watermark", "pdf-page-numbers", "pdf-tools"],
  },
  "pdf-metadata-cleaner": {
    steps: [
      "PDF faylını seçib oxuna bilən sənəd metadata-sına baxın.",
      "Sahələri silin və ya yeni dəyərlərlə əvəz edin.",
      "Görünən səhifələri saxlayan yeni PDF surətini yükləyin.",
    ],
    faqs: [
      {
        question: "Səhifə məzmunu dəyişir?",
        answer:
          "Alət səhifələri yenidən çəkmir; sənəd məlumatı sahələrini redaktə edir.",
      },
      {
        question: "Bütün metadata zəmanətlə silinir?",
        answer:
          "Xeyr. Qeyri-adi XMP, əlavə və xüsusi obyekt məlumatı kitabxananın imkanından kənarda qala bilər.",
      },
    ],
    limitation: "Alət forensik metadata təmizlənməsinə zəmanət vermir.",
    related: ["pdf-watermark", "pdf-signature", "pdf-tools"],
  },
  "image-metadata-remover": {
    steps: [
      "JPG, PNG və ya WebP şəkli seçib EXIF və GPS göstəricilərinə baxın.",
      "Lossy format üçün çıxış keyfiyyətini tənzimləyin.",
      "Şəkli yenidən kodlayıb metadata-sız surəti yükləyin.",
    ],
    faqs: [
      {
        question: "Şəklin orientasiyası qorunur?",
        answer:
          "Bəli. Brauzer orientasiyanı tətbiq etdikdən sonra görünən şəkil canvas-a çəkilir.",
      },
      {
        question: "Animasiya dəstəklənir?",
        answer: "Xeyr. Animasiya edilmiş PNG və WebP qəbul edilmir.",
      },
    ],
    limitation:
      "Yenidən kodlama rəng profili və lossy keyfiyyət səbəbilə kiçik vizual fərq yarada bilər.",
    related: ["image-tools", "color-palette-extractor", "favicon-generator"],
  },
  "color-palette-extractor": {
    steps: [
      "Bir şəkil seçin və 5–12 dominant rəng sayını müəyyən edin.",
      "Palitranı çıxarın, pikselə klikləyin və iki rəngin kontrastını müqayisə edin.",
      "HEX/RGB/HSL dəyərlərini kopyalayın və JSON və ya PNG yükləyin.",
    ],
    faqs: [
      {
        question: "Hər dəfə eyni palitra alınır?",
        answer:
          "Bəli. Random sampling deyil, deterministik histogram və median bölmə istifadə olunur.",
      },
      {
        question: "Kontrast nəticəsi nədir?",
        answer:
          "İki seçilmiş rəng üçün WCAG kontrast nisbəti və AA keçidi göstərilir.",
      },
    ],
    limitation:
      "Kiçildilmiş analiz təsviri istifadə edildiyi üçün çox incə, az sahəli rənglər dominant siyahıya düşməyə bilər.",
    related: ["image-tools", "image-metadata-remover", "favicon-generator"],
  },
  "favicon-generator": {
    steps: [
      "PNG, JPG, WebP və ya SVG mənbə seçin.",
      "Kvadrat crop və ya padding, şəffaf və ya rəngli fon seçin.",
      "PNG-ləri, favicon.ico-nu və ya tam ZIP paketini yükləyin.",
    ],
    faqs: [
      {
        question: "Düzbucaqlı şəkil dartılır?",
        answer:
          "Xeyr. Mənbə ya kvadrat kəsilir, ya da kənar əlavə edilərək yerləşdirilir.",
      },
      {
        question: "SVG təhlükəsiz açılır?",
        answer:
          "SVG əvvəlcə script, event və təhlükəli xarici istinadlardan təmizlənir.",
      },
    ],
    limitation:
      "PNG əsaslı ICO müasir brauzerlər üçün uyğundur; çox köhnə platformalar fərqli BMP əsaslı ICO tələb edə bilər.",
    related: ["svg-optimizer", "color-palette-extractor", "image-tools"],
  },
  "svg-optimizer": {
    steps: [
      "SVG kodunu yapışdırın və ya .svg faylı seçin.",
      "Rəqəm dəqiqliyini seçib sanitizasiya və optimallaşdırmanı başladın.",
      "Önizləmələri müqayisə edib kodu kopyalayın və ya SVG-ni yükləyin.",
    ],
    faqs: [
      {
        question: "Scriptlər icra olunur?",
        answer:
          "Xeyr. Script və event atributları silinir, SVG HTML kimi DOM-a inject edilmir.",
      },
      {
        question: "viewBox qorunur?",
        answer:
          "Mövcud viewBox saxlanılır; yalnız width və height olan sadə SVG-də çatışmırsa yaradılır.",
      },
    ],
    limitation:
      "Çox mürəkkəb editor SVG-lərində aqressiv təmizləmə görünüşə təsir edə bilər; önizləməni müqayisə edin.",
    related: ["favicon-generator", "json-formatter", "image-tools"],
  },
  "qr-scanner": {
    steps: [
      "QR şəkli seçin, panodan yapışdırın və ya kameranı başladın.",
      "Kamera dəstəklənirsə ön/arxa kameranı dəyişib kodu çərçivəyə gətirin.",
      "Nəticə tipini yoxlayın, dəyəri kopyalayın və linki yalnız istəsəniz açın.",
    ],
    faqs: [
      {
        question: "QR linki avtomatik açılır?",
        answer: "Xeyr. Link yalnız ayrıca istifadəçi düyməsi ilə açılır.",
      },
      {
        question: "BarcodeDetector olmayan brauzerdə işləyir?",
        answer:
          "Bəli. Lokal jsQR piksel decoder fallback kimi dinamik yüklənir.",
      },
    ],
    limitation:
      "Canlı kamera təhlükəsiz HTTPS/localhost konteksti və istifadəçi icazəsi tələb edir.",
    related: ["qr-code-generator", "vcard-qr-generator", "url-encoder-decoder"],
  },
  "text-diff": {
    steps: [
      "Müqayisə ediləcək iki mətni yan-yana daxil edin.",
      "Sətir, söz və ya simvol rejimini, görünüşü və ignore seçimlərini təyin edin.",
      "Fərqləri yoxlayıb hesabatı kopyalayın və ya TXT yükləyin.",
    ],
    faqs: [
      {
        question: "Boşluqları nəzərə almamaq olar?",
        answer:
          "Bəli. Böyük/kiçik hərf, whitespace və boş sətir ayrıca ignor edilə bilər.",
      },
      {
        question: "Böyük mətn işləyir?",
        answer:
          "Nəticə yüngül, scroll edilən mətn bloklarında göstərilir; ölçü artdıqca emal vaxtı arta bilər.",
      },
    ],
    limitation:
      "Ignore seçimləri müqayisədən əvvəl normallaşdırma tətbiq edir; nəticə həmin normallaşdırılmış məzmunu göstərir.",
    related: ["text-cleaner", "word-counter", "json-formatter"],
  },
  "az-cyrillic-latin": {
    steps: [
      "Azərbaycan Kiril və ya Latın mətnini mənbə sahəsinə daxil edin.",
      "Avtomatik aşkarlamanı saxlayın və ya istiqaməti əl ilə seçin.",
      "Nəticəni kopyalayın və ya sahələri dəyişib əks istiqamətdə çevirin.",
    ],
    faqs: [
      {
        question: "Bu tərcümədir?",
        answer:
          "Xeyr. Söz mənasını dəyişmədən əlifba simvollarını transliterasiya edir.",
      },
      {
        question: "Naməlum Kiril hərfi nə olur?",
        answer: "Xəritədə olmayan simvol silinmir və olduğu kimi saxlanılır.",
      },
    ],
    limitation:
      "Tarixi mətnlərdə Azərbaycan əlifbasına aid olmayan rus hərfləri manual düzəliş tələb edə bilər.",
    related: ["az-transliteration", "az-keyboard-fixer", "text-diff"],
  },
  "number-to-words-az": {
    steps: [
      "Tam ədəd və ya AZN məbləği rejimini seçin.",
      "Rəqəmi nöqtə və ya vergül onluq ayrıcısı ilə daxil edin.",
      "Normallaşdırılmış rəqəmi və yazılı nəticəni yoxlayıb kopyalayın.",
    ],
    faqs: [
      {
        question: "100 niyə “bir yüz” deyil?",
        answer:
          "Azərbaycan dilinin say qaydasına uyğun olaraq 100 “yüz”, 1000 isə “min” yazılır.",
      },
      {
        question: "Qəpik necə normallaşdırılır?",
        answer:
          "AZN rejimində məbləğ iki qəpik rəqəminə yuvarlaqlaşdırılır və yazı ilə göstərilir.",
      },
    ],
    limitation:
      "Dəstəklənən ən böyük modul dəyər 999 kvadrilyon 999 trilyon 999 milyard 999 milyon 999 min 999-dur.",
    related: ["invoice-generator", "vat-calculator", "discount-calculator"],
  },
  "az-iban-validator": {
    steps: [
      "Formatlı və ya boşluqsuz Azərbaycan IBAN-ını daxil edin.",
      "AZ prefiksi, uzunluq, BBAN strukturu və MOD-97 nəticələrinə baxın.",
      "Lazım olarsa dörd simvolluq qruplarla formatlanmış IBAN-ı kopyalayın.",
    ],
    faqs: [
      {
        question: "Keçən IBAN hesabın mövcudluğunu göstərir?",
        answer: "Xeyr. Yalnız format və checksum uyğunluğu yoxlanır.",
      },
      {
        question: "IBAN saxlanılır?",
        answer:
          "Xeyr. Dəyər yalnız səhifənin yaddaşında emal olunur və storage-a yazılmır.",
      },
    ],
    limitation:
      "Alət bank, hesab sahibi və hesab statusu barədə məlumat vermir.",
    related: ["invoice-generator", "vat-calculator", "number-to-words-az"],
  },
  "json-formatter": {
    steps: [
      "JSON mətnini yapışdırın, fayl seçin və ya nümunəni açın.",
      "Yoxlama, formatlama, minify və ya rekursiv açar sıralamasını seçin.",
      "Nəticəni kopyalayın və ya .json faylı kimi yükləyin.",
    ],
    faqs: [
      {
        question: "Kod eval olunur?",
        answer:
          "Xeyr. Yalnız standart JSON.parse və JSON.stringify istifadə olunur.",
      },
      {
        question: "Səhvin yeri göstərilir?",
        answer:
          "Brauzer mövqe verdikdə sətir və sütun hesablanıb mesaja əlavə olunur.",
      },
    ],
    limitation:
      "JSON şərh, trailing comma, NaN və JavaScript obyekt literal sintaksisini qəbul etmir.",
    related: ["base64", "jwt-decoder", "text-diff"],
  },
  base64: {
    steps: [
      "Mətn, fayl, Data URL və ya decode rejimini seçin.",
      "Standard Base64 və ya Base64URL seçib girişi daxil edin.",
      "Nəticəni kopyalayın və ya mətn/fayl çıxışını yükləyin.",
    ],
    faqs: [
      {
        question: "Azərbaycan hərfləri düzgün çevrilir?",
        answer: "Bəli. Mətn əvvəlcə UTF-8 baytlarına çevrilir.",
      },
      {
        question: "Böyük fayllarda spread istifadə olunur?",
        answer:
          "Xeyr. Binar mətn hissələrlə qurulur ki, arqument limitinə düşməsin.",
      },
    ],
    limitation:
      "Base64 ölçünü təxminən üçdə bir artırır və çox böyük fayllar brauzer yaddaş limitinə çata bilər.",
    related: ["jwt-decoder", "json-formatter", "uuid-generator"],
  },
  "jwt-decoder": {
    steps: [
      "Üç hissəli JWT mətnini daxil edin.",
      "Decode düyməsi ilə Base64URL header və payload JSON-u oxuyun.",
      "Claim-ləri, yerli/UTC vaxtları və exp görünüşünü yoxlayın.",
    ],
    faqs: [
      {
        question: "İmza yoxlanılır?",
        answer:
          "Xeyr. Decode etmək secret/public key olmadan imzanı doğrulamır.",
      },
      {
        question: "Expired göstəricisi etibarlılıqdır?",
        answer:
          "Xeyr. Yalnız payload-dakı rəqəm tipli exp dəyəri cihaz vaxtı ilə müqayisə edilir.",
      },
    ],
    limitation:
      "Decode edilmiş claim-lər etibarsız və ya saxtalaşdırılmış ola bilər.",
    related: ["base64", "json-formatter", "timestamp-converter"],
  },
  "uuid-generator": {
    steps: [
      "UUID v4 və ya secure random ID rejimini seçin.",
      "Say, format və random ID üçün uzunluq/simvol dəstini tənzimləyin.",
      "Bir dəyəri və ya hamısını kopyalayın və TXT kimi yükləyin.",
    ],
    faqs: [
      {
        question: "Math.random istifadə olunur?",
        answer:
          "Xeyr. crypto.randomUUID və Web Crypto getRandomValues istifadə olunur.",
      },
      {
        question: "Xüsusi random ID UUID-dirmi?",
        answer: "Xeyr. Yalnız UUID rejimi RFC 4122 v4 formatı yaradır.",
      },
    ],
    limitation:
      "Random ID təhlükəsizliyi seçilən uzunluq və əlifbanın entropiyasından asılıdır.",
    related: ["base64", "timestamp-converter", "json-formatter"],
  },
  "timestamp-converter": {
    steps: [
      "Unix rəqəmini daxil edib vahidi avtomatik və ya əl ilə seçin.",
      "Yerli, UTC, ISO və nisbi tarix nəticələrinə baxın.",
      "Əks istiqamət üçün yerli tarix seçib saniyə və millisaniyəni kopyalayın.",
    ],
    faqs: [
      {
        question: "Saat qurşağı necə seçilir?",
        answer:
          "Yerli nəticə brauzerin sistem saat qurşağından, UTC nəticə isə sıfır ofsetdən istifadə edir.",
      },
      {
        question: "Vaxt API-si çağırılır?",
        answer: "Xeyr. Cari vaxt cihazın JavaScript Date saatından alınır.",
      },
    ],
    limitation:
      "Səhv sistem saatı və saat qurşağı yerli və nisbi nəticəyə təsir edir.",
    related: ["jwt-decoder", "uuid-generator", "json-formatter"],
  },
  "url-encoder-decoder": {
    steps: [
      "Encode, decode, tam URL parse və ya query qurma rejimini seçin.",
      "Mətni və ya protokollu tam URL-i daxil edib əməliyyatı başladın.",
      "Təkrarlanan query parametrlərini redaktə edib final URL-i kopyalayın.",
    ],
    faqs: [
      {
        question: "URL avtomatik açılır?",
        answer: "Xeyr. Alət URL-i nə fetch edir, nə də ona keçid edir.",
      },
      {
        question: "Təkrarlanan query açarları qorunur?",
        answer:
          "Bəli. URLSearchParams sırası ilə hər dəyər ayrıca cədvəl sətri olur.",
      },
    ],
    limitation:
      "Tam URL parse rejimi http ilə məhdud deyil, amma giriş etibarlı protokol və URL sintaksisi daşımalıdır.",
    related: ["qr-code-generator", "qr-scanner", "json-formatter"],
  },
};

export const existingRelatedOverrides: Partial<
  Record<ToolSlug, readonly ToolSlug[]>
> = {
  "image-to-pdf": ["pdf-to-image", "pdf-tools", "image-tools"],
  "pdf-tools": ["pdf-watermark", "pdf-page-numbers", "pdf-signature"],
  "qr-code-generator": [
    "qr-scanner",
    "vcard-qr-generator",
    "url-encoder-decoder",
  ],
  "az-transliteration": [
    "az-cyrillic-latin",
    "az-keyboard-fixer",
    "text-cleaner",
  ],
  "invoice-generator": [
    "number-to-words-az",
    "az-iban-validator",
    "vat-calculator",
  ],
  "image-tools": [
    "image-metadata-remover",
    "color-palette-extractor",
    "favicon-generator",
  ],
};

export const homeNewToolSlugs = [
  "pdf-to-image",
  "pdf-signature",
  "qr-scanner",
  "az-cyrillic-latin",
  "number-to-words-az",
  "json-formatter",
] as const satisfies readonly NewToolSlug[];
