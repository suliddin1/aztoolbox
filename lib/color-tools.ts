export type RgbColor = { r: number; g: number; b: number };
export type PaletteColor = RgbColor & {
  hex: string;
  rgb: string;
  hsl: string;
  population: number;
};

type BucketColor = RgbColor & { count: number };

function toHex(value: number) {
  return Math.round(value).toString(16).padStart(2, "0").toUpperCase();
}

export function rgbToHex({ r, g, b }: RgbColor) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl({ r, g, b }: RgbColor) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;
  if (delta) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return {
    h: Math.round(hue),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function channelRange(colors: BucketColor[], channel: keyof RgbColor) {
  return (
    Math.max(...colors.map((color) => color[channel])) -
    Math.min(...colors.map((color) => color[channel]))
  );
}

function splitBucket(colors: BucketColor[]) {
  const ranges = (["r", "g", "b"] as const).map((channel) => ({
    channel,
    range: channelRange(colors, channel),
  }));
  ranges.sort(
    (left, right) =>
      right.range - left.range || left.channel.localeCompare(right.channel),
  );
  const channel = ranges[0].channel;
  const sorted = [...colors].sort(
    (left, right) =>
      left[channel] - right[channel] ||
      left.r - right.r ||
      left.g - right.g ||
      left.b - right.b,
  );
  const total = sorted.reduce((sum, color) => sum + color.count, 0);
  let running = 0;
  let split = 1;
  for (; split < sorted.length; split += 1) {
    running += sorted[split - 1].count;
    if (running >= total / 2) break;
  }
  return [sorted.slice(0, split), sorted.slice(split)] as const;
}

export function extractDominantColors(
  imageData: ImageData,
  count: number,
): PaletteColor[] {
  const target = Math.max(1, Math.min(12, Math.round(count)));
  const histogram = new Map<number, number>();
  for (let index = 0; index < imageData.data.length; index += 4) {
    if (imageData.data[index + 3] < 128) continue;
    const r = imageData.data[index] >> 3;
    const g = imageData.data[index + 1] >> 3;
    const b = imageData.data[index + 2] >> 3;
    const key = (r << 10) | (g << 5) | b;
    histogram.set(key, (histogram.get(key) ?? 0) + 1);
  }
  const colors: BucketColor[] = [...histogram.entries()].map(
    ([key, value]) => ({
      r: (((key >> 10) & 31) << 3) + 4,
      g: (((key >> 5) & 31) << 3) + 4,
      b: ((key & 31) << 3) + 4,
      count: value,
    }),
  );
  if (!colors.length) throw new Error("Şəkildə görünən rəng tapılmadı.");
  let buckets: BucketColor[][] = [colors];
  while (buckets.length < target) {
    const candidateIndex = buckets
      .map((bucket, index) => ({
        index,
        score:
          bucket.length * bucket.reduce((sum, color) => sum + color.count, 0),
      }))
      .filter((item) => buckets[item.index].length > 1)
      .sort(
        (left, right) => right.score - left.score || left.index - right.index,
      )[0]?.index;
    if (candidateIndex === undefined) break;
    const [left, right] = splitBucket(buckets[candidateIndex]);
    buckets = [
      ...buckets.slice(0, candidateIndex),
      left,
      right,
      ...buckets.slice(candidateIndex + 1),
    ];
  }
  return buckets
    .map((bucket) => {
      const population = bucket.reduce((sum, color) => sum + color.count, 0);
      const color = {
        r: Math.round(
          bucket.reduce((sum, item) => sum + item.r * item.count, 0) /
            population,
        ),
        g: Math.round(
          bucket.reduce((sum, item) => sum + item.g * item.count, 0) /
            population,
        ),
        b: Math.round(
          bucket.reduce((sum, item) => sum + item.b * item.count, 0) /
            population,
        ),
      };
      const hsl = rgbToHsl(color);
      return {
        ...color,
        hex: rgbToHex(color),
        rgb: `rgb(${color.r}, ${color.g}, ${color.b})`,
        hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        population,
      };
    })
    .sort(
      (left, right) =>
        right.population - left.population || left.hex.localeCompare(right.hex),
    );
}

function luminanceChannel(value: number) {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(left: RgbColor, right: RgbColor) {
  const leftLum =
    0.2126 * luminanceChannel(left.r) +
    0.7152 * luminanceChannel(left.g) +
    0.0722 * luminanceChannel(left.b);
  const rightLum =
    0.2126 * luminanceChannel(right.r) +
    0.7152 * luminanceChannel(right.g) +
    0.0722 * luminanceChannel(right.b);
  return (
    (Math.max(leftLum, rightLum) + 0.05) / (Math.min(leftLum, rightLum) + 0.05)
  );
}
