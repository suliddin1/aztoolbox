"use client";

import { Download, FileText, RotateCcw } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ChangeEvent, useEffect, useRef, useState } from "react";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function parsePageRange(value: string, total: number) {
  const pages = new Set<number>();
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);

  if (!parts.length) {
    throw new Error("Səhifə aralığını daxil edin.");
  }

  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const page = Number(part);
      if (page < 1 || page > total) {
        throw new Error(`Səhifə nömrəsi 1 ilə ${total} arasında olmalıdır.`);
      }
      pages.add(page - 1);
      continue;
    }

    const match = part.match(/^(\d+)-(\d+)$/);
    if (!match) {
      throw new Error("Format düzgün deyil. Məsələn: 1-3, 5, 8-10");
    }

    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start > end) {
      throw new Error("Aralıqda başlanğıc səhifə son səhifədən böyük ola bilməz.");
    }
    if (start < 1 || end > total) {
      throw new Error(`Səhifələr 1 ilə ${total} arasında olmalıdır.`);
    }
    for (let page = start; page <= end; page += 1) {
      pages.add(page - 1);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export function PdfSplit() {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef("");
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [range, setRange] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
      }
    };
  }, []);

  function clearResult() {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
    }
    resultUrlRef.current = "";
    setResultUrl("");
  }

  function replaceResultUrl(url: string) {
    clearResult();
    resultUrlRef.current = url;
    setResultUrl(url);
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";
    setError("");
    setSuccess("");
    clearResult();

    if (!selected) {
      return;
    }

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Yalnız PDF faylı seçin.");
      return;
    }

    try {
      const pdf = await PDFDocument.load(await selected.arrayBuffer());
      setFile(selected);
      setPageCount(pdf.getPageCount());
      setRange("");
    } catch {
      setError("PDF oxuna bilmədi. Fayl şifrəli və ya zədələnmiş ola bilər.");
      setFile(null);
      setPageCount(0);
    }
  }

  function clear() {
    setFile(null);
    setPageCount(0);
    setRange("");
    clearResult();
    setError("");
    setSuccess("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function extract() {
    setError("");
    setSuccess("");
    clearResult();

    if (!file) {
      setError("Əvvəlcə PDF faylı seçin.");
      return;
    }

    if (!range.trim()) {
      setError("Səhifə aralığını daxil edin.");
      return;
    }

    setIsProcessing(true);
    try {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const indices = parsePageRange(range, source.getPageCount());
      const output = await PDFDocument.create();
      const pages = await output.copyPages(source, indices);
      pages.forEach((page) => output.addPage(page));
      const bytes = await output.save();
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      replaceResultUrl(URL.createObjectURL(blob));
      setSuccess(`${indices.length} səhifə çıxarıldı.`);
    } catch (extractError) {
      setError(extractError instanceof Error ? extractError.message : "Səhifələr çıxarıla bilmədi.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-soft p-6 text-center transition hover:border-accent">
          <FileText className="mb-3 text-accent-strong" size={28} />
          <span className="font-semibold">PDF faylı seç</span>
          <span className="mt-1 text-sm text-muted">Bir PDF faylından səhifə çıxarın</span>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={handleFile}
          />
        </label>

        {file ? (
          <div className="mt-4 rounded-md border border-line bg-surface-soft p-4 text-sm">
            <p className="font-semibold">{file.name}</p>
            <p className="mt-1 text-muted">
              {formatFileSize(file.size)} · {pageCount} səhifə
            </p>
          </div>
        ) : null}

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold">Səhifə aralığı</label>
          <input
            value={range}
            onChange={(event) => {
              setRange(event.target.value);
              clearResult();
              setError("");
              setSuccess("");
            }}
            placeholder="1-3, 5, 8-10"
            className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
          />
          <p className="mt-2 text-sm text-muted">Məsələn: 1-3, 5, 8-10</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={extract}
            disabled={isProcessing || !file || !range.trim()}
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isProcessing ? "Çıxarılır..." : "Səhifələri çıxart"}
          </button>
          {resultUrl ? (
            <a
              href={resultUrl}
              download="aztoolbox-extracted.pdf"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
            >
              <Download size={16} />
              PDF yüklə
            </a>
          ) : null}
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent"
          >
            <RotateCcw size={16} />
            Təmizlə
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-accent-strong">{success}</p> : null}
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">Necə işləyir?</h2>
        <div className="mt-3 rounded-md border border-line bg-surface-soft p-4 text-sm leading-6 text-muted">
          <p>
            Tək səhifə üçün <span className="font-mono text-foreground">1</span>,
            aralıq üçün <span className="font-mono text-foreground">1-3</span>,
            qarışıq seçim üçün{" "}
            <span className="font-mono text-foreground">1-3,7,10-12</span>{" "}
            yazın.
          </p>
        </div>
      </div>
    </section>
  );
}
