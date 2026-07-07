"use client";

import { Download, QrCode, RotateCcw } from "lucide-react";
import QRCode from "qrcode";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";

type VCardForm = {
  fullName: string;
  phone: string;
  email: string;
  website: string;
  company: string;
  title: string;
  socialUrl: string;
  address: string;
};

const initialForm: VCardForm = {
  fullName: "",
  phone: "",
  email: "",
  website: "",
  company: "",
  title: "",
  socialUrl: "",
  address: "",
};

function escapeVCard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function buildVCard(form: VCardForm) {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${escapeVCard(form.fullName.trim())}`];
  if (form.company.trim()) lines.push(`ORG:${escapeVCard(form.company.trim())}`);
  if (form.title.trim()) lines.push(`TITLE:${escapeVCard(form.title.trim())}`);
  if (form.phone.trim()) lines.push(`TEL:${escapeVCard(form.phone.trim())}`);
  if (form.email.trim()) lines.push(`EMAIL:${escapeVCard(form.email.trim())}`);
  if (form.website.trim()) lines.push(`URL:${escapeVCard(form.website.trim())}`);
  if (form.socialUrl.trim()) lines.push(`URL:${escapeVCard(form.socialUrl.trim())}`);
  if (form.address.trim()) lines.push(`ADR:;;${escapeVCard(form.address.trim())};;;;`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

export function VCardQrGenerator() {
  const [form, setForm] = useState<VCardForm>(initialForm);
  const [qrUrl, setQrUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const vCard = useMemo(() => buildVCard(form), [form]);

  function updateField(field: keyof VCardForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setQrUrl("");
    setError("");
    setSuccess("");
  }

  async function generate() {
    setError("");
    setSuccess("");
    setQrUrl("");

    if (!form.fullName.trim()) {
      setError("Ad və soyad mütləqdir.");
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      setError("Ən azı telefon və ya email daxil edin.");
      return;
    }

    setIsGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(vCard, {
        width: 768,
        margin: 2,
        color: { dark: "#17211d", light: "#ffffff" },
      });
      setQrUrl(dataUrl);
      setSuccess("Vizitka QR kodu hazırdır.");
    } catch {
      setError("QR kod yaradıla bilmədi.");
    } finally {
      setIsGenerating(false);
    }
  }

  function clear() {
    setForm(initialForm);
    setQrUrl("");
    setError("");
    setSuccess("");
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["fullName", "Full name"],
            ["phone", "Phone"],
            ["email", "Email"],
            ["website", "Website"],
            ["company", "Company / project"],
            ["title", "Job title"],
            ["socialUrl", "Instagram və ya LinkedIn URL"],
            ["address", "Address"],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="mb-2 block text-sm font-semibold">{label}</label>
              <input value={form[field as keyof VCardForm]} onChange={(event) => updateField(field as keyof VCardForm, event.target.value)} className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent" />
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={generate} disabled={isGenerating} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55"><QrCode size={16} />{isGenerating ? "Yaradılır..." : "QR yarat"}</button>
          <CopyButton value={vCard} label="vCard mətni kopyala" disabled={!qrUrl} />
          <button type="button" onClick={clear} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent"><RotateCcw size={16} />Təmizlə</button>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-accent-strong">{success}</p> : null}
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 text-center shadow-sm">
        <h2 className="font-semibold">QR preview</h2>
        <div className="mt-4 flex min-h-80 items-center justify-center rounded-lg border border-line bg-surface-soft p-5">
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="vCard QR kod" className="h-64 w-64 rounded-md bg-white p-2 shadow-sm" />
          ) : (
            <p className="max-w-sm text-muted">Məlumatları daxil edib QR yaradın.</p>
          )}
        </div>
        {qrUrl ? (
          <a href={qrUrl} download="aztoolbox-vcard-qr.png" className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"><Download size={16} />PNG yüklə</a>
        ) : null}
        <pre className="mt-4 max-h-48 overflow-auto rounded-md border border-line bg-surface-soft p-3 text-left text-xs text-muted">
          {vCard}
        </pre>
      </div>
    </section>
  );
}
