import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Code2, GraduationCap, Store, UserRound } from "lucide-react";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "AzToolbox nədir? | AzToolbox",
  description: "AzToolbox haqqında: Azərbaycan üçün pulsuz, praktik və sürətli mini alət platforması.",
  path: "/about",
  keywords: ["AzToolbox haqqında", "Azərbaycan mini alətlər", "pulsuz alətlər"],
});

const audiences = [
  {
    title: "Tələbələr",
    description: "CV, GPA, mətn və gündəlik fayl işlərini tez hazırlamaq üçün.",
    icon: GraduationCap,
  },
  {
    title: "Freelancerlər",
    description: "Qəbz, portfolio, LinkedIn və müştəri üçün fayl işlərini sadələşdirmək üçün.",
    icon: UserRound,
  },
  {
    title: "Developerlər",
    description: "QR, mətn, link və karyera alətlərini bir yerdə istifadə etmək üçün.",
    icon: Code2,
  },
  {
    title: "Kiçik bizneslər",
    description: "WhatsApp linki, ƏDV, endirim və sadə invoice işləri üçün.",
    icon: Store,
  },
  {
    title: "Gündəlik istifadəçilər",
    description: "PDF, şəkil, mətn və QR kimi kiçik işləri sürətli həll etmək üçün.",
    icon: BriefcaseBusiness,
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-accent-strong">Haqqında</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal">
          AzToolbox nədir?
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted">
          AzToolbox Azərbaycan-first mini alət platformasıdır. Məqsəd pulsuz,
          praktik və sürətli alətlərlə gündəlik rəqəmsal işləri daha rahat
          etməkdir.
        </p>
      </div>

      <div className="mt-10 grid gap-5">
        <section className="rounded-lg border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Niyə AzToolbox?</h2>
          <p className="mt-3 max-w-4xl leading-7 text-muted">
            Bir çox istifadəçiyə CV hazırlamaq, PDF birləşdirmək, şəkil
            ölçüləndirmək, WhatsApp linki yaratmaq, QR kod hazırlamaq, mətn
            təmizləmək, qəbz düzəltmək və tələbə/biznes hesablamaları aparmaq
            üçün tez açılan sadə alətlər lazımdır. AzToolbox bu işləri bir
            yerdə toplamağa çalışır.
          </p>
        </section>

        <section className="rounded-lg border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Fərqimiz nədir?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Azərbaycan dili və lokal ehtiyaclara fokus",
              "Qeydiyyatsız istifadə",
              "Mümkün olduqca client-side processing",
              "Sadə və sürətli alətlər",
            ].map((item) => (
              <div key={item} className="rounded-md border border-line bg-surface-soft p-4 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Kimlər üçün faydalıdır?</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {audiences.map((audience) => {
              const Icon = audience.icon;

              return (
                <div key={audience.title} className="rounded-lg border border-line bg-surface p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface-soft text-accent-strong">
                    <Icon size={19} />
                  </div>
                  <h3 className="mt-4 font-semibold">{audience.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{audience.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Hazırkı məqsəd</h2>
          <p className="mt-3 max-w-4xl leading-7 text-muted">
            AzToolbox-un məqsədi Azərbaycanca gündəlik rəqəmsal işləri daha
            sürətli və rahat etməkdir.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/tools" className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong">
              Alətlərə bax
            </Link>
            <Link href="/privacy" className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent">
              Məxfilik
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
