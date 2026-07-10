"use client";

import { Download, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import {
  buildWhatsappLink,
  isValidAzerbaijaniWhatsappNumber,
} from "@/components/tools/WhatsappLinkGenerator";

type QrType = "link" | "text" | "whatsapp" | "wifi";
type WifiSecurity = "WPA" | "WEP" | "nopass";
type QrSize = 256 | 512 | 1024;

function escapeWifi(value: string) {
  return value.replace(/([\\;,":])/g, "\\$1");
}

function buildWifiPayload(
  ssid: string,
  password: string,
  security: WifiSecurity,
) {
  if (security === "nopass") {
    return `WIFI:T:nopass;S:${escapeWifi(ssid)};;`;
  }

  return `WIFI:T:${security};S:${escapeWifi(ssid)};P:${escapeWifi(password)};;`;
}

export function QRCodeGenerator() {
  const [type, setType] = useState<QrType>("link");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [phone, setPhone] = useState("+994");
  const [message, setMessage] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState<WifiSecurity>("WPA");
  const [size, setSize] = useState<QrSize>(512);
  const [qrUrl, setQrUrl] = useState("");
  const [encodedContent, setEncodedContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const content = useMemo(() => {
    if (type === "link") {
      return url.trim();
    }
    if (type === "text") {
      return text.trim();
    }
    if (type === "whatsapp") {
      return buildWhatsappLink(phone, message);
    }
    return ssid.trim() ? buildWifiPayload(ssid, password, security) : "";
  }, [message, password, phone, security, ssid, text, type, url]);

  function resetGenerated() {
    setQrUrl("");
    setEncodedContent("");
    setError("");
    setSuccess("");
  }

  function validate() {
    if (type === "link") {
      if (!url.trim()) {
        return "Link daxil edin.";
      }
      if (!/^https?:\/\/.+/i.test(url.trim())) {
        return "Link http:// və ya https:// ilə başlamalıdır.";
      }
    }

    if (type === "text" && !text.trim()) {
      return "Mətn daxil edin.";
    }

    if (type === "whatsapp") {
      if (!phone.trim()) {
        return "Telefon nömrəsi daxil edin.";
      }
      if (!isValidAzerbaijaniWhatsappNumber(phone)) {
        return "WhatsApp üçün düzgün Azərbaycan nömrəsi daxil edin.";
      }
    }

    if (type === "wifi") {
      if (!ssid.trim()) {
        return "Wi-Fi adı (SSID) daxil edin.";
      }
      if (security !== "nopass" && !password.trim()) {
        return "Wi-Fi şifrəsini daxil edin və ya 'No password' seçin.";
      }
    }

    return "";
  }

  async function generate() {
    setError("");
    setSuccess("");
    setQrUrl("");
    setEncodedContent("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(content, {
        width: size,
        margin: 2,
        color: {
          dark: "#17211d",
          light: "#ffffff",
        },
      });
      setQrUrl(dataUrl);
      setEncodedContent(content);
      setSuccess("QR kod hazırdır.");
    } catch {
      setError("QR kod yaradıla bilmədi.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["link", "Link"],
            ["text", "Mətn"],
            ["whatsapp", "WhatsApp"],
            ["wifi", "Wi-Fi"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setType(value as QrType);
                resetGenerated();
              }}
              className={`h-10 rounded-md border text-sm font-semibold transition ${
                type === value
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-surface hover:border-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {type === "link" ? (
          <div>
            <label className="mb-2 block text-sm font-semibold">URL</label>
            <input
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                resetGenerated();
              }}
              placeholder="https://aztoolbox.az"
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            />
          </div>
        ) : null}

        {type === "text" ? (
          <div>
            <label className="mb-2 block text-sm font-semibold">Mətn</label>
            <textarea
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                resetGenerated();
              }}
              rows={7}
              placeholder="QR kodda saxlanılacaq mətn..."
              className="w-full resize-y rounded-md border border-line bg-white p-3 leading-7 outline-none transition focus:border-accent"
            />
          </div>
        ) : null}

        {type === "whatsapp" ? (
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Telefon
              </label>
              <input
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  resetGenerated();
                }}
                placeholder="+994501234567"
                className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Mesaj</label>
              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  resetGenerated();
                }}
                rows={5}
                placeholder="Hazır WhatsApp mesajı..."
                className="w-full resize-y rounded-md border border-line bg-white p-3 leading-7 outline-none transition focus:border-accent"
              />
            </div>
          </div>
        ) : null}

        {type === "wifi" ? (
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold">SSID</label>
              <input
                value={ssid}
                onChange={(event) => {
                  setSsid(event.target.value);
                  resetGenerated();
                }}
                placeholder="Wi-Fi adı"
                className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Təhlükəsizlik
                </label>
                <select
                  value={security}
                  onChange={(event) => {
                    setSecurity(event.target.value as WifiSecurity);
                    resetGenerated();
                  }}
                  className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">No password</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Şifrə
                </label>
                <input
                  value={password}
                  disabled={security === "nopass"}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    resetGenerated();
                  }}
                  placeholder="Wi-Fi şifrəsi"
                  className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent disabled:bg-surface-soft"
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold">QR ölçüsü</label>
          <select
            value={size}
            onChange={(event) => {
              setSize(Number(event.target.value) as QrSize);
              resetGenerated();
            }}
            className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
          >
            <option value={256}>256 x 256</option>
            <option value={512}>512 x 512</option>
            <option value={1024}>1024 x 1024</option>
          </select>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={isGenerating}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
        >
          <QrCode size={16} />
          {isGenerating ? "Yaradılır..." : "QR kod yarat"}
        </button>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {success ? (
          <p className="mt-3 text-sm text-accent-strong">{success}</p>
        ) : null}
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 text-center shadow-sm">
        <h2 className="font-semibold">QR preview</h2>
        <div className="mt-4 flex min-h-80 items-center justify-center rounded-lg border border-line bg-surface-soft p-5">
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrUrl}
              alt="QR kod"
              className="h-64 w-64 rounded-md bg-white p-2 shadow-sm"
            />
          ) : (
            <p className="max-w-sm text-muted">
              Məlumatları daxil edib QR kod yaradın. Nəticə burada görünəcək.
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <CopyButton
            value={encodedContent}
            label="Məzmunu kopyala"
            disabled={!qrUrl}
          />
          {qrUrl ? (
            <a
              href={qrUrl}
              download="aztoolbox-qr.png"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
            >
              <Download size={16} />
              PNG yüklə
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
