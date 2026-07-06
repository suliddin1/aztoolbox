export const siteConfig = {
  name: "AzToolbox",
  defaultTitle: "AzToolbox — Azərbaycan üçün pulsuz mini alətlər",
  defaultDescription:
    "CV, PDF, şəkil, WhatsApp, QR, qəbz, mətn və tələbə alətləri — qeydiyyatsız və mümkün olduqca brauzerinizdə.",
  locale: "az_AZ",
  language: "az",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://aztoolbox.vercel.app",
  ogImage: "/og-image.svg",
};

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, siteConfig.siteUrl).toString();
}
