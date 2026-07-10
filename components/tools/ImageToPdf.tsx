"use client";

import {
  ArrowDown,
  ArrowUp,
  Download,
  ImagePlus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ChangeEvent, useEffect, useRef, useState } from "react";

type SelectedImage = {
  id: string;
  file: File;
  url: string;
};

type PageSize = "a4" | "fit" | "square";
type Orientation = "auto" | "portrait" | "landscape";
type FitMode = "contain" | "cover";

const A4 = { width: 595.28, height: 841.89 };
const SQUARE = { width: 612, height: 612 };

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Şəkil oxuna bilmədi."));
    image.src = url;
  });
}

async function imageToPngBytes(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Şəkil canvas-a çevrilə bilmədi.");
  }

  context.drawImage(image, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) {
    throw new Error("Şəkil PDF üçün hazırlana bilmədi.");
  }

  return new Uint8Array(await blob.arrayBuffer());
}

function getPageSize(
  mode: PageSize,
  orientation: Orientation,
  imageWidth: number,
  imageHeight: number,
) {
  let size =
    mode === "fit"
      ? { width: imageWidth, height: imageHeight }
      : mode === "square"
        ? SQUARE
        : A4;

  if (mode !== "square") {
    if (orientation === "portrait") {
      size = {
        width: Math.min(size.width, size.height),
        height: Math.max(size.width, size.height),
      };
    } else if (orientation === "landscape") {
      size = {
        width: Math.max(size.width, size.height),
        height: Math.min(size.width, size.height),
      };
    } else if (mode === "a4" && imageWidth > imageHeight) {
      size = { width: A4.height, height: A4.width };
    }
  }

  return size;
}

export function ImageToPdf() {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef("");
  const imageUrlsRef = useRef<string[]>([]);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [fitMode, setFitMode] = useState<FitMode>("contain");
  const [resultUrl, setResultUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
      }
    };
  }, []);

  function replaceResultUrl(url: string) {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
    }
    resultUrlRef.current = url;
    setResultUrl(url);
  }

  function clearResult() {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
    }
    resultUrlRef.current = "";
    setResultUrl("");
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError("");
    setSuccess("");
    clearResult();

    const valid = selected.filter((file) => file.type.startsWith("image/"));
    if (!valid.length) {
      setError("JPG, PNG və ya WEBP şəkil faylı seçin.");
      return;
    }

    const nextImages = valid.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));
    imageUrlsRef.current = [
      ...imageUrlsRef.current,
      ...nextImages.map((image) => image.url),
    ];
    setImages((current) => [...current, ...nextImages]);
  }

  function removeImage(id: string) {
    setImages((current) => {
      const removed = current.find((image) => image.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
        imageUrlsRef.current = imageUrlsRef.current.filter(
          (url) => url !== removed.url,
        );
      }
      return current.filter((image) => image.id !== id);
    });
    clearResult();
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) {
        return current;
      }
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    clearResult();
  }

  function clear() {
    images.forEach((image) => URL.revokeObjectURL(image.url));
    imageUrlsRef.current = [];
    setImages([]);
    clearResult();
    setPageSize("a4");
    setOrientation("auto");
    setFitMode("contain");
    setError("");
    setSuccess("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function createPdf() {
    setError("");
    setSuccess("");
    clearResult();

    if (!images.length) {
      setError("PDF yaratmaq üçün ən azı bir şəkil seçin.");
      return;
    }

    setIsProcessing(true);
    try {
      const pdf = await PDFDocument.create();

      for (const item of images) {
        const imageElement = await loadImage(item.url);
        const pngBytes = await imageToPngBytes(imageElement);
        const embedded = await pdf.embedPng(pngBytes);
        const size = getPageSize(
          pageSize,
          orientation,
          imageElement.naturalWidth,
          imageElement.naturalHeight,
        );
        const page = pdf.addPage([size.width, size.height]);
        const ratio =
          fitMode === "cover"
            ? Math.max(
                size.width / embedded.width,
                size.height / embedded.height,
              )
            : Math.min(
                size.width / embedded.width,
                size.height / embedded.height,
              );
        const drawWidth = embedded.width * ratio;
        const drawHeight = embedded.height * ratio;

        page.drawImage(embedded, {
          x: (size.width - drawWidth) / 2,
          y: (size.height - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight,
        });
      }

      const bytes = await pdf.save();
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      replaceResultUrl(URL.createObjectURL(blob));
      setSuccess("PDF hazırdır. İndi yükləyə bilərsiniz.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "PDF yaradıla bilmədi.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-soft p-6 text-center transition hover:border-accent">
          <ImagePlus className="mb-3 text-accent-strong" size={28} />
          <span className="font-semibold">Şəkil seç</span>
          <span className="mt-1 text-sm text-muted">
            JPG, JPEG, PNG və WEBP
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleFiles}
          />
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              PDF ölçüsü
            </label>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(event.target.value as PageSize);
                clearResult();
              }}
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            >
              <option value="a4">A4</option>
              <option value="fit">Şəklə uyğun</option>
              <option value="square">Kvadrat</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Orientasiya
            </label>
            <select
              value={orientation}
              onChange={(event) => {
                setOrientation(event.target.value as Orientation);
                clearResult();
              }}
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            >
              <option value="auto">Auto</option>
              <option value="portrait">Portret</option>
              <option value="landscape">Albom</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Şəkil yerləşməsi
            </label>
            <select
              value={fitMode}
              onChange={(event) => {
                setFitMode(event.target.value as FitMode);
                clearResult();
              }}
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            >
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={createPdf}
            disabled={isProcessing || !images.length}
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isProcessing ? "Yaradılır..." : "PDF yarat"}
          </button>
          {resultUrl ? (
            <a
              href={resultUrl}
              download="aztoolbox-images.pdf"
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
        {success ? (
          <p className="mt-3 text-sm text-accent-strong">{success}</p>
        ) : null}
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">Seçilmiş şəkillər</h2>
        <div className="mt-3 grid gap-3">
          {images.length ? (
            images.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-md border border-line bg-surface-soft p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.file.name}
                  className="h-14 w-14 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-muted">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-muted disabled:opacity-40"
                  title="Yuxarı"
                  aria-label="Şəkli yuxarı daşı"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-muted disabled:opacity-40"
                  title="Aşağı"
                  aria-label="Şəkli aşağı daşı"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(item.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:border-danger hover:text-danger"
                  title="Sil"
                  aria-label="Şəkli siyahıdan sil"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-md border border-line bg-surface-soft p-4 text-sm text-muted">
              Şəkil seçdikdən sonra siyahı burada görünəcək.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
