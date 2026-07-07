import { Lock, Search, ShieldCheck, Zap } from "lucide-react";
import { HomeDiscovery } from "@/components/HomeDiscovery";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "AzToolbox — Azərbaycanca gündəlik alətlər",
  description:
    "CV, PDF, şəkil, WhatsApp, QR, qəbz və mətn alətləri - qeydiyyatsız, reklamsız və mümkün olduqca brauzerində.",
  path: "/",
});

const trustItems = [
  { title: "Qeydiyyat tələb olunmur", icon: ShieldCheck },
  { title: "Fayllar serverə göndərilmir", icon: Lock },
  { title: "Alətlər brauzerdə işləyir", icon: Zap },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-transparent">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-8 pt-16 text-center sm:px-6 lg:px-8 lg:pb-12 lg:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-sm font-semibold text-muted shadow-sm">
            <Search size={15} className="text-accent" />
            Sürətli, lokal və qeydiyyatsız
          </p>
          <h1 className="mt-7 max-w-4xl text-4xl font-bold leading-[1.08] tracking-normal text-foreground sm:text-5xl lg:text-6xl">
            Azərbaycanca gündəlik işləri 10 saniyəyə həll et
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            CV, PDF, şəkil, WhatsApp, QR, qəbz və mətn alətləri - qeydiyyatsız,
            reklamsız və mümkün olduqca brauzerində.
          </p>
          <div className="mt-8 inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-white/92 px-4 py-2 text-sm font-medium text-muted shadow-sm">
            <ShieldCheck size={16} className="shrink-0 text-accent" />
            Alətlərin çoxu brauzerinizdə işləyir. Fayllarınız serverə yüklənmir.
          </div>
        </div>
      </section>

      <HomeDiscovery />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-3 rounded-2xl border border-line bg-white/82 p-3 shadow-sm sm:grid-cols-3">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-md border border-line bg-surface-soft px-4 py-3"
              >
                <Icon className="text-accent-strong" size={18} />
                <span className="text-sm font-semibold">{item.title}</span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
