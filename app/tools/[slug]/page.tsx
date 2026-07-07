import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { ComponentType } from "react";
import { RecentToolTracker } from "@/components/RecentToolTracker";
import { AzTransliterationTool } from "@/components/tools/AzTransliterationTool";
import { AzerbaijaniKeyboardFixer } from "@/components/tools/AzerbaijaniKeyboardFixer";
import { CvBuilder } from "@/components/tools/CvBuilder";
import { CvPhotoMaker } from "@/components/tools/CvPhotoMaker";
import { DiscountCalculator } from "@/components/tools/DiscountCalculator";
import { GpaCalculator } from "@/components/tools/GpaCalculator";
import { ImageCompressor } from "@/components/tools/ImageCompressor";
import { ImageResizer } from "@/components/tools/ImageResizer";
import { ImageToPdf } from "@/components/tools/ImageToPdf";
import { ImageTools } from "@/components/tools/ImageTools";
import { InvoiceGenerator } from "@/components/tools/InvoiceGenerator";
import { LinkedInHeadlineGenerator } from "@/components/tools/LinkedInHeadlineGenerator";
import { PdfTools } from "@/components/tools/PdfTools";
import { QRCodeGenerator } from "@/components/tools/QRCodeGenerator";
import { TextCleaner } from "@/components/tools/TextCleaner";
import { VatCalculator } from "@/components/tools/VatCalculator";
import { VCardQrGenerator } from "@/components/tools/VCardQrGenerator";
import { WhatsappLinkGenerator } from "@/components/tools/WhatsappLinkGenerator";
import { WordCounter } from "@/components/tools/WordCounter";
import { createMetadata, createToolMetadata } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { getTool, tools, type ToolSlug } from "@/lib/tools";

const toolComponents: Record<ToolSlug, ComponentType> = {
  "az-keyboard-fixer": AzerbaijaniKeyboardFixer,
  "image-tools": ImageTools,
  "image-resizer": ImageResizer,
  "cv-photo-maker": CvPhotoMaker,
  "cv-builder": CvBuilder,
  "image-compressor": ImageCompressor,
  "image-to-pdf": ImageToPdf,
  "pdf-tools": PdfTools,
  "whatsapp-link-generator": WhatsappLinkGenerator,
  "qr-code-generator": QRCodeGenerator,
  "vcard-qr-generator": VCardQrGenerator,
  "invoice-generator": InvoiceGenerator,
  "gpa-calculator": GpaCalculator,
  "vat-calculator": VatCalculator,
  "discount-calculator": DiscountCalculator,
  "linkedin-headline-generator": LinkedInHeadlineGenerator,
  "az-transliteration": AzTransliterationTool,
  "text-cleaner": TextCleaner,
  "word-counter": WordCounter,
};

const fileToolSlugs: ToolSlug[] = [
  "image-tools",
  "image-resizer",
  "cv-photo-maker",
  "image-compressor",
  "image-to-pdf",
  "pdf-tools",
  "invoice-generator",
];

const oldPdfRoutes = new Set(["pdf-merge", "pdf-split", "pdf-organizer", "pdf-organize"]);
const toolkitSlugs = new Set<ToolSlug>(["pdf-tools", "image-tools"]);

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata(props: PageProps<"/tools/[slug]">) {
  const { slug } = await props.params;

  if (oldPdfRoutes.has(slug)) {
    return createMetadata({
      title: "PDF alətləri | AzToolbox",
      description: "Bu PDF aləti artıq PDF alətləri səhifəsindədir.",
      path: "/tools/pdf-tools",
    });
  }

  const tool = getTool(slug);

  if (!tool) {
    return createMetadata({
      title: "Alət tapılmadı | AzToolbox",
      description: "AzToolbox aləti tapılmadı.",
      path: "/tools",
    });
  }

  return createToolMetadata(tool);
}

export default async function ToolPage(props: PageProps<"/tools/[slug]">) {
  const { slug } = await props.params;

  if (oldPdfRoutes.has(slug)) {
    redirect("/tools/pdf-tools");
  }

  const tool = getTool(slug);

  if (!tool) {
    notFound();
  }

  const ToolComponent = toolComponents[tool.slug];
  const usesFiles = fileToolSlugs.includes(tool.slug);
  const privacyText = "Fayllarınız serverə göndərilmir. Əməliyyat brauzerinizdə aparılır.";
  const subtitle =
    tool.slug === "pdf-tools"
      ? "PDF birləşdir, səhifə ayır, səhifələri sil, döndər və sırala — hamısı brauzerində."
      : tool.slug === "image-tools"
        ? "Şəkil ölçüləndir, sıxışdır, CV şəkli hazırla və formatını dəyiş — hamısı brauzerində."
        : tool.description;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.pageTitle,
    description: tool.description,
    url: absoluteUrl(tool.href),
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    inLanguage: siteConfig.language,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: absoluteUrl("/"),
    },
  };

  const sameCategoryTools = tools.filter(
    (item) => item.category === tool.category && item.slug !== tool.slug,
  );
  const fallbackRelatedTools = tools.filter(
    (item) =>
      item.slug !== tool.slug &&
      !sameCategoryTools.some((relatedTool) => relatedTool.slug === item.slug) &&
      (item.isFeatured || item.isPopular),
  );
  const relatedTools = [...sameCategoryTools, ...fallbackRelatedTools].slice(0, 3);
  const ToolIcon = tool.icon;
  const badges = [
    usesFiles ? "Fayllar lokal emal olunur" : "Brauzerdə işləyir",
    "Qeydiyyatsız",
    tool.isLocal ? "Lokal alət" : null,
    toolkitSlugs.has(tool.slug) ? "Pulsuz" : null,
  ].filter((badge): badge is string => Boolean(badge));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-7 rounded-3xl border border-line bg-white/88 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur sm:p-7">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-muted transition hover:border-accent/45 hover:text-accent"
        >
          <ArrowLeft size={15} />
          Alətlərə qayıt
        </Link>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <ToolIcon size={22} />
              </span>
              <p className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
                {tool.category}
              </p>
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-normal sm:text-5xl">
              {tool.pageTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
              {subtitle}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-line bg-white/86 px-3 py-1 text-xs font-semibold text-accent"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface-soft/90 p-4 text-sm leading-6 text-muted">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 shrink-0 text-accent" size={17} />
              <p>
                {usesFiles
                  ? privacyText
                  : "Alət qeydiyyat istəmir və məlumatları yalnız brauzerinizdə emal edir."}
              </p>
            </div>
          </div>
        </div>
      </div>
      <RecentToolTracker slug={tool.slug} />
      <section className="grid gap-4">
        <div>
          <p className="text-sm font-semibold text-accent-strong">İş sahəsi</p>
          <h2 className="mt-2 text-2xl font-bold">Məlumat daxil et və nəticəni hazırla</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Lazım olan məlumatı daxil edin, seçimləri tənzimləyin və nəticəni çıxış panelində yoxlayın.
          </p>
        </div>
        <ToolComponent />
      </section>
      <section className="mt-10">
        <div className="mb-4">
          <p className="text-sm font-semibold text-accent-strong">Oxşar alətlər</p>
          <h2 className="mt-2 text-2xl font-bold">Davam etmək üçün faydalı alətlər</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {relatedTools.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.slug}
                href={item.href}
                className="rounded-2xl border border-line bg-white/82 p-4 shadow-sm transition hover:border-accent/45 hover:bg-white"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon size={18} />
                </span>
                <p className="mt-4 font-bold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
