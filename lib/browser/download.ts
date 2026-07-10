export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function downloadText(
  value: string,
  filename: string,
  type = "text/plain;charset=utf-8",
) {
  downloadBlob(new Blob([value], { type }), filename);
}

export async function copyText(value: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Bu brauzerdə panoya kopyalama dəstəklənmir.");
  }

  await navigator.clipboard.writeText(value);
}

export function formatBytes(bytes: number) {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(2)} MB`;
}
