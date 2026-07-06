import Link from "next/link";
import { ArrowRight, Lock, Search, ShieldCheck, Zap } from "lucide-react";
import { HomeDiscovery } from "@/components/HomeDiscovery";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "AzToolbox - Azərbaycanca gündəlik alətlər",
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
      <section className="relative overflow-hidden border-b border-line bg-[radial-gradient(circle_at_top_left,rgba(18,113,91,0.10),transparent_34%),linear-gradient(180deg,#f8fbf9_0%,#ffffff_100%)]">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <p className="inline-flex rounded-md border border-line bg-white px-3 py-1 text-sm font-semibold text-accent-strong shadow-sm">
              AzToolbox
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              Azərbaycanca gündəlik işləri 10 saniyəyə həll et
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              CV, PDF, şəkil, WhatsApp, QR, qəbz və mətn alətləri - qeydiyyatsız,
              reklamsız və mümkün olduqca brauzerində.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#tools"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                Alətləri aç
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/tools"
                className="inline-flex h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent-strong"
              >
                Bütün alətlər
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-foreground p-4 text-white shadow-[0_28px_90px_rgba(23,33,29,0.22)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  AzToolbox
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Alət axtarışı</h2>
              </div>
              <span className="rounded-md border border-white/10 px-3 py-1 font-mono text-xs text-white/65">
                19 alət
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                "Azərbaycan klaviatura düzəldici",
                "PDF alətləri",
                "Şəkil alətləri",
                "WhatsApp link generator",
                "Qəbz / invoice generator",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <span className="font-semibold">{item}</span>
                  <span className="font-mono text-xs text-white/45">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {["Tez", "Lokal", "Tap"].map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <Search className="text-white/50" size={17} />
                  <p className="mt-4 font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HomeDiscovery />

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-3 rounded-lg border border-line bg-surface p-4 shadow-sm sm:grid-cols-3">
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
