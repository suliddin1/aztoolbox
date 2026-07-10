export function isAnimatedImage(buffer: ArrayBuffer, type: string) {
  const bytes = new Uint8Array(buffer);
  if (type === "image/png") {
    const text = new TextDecoder("latin1").decode(bytes);
    return text.includes("acTL");
  }
  if (type === "image/webp") {
    const text = new TextDecoder("latin1").decode(
      bytes.slice(0, Math.min(bytes.length, 128)),
    );
    return text.includes("ANIM");
  }
  return false;
}

export async function decodeImage(file: Blob) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall back to an HTMLImageElement for browsers with partial ImageBitmap support.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Şəkil decode edilə bilmədi."));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function imageDimensions(image: ImageBitmap | HTMLImageElement) {
  return "naturalWidth" in image
    ? { width: image.naturalWidth, height: image.naturalHeight }
    : { width: image.width, height: image.height };
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Şəkil faylı yaradıla bilmədi.")),
      type,
      quality,
    );
  });
}

export function drawContainedImage(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  mode: "crop" | "pad",
) {
  const ratio =
    mode === "crop"
      ? Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
      : Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = sourceWidth * ratio;
  const height = sourceHeight * ratio;
  context.drawImage(
    image,
    (targetWidth - width) / 2,
    (targetHeight - height) / 2,
    width,
    height,
  );
}
