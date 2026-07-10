import { describe, expect, it } from "vitest";
import { transliterateAzerbaijani } from "@/lib/az-cyrillic-latin";
import { validateAzerbaijaniIban } from "@/lib/az-iban";
import { base64ToText, textToBase64, toBase64Url } from "@/lib/base64";
import { formatJson, parseJsonWithLocation } from "@/lib/json-tools";
import { decodeJwt } from "@/lib/jwt";
import { integerToAzerbaijani, parseAznAmount } from "@/lib/number-to-words-az";
import { formatPageNumber, getWatermarkPosition } from "@/lib/pdf/layout";
import {
  pageImageFilename,
  sanitizeDownloadBaseName,
} from "@/lib/pdf/filename";
import { parsePageRanges } from "@/lib/pdf/page-ranges";
import { detectQrResult } from "@/lib/qr-result";
import { uuidV4FromBytes } from "@/lib/secure-id";
import { optimizeSvg } from "@/lib/svg-tools";
import { detectTimestampUnit } from "@/lib/timestamp";
import { newToolSlugs, toolGuides } from "@/lib/tool-content";
import { tools } from "@/lib/tools";
import { parseCompleteUrl, rebuildUrl } from "@/lib/url-tools";

describe("PDF helpers", () => {
  it("parses and de-duplicates page ranges", () => {
    expect(parsePageRanges("1-3, 3, 5", 6)).toEqual({
      pages: [1, 2, 3, 5],
      error: null,
    });
    expect(parsePageRanges("", 3)).toEqual({ pages: [1, 2, 3], error: null });
    expect(parsePageRanges("4-2", 6).error).toContain("başlanğıc");
    expect(parsePageRanges("7", 6).error).toContain("1–6");
  });

  it("sanitizes meaningful download filenames", () => {
    expect(sanitizeDownloadBaseName("hesabat: 2026?.pdf")).toBe("hesabat-2026");
    expect(pageImageFilename("document.pdf", 2, "jpg")).toBe(
      "document-page-2.jpg",
    );
  });

  it("calculates watermark positions and page labels", () => {
    expect(getWatermarkPosition(600, 800, 100, 50, "top-right", 20)).toEqual({
      x: 480,
      y: 730,
    });
    expect(
      getWatermarkPosition(600, 800, 100, 50, "middle-center", 20),
    ).toEqual({ x: 250, y: 375 });
    expect(formatPageNumber(3, 10, "page-number-total")).toBe("Səhifə 3 / 10");
    expect(formatPageNumber(3, 10, "number")).toBe("3");
  });
});

describe("Azerbaijani conversions", () => {
  it.each([
    ["Азәрбајҹан", "Azərbaycan"],
    ["Бакы", "Bakı"],
    ["Ҝәнҹә", "Gəncə"],
    ["АЗӘРБАЈҸАН", "AZƏRBAYCAN"],
    ["Бакы, 2026!\nҜәнҹә.", "Bakı, 2026!\nGəncə."],
  ])("transliterates Cyrillic to Latin", (source, expected) => {
    expect(transliterateAzerbaijani(source, "cyrillic-to-latin")).toBe(
      expected,
    );
  });

  it.each([
    ["Azərbaycan", "Азәрбајҹан"],
    ["Bakı", "Бакы"],
    ["Gəncə", "Ҝәнҹә"],
  ])("transliterates Latin to Cyrillic", (source, expected) => {
    expect(transliterateAzerbaijani(source, "latin-to-cyrillic")).toBe(
      expected,
    );
  });

  it("keeps unsupported Cyrillic characters", () => {
    expect(transliterateAzerbaijani("Щ", "cyrillic-to-latin")).toBe("Щ");
  });

  it.each([
    [BigInt(0), "sıfır"],
    [BigInt(11), "on bir"],
    [BigInt(100), "yüz"],
    [BigInt(101), "yüz bir"],
    [BigInt(1_000), "min"],
    [BigInt(1_100), "min yüz"],
    [BigInt(1_000_000), "bir milyon"],
    [BigInt(-11), "mənfi on bir"],
  ])("writes integers in Azerbaijani", (value, expected) => {
    expect(integerToAzerbaijani(value)).toBe(expected);
  });

  it("writes AZN amounts", () => {
    expect(parseAznAmount("123.45").words).toBe(
      "yüz iyirmi üç manat qırx beş qəpik",
    );
    expect(parseAznAmount("0,05").words).toBe("sıfır manat beş qəpik");
    expect(parseAznAmount("12").normalized).toBe("12.00");
  });
});

