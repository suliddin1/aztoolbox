import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { NewToolSlug } from "@/lib/tool-content";

const newToolComponents: Record<NewToolSlug, ComponentType> = {
  "pdf-to-image": dynamic(() =>
    import("@/components/tools/PdfToImage").then((module) => module.PdfToImage),
  ),
  "pdf-watermark": dynamic(() =>
    import("@/components/tools/PdfWatermark").then(
      (module) => module.PdfWatermark,
    ),
  ),
  "pdf-page-numbers": dynamic(() =>
    import("@/components/tools/PdfPageNumbers").then(
      (module) => module.PdfPageNumbers,
    ),
  ),
  "pdf-signature": dynamic(() =>
    import("@/components/tools/PdfSignature").then(
      (module) => module.PdfSignature,
    ),
  ),
  "pdf-metadata-cleaner": dynamic(() =>
    import("@/components/tools/PdfMetadataCleaner").then(
      (module) => module.PdfMetadataCleaner,
    ),
  ),
  "image-metadata-remover": dynamic(() =>
    import("@/components/tools/ImageMetadataRemover").then(
      (module) => module.ImageMetadataRemover,
    ),
  ),
  "color-palette-extractor": dynamic(() =>
    import("@/components/tools/ColorPaletteExtractor").then(
      (module) => module.ColorPaletteExtractor,
    ),
  ),
  "favicon-generator": dynamic(() =>
    import("@/components/tools/FaviconGenerator").then(
      (module) => module.FaviconGenerator,
    ),
  ),
  "svg-optimizer": dynamic(() =>
    import("@/components/tools/SvgOptimizer").then(
      (module) => module.SvgOptimizer,
    ),
  ),
  "qr-scanner": dynamic(() =>
    import("@/components/tools/QrScanner").then((module) => module.QrScanner),
  ),
  "text-diff": dynamic(() =>
    import("@/components/tools/TextDiff").then((module) => module.TextDiff),
  ),
  "az-cyrillic-latin": dynamic(() =>
    import("@/components/tools/AzCyrillicLatin").then(
      (module) => module.AzCyrillicLatin,
    ),
  ),
  "number-to-words-az": dynamic(() =>
    import("@/components/tools/NumberToWordsAz").then(
      (module) => module.NumberToWordsAz,
    ),
  ),
  "az-iban-validator": dynamic(() =>
    import("@/components/tools/AzIbanValidator").then(
      (module) => module.AzIbanValidator,
    ),
  ),
  "json-formatter": dynamic(() =>
    import("@/components/tools/JsonFormatter").then(
      (module) => module.JsonFormatter,
    ),
  ),
  base64: dynamic(() =>
    import("@/components/tools/Base64Tool").then((module) => module.Base64Tool),
  ),
  "jwt-decoder": dynamic(() =>
    import("@/components/tools/JwtDecoder").then((module) => module.JwtDecoder),
  ),
  "uuid-generator": dynamic(() =>
    import("@/components/tools/UuidGenerator").then(
      (module) => module.UuidGenerator,
    ),
  ),
  "timestamp-converter": dynamic(() =>
    import("@/components/tools/TimestampConverter").then(
      (module) => module.TimestampConverter,
    ),
  ),
  "url-encoder-decoder": dynamic(() =>
    import("@/components/tools/UrlEncoderDecoder").then(
      (module) => module.UrlEncoderDecoder,
    ),
  ),
};

export function NewToolRenderer({ slug }: { slug: NewToolSlug }) {
  const Component = newToolComponents[slug];
  return <Component />;
}
