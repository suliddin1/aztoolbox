import type { Metadata } from "next";
import { ToolsIndex } from "@/components/ToolsIndex";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Bütün alətlər | AzToolbox",
  description:
    "PDF, şəkil, CV, QR, WhatsApp, mətn, biznes və tələbə alətlərini bir yerdə istifadə edin.",
  path: "/tools",
  keywords: ["bütün alətlər", "PDF alətləri", "şəkil alətləri", "CV", "QR", "biznes alətləri"],
});

export default function ToolsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accent-strong">AzToolbox kataloqu</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
          Alətlər
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Axtarın, kateqoriya seçin və gündəlik iş üçün lazım olan aləti açın.
        </p>
      </div>
      <ToolsIndex />
    </div>
  );
}
