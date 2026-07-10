export function sanitizeDownloadBaseName(filename: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.\s-]+|[.\s-]+$/g, "")
    .slice(0, 80);

  return normalized || "document";
}

export function pageImageFilename(
  filename: string,
  page: number,
  extension: "jpg" | "png",
) {
  return `${sanitizeDownloadBaseName(filename)}-page-${page}.${extension}`;
}
