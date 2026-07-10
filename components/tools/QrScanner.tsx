"use client";

import {
  Camera,
  CameraOff,
  Clipboard,
  Copy,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { copyText } from "@/lib/browser/download";
import { decodeImage, imageDimensions } from "@/lib/image-tools";
import { detectQrResult, type QrResult } from "@/lib/qr-result";
import {
  FilePicker,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
};

function getBarcodeDetector() {
  return (
    globalThis as typeof globalThis & {
      BarcodeDetector?: BarcodeDetectorConstructor;
    }
  ).BarcodeDetector;
}

async function decodeCanvas(canvas: HTMLCanvasElement) {
  const Detector = getBarcodeDetector();
  if (Detector) {
    try {
      const results = await new Detector({ formats: ["qr_code"] }).detect(
        canvas,
      );
      const value = results[0]?.rawValue;
      if (value) return value;
    } catch {
      // Continue with the local pixel decoder.
    }
  }
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const jsQR = (await import("jsqr")).default;
  return (
    jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    })?.data ?? null
  );
}

export function QrScanner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef(0);
  const scanBusyRef = useRef(false);
  const lastScanRef = useRef(0);
  const [result, setResult] = useState<QrResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const handlePastedFile = useEffectEvent((file: Blob) => {
    void scanBlob(file);
  });

  function stopCamera() {
    cancelAnimationFrame(animationRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    scanBusyRef.current = false;
  }

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const item = [...(event.clipboardData?.items ?? [])].find((entry) =>
        entry.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (file) handlePastedFile(file);
    }
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
      stopCamera();
    };
  }, []);

  function applyResult(value: string) {
    setResult(detectQrResult(value));
    setSuccess("QR kod uğurla oxundu.");
    setError("");
  }

  async function scanBlob(blob: Blob) {
    setIsProcessing(true);
    setError("");
    setSuccess("");
    setResult(null);
    try {
      const image = await decodeImage(blob);
      const size = imageDimensions(image);
      const maxSide = 2_000;
      const ratio = Math.min(1, maxSide / Math.max(size.width, size.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(size.width * ratio));
      canvas.height = Math.max(1, Math.round(size.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Şəkil canvas-a çəkilə bilmədi.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if ("close" in image) image.close();
      const value = await decodeCanvas(canvas);
      if (!value) throw new Error("Şəkildə oxuna bilən QR kod tapılmadı.");
      applyResult(value);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "QR kod oxuna bilmədi.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("QR kod olan şəkil faylı seçin.");
      return;
    }
    void scanBlob(file);
  }

  async function readClipboard() {
    setError("");
    try {
      if (!navigator.clipboard?.read)
        throw new Error(
          "Panodan şəkil oxuma bu brauzerdə dəstəklənmir. Şəkli Ctrl+V ilə yapışdırın.",
        );
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((value) => value.startsWith("image/"));
        if (type) {
          await scanBlob(await item.getType(type));
          return;
        }
      }
      throw new Error("Panoda şəkil tapılmadı.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Pano oxuna bilmədi.",
      );
    }
  }

  async function scanVideoFrame(time: number) {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    if (
      !scanBusyRef.current &&
      video.readyState >= 2 &&
      time - lastScanRef.current > 180
    ) {
      scanBusyRef.current = true;
      lastScanRef.current = time;
      try {
        const maxSide = 1_000;
        const ratio = Math.min(
          1,
          maxSide / Math.max(video.videoWidth, video.videoHeight),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(video.videoWidth * ratio));
        canvas.height = Math.max(1, Math.round(video.videoHeight * ratio));
        canvas
          .getContext("2d")
          ?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const value = await decodeCanvas(canvas);
        if (value) {
          applyResult(value);
          stopCamera();
          return;
        }
      } finally {
        scanBusyRef.current = false;
      }
    }
    animationRef.current = requestAnimationFrame(scanVideoFrame);
  }

  async function startCamera(mode = facingMode) {
    stopCamera();
    setError("");
    setSuccess("");
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Canlı kamera bu brauzerdə və ya təhlükəsiz bağlantıda dəstəklənmir.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setFacingMode(mode);
      setIsCameraActive(true);
      animationRef.current = requestAnimationFrame(scanVideoFrame);
    } catch {
      stopCamera();
      setError(
        "Kamera açıla bilmədi. İcazəni və brauzerin təhlükəsiz bağlantısını yoxlayın.",
      );
    }
  }

  async function switchCamera() {
    const next = facingMode === "environment" ? "user" : "environment";
    await startCamera(next);
  }

  function reset() {
    stopCamera();
    setResult(null);
    setError("");
    setSuccess("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
      <ToolCard title="QR mənbəyi">
        <FilePicker
          inputRef={inputRef}
          accept="image/*"
          title="QR şəkli seç"
          hint="PNG, JPG, WebP və digər brauzer şəkilləri"
          onChange={handleFile}
        />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={readClipboard}
            disabled={isProcessing}
          >
            <Clipboard size={16} />
            Panodan şəkil oxu
          </button>
          {isCameraActive ? (
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={stopCamera}
            >
              <CameraOff size={16} />
              Kameranı dayandır
            </button>
          ) : (
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => startCamera()}
            >
              <Camera size={16} />
              Kameranı aç
            </button>
          )}
        </div>
        {isCameraActive ? (
          <button
            type="button"
            className={`${secondaryButtonClass} mt-2 w-full`}
            onClick={switchCamera}
          >
            <RefreshCw size={16} />
            Ön/arxa kameranı dəyiş
          </button>
        ) : null}
        <button
          type="button"
          className={`${secondaryButtonClass} mt-2 w-full`}
          onClick={reset}
        >
          <RotateCcw size={16} />
          Təmizlə
        </button>
        <StatusMessage error={error} success={success} />
        <div className="mt-4">
          <PrivacyNotice />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          Panodan oxuma icazəsi yoxdursa, səhifə açıq ikən şəkli Ctrl+V ilə
          yapışdırın. Kamera yalnız siz başladanda açılır və dayandırıldıqda
          bütün track-lər bağlanır.
        </p>
      </ToolCard>
      <div className="grid gap-5">
        <ToolCard title="Canlı kamera">
          <div className="relative overflow-hidden rounded-xl bg-slate-950">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`aspect-video w-full object-cover ${isCameraActive ? "block" : "hidden"}`}
            />
            {!isCameraActive ? (
              <div className="flex aspect-video items-center justify-center p-5 text-center text-sm text-slate-300">
                Kamera başladılmayıb. Şəkil yükləmə kamera olmadan da işləyir.
              </div>
            ) : (
              <div className="pointer-events-none absolute inset-[18%] rounded-xl border-2 border-white/80" />
            )}
          </div>
        </ToolCard>
        <ToolCard title="Oxunan nəticə">
          {isProcessing ? (
            <p className="rounded-xl bg-surface-soft p-4 text-sm text-muted">
              Şəkil analiz olunur...
            </p>
          ) : result ? (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
                  {result.label}
                </span>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => copyText(result.value)}
                >
                  <Copy size={16} />
                  Kopyala
                </button>
              </div>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-surface-soft p-4 text-sm leading-6">
                {result.value}
              </pre>
              {result.safeUrl ? (
                <a
                  href={result.safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={primaryButtonClass}
                >
                  Açıq istifadəçi əməliyyatı ilə aç
                </a>
              ) : null}
            </div>
          ) : (
            <p className="rounded-xl bg-surface-soft p-4 text-sm text-muted">
              QR kod oxunduqda nəticə burada təhlükəsiz mətn kimi göstəriləcək.
            </p>
          )}
          <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            QR kodlar təhlükəli və ya aldadıcı link saxlaya bilər. Ünvanı
            yoxlamadan açmayın. Alət heç bir linkə avtomatik keçmir.
          </p>
        </ToolCard>
      </div>
    </div>
  );
}
