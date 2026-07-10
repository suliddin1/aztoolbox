export type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type PageNumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type Point = { x: number; y: number };

export function getWatermarkPosition(
  pageWidth: number,
  pageHeight: number,
  markWidth: number,
  markHeight: number,
  position: WatermarkPosition,
  margin = 24,
): Point {
  const [vertical, horizontal] = position.split("-") as [string, string];
  const x =
    horizontal === "left"
      ? margin
      : horizontal === "right"
        ? pageWidth - markWidth - margin
        : (pageWidth - markWidth) / 2;
  const y =
    vertical === "bottom"
      ? margin
      : vertical === "top"
        ? pageHeight - markHeight - margin
        : (pageHeight - markHeight) / 2;

  return { x: Math.max(0, x), y: Math.max(0, y) };
}

export type PageNumberFormat =
  "number" | "page-number" | "number-total" | "page-number-total";

export function formatPageNumber(
  value: number,
  total: number,
  format: PageNumberFormat,
) {
  switch (format) {
    case "page-number":
      return `Səhifə ${value}`;
    case "number-total":
      return `${value} / ${total}`;
    case "page-number-total":
      return `Səhifə ${value} / ${total}`;
    default:
      return String(value);
  }
}

export function getPageNumberPosition(
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  textHeight: number,
  position: PageNumberPosition,
  margin: number,
): Point {
  const [vertical, horizontal] = position.split("-") as [
    "top" | "bottom",
    string,
  ];
  const x =
    horizontal === "left"
      ? margin
      : horizontal === "right"
        ? pageWidth - textWidth - margin
        : (pageWidth - textWidth) / 2;
  const y = vertical === "top" ? pageHeight - textHeight - margin : margin;
  return { x: Math.max(0, x), y: Math.max(0, y) };
}
