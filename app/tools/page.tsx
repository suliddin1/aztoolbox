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
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="text-sm font-semibold text-accent-strong">AzToolbox kataloqu</p>
        <h1 className="mt-3 text-4xl font-bold tracking-normal sm:text-5xl">
          Bütün alətlər
        </h1>
        <p className="mt-4 leading-8 text-muted">
          Məhsuldarlığınızı artırmaq üçün lazım olan rəqəmsal alətlər bir yerdə.
        </p>
      </div>
      <ToolsIndex />
    </div>
  );
}
