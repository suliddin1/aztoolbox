"use client";

import { Copy, Download, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import {
  base64ToBytes,
  base64ToText,
  bytesToBase64,
  parseDataUrl,
  textToBase64,
  toBase64Url,
} from "@/lib/base64";
import {
  copyText,
  downloadBlob,
  downloadText,
  formatBytes,
} from "@/lib/browser/download";
import {
  FilePicker,
  inputClass,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  textareaClass,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

type Mode =
  | "text-encode"
  | "text-decode"
  | "file-base64"
  | "file-data-url"
  | "decode-file";

const labels: Record<Mode, string> = {
  "text-encode": "Mətn → Base64",
  "text-decode": "Base64 → mətn",
  "file-base64": "Fayl → Base64",
  "file-data-url": "Fayl → Data URL",
  "decode-file": "Base64/Data URL → fayl",
};

export function Base64Tool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("text-encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState("decoded-file.bin");
  const [mimeType, setMimeType] = useState("application/octet-stream");
  const [decodedBlob, setDecodedBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function invalidate() {
    setOutput("");
    setDecodedBlob(null);
    setError("");
    setSuccess("");
  }

  function changeMode(next: Mode) {
    setMode(next);
    setInput("");
    setFile(null);
    invalidate();
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    setFile(selected);
    invalidate();
  }

  async function process() {
    setIsProcessing(true);
    setError("");
    setSuccess("");
    setOutput("");
    setDecodedBlob(null);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    try {
      if (mode === "text-encode") {
        setOutput(textToBase64(input, urlSafe));
      } else if (mode === "text-decode") {
        setOutput(base64ToText(input, urlSafe));
      } else if (mode === "file-base64" || mode === "file-data-url") {
        if (!file) throw new Error("Əvvəlcə fayl seçin.");
        let encoded = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
        if (urlSafe && mode === "file-base64") encoded = toBase64Url(encoded);
        setOutput(
          mode === "file-data-url"
            ? `data:${file.type || "application/octet-stream"};base64,${encoded}`
            : encoded,
        );
      } else {
        if (!input.trim()) throw new Error("Base64 və ya Data URL daxil edin.");
        let data = input;
        let detectedMime = mimeType;
        if (/^data:/i.test(input.trim())) {
          const parsed = parseDataUrl(input);
          data = parsed.data;
          detectedMime = parsed.mimeType;
          setMimeType(detectedMime);
        }
        const blob = new Blob([base64ToBytes(data, urlSafe)], {
          type: detectedMime || "application/octet-stream",
        });
        setDecodedBlob(blob);
      }
      setSuccess("Çevirmə tamamlandı.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Base64 çevirməsi alınmadı.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function reset() {
    setInput("");
    setOutput("");
    setFile(null);
    setDecodedBlob(null);
    setFilename("decoded-file.bin");
    setMimeType("application/octet-stream");
    setError("");
    setSuccess("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const fileInputMode = mode === "file-base64" || mode === "file-data-url";
  const decodeFileMode = mode === "decode-file";

  return (
    <div className="grid gap-5">
      <ToolCard>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(labels) as Mode[]).map((item) => (
            <button
              key={item}
              type="button"
              className={
                mode === item ? primaryButtonClass : secondaryButtonClass
              }
              onClick={() => changeMode(item)}
            >
              {labels[item]}
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface-soft p-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={urlSafe}
            disabled={mode === "file-data-url"}
            onChange={(event) => {
              setUrlSafe(event.target.checked);
              invalidate();
            }}
          />
          Base64URL formatı (- və _, padding-siz)
        </label>
        {mode === "file-data-url" ? (
          <p className="mt-2 text-xs text-muted">
            Data URL standart Base64 sintaksisi tələb etdiyi üçün bu rejimdə
            Base64URL tətbiq edilmir.
          </p>
        ) : null}
        {fileInputMode ? (
          <div className="mt-4">
            <FilePicker
              inputRef={inputRef}
              accept="*/*"
              title={file ? "Başqa fayl seç" : "Fayl seç"}
              hint="İstənilən binar fayl"
              onChange={handleFile}
            />
            {file ? (
              <p className="mt-2 rounded-xl bg-surface-soft p-3 text-sm">
                <strong>{file.name}</strong> · {formatBytes(file.size)} ·{" "}
                {file.type || "MIME naməlum"}
              </p>
            ) : null}
          </div>
        ) : (
          <label className="mt-4 block text-sm font-semibold">
            {mode === "text-encode"
              ? "Unicode mətn"
              : mode === "text-decode"
                ? "Base64 mətni"
                : "Base64 və ya Data URL"}
            <textarea
              className={`${textareaClass} mt-2 min-h-56`}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                invalidate();
              }}
              spellCheck={false}
              placeholder={
                mode === "text-encode"
                  ? "Azərbaycan mətnini daxil edin"
                  : "Base64 mətni yapışdırın"
              }
            />
          </label>
        )}
        {decodeFileMode ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Fayl adı
              <input
                className={`${inputClass} mt-2`}
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
              />
            </label>
            <label className="text-sm font-semibold">
              MIME type
              <input
                className={`${inputClass} mt-2`}
                value={mimeType}
                onChange={(event) => setMimeType(event.target.value)}
                placeholder="application/octet-stream"
              />
            </label>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={process}
            disabled={isProcessing || (fileInputMode ? !file : !input)}
          >
            {isProcessing ? "Çevrilir..." : "Çevir"}
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={reset}
          >
            <RotateCcw size={16} />
            Təmizlə
          </button>
          {decodedBlob ? (
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() =>
                downloadBlob(decodedBlob, filename || "decoded-file.bin")
              }
            >
              <Download size={16} />
              Faylı yüklə
            </button>
          ) : null}
        </div>
        <StatusMessage error={error} success={success} />
        <div className="mt-4">
          <PrivacyNotice />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          Böyük fayllar yaddaşda binar və Base64 surətlərini eyni vaxtda saxlaya
          bilər. Çox böyük fayllarda brauzer yaddaş limitini nəzərə alın;
          çevirmə massivləri funksiya arqumentlərinə yaymadan hissələrlə
          aparılır.
        </p>
      </ToolCard>
      <ToolCard title="Nəticə">
        {output ? (
          <>
            <textarea
              className={`${textareaClass} min-h-72`}
              value={output}
              readOnly
              spellCheck={false}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => copyText(output)}
              >
                <Copy size={16} />
                Kopyala
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() =>
                  downloadText(
                    output,
                    mode === "file-data-url"
                      ? "data-url.txt"
                      : mode === "text-decode"
                        ? "decoded-text.txt"
                        : "base64.txt",
                  )
                }
              >
                <Download size={16} />
                TXT yüklə
              </button>
            </div>
          </>
        ) : decodedBlob ? (
          <p className="rounded-xl bg-accent-soft p-4 text-sm text-accent-strong">
            Fayl hazırdır: {filename} · {mimeType} ·{" "}
            {formatBytes(decodedBlob.size)}
          </p>
        ) : (
          <p className="rounded-xl bg-surface-soft p-5 text-center text-sm text-muted">
            Çevirmə nəticəsi burada görünəcək.
          </p>
        )}
      </ToolCard>
    </div>
  );
}