describe("validation and developer helpers", () => {
  it("validates Azerbaijani IBAN structure and MOD-97", () => {
    expect(
      validateAzerbaijaniIban("AZ21 NABZ 0000 0000 1370 1000 1944").valid,
    ).toBe(true);
    expect(
      validateAzerbaijaniIban("TR21NABZ00000000137010001944").errors,
    ).toContain("Ölkə prefiksi “AZ” olmalıdır.");
    expect(
      validateAzerbaijaniIban("AZ20NABZ00000000137010001944").errors,
    ).toContain("MOD-97 yoxlama cəmi uyğun gəlmir.");
  });

  it("formats, sorts and reports JSON errors", () => {
    expect(
      formatJson('{"b":1,"a":{"d":2,"c":3}}', { sortKeys: true, indent: 2 }),
    ).toBe('{\n  "a": {\n    "c": 3,\n    "d": 2\n  },\n  "b": 1\n}');
    expect(parseJsonWithLocation('{\n  "a": 1,\n}').error).toMatch(
      /sətir|JSON/i,
    );
  });

  it("round-trips Unicode Base64 and Base64URL", () => {
    const source = "Azərbaycan — ş, ğ, ə";
    const encoded = textToBase64(source);
    expect(base64ToText(encoded)).toBe(source);
    expect(base64ToText(toBase64Url(encoded), true)).toBe(source);
    expect(() => base64ToText("%%%")).toThrow(/Base64/);
  });

  it("decodes JWT without treating it as verification", () => {
    const header = toBase64Url(textToBase64('{"alg":"none"}'));
    const payload = toBase64Url(textToBase64('{"sub":"42","exp":1}'));
    const decoded = decodeJwt(`${header}.${payload}.signature`, 2_000);
    expect(decoded.payload.sub).toBe("42");
    expect(decoded.expired).toBe(true);
  });

  it("creates an RFC 4122 v4 UUID from fallback bytes", () => {
    const uuid = uuidV4FromBytes(
      Uint8Array.from({ length: 16 }, (_, index) => index),
    );
    expect(uuid).toBe("00010203-0405-4607-8809-0a0b0c0d0e0f");
  });

  it("detects timestamp units", () => {
    expect(detectTimestampUnit(1_700_000_000)).toBe("seconds");
    expect(detectTimestampUnit(1_700_000_000_000)).toBe("milliseconds");
  });

  it("parses repeated query parameters and rebuilds them", () => {
    const parsed = parseCompleteUrl(
      "https://example.com/a?tag=az&tag=pdf#nəticə",
    );
    expect(parsed.entries).toEqual([
      { key: "tag", value: "az" },
      { key: "tag", value: "pdf" },
    ]);
    expect(rebuildUrl("https://example.com/a", parsed.entries)).toBe(
      "https://example.com/a?tag=az&tag=pdf",
    );
  });

  it("sanitizes SVG scripts, handlers and external references", () => {
    const result = optimizeSvg(
      '<svg width="100" height="50" xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><style>@import url(https://evil.test/a.css)</style><rect onclick="x()" fill="red" width="100.12345" height="50"/><image href="https://evil.test/a.png"/></svg>',
      2,
    );
    expect(result.optimized).not.toMatch(/script|onclick|evil\.test/);
    expect(result.optimized).toContain('viewBox="0 0 100 50"');
    expect(result.optimized).toContain('width="100.12"');
  });

  it.each([
    ["https://example.com", "url"],
    ["WIFI:T:WPA;S:test;P:pass;;", "wifi"],
    ["mailto:test@example.com", "email"],
    ["tel:+994501234567", "phone"],
    ["sms:+994501234567", "sms"],
    ["BEGIN:VCARD\nEND:VCARD", "vcard"],
    ["salam", "text"],
  ])("detects QR result types", (value, expected) => {
    expect(detectQrResult(value).type).toBe(expected);
  });
});

describe("tool registry and routes", () => {
  it("registers exactly twenty new, unique, fully documented routes", () => {
    expect(newToolSlugs).toHaveLength(20);
    expect(new Set(newToolSlugs).size).toBe(20);
    for (const slug of newToolSlugs) {
      const tool = tools.find((item) => item.slug === slug);
      expect(tool?.href).toBe(`/tools/${slug}`);
      expect(tool?.isLocal).toBe(true);
      expect(toolGuides[slug].steps).toHaveLength(3);
      expect(toolGuides[slug].faqs.length).toBeGreaterThanOrEqual(2);
      expect(toolGuides[slug].related.length).toBeGreaterThanOrEqual(3);
    }
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(tools.length);
    expect(new Set(tools.map((tool) => tool.href)).size).toBe(tools.length);
  });
});
