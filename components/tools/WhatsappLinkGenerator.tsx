"use client";

import { ExternalLink, Link2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";

const examples = [
  "Salam, qiymət barədə məlumat almaq istəyirəm.",
  "Salam, görüş üçün vaxt bron etmək istəyirəm.",
  "Salam, sifariş vermək istəyirəm.",
];

export function normalizeAzerbaijaniPhone(value: string) {
  const digits = value.replace(/[^\d]/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("994") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `994${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `994${digits}`;
  }

  return digits;
}

export function isValidAzerbaijaniWhatsappNumber(value: string) {
  const normalized = normalizeAzerbaijaniPhone(value);
  return normalized.length === 12 && normalized.startsWith("994");
}

export function buildWhatsappLink(phone: string, message: string) {
  const normalized = normalizeAzerbaijaniPhone(phone);
  if (!normalized || !isValidAzerbaijaniWhatsappNumber(phone)) {
    return "";
  }

  const encodedMessage = encodeURIComponent(message.trim());
  return `https://wa.me/${normalized}${encodedMessage ? `?text=${encodedMessage}` : ""}`;
}

export function WhatsappLinkGenerator() {
  const [phone, setPhone] = useState("+994");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [status, setStatus] = useState("");
  const normalized = useMemo(() => normalizeAzerbaijaniPhone(phone), [phone]);
  const isValid = isValidAzerbaijaniWhatsappNumber(phone);
  const generatedLink = hasGenerated && isValid ? buildWhatsappLink(phone, message) : "";

  function generate() {
    setTouched(true);
    setStatus("");
    setHasGenerated(false);

    if (!phone.trim()) {
      setStatus("Telefon nömrəsi mütləqdir.");
      return;
    }

    if (!isValid) {
      setStatus("Nömrəni 0501234567, 501234567 və ya +994501234567 formatında daxil edin.");
      return;
    }

    setHasGenerated(true);
    setStatus("Link hazırdır.");
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-4">
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-semibold">
              Telefon nömrəsi
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setTouched(true);
                setStatus("");
              }}
              onBlur={() => setTouched(true)}
              placeholder="+994501234567"
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            />
            {touched && phone.trim() && !isValid ? (
              <p className="mt-2 text-sm text-danger">
                Azərbaycan nömrəsini 0501234567, 501234567, 994501234567 və ya
                +994501234567 formatında daxil edin.
              </p>
            ) : null}
            {normalized && isValid ? (
              <p className="mt-2 text-sm text-muted">
                Beynəlxalq format: {normalized}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block text-sm font-semibold">
              Mesaj
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setStatus(hasGenerated ? "Link yeniləndi." : "");
              }}
              rows={6}
              placeholder="Müştərinin WhatsApp-da görəcəyi hazır mesaj..."
              className="w-full resize-y rounded-md border border-line bg-white p-3 leading-7 outline-none transition focus:border-accent"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Nümunə mesajlar</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  type="button"
                  key={example}
                  onClick={() => {
                    setMessage(example);
                    setStatus(hasGenerated ? "Link yeniləndi." : "");
                  }}
                  className="rounded-md border border-line bg-surface px-3 py-2 text-left text-sm transition hover:border-accent"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={generate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            <Link2 size={16} />
            Link yarat
          </button>
          {status ? (
            <p className={`text-sm ${generatedLink ? "text-accent-strong" : "text-danger"}`}>
              {status}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">Yaradılmış link</h2>
        <div className="mt-4 min-h-32 rounded-md border border-line bg-surface-soft p-4">
          {generatedLink ? (
            <p className="break-all font-mono text-sm text-accent-strong">
              {generatedLink}
            </p>
          ) : (
            <p className="text-muted">
              Nömrəni düzgün daxil edib “Link yarat” düyməsinə basın. Link
              burada görünəcək.
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyButton value={generatedLink} label="Linki kopyala" />
          <a
            href={generatedLink || undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!generatedLink}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <ExternalLink size={16} />
            WhatsApp-da aç
          </a>
        </div>
        <div className="mt-5 rounded-md bg-accent-soft p-4 text-sm text-accent-strong">
          <Link2 className="mb-2" size={18} />
          Boşluq, tire və mötərizələr avtomatik təmizlənir.
        </div>
      </div>
    </section>
  );
}
