import type { Metadata } from "next";
import Link from "next/link";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Məxfilik | AzToolbox",
  description:
    "AzToolbox məxfilik prinsipləri və client-side fayl emalı haqqında məlumat.",
  path: "/privacy",
  keywords: ["AzToolbox məxfilik", "client-side fayl emalı", "localStorage"],
});

const sections = [
  {
    title: "Fayllar necə emal olunur?",
    body: [
      "AzToolbox mümkün olduğu qədər faylları brauzerinizdə emal edir və serverə göndərmir.",
      "Şəkil alətləri brauzer canvas imkanlarından istifadə edir. PDF alətləri hazırkı versiyada client-side brauzer kitabxanaları ilə işləyir. Mətn alətləri isə daxil etdiyiniz mətni brauzerinizdə emal edir.",
      "Hazırkı versiyada alət nəticələrinin database-də saxlanması nəzərdə tutulmayıb.",
    ],
  },
  {
    title: "Nə saxlanılır?",
    body: [
      "Favorit alətlər və son istifadə edilən alətlər yalnız brauzerinizin localStorage sahəsində saxlanıla bilər.",
      "Bu məlumatlar cihazınızda qalır və login hesabı yaradılmır.",
      "Brauzer məlumatlarını təmizləsəniz, favorit və son istifadə siyahısı da silinə bilər.",
    ],
  },
  {
    title: "Nə saxlanılmır?",
    body: [
      "Yüklədiyiniz faylların serverdə saxlanması nəzərdə tutulmayıb.",
      "CV və invoice kimi alətlərə yazdığınız mətn serverə göndərilmək üçün saxlanmır.",
      "AzToolbox hazırkı versiyada authentication profili yaratmır.",
    ],
  },
  {
    title: "Limitlər",
    body: [
      "Çox böyük fayllar brauzerdə emal olunduğu üçün yavaş işləyə və cihaz resurslarından asılı ola bilər.",
      "Yaradılan PDF, CV, invoice və digər sənədləri rəsmi istifadə etməzdən əvvəl yoxlamağınız tövsiyə olunur.",
      "Kalkulyatorlar məlumat xarakterlidir və hüquqi, maliyyə və ya mühasibat məsləhəti sayılmır.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-accent-strong">Məxfilik</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal">
          Məxfilik
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted">
          AzToolbox mümkün olduğu qədər faylları brauzerinizdə emal edir və
          serverə göndərmir.
        </p>
      </div>

      <div className="mt-10 grid gap-5">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-lg border border-line bg-surface p-6 shadow-sm"
          >
            <h2 className="text-2xl font-semibold">{section.title}</h2>
            <div className="mt-3 grid gap-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="leading-7 text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-lg border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Əlaqə və feedback</h2>
          <p className="mt-3 max-w-4xl leading-7 text-muted">
            Problem bildirmək, yeni alət təklif etmək və ya məxfilik mesajı ilə
            bağlı qeyd göndərmək üçün feedback composer-dən istifadə edə
            bilərsiniz.
          </p>
          <Link
            href="/feedback"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Feedback səhifəsinə keç
          </Link>
        </section>
      </div>
    </div>
  );
}
