"use client";

import { ArrowDown, ArrowUp, Download, FileText, RotateCcw, RotateCw, Trash2, Undo2 } from "lucide-react";
import { degrees, PDFDocument } from "pdf-lib";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ImageToPdf } from "@/components/tools/ImageToPdf";
import { PdfMerge } from "@/components/tools/PdfMerge";
import { PdfSplit } from "@/components/tools/PdfSplit";

type Tab = "merge" | "split" | "organize" | "image";

type PageItem = {
  id: string;
  originalIndex: number;
  label: string;
  rotation: number;
  deleted: boolean;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function pdfBytesToBlob(bytes: Uint8Array) {
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: "application/pdf" });
}

function PdfOrganizer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef("");
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
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
      const pageCount = pdf.getPageCount();
      setFile(selected);
      setPages(
        Array.from({ length: pageCount }, (_, index) => ({
          id: crypto.randomUUID(),
          originalIndex: index,
          label: `Səhifə ${index + 1}`,
          rotation: 0,
          deleted: false,
        })),
      );
    } catch {
      setError("PDF oxuna bilmədi. Fayl şifrəli və ya zədələnmiş ola bilər.");
      setFile(null);
      setPages([]);
    }
  }

  function updatePages(nextPages: PageItem[]) {
    setPages(nextPages);
    setError("");
    setSuccess("");
    clearResult();
  }

  function movePage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= pages.length) {
      return;
    }
    const next = [...pages];
    [next[index], next[target]] = [next[target], next[index]];
    updatePages(next);
  }

  function rotatePage(id: string) {
    updatePages(
      pages.map((page) =>
        page.id === id ? { ...page, rotation: (page.rotation + 90) % 360 } : page,
      ),
    );
  }

  function toggleDelete(id: string) {
    updatePages(
      pages.map((page) =>
        page.id === id ? { ...page, deleted: !page.deleted } : page,
      ),
    );
  }

  function clear() {
    setFile(null);
    setPages([]);
    clearResult();
    setError("");
    setSuccess("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function createOrganizedPdf() {
    setError("");
    setSuccess("");
    clearResult();

    if (!file) {
      setError("Əvvəlcə PDF faylı seçin.");
      return;
    }

    const selectedPages = pages.filter((page) => !page.deleted);
    if (!selectedPages.length) {
      setError("Yeni PDF üçün ən azı bir səhifə saxlanmalıdır.");
      return;
    }

    setIsProcessing(true);
    try {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const output = await PDFDocument.create();

      for (const item of selectedPages) {
        const [copiedPage] = await output.copyPages(source, [item.originalIndex]);
        const currentAngle = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees((currentAngle + item.rotation) % 360));
        output.addPage(copiedPage);
      }

      const bytes = await output.save();
      replaceResultUrl(URL.createObjectURL(pdfBytesToBlob(bytes)));
      setSuccess("Yeni PDF hazırdır.");
    } catch {
      setError("Yeni PDF yaradıla bilmədi.");
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
          <span className="mt-1 text-sm text-muted">Səhifələri sırala, sil və döndər</span>
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
              {formatFileSize(file.size)} · {pages.length} səhifə
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={createOrganizedPdf}
            disabled={isProcessing || !file || !pages.some((page) => !page.deleted)}
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isProcessing ? "Yaradılır..." : "Yeni PDF yarat"}
          </button>
          {resultUrl ? (
            <a
              href={resultUrl}
              download="aztoolbox-organized.pdf"
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
        <h2 className="font-semibold">Səhifələr</h2>
        <div className="mt-3 grid gap-3">
          {pages.length ? (
            pages.map((page, index) => (
              <div
                key={page.id}
                className={`flex flex-wrap items-center gap-3 rounded-md border p-3 ${
                  page.deleted
                    ? "border-danger/30 bg-red-50 text-muted"
                    : "border-line bg-surface-soft"
                }`}
              >
                <div className="min-w-32 flex-1">
                  <p className="font-semibold">{page.label}</p>
                  <p className="text-xs text-muted">
                    {page.rotation ? `${page.rotation}° döndürülüb` : "Döndürülməyib"}
                    {page.deleted ? " · çıxarılacaq" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => movePage(index, -1)}
                  disabled={index === 0}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-muted disabled:opacity-40"
                  title="Yuxarı"
                  aria-label="Səhifəni yuxarı daşı"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => movePage(index, 1)}
                  disabled={index === pages.length - 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-muted disabled:opacity-40"
                  title="Aşağı"
                  aria-label="Səhifəni aşağı daşı"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => rotatePage(page.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:border-accent hover:text-accent-strong"
                  title="90° döndər"
                  aria-label="Səhifəni 90 dərəcə döndər"
                >
                  <RotateCw size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleDelete(page.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:border-danger hover:text-danger"
                  title={page.deleted ? "Geri qaytar" : "Səhifəni sil"}
                  aria-label={page.deleted ? "Səhifəni geri qaytar" : "Səhifəni sil"}
                >
                  {page.deleted ? <Undo2 size={15} /> : <Trash2 size={15} />}
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-md border border-line bg-surface-soft p-4 text-sm text-muted">
              PDF seçdikdən sonra səhifə siyahısı burada görünəcək.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function PdfTools() {
  const [activeTab, setActiveTab] = useState<Tab>("merge");

  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-line bg-surface p-2 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["merge", "Birləşdir"],
            ["split", "Səhifə ayır"],
            ["organize", "Səhifələri təşkil et"],
            ["image", "Şəkli PDF et"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as Tab)}
              className={`h-11 rounded-md px-3 text-sm font-semibold transition ${
                activeTab === value
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:bg-surface-soft hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "merge" ? <PdfMerge /> : null}
      {activeTab === "split" ? <PdfSplit /> : null}
      {activeTab === "organize" ? <PdfOrganizer /> : null}
      {activeTab === "image" ? <ImageToPdf /> : null}
    </div>
  );
}
