const dangerousElements = new Set([
  "script",
  "foreignobject",
  "iframe",
  "object",
  "embed",
  "audio",
  "video",
  "canvas",
]);
const editorElements = new Set(["metadata", "sodipodi:namedview"]);
const numericAttributes = new Set([
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "stroke-width",
  "stroke-miterlimit",
  "opacity",
  "fill-opacity",
  "stroke-opacity",
  "offset",
  "viewBox",
  "points",
  "d",
  "transform",
]);

function roundNumbers(value: string, precision: number) {
  return value.replace(/-?\d*\.\d+(?:e[-+]?\d+)?/gi, (number) => {
    const rounded = Number(Number(number).toFixed(precision));
    return Number.isFinite(rounded) ? String(rounded) : number;
  });
}

function isUnsafeReference(value: string) {
  const trimmed = value.trim().toLowerCase();
  return /^(?:https?:|\/\/|javascript:|data:text|file:)/.test(trimmed);
}

export type SvgOptimizationResult = {
  originalBytes: number;
  optimizedBytes: number;
  sanitizedOriginal: string;
  optimized: string;
};

export function optimizeSvg(
  source: string,
  precision = 3,
): SvgOptimizationResult {
  if (typeof DOMParser === "undefined")
    throw new Error("Bu brauzerdə SVG parser dəstəklənmir.");
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(source, "image/svg+xml");
  if (
    documentNode.querySelector("parsererror") ||
    documentNode.documentElement.localName.toLowerCase() !== "svg"
  ) {
    throw new Error("Daxil edilən mətn etibarlı SVG deyil.");
  }

  const sanitize = (documentValue: Document, optimize: boolean) => {
    const walker = documentValue.createTreeWalker(
      documentValue.documentElement,
      NodeFilter.SHOW_ELEMENT,
    );
    const elements: Element[] = [documentValue.documentElement];
    while (walker.nextNode()) elements.push(walker.currentNode as Element);
    for (const element of elements.reverse()) {
      const name = element.tagName.toLowerCase();
      if (dangerousElements.has(name) || editorElements.has(name)) {
        element.remove();
        continue;
      }
      if (
        name === "style" &&
        /@import|javascript:|expression|https?:|\/\/|url\(\s*['"]?(?!#)/i.test(
          element.textContent ?? "",
        )
      ) {
        element.remove();
        continue;
      }
      for (const attribute of [...element.attributes]) {
        const attributeName = attribute.name.toLowerCase();
        const value = attribute.value;
        if (
          attributeName.startsWith("on") ||
          attributeName.startsWith("inkscape:") ||
          attributeName.startsWith("sodipodi:") ||
          ((attributeName === "href" || attributeName.endsWith(":href")) &&
            !value.trim().startsWith("#")) ||
          isUnsafeReference(value) ||
          (/url\(/i.test(value) &&
            !/url\(\s*['"]?#[-\w:.]+['"]?\s*\)/i.test(value)) ||
          /(?:expression|@import|javascript:)/i.test(value)
        ) {
          element.removeAttribute(attribute.name);
          continue;
        }
        if (optimize && numericAttributes.has(attributeName)) {
          element.setAttribute(attribute.name, roundNumbers(value, precision));
        }
      }
      if (
        optimize &&
        name === "g" &&
        element.attributes.length === 0 &&
        element.parentNode
      ) {
        while (element.firstChild)
          element.parentNode.insertBefore(element.firstChild, element);
        element.remove();
      }
    }
    const comments: Comment[] = [];
    const commentWalker = documentValue.createTreeWalker(
      documentValue,
      NodeFilter.SHOW_COMMENT,
    );
    while (commentWalker.nextNode())
      comments.push(commentWalker.currentNode as Comment);
    comments.forEach((comment) => comment.remove());
    if (!documentValue.documentElement.hasAttribute("viewBox")) {
      const width = documentValue.documentElement.getAttribute("width");
      const height = documentValue.documentElement.getAttribute("height");
      if (
        width &&
        height &&
        /^\d+(?:\.\d+)?$/.test(width) &&
        /^\d+(?:\.\d+)?$/.test(height)
      ) {
        documentValue.documentElement.setAttribute(
          "viewBox",
          `0 0 ${width} ${height}`,
        );
      }
    }
    return new XMLSerializer()
      .serializeToString(documentValue)
      .replace(/>\s+</g, "><")
      .trim();
  };

  const sanitizedOriginal = sanitize(documentNode, false);
  const optimizedDocument = parser.parseFromString(
    sanitizedOriginal,
    "image/svg+xml",
  );
  const optimized = sanitize(optimizedDocument, true);
  return {
    originalBytes: new TextEncoder().encode(source).length,
    optimizedBytes: new TextEncoder().encode(optimized).length,
    sanitizedOriginal,
    optimized,
  };
}
