import { canvasToBlob } from "@/lib/image-tools";

export async function createTextPng(
  text: string,
  fontSize: number,
  color: string,
) {
  const pixelRatio = 3;
  const canvas = document.createElement("canvas");
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("Mətn ölçülə bilmədi.");
  measure.font = `600 ${fontSize * pixelRatio}px Arial, sans-serif`;
  const metrics = measure.measureText(text);
  const padding = Math.ceil(fontSize * pixelRatio * 0.35);
  canvas.width = Math.max(1, Math.ceil(metrics.width + padding * 2));
  canvas.height = Math.max(1, Math.ceil(fontSize * pixelRatio * 1.5));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Mətn şəkli yaradıla bilmədi.");
  context.font = `600 ${fontSize * pixelRatio}px Arial, sans-serif`;
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.fillText(text, padding, canvas.height / 2);
  const blob = await canvasToBlob(canvas, "image/png");
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width: canvas.width / pixelRatio,
    height: canvas.height / pixelRatio,
  };
}

export function rotatedPlacement(
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number,
) {
  const radians = (angle * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const corners = [
    { x: 0, y: 0 },
    { x: width * cosine, y: width * sine },
    { x: -height * sine, y: height * cosine },
    { x: width * cosine - height * sine, y: width * sine + height * cosine },
  ];
  const minX = Math.min(...corners.map((point) => point.x));
  const minY = Math.min(...corners.map((point) => point.y));
  const maxX = Math.max(...corners.map((point) => point.x));
  const maxY = Math.max(...corners.map((point) => point.y));
  return {
    originX: x - minX,
    originY: y - minY,
    boundingWidth: maxX - minX,
    boundingHeight: maxY - minY,
  };
}
