"use client";

import { Download, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/browser/download";
import {
  FilePicker,
  inputClass,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

type MetadataForm = {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
};

const emptyMetadata: MetadataForm = {
  title: "",
  author: "",
  subject: "",
  keywords: "",
  creator: "",
  producer: "",
  creationDate: "",
  modificationDate: "",
};

function dateInput(value: Date | undefined) {
  if (!value || Number.isNaN(value.getTime())) return "";
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export function PdfMetadataCleaner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef("");
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<MetadataForm>(emptyMetadata);
  const [pageCount, setPageCount] = useState(0);
  const [resultUrl, setResultUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(
    () => () => {
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    },
    [],
  );

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResultUrl("");
    setSuccess("");
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    setError("");
    clearResult();
    if (!selected) return;
    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Yalnız PDF faylı seçin.");
      return;
    }
    setIsProcessing(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.load(await selected.arrayBuffer(), {
        updateMetadata: false,
      });
      setFile(selected);
      setPageCount(pdf.getPageCount());
      setMetadata({
        title: pdf.getTitle() ?? "",
        author: pdf.getAuthor() ?? "",
        subject: pdf.getSubject() ?? "",
        keywords: pdf.getKeywords() ?? "",
        creator: pdf.getCreator() ?? "",
        producer: pdf.getProducer() ?? "",
        creationDate: dateInput(pdf.getCreationDate()),
        modificationDate: dateInput(pdf.getModificationDate()),
      });
    } catch {
      setFile(null);
      setPageCount(0);
      setMetadata(emptyMetadata);
      setError(
        "PDF metadata-sı oxuna bilmədi. Fayl şifrəli və ya zədələnmiş ola bilər.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function update(key: keyof MetadataForm, value: string) {
    setMetadata((current) => ({ ...current, [key]: value }));
    clearResult();
  }

  async function exportPdf() {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setError("");
    clearResult();
    try {
      const { PDFDocument, PDFDict, PDFName } = await import("pdf-lib");
      const pdf = await PDFDocument.load(await file.arrayBuffer(), {
        updateMetadata: false,
      });
      const infoRef = pdf.context.trailerInfo.Info;
      if (infoRef) {
        const info = pdf.context.lookup(infoRef, PDFDict);
        [
          "Title",
          "Author",
          "Subject",
          "Keywords",
          "Creator",
          "Producer",
          "CreationDate",
          "ModDate",
        ].forEach((key) => info.delete(PDFName.of(key)));
      }
      if (metadata.title.trim())
        pdf.setTitle(metadata.title.trim(), { showInWindowTitleBar: false });
      if (metadata.author.trim()) pdf.setAuthor(metadata.author.trim());
      if (metadata.subject.trim()) pdf.setSubject(metadata.subject.trim());
      if (metadata.keywords.trim())
        pdf.setKeywords(
          metadata.keywords
            .split(/[,;]/)
            .map((item) => item.trim())
            .filter(Boolean),
        );
      if (metadata.creator.trim()) pdf.setCreator(metadata.creator.trim());
      if (metadata.producer.trim()) pdf.setProducer(metadata.producer.trim());
      if (metadata.creationDate)
        pdf.setCreationDate(new Date(metadata.creationDate));
      if (metadata.modificationDate)
        pdf.setModificationDate(new Date(metadata.modificationDate));
      const bytes = await pdf.save({ updateFieldAppearances: false });
      const blob = new Blob(
        [
          bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ) as ArrayBuffer,
        ],
        { type: "application/pdf" },
      );
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
      setSuccess("Metadata seçimlərinizlə yeni PDF hazırdır.");
    } catch {
      setError("Təmizlənmiş PDF yaradıla bilmədi.");
    } finally {
      setIsProcessing(false);
    }
  }

  function reset() {
    setFile(null);
    setMetadata(emptyMetadata);
    setPageCount(0);
    setError("");
    clearResult();
    if (inputRef.current) inputRef.current.value = "";
  }

  const textFields: Array<{
    key: keyof MetadataForm;
    label: string;
    placeholder: string;
  }> = [
    { key: "title", label: "Başlıq", placeholder: "Title" },
    { key: "author", label: "Müəllif", placeholder: "Author" },
    { key: "subject", label: "Mövzu", placeholder: "Subject" },
    { key: "keywords", label: "Açar sözlər", placeholder: "Vergüllə ayırın" },
    { key: "creator", label: "Yaradan proqram", placeholder: "Creator" },
    { key: "producer", label: "PDF producer", placeholder: "Producer" },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
      <ToolCard title="PDF seçin">
        <FilePicker
          inputRef={inputRef}
          accept="application/pdf,.pdf"
          title={file ? "Başqa PDF seç" : "PDF seç"}
          hint="Görünən səhifə məzmunu saxlanılır"
          onChange={handleFile}
        />
        {file ? (
          <p className="mt-3 rounded-xl bg-surface-soft p-3 text-sm">
            <strong>{file.name}</strong>
            <br />
            <span className="text-muted">
              {formatBytes(file.size)} · {pageCount} səhifə
            </span>
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={exportPdf}
            disabled={!file || isProcessing}
          >
            {isProcessing ? "Emal olunur..." : "Təmiz surət yarat"}
          </button>
          {resultUrl ? (
            <a
              href={resultUrl}
              download="metadata-cleaned-document.pdf"
              className={secondaryButtonClass}
            >
              <Download size={16} />
              PDF yüklə
            </a>
          ) : null}
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => {
              setMetadata(emptyMetadata);
              clearResult();
            }}
            disabled={!file}
          >
            <Trash2 size={16} />
            Bütün sahələri sil
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={reset}
          >
            <RotateCcw size={16} />
            Təmizlə
          </button>
        </div>
        <StatusMessage error={error} success={success} />
        <div className="mt-4">
          <PrivacyNotice />
        </div>
      </ToolCard>
      <ToolCard title="Metadata sahələri">
        {file ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {textFields.map((field) => (
              <label key={field.key} className="text-sm font-semibold">
                {field.label}
                <input
                  className={`${inputClass} mt-2`}
                  value={metadata[field.key]}
                  onChange={(event) => update(field.key, event.target.value)}
                  placeholder={field.placeholder}
                />
              </label>
            ))}
            <label className="text-sm font-semibold">
              Yaradılma tarixi
              <input
                className={`${inputClass} mt-2`}
                type="datetime-local"
                value={metadata.creationDate}
                onChange={(event) => update("creationDate", event.target.value)}
              />
            </label>
            <label className="text-sm font-semibold">
              Dəyişdirilmə tarixi
              <input
                className={`${inputClass} mt-2`}
                type="datetime-local"
                value={metadata.modificationDate}
                onChange={(event) =>
                  update("modificationDate", event.target.value)
                }
              />
            </label>
          </div>
        ) : (
          <p className="rounded-xl bg-surface-soft p-5 text-center text-sm text-muted">
            PDF seçildikdə tapılan metadata burada görünəcək.
          </p>
        )}
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Bəzi qeyri-adi daxili XMP blokları, əlavələr və xüsusi obyekt
          metadata-sı hər brauzer PDF kitabxanası ilə tam silinməyə bilər. Bu
          alət zəmanətli forensik metadata təmizlənməsi iddiası etmir.
        </p>
      </ToolCard>
    </div>
  );
}
