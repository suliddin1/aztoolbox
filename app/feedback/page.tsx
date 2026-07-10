import type { Metadata } from "next";
import { FeedbackComposer } from "@/components/FeedbackComposer";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Feedback və alət təklifi | AzToolbox",
  description:
    "AzToolbox üçün problem, təklif və yeni alət ideyası mətni hazırlayın.",
  path: "/feedback",
  keywords: ["AzToolbox feedback", "alət təklifi", "problem bildirmək"],
});

export default function FeedbackPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold text-accent-strong">Feedback</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal">
          Feedback və alət təklifi
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted">
          Problem bildirmək, yeni alət təklif etmək və ya istifadə rahatlığı ilə
          bağlı qeyd hazırlamaq üçün bu composer-dən istifadə edin. Mesaj
          serverə göndərilmir.
        </p>
      </div>
      <FeedbackComposer />
    </div>
  );
}
