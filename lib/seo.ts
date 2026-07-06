import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";
import type { Tool } from "@/lib/tools";

type SeoInput = {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
};

const toolSeo: Partial<Record<Tool["slug"], { title: string; description: string }>> = {
  "az-keyboard-fixer": {
    title: "Azərbaycan klaviatura düzəldici | AzToolbox",
    description: "m'n bel' yaz;ram tipli Azərbaycan klaviatura səhvlərini tez düzəldin.",
  },
  "az-transliteration": {
    title: "Azərbaycan hərf düzəldici | AzToolbox",
    description: "Azerbaycanca yazılmış latın mətni Azərbaycan hərflərinə yaxınlaşdırın.",
  },
  "image-tools": {
    title: "Şəkil alətləri | Ölçüləndir, sıxışdır, CV şəkli hazırla | AzToolbox",
    description:
      "Şəkilləri ölçüləndirin, sıxışdırın, formatını dəyişin və CV üçün hazırlayın.",
  },
  "image-resizer": {
    title: "Şəkil ölçüləndirici | AzToolbox",
    description: "Şəkilləri sosial media, CV və profil ölçülərinə uyğun ölçüləndirin.",
  },
  "image-compressor": {
    title: "Şəkil sıxışdırıcı | AzToolbox",
    description: "Şəkil fayl ölçüsünü brauzerinizdə azaldın və yeni faylı yükləyin.",
  },
  "image-to-pdf": {
    title: "Şəkli PDF et | AzToolbox",
    description: "JPG, PNG və WEBP şəkilləri brauzerinizdə tək PDF faylına çevirin.",
  },
  "pdf-tools": {
    title: "PDF alətləri | Birləşdir, ayır, sil, döndər | AzToolbox",
    description:
      "PDF fayllarını brauzerinizdə birləşdirin, səhifə ayırın, silin, döndərin və təşkil edin.",
  },
  "cv-photo-maker": {
    title: "CV şəkli hazırlayıcı | AzToolbox",
    description: "CV, LinkedIn və profil üçün kvadrat və 3x4 ölçüdə şəkil hazırlayın.",
  },
  "cv-builder": {
    title: "CV hazırlayıcı | Pulsuz PDF CV generator | AzToolbox",
    description: "Tələbələr və junior developer-lər üçün sadə, təmiz PDF CV hazırlayın.",
  },
  "linkedin-headline-generator": {
    title: "LinkedIn headline generator | AzToolbox",
    description: "AI API olmadan LinkedIn profiliniz üçün təmiz headline variantları yaradın.",
  },
  "whatsapp-link-generator": {
    title: "WhatsApp link generator | AzToolbox",
    description: "Nömrə və mesaj daxil edin, paylaşılabilən WhatsApp linki yaradın.",
  },
  "qr-code-generator": {
    title: "QR kod generator | AzToolbox",
    description: "Link, mətn, WhatsApp və Wi-Fi məlumatı üçün QR kod hazırlayın.",
  },
  "vcard-qr-generator": {
    title: "Rəqəmsal vizitka QR generator | AzToolbox",
    description: "Telefonlarda kontakt kimi yadda saxlanan vCard QR kodu yaradın.",
  },
  "invoice-generator": {
    title: "Qəbz / invoice generator | AzToolbox",
    description: "Freelancer və kiçik bizneslər üçün brauzerdə sadə PDF qəbz yaradın.",
  },
  "vat-calculator": {
    title: "ƏDV kalkulyatoru | AzToolbox",
    description: "18% ƏDV əlavə edin və ya qiymətin içindən ƏDV məbləğini çıxarın.",
  },
  "discount-calculator": {
    title: "Endirim / faiz kalkulyatoru | AzToolbox",
    description: "Endirim, faiz payı və artım/azalma faizini tez hesablayın.",
  },
  "gpa-calculator": {
    title: "GPA / ortalama kalkulyatoru | AzToolbox",
    description: "Kredit və ballara görə çəkili semestr ortalamasını hesablayın.",
  },
  "text-cleaner": {
    title: "Mətn təmizləyici | AzToolbox",
    description: "Kopyalanmış qarışıq mətni qaydaya salın, boşluqları və formatı təmizləyin.",
  },
  "word-counter": {
    title: "Söz və simvol sayğacı | AzToolbox",
    description: "Söz, simvol, cümlə, abzas və təxmini oxuma vaxtını hesablayın.",
  },
};

export function createMetadata({
  title = siteConfig.defaultTitle,
  description = siteConfig.defaultDescription,
  path = "/",
  keywords,
}: SeoInput = {}): Metadata {
  const url = absoluteUrl(path);
  const image = absoluteUrl(siteConfig.ogImage);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      siteName: siteConfig.name,
      title,
      description,
      type: "website",
      locale: siteConfig.locale,
      url,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: "AzToolbox preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function createToolMetadata(tool: Tool): Metadata {
  const custom = toolSeo[tool.slug];
  const title = custom?.title ?? `${tool.pageTitle} | AzToolbox`;
  const description = custom?.description ?? tool.description;

  return createMetadata({
    title,
    description,
    path: tool.href,
    keywords: [...tool.tags, ...tool.searchKeywords],
  });
}
