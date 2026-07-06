import {
  BadgeInfo,
  BriefcaseBusiness,
  Calculator,
  FileText,
  GraduationCap,
  Image,
  Images,
  Keyboard,
  Languages,
  MessageCircle,
  Percent,
  QrCode,
  ScanLine,
  Shrink,
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
  | "word-counter";

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
    searchKeywords: ["azerbaycan klaviatura", "azeri keyboard", "yanlış klaviatura", "mətni düzəlt"],
  },
  {
    slug: "image-tools",
    title: "Şəkil alətləri",
    pageTitle: "Şəkil alətləri",
    description: "Şəkil ölçüləndir, sıxışdır, CV şəkli hazırla və format çevir.",
    category: "Şəkil alətləri",
    tags: ["şəkil", "resize", "compress", "cv", "format", "converter"],
    icon: Image,
    isFeatured: true,
    isLocal: true,
    isPopular: true,
    href: "/tools/image-tools",
    searchKeywords: ["image tools", "şəkil alətləri", "image resizer", "image compressor", "format converter", "cv photo"],
  },
  {
    slug: "az-transliteration",
    title: "Azərbaycan hərf düzəldici",
    pageTitle: "Azərbaycan hərf düzəldici",
    description: "Azerbaycanca yazılmış latın mətni Azərbaycan hərflərinə yaxınlaşdırın.",
    category: "Azərbaycan dili",
    tags: ["azərbaycan dili", "transliterasiya", "hərf", "mətn"],
    icon: Languages,
    isFeatured: true,
    isLocal: true,
    isPopular: false,
    href: "/tools/az-transliteration",
    searchKeywords: ["azerbaycan transliteration", "azerbaycan herf", "latin to azerbaijani", "men yaxsiyam", "cox sag ol"],
  },
  {
    slug: "image-resizer",
    title: "Şəkil ölçüləndirici",
    pageTitle: "Şəkil ölçüləndirici",
    description: "Şəkilləri sosial media, CV və profil ölçülərinə uyğunlaşdırın.",
    category: "Şəkil alətləri",
    tags: ["şəkil", "resize", "ölçü", "profil"],
    icon: Image,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/image-resizer",
    searchKeywords: ["image resizer", "photo resize", "şəkil ölçüsü", "instagram ölçü"],
  },
  {
    slug: "cv-photo-maker",
    title: "CV şəkli hazırlayıcı",
    pageTitle: "CV şəkli hazırlayıcı",
    description: "CV, LinkedIn və profil üçün təmiz kvadrat və 3x4 şəkil hazırlayın.",
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
    description: "Tələbə və junior developer üçün sadə, təmiz CV PDF-i yaradın.",
    category: "CV və karyera",
    tags: ["cv", "resume", "pdf", "karyera", "tələbə"],
    icon: FileText,
    isFeatured: true,
    isLocal: true,
    isPopular: false,
    href: "/tools/cv-builder",
    searchKeywords: ["cv builder", "resume builder", "cv hazırla", "pdf cv", "developer cv"],
  },
  {
    slug: "image-compressor",
    title: "Şəkil sıxışdırıcı",
    pageTitle: "Şəkil sıxışdırıcı",
    description: "Şəkil ölçüsünü email, forma və sayt yükləmələri üçün azaldın.",
    category: "Şəkil alətləri",
    tags: ["şəkil", "compress", "sıxışdır", "ölçü azalt"],
    icon: Shrink,
    isFeatured: false,
    isLocal: true,
    isPopular: true,
    href: "/tools/image-compressor",
    searchKeywords: ["image compressor", "photo compress", "şəkil kiçilt", "fayl ölçüsü azalt"],
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
    searchKeywords: ["image to pdf", "jpg to pdf", "png to pdf", "şəkildən pdf"],
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
    searchKeywords: ["pdf merge", "pdf split", "pdf organizer", "pdf birləşdir", "pdf ayır"],
  },
  {
    slug: "whatsapp-link-generator",
    title: "WhatsApp link generator",
    pageTitle: "WhatsApp link generator",
    description: "Nömrə və hazır mesajla paylaşılabilən WhatsApp linki yaradın.",
    category: "Biznes alətləri",
    tags: ["whatsapp", "link", "mesaj", "biznes"],
    icon: MessageCircle,
    isFeatured: true,
    isLocal: true,
    isPopular: false,
    href: "/tools/whatsapp-link-generator",
    searchKeywords: ["whatsapp link", "wa.me", "whatsapp mesaj", "biznes nömrə"],
  },
  {
    slug: "qr-code-generator",
    title: "QR kod generator",
    pageTitle: "QR kod generator",
    description: "Link, mətn, WhatsApp və Wi-Fi məlumatı üçün QR kod hazırlayın.",
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
    description: "Telefonlarda kontakt kimi yadda saxlanan vCard QR kodu yaradın.",
    category: "Biznes alətləri",
    tags: ["vcard", "vizitka", "qr", "kontakt"],
    icon: BadgeInfo,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/vcard-qr-generator",
    searchKeywords: ["vcard qr", "digital business card", "vizitka qr", "kontakt qr"],
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
    searchKeywords: ["invoice generator", "qəbz yarat", "faktura", "pdf invoice"],
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
    searchKeywords: ["edv kalkulyator", "vat calculator", "18 faiz", "ədv hesabla"],
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
    searchKeywords: ["discount calculator", "faiz kalkulyator", "endirim hesabla", "percentage change"],
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
    searchKeywords: ["linkedin headline", "linkedin bio", "cv headline", "karyera profil"],
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
    searchKeywords: ["text cleaner", "mətn düzəlt", "formatla", "boşluq təmizlə"],
  },
  {
    slug: "word-counter",
    title: "Söz və simvol sayğacı",
    pageTitle: "Söz və simvol sayğacı",
    description: "Söz, simvol, cümlə, abzas və təxmini oxuma vaxtını hesablayın.",
    category: "Tələbə alətləri",
    tags: ["söz", "simvol", "sayğac", "mətn", "oxuma vaxtı"],
    icon: ScanLine,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/word-counter",
    searchKeywords: ["word counter", "character counter", "söz sayı", "simvol sayı"],
  },
  {
    slug: "gpa-calculator",
    title: "GPA / ortalama kalkulyatoru",
    pageTitle: "GPA / ortalama kalkulyatoru",
    description: "Kredit və ballara görə çəkili semestr ortalamasını hesablayın.",
    category: "Tələbə alətləri",
    tags: ["gpa", "ortalama", "kredit", "bal", "tələbə"],
    icon: GraduationCap,
    isFeatured: false,
    isLocal: true,
    isPopular: false,
    href: "/tools/gpa-calculator",
    searchKeywords: ["gpa calculator", "ortalama kalkulyator", "kredit bal", "semester average"],
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
