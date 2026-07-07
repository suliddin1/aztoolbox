"use client";

import { ArrowDown, ArrowUp, Download, FileText, RotateCcw, Trash2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ChangeEvent, useEffect, useRef, useState } from "react";

type SelectedPdf = {
  id: string;
  file: File;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function PdfMerge() {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef("");
  const [files, setFiles] = useState<SelectedPdf[]>([]);
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

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError("");
    setSuccess("");
    clearResult();

    const invalid = selected.find((file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"));
    if (invalid) {
      setError("Yalnız PDF faylları seçin.");
      return;
    }

    if (!selected.length) {
      return;
    }

    setFiles((current) => [
      ...current,
      ...selected.map((file) => ({ id: crypto.randomUUID(), file })),
    ]);
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((file) => file.id !== id));
    clearResult();
  }

  function moveFile(index: number, direction: -1 | 1) {
    setFiles((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    clearResult();
  }

  function clear() {
    setFiles([]);
    clearResult();
    setError("");
    setSuccess("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function merge() {
    setError("");
    setSuccess("");
    clearResult();

    if (files.length < 2) {
      setError("Zəhmət olmasa birləşdirmək üçün ən azı 2 PDF seçin.");
      return;
    }

    setIsProcessing(true);
    try {
      const merged = await PDFDocument.create();

      for (const item of files) {
        const source = await PDFDocument.load(await item.file.arrayBuffer());
        const pages = await merged.copyPages(source, source.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }

      const bytes = await merged.save();
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      replaceResultUrl(URL.createObjectURL(blob));
      setSuccess("PDF-lər birləşdirildi.");
    } catch {
      setError("PDF-ləri birləşdirmək mümkün olmadı. Fayllar şifrəli və ya zədələnmiş ola bilər.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-soft p-6 text-center transition hover:border-accent">
          <FileText className="mb-3 text-accent-strong" size={28} />
          <span className="font-semibold">PDF faylları seç</span>
          <span className="mt-1 text-sm text-muted">Ən azı 2 PDF faylı lazımdır</span>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="sr-only"
            onChange={handleFiles}
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={merge}
            disabled={isProcessing || files.length < 2}
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isProcessing ? "Birləşdirilir..." : "PDF-ləri birləşdir"}
          </button>
          {resultUrl ? (
            <a
              href={resultUrl}
              download="aztoolbox-merged.pdf"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
            >
              <Download size={16} />
              Birləşmiş PDF-i yüklə
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
        <h2 className="font-semibold">Seçilmiş PDF-lər</h2>
        <div className="mt-3 grid gap-3">
          {files.length ? (
            files.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 rounded-md border border-line bg-surface-soft p-3">
                <FileText className="text-accent-strong" size={24} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.file.name}</p>
                  <p className="text-xs text-muted">{formatFileSize(item.file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => moveFile(index, -1)}
                  disabled={index === 0}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-muted disabled:opacity-40"
                  title="Yuxarı"
                  aria-label="PDF-i yuxarı daşı"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => moveFile(index, 1)}
                  disabled={index === files.length - 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-muted disabled:opacity-40"
                  title="Aşağı"
                  aria-label="PDF-i aşağı daşı"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:border-danger hover:text-danger"
                  title="Sil"
                  aria-label="PDF-i siyahıdan sil"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-md border border-line bg-surface-soft p-4 text-sm text-muted">
              PDF seçdikdən sonra siyahı burada görünəcək.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
