import {
  BadgeInfo,
  Binary,
  Braces,
  BriefcaseBusiness,
  Calculator,
  Clock3,
  CodeXml,
  Eraser,
  FileText,
  FileImage,
  FileKey,
  FileSearch,
  Fingerprint,
  GitCompareArrows,
  GraduationCap,
  Image,
  Images,
  Keyboard,
  KeyRound,
  Landmark,
  Languages,
  Link2,
  ListOrdered,
  MessageCircle,
  Palette,
  PenLine,
  Percent,
  QrCode,
  ScanQrCode,
  ScanLine,
  Shrink,
  Stamp,
  Type,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export const toolCategories = [
  "Azərbaycan dili",
  "Şəkil alətləri",
  "PDF alətləri",
  "CV və karyera",
  "Biznes alətləri",
  "Tələbə alətləri",
  "Mətn alətləri",
  "Developer alətləri",
] as const;

export type ToolCategory = (typeof toolCategories)[number];

export type ToolSlug =
  | "az-keyboard-fixer"
  | "image-tools"
  | "image-resizer"
  | "cv-photo-maker"
  | "cv-builder"
  | "image-compressor"
  | "image-to-pdf"
  | "pdf-tools"
  | "whatsapp-link-generator"
  | "qr-code-generator"
  | "vcard-qr-generator"
  | "invoice-generator"
  | "gpa-calculator"
  | "vat-calculator"
  | "discount-calculator"
  | "linkedin-headline-generator"
  | "az-transliteration"
  | "text-cleaner"
  | "word-counter"
  | "pdf-to-image"
  | "pdf-watermark"
  | "pdf-page-numbers"
  | "pdf-signature"
  | "pdf-metadata-cleaner"
  | "image-metadata-remover"
  | "color-palette-extractor"
  | "favicon-generator"
  | "svg-optimizer"
  | "qr-scanner"
  | "text-diff"
  | "az-cyrillic-latin"
  | "number-to-words-az"
  | "az-iban-validator"
  | "json-formatter"
  | "base64"
  | "jwt-decoder"
  | "uuid-generator"
  | "timestamp-converter"
  | "url-encoder-decoder";

export type Tool = {
  slug: ToolSlug;
  title: string;
  pageTitle: string;
  description: string;
  category: ToolCategory;
  tags: string[];
  icon: LucideIcon;
  isFeatured: boolean;
  isLocal: boolean;
  isPopular: boolean;
  href: `/tools/${ToolSlug}`;
  searchKeywords: string[];
};

export const tools: Tool[] = [
  {
    slug: "az-keyboard-fixer",
    title: "Azərbaycan klaviatura düzəldici",
    pageTitle: "Azərbaycan klaviatura düzəldici",
    description: "Səhv klaviatura ilə yazılmış Azərbaycan mətnini düzəldin.",
    category: "Azərbaycan dili",
    tags: ["azərbaycan dili", "klaviatura", "mətn", "transliterasiya"],
    icon: Keyboard,
    isFeatured: true,
    isLocal: true,
    isPopular: false,
    href: "/tools/az-keyboard-fixer",
    searchKeywords: [
      "azerbaycan klaviatura",
      "azeri keyboard",
      "yanlış klaviatura",
      "mətni düzəlt",
    ],
  },
  {
    slug: "image-tools",
    title: "Şəkil alətləri",
    pageTitle: "Şəkil alətləri",
    description:
      "Şəkil ölçüləndir, sıxışdır, CV şəkli hazırla və format çevir.",
    category: "Şəkil alətləri",
    tags: ["şəkil", "resize", "compress", "cv", "format", "converter"],
    icon: Image,
    isFeatured: true,
    isLocal: true,
    isPopular: true,
    href: "/tools/image-tools",
    searchKeywords: [
      "image tools",
      "şəkil alətləri",
      "image resizer",
      "image compressor",
      "format converter",
      "cv photo",
    ],
  },
  {
    slug: "az-transliteration",
    title: "Azərbaycan hərf düzəldici",
    pageTitle: "Azərbaycan hərf düzəldici",
    description:
      "Azerbaycanca yazılmış latın mətni Azərbaycan hərflərinə yaxınlaşdırın.",
    category: "Azərbaycan dili",
    tags: ["azərbaycan dili", "transliterasiya", "hərf", "mətn"],
    icon: Languages,
    isFeatured: true,
    isLocal: true,
    isPopular: false,
    href: "/tools/az-transliteration",
    searchKeywords: [
      "azerbaycan transliteration",
      "azerbaycan herf",
      "latin to azerbaijani",
      "men yaxsiyam",
      "cox sag ol",
    ],
  },
  {
    slug: "image-resizer",
    title: "Şəkil ölçüləndirici",
    pageTitle: "Şəkil ölçüləndirici",
    description:
      "Şəkilləri sosial media, CV və profil ölçülərinə uyğunlaşdırın.",
    category: "Şəkil alətləri",
    tags: ["şəkil", "resize", "ölçü", "profil"],
    icon: Image,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/image-resizer",
    searchKeywords: [
      "image resizer",
      "photo resize",
      "şəkil ölçüsü",
      "instagram ölçü",
    ],
  },
  {
    slug: "cv-photo-maker",
    title: "CV şəkli hazırlayıcı",
    pageTitle: "CV şəkli hazırlayıcı",
    description:
      "CV, LinkedIn və profil üçün təmiz kvadrat və 3x4 şəkil hazırlayın.",
    category: "CV və karyera",
    tags: ["cv", "profil", "linkedin", "şəkil", "3x4"],
    icon: UserRound,
    isFeatured: true,
    isLocal: true,
    isPopular: false,
    href: "/tools/cv-photo-maker",
    searchKeywords: ["cv photo", "linkedin photo", "profil şəkli", "3x4 şəkil"],
  },
  {
    slug: "cv-builder",
    title: "CV hazırlayıcı",
    pageTitle: "CV hazırlayıcı",
    description:
      "Tələbə və junior developer üçün sadə, təmiz CV PDF-i yaradın.",
    category: "CV və karyera",
    tags: ["cv", "resume", "pdf", "karyera", "tələbə"],
    icon: FileText,
    isFeatured: true,
    isLocal: true,
    isPopular: false,
    href: "/tools/cv-builder",
    searchKeywords: [
      "cv builder",
      "resume builder",
      "cv hazırla",
      "pdf cv",
      "developer cv",
    ],
  },
  {
    slug: "image-compressor",
    title: "Şəkil sıxışdırıcı",
    pageTitle: "Şəkil sıxışdırıcı",
    description:
      "Şəkil ölçüsünü email, forma və sayt yükləmələri üçün azaldın.",
    category: "Şəkil alətləri",
    tags: ["şəkil", "compress", "sıxışdır", "ölçü azalt"],
    icon: Shrink,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/image-compressor",
    searchKeywords: [
      "image compressor",
      "photo compress",
      "şəkil kiçilt",
      "fayl ölçüsü azalt",
    ],
  },
  {
    slug: "image-to-pdf",
    title: "Şəkli PDF et",
    pageTitle: "Şəkli PDF et",
    description: "Bir və ya bir neçə şəkli tək PDF faylına çevirin.",
    category: "PDF alətləri",
    tags: ["pdf", "şəkil", "convert", "çevirmə"],
    icon: Images,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/image-to-pdf",
    searchKeywords: [
      "image to pdf",
      "jpg to pdf",
      "png to pdf",
      "şəkildən pdf",
    ],
  },
  {
    slug: "pdf-tools",
    title: "PDF alətləri",
    pageTitle: "PDF alətləri",
    description: "PDF birləşdir, səhifə ayır, sil, döndər və sırala.",
    category: "PDF alətləri",
    tags: ["pdf", "birləşdir", "split", "səhifə", "rotate"],
    icon: FileText,
    isFeatured: true,
    isLocal: true,
    isPopular: true,
    href: "/tools/pdf-tools",
    searchKeywords: [
      "pdf merge",
      "pdf split",
      "pdf organizer",
      "pdf birləşdir",
      "pdf ayır",
    ],
  },
  {
    slug: "whatsapp-link-generator",
    title: "WhatsApp link generator",
    pageTitle: "WhatsApp link generator",
    description:
      "Nömrə və hazır mesajla paylaşılabilən WhatsApp linki yaradın.",
    category: "Biznes alətləri",
    tags: ["whatsapp", "link", "mesaj", "biznes"],
    icon: MessageCircle,
    isFeatured: true,
    isLocal: true,
    isPopular: false,
    href: "/tools/whatsapp-link-generator",
    searchKeywords: [
      "whatsapp link",
      "wa.me",
      "whatsapp mesaj",
      "biznes nömrə",
    ],
  },
  {
    slug: "qr-code-generator",
    title: "QR kod generator",
    pageTitle: "QR kod generator",
    description:
      "Link, mətn, WhatsApp və Wi-Fi məlumatı üçün QR kod hazırlayın.",
    category: "Developer alətləri",
    tags: ["qr", "kod", "link", "wi-fi"],
    icon: QrCode,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/qr-code-generator",
    searchKeywords: ["qr code", "qr generator", "wifi qr", "link qr"],
  },
  {
    slug: "vcard-qr-generator",
    title: "Rəqəmsal vizitka QR generator",
    pageTitle: "Rəqəmsal vizitka QR generator",
    description:
      "Telefonlarda kontakt kimi yadda saxlanan vCard QR kodu yaradın.",
    category: "Biznes alətləri",
    tags: ["vcard", "vizitka", "qr", "kontakt"],
    icon: BadgeInfo,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/vcard-qr-generator",
    searchKeywords: [
      "vcard qr",
      "digital business card",
      "vizitka qr",
      "kontakt qr",
    ],
  },
  {
    slug: "invoice-generator",
    title: "Qəbz / invoice generator",
    pageTitle: "Qəbz / invoice generator",
    description: "Freelancer və kiçik bizneslər üçün sadə PDF qəbz yaradın.",
    category: "Biznes alətləri",
    tags: ["qəbz", "invoice", "pdf", "freelancer", "biznes"],
    icon: FileText,
    isFeatured: true,
    isLocal: true,
    isPopular: false,
    href: "/tools/invoice-generator",
    searchKeywords: [
      "invoice generator",
      "qəbz yarat",
      "faktura",
      "pdf invoice",
    ],
  },
  {
    slug: "vat-calculator",
    title: "ƏDV kalkulyatoru",
    pageTitle: "ƏDV kalkulyatoru",
    description: "18% ƏDV əlavə et və ya qiymətin içindən ƏDV-ni çıxart.",
    category: "Biznes alətləri",
    tags: ["ədv", "vat", "kalkulyator", "biznes", "azn"],
    icon: Calculator,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/vat-calculator",
    searchKeywords: [
      "edv kalkulyator",
      "vat calculator",
      "18 faiz",
      "ədv hesabla",
    ],
  },
  {
    slug: "discount-calculator",
    title: "Endirim / faiz kalkulyatoru",
    pageTitle: "Endirim / faiz kalkulyatoru",
    description: "Endirim, faiz payı və artım/azalma faizini tez hesablayın.",
    category: "Biznes alətləri",
    tags: ["endirim", "faiz", "discount", "percentage", "kalkulyator"],
    icon: Percent,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/discount-calculator",
    searchKeywords: [
      "discount calculator",
      "faiz kalkulyator",
      "endirim hesabla",
      "percentage change",
    ],
  },
  {
    slug: "linkedin-headline-generator",
    title: "LinkedIn headline generator",
    pageTitle: "LinkedIn headline generator",
    description: "AI API olmadan təmiz LinkedIn headline variantları yaradın.",
    category: "CV və karyera",
    tags: ["linkedin", "headline", "cv", "karyera"],
    icon: BriefcaseBusiness,
    isFeatured: true,
    isLocal: true,
    isPopular: false,
    href: "/tools/linkedin-headline-generator",
    searchKeywords: [
      "linkedin headline",
      "linkedin bio",
      "cv headline",
      "karyera profil",
    ],
  },
  {
    slug: "text-cleaner",
    title: "Mətn təmizləyici",
    pageTitle: "Mətn təmizləyici",
    description: "Kopyalanmış qarışıq mətni qaydaya salın və formatlayın.",
    category: "Mətn alətləri",
    tags: ["mətn", "format", "təmizlə", "copy paste"],
    icon: Type,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/text-cleaner",
    searchKeywords: [
      "text cleaner",
      "mətn düzəlt",
      "formatla",
      "boşluq təmizlə",
    ],
  },
  {
    slug: "word-counter",
    title: "Söz və simvol sayğacı",
    pageTitle: "Söz və simvol sayğacı",
    description:
      "Söz, simvol, cümlə, abzas və təxmini oxuma vaxtını hesablayın.",
    category: "Tələbə alətləri",
    tags: ["söz", "simvol", "sayğac", "mətn", "oxuma vaxtı"],
    icon: ScanLine,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/word-counter",
    searchKeywords: [
      "word counter",
      "character counter",
      "söz sayı",
      "simvol sayı",
    ],
  },
  {
    slug: "gpa-calculator",
    title: "GPA / ortalama kalkulyatoru",
    pageTitle: "GPA / ortalama kalkulyatoru",
    description:
      "Kredit və ballara görə çəkili semestr ortalamasını hesablayın.",
    category: "Tələbə alətləri",
    tags: ["gpa", "ortalama", "kredit", "bal", "tələbə"],
    icon: GraduationCap,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/gpa-calculator",
    searchKeywords: [
      "gpa calculator",
      "ortalama kalkulyator",
      "kredit bal",
      "semester average",
    ],
  },
  {
    slug: "pdf-to-image",
    title: "PDF-dən Şəkilə",
    pageTitle: "PDF-dən Şəkilə Çevirici",
    description: "PDF səhifələrini seçərək JPG və ya PNG şəkillərinə çevirin.",
    category: "PDF alətləri",
    tags: ["pdf", "şəkil", "jpg", "png", "səhifə"],
    icon: FileImage,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/pdf-to-image",
    searchKeywords: ["pdf to image", "pdf jpg", "pdf png", "pdf-dən şəkilə"],
  },
  {
    slug: "pdf-watermark",
    title: "PDF-ə Su Nişanı Əlavə Et",
    pageTitle: "PDF-ə Su Nişanı Əlavə Et",
    description: "PDF səhifələrinə mətn və ya şəkil su nişanı yerləşdirin.",
    category: "PDF alətləri",
    tags: ["pdf", "su nişanı", "watermark", "mətn", "şəkil"],
    icon: Stamp,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/pdf-watermark",
    searchKeywords: ["pdf watermark", "pdf su nişanı", "pdf möhür"],
  },
  {
    slug: "pdf-page-numbers",
    title: "PDF-ə Səhifə Nömrəsi Əlavə Et",
    pageTitle: "PDF-ə Səhifə Nömrəsi Əlavə Et",
    description: "PDF səhifələrini fərqli format və mövqelərdə nömrələyin.",
    category: "PDF alətləri",
    tags: ["pdf", "səhifə", "nömrə", "pagination"],
    icon: ListOrdered,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/pdf-page-numbers",
    searchKeywords: ["pdf page numbers", "pdf səhifə nömrəsi", "pdf nömrələ"],
  },
  {
    slug: "pdf-signature",
    title: "PDF-ə İmza Əlavə Et",
    pageTitle: "PDF-ə Vizual İmza Əlavə Et",
    description: "İmzanı çəkin, yazın və ya PNG yükləyib PDF-də yerləşdirin.",
    category: "PDF alətləri",
    tags: ["pdf", "imza", "signature", "vizual imza"],
    icon: PenLine,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/pdf-signature",
    searchKeywords: ["pdf signature", "pdf imza", "pdf-ə imza əlavə et"],
  },
  {
    slug: "pdf-metadata-cleaner",
    title: "PDF Metadata Göstəricisi və Təmizləyicisi",
    pageTitle: "PDF Metadata Göstəricisi və Təmizləyicisi",
    description: "PDF sənəd məlumatlarını göstərin, silin və ya əvəz edin.",
    category: "PDF alətləri",
    tags: ["pdf", "metadata", "müəllif", "məxfilik"],
    icon: FileSearch,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/pdf-metadata-cleaner",
    searchKeywords: ["pdf metadata", "pdf metadata sil", "pdf author remove"],
  },
  {
    slug: "image-metadata-remover",
    title: "Şəkil Metadatasını Sil",
    pageTitle: "Şəkil Metadatasını və GPS Məlumatını Sil",
    description:
      "JPG, PNG və WebP şəkillərini EXIF və GPS olmadan yenidən kodlayın.",
    category: "Şəkil alətləri",
    tags: ["şəkil", "metadata", "exif", "gps", "məxfilik"],
    icon: Eraser,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/image-metadata-remover",
    searchKeywords: [
      "remove exif",
      "şəkil metadata sil",
      "gps sil",
      "photo privacy",
    ],
  },
  {
    slug: "color-palette-extractor",
    title: "Şəkildən Rəng Palitrası Çıxar",
    pageTitle: "Şəkildən Rəng Palitrası Çıxar",
    description:
      "Şəkildən dominant rəngləri, HEX, RGB, HSL və kontrastı tapın.",
    category: "Şəkil alətləri",
    tags: ["şəkil", "rəng", "palitra", "hex", "rgb", "hsl"],
    icon: Palette,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/color-palette-extractor",
    searchKeywords: [
      "color palette",
      "şəkildən rəng",
      "hex extractor",
      "contrast",
    ],
  },
  {
    slug: "favicon-generator",
    title: "Favicon və App Icon Generator",
    pageTitle: "Favicon və App Icon Generator",
    description:
      "Şəkil və ya SVG-dən PNG app icon-ları və favicon.ico yaradın.",
    category: "Şəkil alətləri",
    tags: ["favicon", "app icon", "ico", "png", "svg"],
    icon: Image,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/favicon-generator",
    searchKeywords: [
      "favicon generator",
      "app icon generator",
      "favicon ico",
      "apple touch icon",
    ],
  },
  {
    slug: "svg-optimizer",
    title: "SVG Optimizer",
    pageTitle: "Təhlükəsiz SVG Optimizer",
    description: "SVG kodunu sanitizasiya edin, ölçüsünü azaldın və önizləyin.",
    category: "Developer alətləri",
    tags: ["svg", "optimize", "sanitize", "vector", "developer"],
    icon: CodeXml,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/svg-optimizer",
    searchKeywords: [
      "svg optimizer",
      "svg minify",
      "svg sanitize",
      "svg təmizlə",
    ],
  },
  {
    slug: "qr-scanner",
    title: "QR Kod Oxuyucu və Skaner",
    pageTitle: "QR Kod Oxuyucu və Kamera Skaneri",
    description: "Şəkildən, panodan və ya kameradan QR kodu təhlükəsiz oxuyun.",
    category: "Developer alətləri",
    tags: ["qr", "scanner", "kamera", "oxuyucu", "barcode"],
    icon: ScanQrCode,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/qr-scanner",
    searchKeywords: ["qr scanner", "qr kod oxu", "camera qr", "şəkildən qr"],
  },
  {
    slug: "text-diff",
    title: "Mətn Müqayisəsi",
    pageTitle: "İki Mətni Müqayisə Et",
    description:
      "Mətnləri sətir, söz və simvol səviyyəsində yan-yana müqayisə edin.",
    category: "Mətn alətləri",
    tags: ["mətn", "diff", "müqayisə", "sətir", "söz"],
    icon: GitCompareArrows,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/text-diff",
    searchKeywords: [
      "text diff",
      "mətn müqayisə",
      "compare text",
      "difference checker",
    ],
  },
  {
    slug: "az-cyrillic-latin",
    title: "Azərbaycan Kiril–Latın Çeviricisi",
    pageTitle: "Azərbaycan Kiril–Latın Çeviricisi",
    description:
      "Azərbaycan mətnini Kiril və müasir Latın əlifbaları arasında çevirin.",
    category: "Azərbaycan dili",
    tags: ["azərbaycan", "kiril", "latın", "transliterasiya", "əlifba"],
    icon: Languages,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/az-cyrillic-latin",
    searchKeywords: [
      "azerbaijani cyrillic latin",
      "kiril latın",
      "азәрбајҹан",
      "əlifba çevirici",
    ],
  },
  {
    slug: "number-to-words-az",
    title: "Ədədi Azərbaycan Dilində Yazı ilə",
    pageTitle: "Ədədi Azərbaycan Dilində Yazı ilə Göstər",
    description:
      "Tam ədədləri və AZN məbləğlərini Azərbaycan dilində yazıya çevirin.",
    category: "Azərbaycan dili",
    tags: ["ədəd", "yazı", "azn", "manat", "qəpik", "azərbaycan dili"],
    icon: Binary,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/number-to-words-az",
    searchKeywords: [
      "number to words az",
      "ədədi yazı ilə",
      "məbləğ yazı ilə",
      "manat qəpik",
    ],
  },
  {
    slug: "az-iban-validator",
    title: "Azərbaycan IBAN Yoxlayıcısı",
    pageTitle: "Azərbaycan IBAN Format və MOD-97 Yoxlayıcısı",
    description:
      "Azərbaycan IBAN formatını və ISO MOD-97 yoxlama cəmini lokal yoxlayın.",
    category: "Biznes alətləri",
    tags: ["iban", "azərbaycan", "bank", "mod-97", "hesab"],
    icon: Landmark,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/az-iban-validator",
    searchKeywords: [
      "az iban validator",
      "iban yoxla",
      "azerbaijan iban",
      "mod97",
    ],
  },
  {
    slug: "json-formatter",
    title: "JSON Formatter və Validator",
    pageTitle: "JSON Formatter, Validator və Minifier",
    description:
      "JSON-u yoxlayın, formatlayın, minify edin və açarları sıralayın.",
    category: "Developer alətləri",
    tags: ["json", "formatter", "validator", "minify", "developer"],
    icon: Braces,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/json-formatter",
    searchKeywords: [
      "json formatter",
      "json validator",
      "json beautify",
      "json minify",
    ],
  },
  {
    slug: "base64",
    title: "Base64 Encoder və Decoder",
    pageTitle: "Base64 və Base64URL Encoder–Decoder",
    description:
      "Unicode mətn və faylları Base64, Base64URL və Data URL formatına çevirin.",
    category: "Developer alətləri",
    tags: ["base64", "base64url", "encode", "decode", "data url"],
    icon: FileKey,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/base64",
    searchKeywords: [
      "base64 encoder",
      "base64 decoder",
      "file to base64",
      "data url",
    ],
  },
  {
    slug: "jwt-decoder",
    title: "JWT Decoder",
    pageTitle: "JWT Header və Payload Decoder",
    description:
      "JWT header, payload və vaxt claim-lərini imzanı yoxlamadan oxuyun.",
    category: "Developer alətləri",
    tags: ["jwt", "token", "decoder", "base64url", "claims"],
    icon: KeyRound,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/jwt-decoder",
    searchKeywords: ["jwt decoder", "decode jwt", "jwt claims", "jwt exp"],
  },
  {
    slug: "uuid-generator",
    title: "UUID və Secure Random ID Generator",
    pageTitle: "UUID v4 və Secure Random ID Generator",
    description:
      "Web Crypto ilə UUID v4 və xüsusi uzunluqda təhlükəsiz ID-lər yaradın.",
    category: "Developer alətləri",
    tags: ["uuid", "random id", "crypto", "generator", "v4"],
    icon: Fingerprint,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/uuid-generator",
    searchKeywords: [
      "uuid generator",
      "uuid v4",
      "secure random id",
      "crypto id",
    ],
  },
  {
    slug: "timestamp-converter",
    title: "Unix Timestamp Çevirici",
    pageTitle: "Unix Timestamp və Tarix Çeviricisi",
    description:
      "Unix saniyə və millisaniyəni yerli, UTC və ISO tarixlərinə çevirin.",
    category: "Developer alətləri",
    tags: ["unix", "timestamp", "date", "utc", "iso 8601"],
    icon: Clock3,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/timestamp-converter",
    searchKeywords: [
      "unix timestamp converter",
      "timestamp to date",
      "date to unix",
      "epoch",
    ],
  },
  {
    slug: "url-encoder-decoder",
    title: "URL Encoder, Decoder və Query Parser",
    pageTitle: "URL Encoder, Decoder və Query Parser",
    description:
      "URL komponentlərini çevirin, tam URL-i parse edin və query qurun.",
    category: "Developer alətləri",
    tags: ["url", "encode", "decode", "query", "parser"],
    icon: Link2,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/url-encoder-decoder",
    searchKeywords: [
      "url encoder",
      "url decoder",
      "query parser",
      "urlsearchparams",
    ],
  },
];

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolsByCategory() {
  return toolCategories
    .map((category) => ({
      category,
      tools: tools.filter((tool) => tool.category === category),
    }))
    .filter((group) => group.tools.length > 0);
}

export function searchTools(query: string, source: Tool[] = tools) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return source;
  }

  return source.filter((tool) => {
    const searchable = [
      tool.title,
      tool.description,
      tool.category,
      tool.slug,
      ...tool.tags,
      ...tool.searchKeywords,
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalizedQuery);
  });
}
