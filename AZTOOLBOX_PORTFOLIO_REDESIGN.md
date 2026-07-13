# AzToolbox market-driven portfolio redesign

**Research date:** 13 July 2026  
**Scope:** research and product planning only; no implementation, route change, dependency change, commit, push, or deployment  
**Current verified baseline:** 39 tools, 7 categories, all six remediation batches complete, 28/28 structured issues locally resolved

## 1. Executive product assessment

AzToolbox is technically credible but product-strategically over-fragmented. Its strongest assets are not the raw count of 39 tools; they are:

- local, private processing with no file-content upload;
- high-value PDF, image, calculator, and Azerbaijani-language capabilities;
- a production-stable shell with search, favorites, recent tools, responsive layouts, route metadata, and lazy PDF/QR dependencies;
- unusually strong Azerbaijani differentiation through the AZ IBAN validator and Latin/Cyrillic transliterator.

The principal weakness is portfolio shape. Fourteen current routes are either very weak standalone propositions or fragments of a larger user workflow. A route for grayscale conversion, Lorem Ipsum, a slug generator, a one-operation line deduplicator, or a 90-degree image rotator makes the catalog feel count-driven. Conversely, image editing, PDF page management, document scanning/OCR, HEIC conversion, QR workflows, and serious text comparison have enough depth to feel like products.

### Recommended decision

Reduce the catalog from **39 to 30 tools**. Do this through four consolidations, two removals, and one replacement:

- merge PDF Splitter, Page Remover, and Page Extractor into **PDF Organizer**;
- merge Image Resizer, Cropper, and Rotator into **Image Editor**;
- merge Line Sorter, Duplicate-line Remover, and Whitespace Cleaner into **Text Cleanup Workspace**;
- merge UUID Generator and Secure Token Generator into **ID & Token Studio**;
- remove standalone **Lorem Ipsum Generator** and **Slug Generator**;
- replace **Grayscale Image** with **Document Scanner & Azerbaijani OCR**;
- deepen, without increasing route count, Image Converter (HEIC/HEIF), QR Generator, Text Compare, JSON Formatter, Hash Generator, calculators, and the Azerbaijani tools.

This target is deliberately smaller. No net-new standalone tool is proposed. The one new route is a one-for-one replacement for Grayscale Image.

## 2. Research method and evidence standard

The assessment read the full current registry and navigation implementation plus the requested audit, issue, remediation, decision, and six batch-result documents. The baseline facts used here are:

- 39 unique tools and slugs; no orphan or duplicate route;
- current category counts: PDF 6, image 7, text 8, developer 8, calculators 5, security 3, Azerbaijani 2;
- current homepage shows the first six of eleven `featured` tools;
- all current tools process payloads locally; PDF and QR libraries are loaded only when needed;
- all structured remediation issues are closed locally; this report does not rescore old bugs as current defects.

### Current navigation snapshot

- The shared desktop header links to All Tools, Favorites, and Recent Tools and exposes a global Ctrl/Cmd-K search.
- The sidebar and mobile menu list all seven current categories with registry-derived counts, plus favorites and recent history.
- The catalog supports category query parameters, favorites/recent views, text filtering, empty states, and a three-item recent section.
- Global search matches lowercased tool names, descriptions, and keywords; when empty it shows recent tools or all tools marked featured.
- The homepage renders all seven category cards and only the first six of eleven `featured` registry entries.
- Every logical tool currently uses `/tool/?slug=<slug>` with client-rendered metadata and a canonical generated at runtime.

External evidence was triangulated. A recommendation is not based only on a competitor having a route. Signals used were:

1. repeated inclusion and prominence across established tool suites;
2. depth of the workflow exposed by leading products;
3. dedicated intent pages that indicate stable search intent;
4. recurring community problem statements;
5. mobile usefulness and camera/file workflows;
6. fit with browser-only processing and Azerbaijani localization;
7. implementation and maintenance feasibility without paid APIs.

No commercial keyword-volume database or AzToolbox Search Console export was available. SEO scores are therefore **relative opportunity estimates**, not claimed monthly-search volumes. Before implementation, the owner should add first-party Search Console impressions/clicks and privacy-safe route events as the final demand gate.

## 3. Market and competitor research

### 3.1 PDF and document workflows

The strongest repeated PDF jobs are merge, split, compress, organize/reorder, convert, scan/OCR, and sign. Importantly, successful competitors expose visual page organization as a workflow rather than only as page-number text boxes:

- [iLovePDF documentation](https://www.ilovepdf.com/help/documentation) describes merge, split-by-range, extract-to-ZIP, and an Organize PDF experience with page thumbnails, drag-and-drop reordering, and deletion.
- [Smallpdf's complete tool directory](https://smallpdf.com/pdf-tools) gives first-class placement to Compress, Merge, Split, OCR, Scan, and electronic signing.
- [Adobe's mobile products](https://www.adobe.com/acrobat/mobile.html) position scanning plus OCR as a core mobile document workflow.

**Product implication:** AzToolbox should keep merge and image-to-PDF, but replace three separate page-number tools with one visual PDF Organizer. Document scanning/OCR clears the quality bar; a PDF compressor does not yet clear the browser-quality/bundle bar.

### 3.2 Image workflows

[iLoveIMG](https://www.iloveimg.com/) promotes bulk compression, resize, crop, conversion, rotation, and background removal. [Squoosh](https://github.com/GoogleChromeLabs/squoosh) demonstrates that high-quality codec control and comparison can run in the browser. The repeated workflow is not “rotate once”; it is “prepare this image for upload/sharing” with crop, resize, orientation, format, quality, batch state, and before/after feedback.

HEIC is a distinct compatibility problem rather than novelty. Repeated community questions describe iPhone photos that do not open or upload cleanly on Windows, often in large batches ([Apple Help example](https://www.reddit.com/r/applehelp/comments/1rsu083/hundreds_of_iphone_photos_are_heic_and_wont_open/), [Microsoft community example](https://techcommunity.microsoft.com/discussions/windows10space/how-do-i-convert-heic-files-to-jpegs-in-windows/4508209)). The [libheif project](https://github.com/strukturag/libheif) provides an in-browser JavaScript/Wasm path and documents security limits.

**Product implication:** consolidate geometric edits, keep compression and conversion as dedicated high-intent routes, and add HEIC/HEIF decoding lazily to Image Converter only after mobile memory tests.

### 3.3 Text, student, and productivity tools

The market rewards depth in word counting and comparison, not a collection of one-line transforms:

- [Word Counter](https://wordcounter.io/) combines words, characters, sentences, paragraphs, pages, reading level, and keyword density for essays, papers, and long-form writing.
- [Diff Checker](https://www.diffchecker.net/) uses local processing, Myers diff, line/word/character precision, file input, split/unified views, and narrow-screen support.

Standalone Lorem Ipsum and slug generation solve low-frequency problems already handled by design tools, editors, frameworks, and trivial snippets. Line sorting, deduplication, and whitespace cleanup are useful only as modes in a reusable cleanup pipeline.

**Product implication:** remove Lorem and Slug routes, create one Text Cleanup Workspace, and upgrade Text Compare to a real diff product. Keep Word Counter and Azerbaijani-aware Case Converter.

### 3.4 Calculators and everyday consumer tools

Calculators are a durable consumer category. [Calculator.net](https://www.calculator.net/) prominently lists loan, percentage, and conversion calculators, while [Omni Calculator](https://www.omnicalculator.com/omni-by-the-numbers) reports a large multi-category library that began with a percentage calculator. The market signal favors familiar calculations with explanations, scenarios, and useful result breakdowns—not novelty formulas.

**Product implication:** keep Percentage, VAT, Unit, and Loan calculators. Improve Unit Converter beyond length, add amortization detail to Loan, and keep VAT locally useful without hard-coding legal advice.

### 3.5 QR workflows

[QRCode Monkey](https://www.qrcode-monkey.com/en/) exposes structured templates for URL, text, email, phone, SMS, vCard, location, Wi-Fi, and events plus size, contrast, logo, and vector downloads. Camera/image scanning is feasible with [ZXing's browser layer](https://github.com/zxing-js/browser); the native [BarcodeDetector API](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector/detect) remains limited-availability and therefore cannot be the sole implementation.

**Product implication:** retain one QR route, but turn it into QR Studio with Generate and Scan tabs, structured Azerbaijani labels, safe URL previews, Wi-Fi/vCard templates, PNG/SVG export, and a ZXing fallback.

### 3.6 Developer utilities and privacy-first browser tools

[JSONLint](https://jsonlint.com/) validates and reformats JSON with actionable error positioning. [CyberChef](https://github.com/gchq/CyberChef) combines encoding, crypto, compression, and data operations into reusable browser-side recipes. These products show two viable patterns: a deep single-purpose editor or a coherent workbench. A long row of isolated one-button developer routes is the weaker pattern.

**Product implication:** keep the high-intent JSON, JWT, timestamp, and regex routes; deepen file/hash and Base64 behavior; combine UUID and secure-token creation because the target audience and interaction are nearly identical.

### 3.7 Azerbaijani/local opportunity

The [Central Bank of Azerbaijan's IBAN guidance](https://www.cbar.az/page-618/iban?language=en) confirms a country-specific structure and official domestic use. The [State Tax Service calculator](https://www.e-taxes.gov.az/calc/calcMain.jsp) confirms substantial local demand for payroll and tax calculations, but also demonstrates why those rules require an accountable maintenance process.

Tesseract provides official Azerbaijani language data (`aze`) in its [trained-data repository](https://github.com/tesseract-ocr/tessdata) and documentation. That makes Azerbaijani OCR a credible differentiator for private document scanning.

**Product implication:** make “Azerbaijan” a first-class navigation destination and homepage block. Keep IBAN and transliteration. Add Azerbaijani OCR as the local advantage of the scanner replacement. Do **not** add a salary/tax calculator until a named owner, official source ledger, effective-date model, and change-monitoring test exist.

### 3.8 Privacy as product differentiation

Squoosh, CyberChef, and private local diff tools all demonstrate demand for browser processing. Community posts about PDF and image tools repeatedly complain about uploading personal files or free limits. AzToolbox already has the technical foundation to make a stronger claim: not “uploaded then deleted,” but “processed on this device.”

The claim must remain testable: self-host every runtime asset, emit no file/text content, and distinguish anonymous route/performance events from payload data.

## 4. Weighted current-tool scorecard

### 4.1 Formula

All dimensions are 0–10. `Cost` means maintenance cost, where **10 is expensive**. The final score is:

`18% Demand + 10% Frequency + 10% AZ relevance + 12% SEO + 8% Mobile + 8% Differentiation + 10% Privacy/client-side + 8% UX depth + 6% (10 − Cost) + 10% Coherence`.

Legend: `D` demand; `F` frequency; `AZ` local relevance; `S` SEO; `M` mobile; `X` differentiation; `P` private/client-side; `U` UX depth; `Cst` maintenance cost; `Coh` professional coherence.

| # | Current tool (slug) | D | F | AZ | S | M | X | P | U | Cst | Coh | Final | Decision |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | PDF Merger (`pdf-merger`) | 9 | 6 | 5 | 9 | 7 | 3 | 9 | 8 | 5 | 9 | 7.3 | KEEP |
| 2 | PDF Splitter (`pdf-splitter`) | 8 | 5 | 5 | 8 | 6 | 2 | 9 | 7 | 5 | 8 | 6.6 | MERGE |
| 3 | PDF Page Remover (`pdf-page-remover`) | 6 | 4 | 5 | 7 | 5 | 2 | 9 | 6 | 4 | 7 | 5.8 | MERGE |
| 4 | PDF Page Extractor (`pdf-page-extractor`) | 7 | 5 | 5 | 7 | 6 | 2 | 9 | 6 | 4 | 7 | 6.2 | MERGE |
| 5 | Image to PDF (`image-to-pdf`) | 9 | 7 | 6 | 9 | 8 | 4 | 9 | 8 | 5 | 9 | 7.7 | IMPROVE |
| 6 | PDF Metadata Remover (`pdf-metadata-remover`) | 6 | 3 | 5 | 6 | 6 | 5 | 9 | 6 | 4 | 8 | 6.0 | KEEP |
| 7 | Image Resizer (`image-resizer`) | 9 | 7 | 5 | 9 | 9 | 2 | 9 | 8 | 4 | 9 | 7.6 | MERGE |
| 8 | Image Compressor (`image-compressor`) | 10 | 8 | 5 | 10 | 9 | 3 | 9 | 9 | 5 | 10 | 8.2 | IMPROVE |
| 9 | Image Converter (`image-converter`) | 9 | 7 | 5 | 9 | 9 | 3 | 9 | 8 | 4 | 9 | 7.7 | IMPROVE |
| 10 | Image Cropper (`image-cropper`) | 8 | 7 | 5 | 8 | 9 | 2 | 9 | 7 | 4 | 8 | 7.1 | MERGE |
| 11 | Image Rotator (`image-rotator`) | 5 | 4 | 4 | 5 | 7 | 1 | 9 | 4 | 3 | 6 | 5.2 | MERGE |
| 12 | Grayscale Image (`grayscale-image`) | 2 | 2 | 3 | 3 | 5 | 1 | 9 | 3 | 2 | 3 | 3.6 | REPLACE |
| 13 | Image Metadata Remover (`image-metadata-remover`) | 7 | 4 | 5 | 7 | 8 | 6 | 9 | 6 | 4 | 8 | 6.7 | KEEP |
| 14 | Word Counter (`text-counter`) | 9 | 8 | 6 | 10 | 10 | 3 | 10 | 8 | 2 | 9 | 8.3 | KEEP |
| 15 | Case Converter (`case-converter`) | 6 | 6 | 7 | 7 | 9 | 2 | 10 | 5 | 2 | 7 | 6.7 | KEEP |
| 16 | Line Sorter (`line-sorter`) | 4 | 3 | 4 | 4 | 6 | 1 | 10 | 4 | 2 | 5 | 4.8 | MERGE |
| 17 | Duplicate-line Remover (`duplicate-line-remover`) | 3 | 3 | 4 | 4 | 6 | 1 | 10 | 4 | 2 | 4 | 4.5 | MERGE |
| 18 | Whitespace Cleaner (`whitespace-cleaner`) | 5 | 5 | 6 | 6 | 8 | 2 | 10 | 5 | 2 | 6 | 6.0 | MERGE |
| 19 | Slug Generator (`slug-generator`) | 3 | 2 | 5 | 4 | 4 | 1 | 10 | 3 | 1 | 3 | 4.2 | REMOVE |
| 20 | Lorem Ipsum Generator (`lorem-ipsum-generator`) | 1 | 1 | 2 | 3 | 3 | 0 | 10 | 2 | 1 | 2 | 3.0 | REMOVE |
| 21 | Text Compare (`text-compare`) | 8 | 6 | 5 | 8 | 7 | 3 | 10 | 8 | 5 | 8 | 7.0 | IMPROVE |
| 22 | JSON Formatter (`json-formatter`) | 9 | 7 | 4 | 9 | 7 | 2 | 10 | 8 | 3 | 9 | 7.5 | IMPROVE |
| 23 | Base64 Encoder (`base64-encoder`) | 5 | 4 | 3 | 6 | 5 | 1 | 10 | 4 | 2 | 5 | 5.1 | IMPROVE |
| 24 | URL Encoder (`url-encoder`) | 5 | 4 | 3 | 6 | 5 | 1 | 10 | 4 | 2 | 5 | 5.1 | KEEP |
| 25 | JWT Decoder (`jwt-decoder`) | 7 | 5 | 3 | 8 | 5 | 2 | 10 | 7 | 3 | 7 | 6.3 | KEEP |
| 26 | Hash Generator (`hash-generator`) | 6 | 4 | 3 | 7 | 5 | 2 | 10 | 6 | 3 | 6 | 5.7 | IMPROVE |
| 27 | UUID Generator (`uuid-generator`) | 5 | 4 | 3 | 7 | 5 | 1 | 10 | 3 | 1 | 4 | 5.1 | MERGE |
| 28 | Timestamp Converter (`timestamp-converter`) | 8 | 6 | 4 | 8 | 7 | 2 | 10 | 7 | 3 | 8 | 6.9 | KEEP |
| 29 | Regex Tester (`regex-tester`) | 8 | 6 | 3 | 8 | 5 | 2 | 10 | 8 | 5 | 8 | 6.6 | KEEP |
| 30 | Percentage Calculator (`percentage-calculator`) | 10 | 9 | 7 | 10 | 10 | 2 | 10 | 7 | 2 | 10 | 8.6 | KEEP |
| 31 | VAT Calculator (`vat-calculator`) | 8 | 7 | 9 | 8 | 10 | 5 | 10 | 8 | 3 | 9 | 8.2 | IMPROVE |
| 32 | Unit Converter (`unit-converter`) | 10 | 9 | 6 | 10 | 10 | 1 | 10 | 9 | 4 | 9 | 8.4 | IMPROVE |
| 33 | Loan Calculator (`loan-calculator`) | 9 | 7 | 8 | 9 | 9 | 4 | 10 | 9 | 3 | 9 | 8.3 | IMPROVE |
| 34 | QR Generator (`qr-generator`) | 9 | 7 | 6 | 10 | 10 | 3 | 9 | 9 | 3 | 9 | 8.1 | IMPROVE |
| 35 | Password Generator (`password-generator`) | 9 | 7 | 5 | 9 | 9 | 2 | 10 | 8 | 3 | 9 | 7.7 | KEEP |
| 36 | Password Strength (`password-strength`) | 8 | 5 | 5 | 9 | 8 | 2 | 10 | 7 | 5 | 8 | 7.0 | IMPROVE |
| 37 | Secure Token Generator (`secure-token-generator`) | 4 | 3 | 3 | 5 | 4 | 1 | 10 | 3 | 1 | 4 | 4.5 | MERGE |
| 38 | AZ IBAN Validator (`az-iban-validator`) | 7 | 5 | 10 | 8 | 10 | 8 | 10 | 7 | 4 | 10 | 8.1 | KEEP |
| 39 | Latin/Cyrillic Transliterator (`az-transliterator`) | 6 | 5 | 10 | 8 | 10 | 9 | 10 | 8 | 3 | 10 | 8.1 | IMPROVE |

Scores measure portfolio value, not current correctness. A high-scoring tool can still be merged when the workflow is stronger than separate routes; a lower-scoring developer utility can remain when intent is stable and maintenance is tiny.

## 5. Ranked weakest-tool and fragmentation list

“Weakest” includes low-value routes and good capabilities presented at the wrong granularity.

| Rank | Current tool | Category | Score | Why low-value/redundant | Current route SEO value | Decision and route behavior |
|---:|---|---|---:|---|---|---|
| 1 | Lorem Ipsum Generator | Text | 3.0 | Fixed paragraphs, very low recurring value, easily available inside design/editing software, no local advantage. | Low; generic/high-competition intent. | **REMOVE.** True removal; return 410 where possible, `noindex` immediately, remove from sitemap. No redirect to unrelated content. |
| 2 | Grayscale Image | Image | 3.6 | One filter already present in operating-system/photo editors; no meaningful workflow depth. | Low. | **REPLACE** with Document Scanner & Azerbaijani OCR at a new canonical route. Old route gets a short deprecation/410, not a misleading scanner redirect. |
| 3 | Slug Generator | Text | 4.2 | Developer convenience with trivial implementation and weak mobile/consumer value; embarrassing as a headline tool. | Low-to-medium but highly commoditized. | **REMOVE.** 410/true removal, `noindex`, sitemap removal. Keep no hidden “count-preserving” substitute. |
| 4 | Duplicate-line Remover | Text | 4.5 | One transform; overlaps cleanup and list workflows. | Low; some long-tail intent but thin experience. | **MERGE** into Text Cleanup Workspace, redirect with `mode=deduplicate`, canonical to workspace. |
| 5 | Secure Token Generator | Security | 4.5 | Same audience, entropy source, count/output actions, and copy/download patterns as UUID generation. | Low-to-medium developer intent. | **MERGE** into ID & Token Studio with `mode=token`; permanent redirect after parity. |
| 6 | Line Sorter | Text | 4.8 | Useful occasionally, but not a product alone. | Low. | **MERGE** into Text Cleanup Workspace with `mode=sort`; redirect and preserve Azerbaijani collation. |
| 7 | UUID Generator | Developer | 5.1 | Stable intent but a very thin route; overlaps secure token generation. | Medium; retain intent via destination metadata. | **MERGE** into ID & Token Studio with `mode=uuid`; permanent redirect after parity. |
| 8 | Image Rotator | Image | 5.2 | Common edit, but one button group is not a credible standalone feature; duplicates OS/gallery editing. | Low-to-medium. | **MERGE** into Image Editor with rotation selected; redirect. |
| 9 | PDF Page Remover | PDF | 5.8 | Valid need but shares the same file, page model, preview, validation, and output with extraction/reordering. | Medium. | **MERGE** into PDF Organizer `mode=delete`; preserve targeted metadata during redirect period. |
| 10 | Whitespace Cleaner | Text | 6.0 | Useful transform but better as a configurable cleanup pipeline with preview and undo. | Medium-low. | **MERGE** into Text Cleanup Workspace `mode=whitespace`; redirect. |
| 11 | PDF Page Extractor | PDF | 6.2 | Useful but fragmented from split/delete/reorder; page-number-only UX is weaker than thumbnails. | Medium-high. | **MERGE** into PDF Organizer `mode=extract`; redirect, never collapse into unrelated Split semantics. |
| 12 | PDF Splitter | PDF | 6.6 | Strong intent, but current ZIP-by-page behavior is one mode of page organization. | High among this group. | **MERGE** carefully into PDF Organizer `mode=split`; keep old page copy available through redirect landing for at least one release. |
| 13 | Image Cropper | Image | 7.1 | High-use capability, wrong granularity; must be visual and paired with resize/rotate. | Medium-high. | **MERGE** into Image Editor with crop mode; permanent redirect after feature parity. |
| 14 | Image Resizer | Image | 7.6 | High-demand route, but combining crop/rotate improves task completion. Its SEO intent is too valuable to discard. | High. | **MERGE** into Image Editor but preserve a dedicated resize landing state and old-route redirect; do not simply remove the intent page. |

The list intentionally includes strong individual capabilities at ranks 11–14 because the weakness is the fragmented product surface, not the job itself.

## 6. Ranked top-tier replacement and consolidation candidates

Only candidates that pass the no-paid-API, local-processing, mobile, and product-depth gates are recommended. Confidence is product confidence, not implementation completion.

### 6.1 Document Scanner & Azerbaijani OCR — priority 1, confidence 8.7/10

1. **Tool name:** Document Scanner & Azerbaijani OCR.
2. **Exact problem:** phone photos of paper are skewed, shadowed, hard to read, not searchable, and awkward to combine into a document.
3. **Target audience:** students, teachers, office staff, small businesses, families digitizing forms/receipts, and Azerbaijani users with sensitive documents.
4. **Typical scenario:** capture or import several pages, correct corners and contrast, reorder them, export a clean PDF, and optionally copy recognized Azerbaijani text.
5. **Demand evidence:** Scan/OCR is prominent at Adobe, Smallpdf, and iLovePDF; Adobe markets a dedicated scanner/OCR mobile product; student workflows repeatedly use scanning for assignments and worksheets.
6. **Relevant competitors:** [Adobe Scan](https://play.google.com/store/apps/details?id=com.adobe.scan.android), [Smallpdf tools](https://smallpdf.com/pdf-tools), iLovePDF Scan/OCR.
7. **Why AzToolbox:** it connects camera, image, PDF, student, privacy, and local-language positioning in one defensible feature.
8. **Why stronger than Grayscale Image:** it uses grayscale/thresholding as one step inside a complete outcome, rather than presenting a trivial filter as a product.
9. **Azerbaijani advantage:** Azerbaijani UI, `aze` OCR model, Latin/Cyrillic selection, and correct local characters in copied text.
10. **Client-side approach:** camera/file input; edge proposal plus manual four-corner correction; perspective warp; contrast/threshold modes; page queue; PDF export; opt-in OCR worker.
11. **APIs/libraries:** `getUserMedia`, File/Blob, Canvas/OffscreenCanvas, Web Workers, existing pdf-lib, lazy OpenCV.js, lazy Tesseract.js plus self-hosted `aze`/`eng` data.
12. **Privacy:** camera starts only after a user action; no frames, images, recognized text, or filenames leave the device; stop tracks on exit.
13. **Bundle/performance:** high optional payload and memory. Scanner core and OCR must be separate lazy chunks; OCR language data cached only after explicit consent. Enforce page/pixel caps.
14. **Development complexity:** high.
15. **Maintenance risk:** medium-high: browser camera behavior, OCR quality, Wasm updates, mobile memory, and trained-data licensing/version tracking.
16. **SEO potential:** high for scan-to-PDF, image-to-text, and Azerbaijani OCR intent, but one canonical route should avoid thin doorway pages.
17. **Mobile UX:** rear-camera preference, full-screen capture, large corner handles, one-handed retake/add-page controls, visible progress/cancel, screen-wake resilience, and offline error messaging.
18. **Category:** PDF & Documents; secondary tags `student`, `privacy`, `Azerbaijan`.
19. **Replacement mapping:** replaces `grayscale-image`; grayscale becomes an enhancement mode, not a route.
20. **Confidence:** 8.7/10, conditional on a two-device performance prototype and Azerbaijani OCR quality benchmark.

### 6.2 PDF Organizer — priority 2, confidence 9.2/10

1. **Tool name:** PDF Organizer.
2. **Exact problem:** users need to see, reorder, rotate, delete, extract, or split pages without translating a visual document into page-number expressions.
3. **Target audience:** students, administrative staff, applicants, accountants, and anyone assembling submissions.
4. **Typical scenario:** import a PDF, drag page 5 before page 2, rotate a scan, remove a blank page, then export one PDF or selected pages as a ZIP.
5. **Demand evidence:** visual organization is documented prominently by iLovePDF; merge/split/organize recur across iLovePDF, Smallpdf, Adobe, and offline PDF apps.
6. **Relevant competitors:** [iLovePDF Organize/Split documentation](https://www.ilovepdf.com/help/documentation), [Smallpdf tool directory](https://smallpdf.com/pdf-tools).
7. **Why AzToolbox:** it turns three remediated engines into one polished private workflow while retaining exact existing page semantics.
8. **Why stronger:** thumbnails, direct manipulation, undo, multi-select, and an explicit output mode replace three near-identical forms.
9. **Azerbaijani advantage:** page actions and error states in plain Azerbaijani; privacy-first handling for official documents.
10. **Client-side approach:** render low-resolution thumbnails, keep an immutable page-order/action model, and use pdf-lib only for final output; preserve splitter ZIP semantics.
11. **APIs/libraries:** existing pdf-lib and ZIP writer; lazy [PDF.js](https://github.com/mozilla/pdf.js) worker for thumbnail rendering; Pointer Events and keyboard drag/reorder controls.
12. **Privacy:** all document bytes and thumbnail canvases stay local; no thumbnail analytics.
13. **Bundle/performance:** medium-high lazy PDF.js cost; virtualize thumbnails and cap concurrent renders; never load on other routes.
14. **Development complexity:** medium-high.
15. **Maintenance risk:** medium: encrypted PDFs, page rotation, large documents, drag accessibility, and PDF.js/pdf-lib compatibility.
16. **SEO potential:** high. Preserve split/extract/delete intent through redirects and mode-specific landing copy without indexing duplicate state URLs.
17. **Mobile UX:** two-column/one-column thumbnails, long-press or explicit selection rather than drag-only behavior, bottom action bar, undo, page-count progress.
18. **Category:** PDF & Documents.
19. **Replacement mapping:** merges `pdf-splitter`, `pdf-page-remover`, and `pdf-page-extractor` into `pdf-organizer`.
20. **Confidence:** 9.2/10.

### 6.3 Image Editor — priority 3, confidence 9.0/10

1. **Tool name:** Image Editor.
2. **Exact problem:** users commonly need crop, rotate, and resize together to prepare one image for a form, profile, marketplace, or document.
3. **Target audience:** mobile users, students, marketplace sellers, content creators, and job applicants.
4. **Typical scenario:** straighten an image, crop to 1:1 or a custom area, set 800×800, compare the output, then download in the source format.
5. **Demand evidence:** iLoveIMG repeats crop/resize/rotate and presents them as a coherent editing suite; community privacy-first editors group the same operations.
6. **Relevant competitors:** [iLoveIMG](https://www.iloveimg.com/), Squoosh for preview/codec interaction.
7. **Why AzToolbox:** the existing format-preservation, validation, and result-lifecycle work can support a stronger surface with limited new dependency risk.
8. **Why stronger:** users perform a task sequence once, rather than repeatedly uploading/downloading between three routes.
9. **Azerbaijani advantage:** localized presets and dimensions for common local application/document use can be added only when verified.
10. **Client-side approach:** one decoded source, non-destructive transform state, interactive crop rectangle, rotation/flip, aspect and pixel presets, one final canvas encode.
11. **APIs/libraries:** File/Blob, Canvas/OffscreenCanvas, `createImageBitmap`, Pointer Events; no mandatory third-party editor library.
12. **Privacy:** local; clear warning for metadata loss and animated files.
13. **Bundle/performance:** low-to-medium; reuse current image pipeline; defer decoding until selected; revoke every preview URL.
14. **Development complexity:** medium.
15. **Maintenance risk:** medium-low: pointer geometry, EXIF orientation, codec differences, and accessibility are the main risks.
16. **SEO potential:** high via preserved resize/crop intent redirects; canonical only the editor route.
17. **Mobile UX:** pinch/zoom or accessible zoom controls, large crop handles, numeric fallback, fixed preview bounds, and no precision-only gestures.
18. **Category:** Images.
19. **Replacement mapping:** merges `image-resizer`, `image-cropper`, and `image-rotator` into `image-editor`.
20. **Confidence:** 9.0/10.

### 6.4 HEIC/HEIF support in Image Converter — priority 4, confidence 8.8/10

1. **Tool name:** Image Converter with HEIC/HEIF input.
2. **Exact problem:** iPhone photos cannot always be opened or uploaded in Windows, legacy sites, and forms.
3. **Target audience:** iPhone-to-Windows users, students submitting images, families, and marketplace sellers.
4. **Typical scenario:** drop several `.heic` photos and download JPG/PNG/WebP versions with orientation preserved.
5. **Demand evidence:** recurring Apple/Windows community requests and dedicated conversion pages; competitors consistently promote image conversion.
6. **Relevant competitors:** iLoveIMG converters, Squoosh, local HEIC converters; implementation reference [libheif](https://github.com/strukturag/libheif).
7. **Why AzToolbox:** private family photos are a strong reason to prefer on-device conversion.
8. **Why stronger:** it upgrades a proven high-demand route rather than adding another converter route.
9. **Azerbaijani advantage:** Azerbaijani errors and output explanations; no external upload on slow/mobile connections.
10. **Client-side approach:** signature-detect HEIF/HEIC, decode in a worker, apply orientation, encode one chosen supported output, allow bounded batch export.
11. **APIs/libraries:** File/Blob, Web Workers, Canvas, lazy libheif-js/Wasm; native `ImageDecoder`/WebCodecs only as capability-checked optimization.
12. **Privacy:** local; strip location metadata by default and disclose that policy before conversion.
13. **Bundle/performance:** roughly megabyte-scale lazy Wasm plus high decoded-memory use; enforce file/pixel/batch caps and sequential mobile processing.
14. **Development complexity:** medium-high.
15. **Maintenance risk:** medium-high due HEIF variants, orientation, auxiliary images, and codec security updates.
16. **SEO potential:** high transactional intent for HEIC-to-JPG/PNG, handled as content/state under Image Converter rather than multiple thin routes.
17. **Mobile UX:** batch queue, per-file status, choose output once, memory-safe sequential processing, cancel, and clear unsupported-variant messages.
18. **Category:** Images.
19. **Replacement mapping:** improves `image-converter`; no new route or tool-count increase.
20. **Confidence:** 8.8/10 after a corpus covering iPhone generations, live photos, depth/auxiliary images, and uppercase/extensionless inputs.

### 6.5 QR Studio — priority 5, confidence 8.5/10

1. **Tool name:** QR Studio — Generate & Scan.
2. **Exact problem:** users need safe, well-formed QR codes for Wi-Fi/contact/event/link data and often need to decode a QR from a screenshot or camera.
3. **Target audience:** consumers, events, small businesses, educators, and mobile users.
4. **Typical scenario:** make a Wi-Fi QR with tested contrast and SVG/PNG output, or scan a code from a screenshot and inspect its URL before opening.
5. **Demand evidence:** QRCode Monkey exposes many structured types; QR creation/scanning is intrinsically mobile and recurs across utility suites.
6. **Relevant competitors:** [QRCode Monkey](https://www.qrcode-monkey.com/en/), ZXing browser demos.
7. **Why AzToolbox:** the existing corrected local generator is a strong base; safe preview and Azerbaijani templates add real depth.
8. **Why stronger:** structured validation, scan, security preview, vector output, and test-before-download replace a generic textarea/PNG interaction.
9. **Azerbaijani advantage:** Wi-Fi, contact, event, phone/SMS templates and warnings in Azerbaijani; correct Unicode round trip.
10. **Client-side approach:** Generate/Scan tabs; encode static payloads only; decode camera or image; classify results; require confirmation before navigation.
11. **APIs/libraries:** existing QR encoder, SVG serializer, `getUserMedia`, File/Canvas, lazy ZXing browser fallback; native BarcodeDetector only as an optimization.
12. **Privacy:** local camera/image processing; no dynamic tracking or hosted redirect codes; stop camera tracks immediately.
13. **Bundle/performance:** medium lazy decoder; generator remains light; decoder never loads until Scan is selected.
14. **Development complexity:** medium.
15. **Maintenance risk:** medium: camera permissions, decoder compatibility, malicious URL handling, and SVG export testing.
16. **SEO potential:** high; keep one canonical QR route and non-indexed tab state.
17. **Mobile UX:** rear camera, flashlight where supported, import screenshot, scan region, vibration optional, visible URL domain, copy/open choices.
18. **Category:** Calculators & Everyday; secondary `mobile`, `business`.
19. **Replacement mapping:** improves `qr-generator`; no new route.
20. **Confidence:** 8.5/10.

### 6.6 Text Cleanup Workspace — priority 6, confidence 8.0/10

1. **Tool name:** Text Cleanup Workspace.
2. **Exact problem:** pasted lists and text often need several predictable transformations, with users needing to preview exactly what changed.
3. **Target audience:** office users, students, content editors, data-entry staff, and developers.
4. **Typical scenario:** trim/collapse whitespace, remove blanks, deduplicate with case options, sort with Azerbaijani collation, preview counts, copy/download.
5. **Demand evidence:** cleanup functions recur across text suites, but stronger products combine modes; CyberChef validates the workbench/recipe pattern.
6. **Relevant competitors:** CyberChef, text-cleanup suites, spreadsheet/editor list functions.
7. **Why AzToolbox:** it removes three filler-looking cards while retaining their useful combined workflow.
8. **Why stronger:** ordered operations, before/after diff, options, undo, statistics, presets, and download are meaningfully deeper.
9. **Azerbaijani advantage:** `az` collation, dotted/dotless letter behavior, and localized whitespace/line terminology.
10. **Client-side approach:** immutable transform pipeline with ordered steps; preview diff; raw and transformed counts; copy/download; URL state stores settings only, never text.
11. **APIs/libraries:** native Intl.Collator/Segmenter; optional small diff library already justified by Text Compare; no server.
12. **Privacy:** fully local; do not persist input by default.
13. **Bundle/performance:** low; worker only above a text-size threshold.
14. **Development complexity:** medium-low.
15. **Maintenance risk:** low; Unicode/collation regression corpus is the main requirement.
16. **SEO potential:** medium; redirects preserve old intents, but one canonical avoids three thin pages.
17. **Mobile UX:** preset chips, reorderable but accessible step list, full-width editors, sticky copy/apply bar, compact diff summary.
18. **Category:** Text & Study.
19. **Replacement mapping:** merges `line-sorter`, `duplicate-line-remover`, and `whitespace-cleaner`.
20. **Confidence:** 8.0/10.

### 6.7 ID & Token Studio — consolidation, confidence 7.6/10

1. **Tool name:** ID & Token Studio.
2. **Exact problem:** developers need small batches of standard UUIDs or cryptographically random tokens in chosen encodings.
3. **Audience:** developers, QA, system administrators.
4. **Scenario:** generate 20 UUID v4 values or a 32-byte hex/Base64URL secret and download/copy them.
5. **Evidence:** these are recurring developer utilities, but the separate routes are thin; CyberChef/IT-tool workbenches support consolidation.
6. **Competitors:** CyberChef and self-hosted developer-tool collections.
7. **Why AzToolbox:** privacy and WebCrypto are a natural fit.
8. **Why stronger:** shared output, count, encoding, entropy explanation, and copy/download behavior.
9. **Local advantage:** Azerbaijani explanations; differentiation remains modest.
10. **Approach:** tabs/mode selector, WebCrypto rejection sampling, UUID v4, hex/Base64URL, batch caps.
11. **APIs/libraries:** `crypto.getRandomValues`, `crypto.randomUUID`; no library.
12. **Privacy:** entirely local; explicit warning not to reuse displayed secrets.
13. **Bundle impact:** negligible.
14. **Complexity:** low.
15. **Maintenance risk:** low.
16. **SEO:** medium; preserve UUID intent with a mode-specific landing state.
17. **Mobile UX:** large copy button, line wrapping, per-item/batch copy.
18. **Category:** Developer & Security.
19. **Mapping:** merges `uuid-generator` and `secure-token-generator`.
20. **Confidence:** 7.6/10; recommended as consolidation, not as a flagship replacement.

## 7. Proposed final inventory

| Final category | Final tools | Count |
|---|---|---:|
| **PDF & Documents** | PDF Merger; PDF Organizer; Image to PDF; PDF Metadata Remover; Document Scanner & Azerbaijani OCR | 5 |
| **Images** | Image Editor; Image Compressor; Image Converter (including HEIC/HEIF); Image Metadata Remover | 4 |
| **Text & Study** | Word Counter; Case Converter; Text Cleanup Workspace; Text Compare | 4 |
| **Developer & Security** | JSON Formatter; Base64 Encoder; URL Encoder; JWT Decoder; File & Text Hash; ID & Token Studio; Timestamp Converter; Regex Tester; Password Generator; Password Strength | 10 |
| **Calculators & Everyday** | Percentage Calculator; VAT Calculator; Unit Converter; Loan Calculator; QR Studio | 5 |
| **Azerbaijan** | AZ IBAN Validator; Latin/Cyrillic Transliterator | 2 |
| **Total** |  | **30** |

Developer & Security is intentionally the largest category because several routes have distinct stable intent. The category should be visually secondary to consumer workflows on the homepage. Privacy is a cross-cutting capability filter, not a category that pulls metadata tools away from their natural file workflows.

### Improvement backlog for retained tools

- **Image to PDF:** paper-size/orientation/margin options, thumbnail reorder, size estimate, and explicit photographic-size trade-offs.
- **Image Compressor:** batch queue, before/after preview, size target, format-aware controls, and “no saving” honesty.
- **Text Compare:** Myers/LCS diff, line/word/character views, split/unified mobile mode, file input, ignore-whitespace option, export.
- **JSON Formatter:** editor with line/column errors, tree view, sort keys, copy/download, bounded large-file worker; do not sprawl into dozens of language generators.
- **Base64:** URL-safe mode and binary/file input, with a warning that Base64 is encoding, not encryption.
- **File & Text Hash:** file hashing, progress/cancel, SHA-256/512, checksum compare; no obsolete MD5 success framing.
- **Unit Converter:** add mass, temperature, area, volume, data size, speed, and time inside one route; preserve type-safe units.
- **Loan:** amortization schedule, early-payment scenario, total cost, printable/local download; no lending recommendation.
- **VAT:** clear add/extract modes, reusable custom rate, result equation; do not call a custom calculation official tax advice.
- **Azerbaijani transliterator:** selection-aware copy, ambiguity notes, mixed-script detection, and Azerbaijani examples.

## 8. Category and navigation redesign

### 8.1 Category model

Replace the current seven category labels with six task-oriented categories:

1. **PDF & Documents**
2. **Images**
3. **Text & Study**
4. **Developer & Security**
5. **Calculators & Everyday**
6. **Azerbaijan**

Each tool has one primary category plus capability tags such as `privacy`, `student`, `mobile`, `batch`, `file`, `camera`, and `local`. Tags power search and collections; they do not create duplicate indexable pages.

### 8.2 Homepage

Do not show a rotating sample based on the order of `featured: true`. Use an explicit, measured homepage configuration:

- **Primary “Popular tasks” (six):** Image Compressor, Percentage Calculator, PDF Organizer, Image to PDF, Word Counter, Image Converter.
- **Azerbaijan block (always visible above the long catalog):** AZ IBAN Validator, Latin/Cyrillic Transliterator, and the Azerbaijani OCR entry point inside Document Scanner.
- **Mobile tasks:** Document Scanner, QR Studio, Image Editor.
- **Private on this device:** PDF/Image Metadata Removers, Password Generator, Text Compare, File Hash.
- Show recent tools only to returning users and only from local storage.

Featured placement should be a registry field with an explicit rank and rationale, not a boolean whose first six happen to win.

### 8.3 Search

Search should index:

- Azerbaijani name and description;
- English and Azerbaijani aliases (`merge`, `birləşdir`, `scan`, `skan`, `crop`, `kəs`, `HEIC`, `iPhone şəkli`);
- user-task phrases (“PDF-dən səhifə sil”, “şəkli 800x800 et”, “Wi-Fi QR yarat”);
- category and capability tags;
- deprecated names mapped to their destination.

Ranking order: exact alias → exact name → task phrase → prefix → fuzzy fallback. Do not log raw queries. For zero-result analytics, log only a locally mapped taxonomy bucket or an irreversible, non-reversible aggregate after privacy review—not user text.

### 8.4 Favorites and recent tools

- Remain device-local and anonymous.
- Sanitize deprecated slugs through the route-alias map so favorites survive consolidation.
- Show clear-all and per-item remove actions.
- Store only tool IDs and timestamps; never inputs, filenames, recognized text, or results.
- Cap recent tools at eight and favorites at a reasonable documented limit.
- Provide a visible “This device only” note; no account/sync work is justified.

## 9. Architecture-strengthening plan

### 9.1 Tool registry

Move from a display-only array to a versioned product registry. Each entry should include:

| Field group | Required fields |
|---|---|
| Identity | stable `id`, canonical path, Azerbaijani name, short description, primary category, tags |
| Discovery | aliases, task phrases, featured collection/rank, related-tool rules |
| Lifecycle | `active/deprecated/removed/replaced`, destination, effective date, sitemap/index policy |
| Runtime | module loader, dependency chunks, worker, supported inputs/outputs, limits, offline capability |
| UX contract | workspace type, result type, loading/error/success model, mobile notes, accessibility notes |
| Privacy | processing location, permissions, storage, allowed network destinations, analytics event allowlist |
| Ownership | product owner, maintenance risk, source/evidence links, last review, admission record |
| SEO | canonical title/description, intent, structured data eligibility, migration aliases |
| Quality | unit/browser/binary/a11y/performance test IDs and release gate |

Unknown kinds must fail closed with a registry error; they must never fall into a generic PDF workspace.

### 9.2 Shared input/file/result components

Create a small set of contract-driven components:

- `TextInputWorkspace`: text limits, paste/clear/sample, live or explicit run mode.
- `FileInputWorkspace`: drag/drop, camera, file list, signature/MIME validation, limits, reorder, retry.
- `TransformPipeline`: ordered operations, preview, undo/reset, deterministic settings serialization.
- `ResultPanel`: typed text/table/preview/file output, stale-result invalidation, status live region.
- `DownloadController`: one filename policy, MIME/signature check, size display, object-URL disposal.
- `OperationController`: operation ID, snapshot, progress, cancel/worker termination, error recovery.

Shared components must accept a tool capability contract; they must not infer behavior from a slug.

### 9.3 Lazy loading and bundle splitting

- Keep the shell and registry light.
- Load pdf-lib only for PDF writers; PDF.js only inside PDF Organizer/Scanner preview.
- Split OpenCV.js and Tesseract core/languages; load OCR only after the user selects OCR.
- Load libheif only after HEIC signature detection.
- Load ZXing only after Scan is selected and native BarcodeDetector is unavailable.
- Put CPU-heavy PDF rendering, OCR, HEIC decode, diff, regex, and large text transforms in terminable workers.
- Add CI bundle budgets per route and per lazy chunk; a dependency cannot enter the global shell for convenience.

### 9.4 Validation and states

Every tool must use the same state machine: `idle → validating → ready/running → success | error | cancelled`, with any input change invalidating published output. Required consistency:

- field-level Azerbaijani errors associated with controls;
- no success before output postconditions pass;
- no generic “something went wrong” when a bounded, actionable reason is known;
- retry without reload;
- progress only when measurable; indeterminate wording otherwise;
- explicit local-processing and format-loss disclosure near the relevant control.

### 9.5 Downloads

- Generate deterministic, sanitized Azerbaijani-safe filenames with the original stem where useful.
- Verify MIME, binary signature, extension, decoded/reopened output, and maximum generated size.
- Never auto-download multiple files; use one ZIP.
- Show original/new size and whether the stated goal was achieved.
- Revoke object URLs on replacement, reset, error, navigation, and bounded post-download cleanup.

### 9.6 Privacy-safe analytics

Allowed event examples:

- route viewed; category selected; featured card clicked;
- search opened; result position selected; zero-result **taxonomy bucket**;
- operation started/succeeded/failed/cancelled;
- coarse file-count/size/pixel/page buckets;
- duration/performance buckets; browser capability flags;
- download initiated.

Forbidden fields:

- raw search text, tool input, output, OCR text, regex, JSON, JWT, IBAN, URLs, passwords, hashes/tokens;
- filename, file bytes, preview, EXIF, camera frame, clipboard contents;
- full error objects that can echo user data;
- stable cross-site identifiers.

Prefer a first-party, cookieless endpoint or a vetted privacy analytics product configured without session replay. Analytics failure must not affect a tool. Publish the event schema in the privacy page and test the network allowlist.

### 9.7 SEO metadata and sitemap

- Long term, migrate from query canonicals to clean paths such as `/tools/pdf-organizer/`; keep query routes as compatibility redirects.
- Server-render or build static HTML for every active canonical so title, description, H1, canonical, hreflang, and structured data do not depend on crawler JavaScript.
- Sitemap contains only active canonical tools, categories, and editorial help pages.
- Mode/tab/filter URLs are `noindex,follow` unless they have distinct content and pass the admission standard.
- Removed routes are immediately removed from internal links and sitemap; return 410 for no-substitute routes.
- Redirect only when intent is genuinely preserved. Never redirect Lorem or Grayscale to an unrelated popular tool.
- Add concise FAQ/how-to content only when it answers real tool questions; do not generate thin SEO text at scale.

## 10. Three-iteration bounded implementation loop

This is a proposed future loop only. Each iteration touches exactly five current tools and ends at a reversible checkpoint.

### Iteration 1 — PDF workflow and obvious removals

**Current tools in scope (5):** PDF Splitter, PDF Page Remover, PDF Page Extractor, Slug Generator, Lorem Ipsum Generator.

- **Removed:** Slug Generator; Lorem Ipsum Generator.
- **Merged:** three PDF page tools.
- **Added:** PDF Organizer (one consolidated route).
- **Route migration:** three intent-preserving redirects with `mode=split/delete/extract`; Slug/Lorem become `noindex` immediately and 410 after one release; remove both from sitemap/internal search.
- **Category/navigation:** PDF category loses two net cards; Text loses two cards; PDF Organizer becomes a primary homepage task.
- **Architecture:** lifecycle fields and alias/redirect map in registry; lazy PDF.js thumbnails; reusable sortable page grid.
- **Tests:** old page grammar/output corpus; thumbnail/order/rotation/delete/split/extract; keyboard and touch reorder; encrypted/corrupt/large PDF; old-route canonical/redirect/sitemap; 410 behavior; favorites/recent alias migration.
- **Regression risks:** split ZIP semantics accidentally change; page order/duplicates lost; PDF.js adds excessive initial payload; old query redirects loop.
- **Exit criteria:** all old valid operations reproducible from Organizer, invalid semantics unchanged, old high-intent URLs reach the right mode in one hop, no PDF.js on non-organizer routes, no P1/P2 regression.
- **Rollback point:** checkpoint before routing changes, then one checkpoint for Organizer; rollback restores old routes and registry while retaining tests.

### Iteration 2 — mobile image/document workflow

**Current tools in scope (5):** Image Resizer, Image Cropper, Image Rotator, Grayscale Image, Image Converter.

- **Removed:** Grayscale standalone route.
- **Merged:** Resizer, Cropper, Rotator into Image Editor.
- **Added:** Image Editor; Document Scanner & Azerbaijani OCR replaces Grayscale; HEIC/HEIF capability added to existing Image Converter.
- **Route migration:** three edit routes redirect to editor modes; Grayscale is a true removal/410 with a non-indexable deprecation notice for one release; Scanner receives a new canonical; Image Converter keeps its canonical.
- **Category/navigation:** Scanner moves to PDF & Documents; Image Editor replaces three cards; mobile collection appears on homepage.
- **Architecture:** capability-based lazy Wasm loader; camera permission controller; transform model; worker pool; language-data cache policy; route-specific bundle budgets.
- **Tests:** crop/resize/rotate parity, EXIF/orientation/alpha/format, pointer and keyboard editing, camera lifecycle, manual corners, perspective correction, OCR `aze/eng` accuracy corpus, HEIC variants, memory/cancel/retry, offline assets, no payload requests.
- **Regression risks:** mobile tab crashes, Wasm bundle growth, inconsistent HEIC variants, OCR errors presented as certainty, camera tracks remaining active, metadata/location leakage.
- **Exit criteria:** two representative low/mid-tier Android devices and one iPhone/Safari complete bounded scans/conversions; OCR benchmark meets the approved threshold; route budgets pass; all output postconditions and privacy tests pass.
- **Rollback point:** ship Image Editor independently; keep Scanner/OCR and HEIC behind registry feature flags until their gates pass. Rollback disables only those entries/chunks.

### Iteration 3 — text and developer consolidation

**Current tools in scope (5):** Line Sorter, Duplicate-line Remover, Whitespace Cleaner, UUID Generator, Secure Token Generator.

- **Removed:** no underlying capabilities; five routes become two.
- **Merged:** first three into Text Cleanup Workspace; last two into ID & Token Studio.
- **Added:** two consolidated routes.
- **Route migration:** intent-preserving mode redirects; canonical only the two workspace routes; migrate favorites/recent.
- **Category/navigation:** Text & Study loses two net cards; Developer & Security loses one net card.
- **Architecture:** reusable transform-pipeline component, deterministic settings state, shared batch-copy/download result, worker threshold for large text.
- **Tests:** Unicode/Azerbaijani collation, CRLF/blank/case-sensitive and insensitive dedupe, operation ordering, before/after counts, undo, 10k token/UUID invariants, entropy/format/count bounds, redirect and search aliases.
- **Regression risks:** operation order changes results; dedupe defaults silently change; UUID SEO intent is weakened; settings URLs accidentally contain input.
- **Exit criteria:** exact current default outputs available as presets, combined workflows pass mobile/a11y tests, no text enters URL/storage/analytics, route migration has no loops or duplicate canonicals.
- **Rollback point:** checkpoint each workspace and then its redirects; old handlers remain callable until parity is signed off.

## 11. Route migration plan

| Current route slug | Target | Migration |
|---|---|---|
| `pdf-splitter` | `pdf-organizer?mode=split` | 301/308 intent-preserving redirect after one-release parity notice |
| `pdf-page-remover` | `pdf-organizer?mode=delete` | 301/308 redirect |
| `pdf-page-extractor` | `pdf-organizer?mode=extract` | 301/308 redirect |
| `image-resizer` | `image-editor?mode=resize` | 301/308 redirect; retain resize-specific landing state |
| `image-cropper` | `image-editor?mode=crop` | 301/308 redirect |
| `image-rotator` | `image-editor?mode=rotate` | 301/308 redirect |
| `line-sorter` | `text-cleanup?mode=sort` | 301/308 redirect |
| `duplicate-line-remover` | `text-cleanup?mode=deduplicate` | 301/308 redirect |
| `whitespace-cleaner` | `text-cleanup?mode=whitespace` | 301/308 redirect |
| `uuid-generator` | `id-token-studio?mode=uuid` | 301/308 redirect |
| `secure-token-generator` | `id-token-studio?mode=token` | 301/308 redirect |
| `lorem-ipsum-generator` | none | `noindex`, remove links/sitemap, then 410; no redirect |
| `slug-generator` | none | `noindex`, remove links/sitemap, then 410; no redirect |
| `grayscale-image` | none; new `document-scanner` route | deprecation notice then 410; do not redirect across unrelated intent |

For the current query-string route architecture, the app must still resolve old slugs deterministically. The preferred final state is build-generated clean paths with host-level redirects; client-only `location.replace` is a temporary compatibility layer, not the SEO end state.

## 12. Mandatory tool admission standard

A new tool cannot enter the registry until one admission record answers every item below.

### 12.1 Hard gates

1. **Proven problem:** one-sentence job-to-be-done and at least three real examples.
2. **Demand evidence:** at least two independent signal types; one must be more than competitor presence (first-party search data, community repetition, official workflow, user research, or stable transactional intent).
3. **Target audience/frequency:** named audience and credible recurrence.
4. **Meaningful advantage:** why this should exist in AzToolbox rather than a common OS/browser/editor; Azerbaijani, privacy, workflow depth, or quality advantage must be specific.
5. **No duplication:** comparison with every current tool; merge is the default when input/result/workflow overlap.
6. **Privacy/cost feasibility:** no paid API or unbounded recurring infrastructure; data-flow diagram and allowed network list.
7. **Polished UX specification:** full happy/error/cancel/mobile/a11y flow, not only input/button/output.
8. **Implementation feasibility:** browser APIs/libraries, licenses, bundle budget, performance caps, offline behavior, and cross-browser fallback.
9. **Regression plan:** pure logic, browser, binary/output, a11y, privacy, performance, and route/SEO tests as applicable.
10. **Owner/risk:** named maintenance owner, update sources, dependency/security review cadence, and rollback strategy.
11. **SEO integrity:** one distinct intent, canonical strategy, no doorway pages, and cannibalization analysis.
12. **Measurement plan:** success event and 30/90-day keep/iterate/remove criteria without payload analytics.

### 12.2 Score gate

- weighted portfolio score **≥ 7.0/10**;
- demand **≥ 6**, coherence **≥ 7**, privacy/client-side **≥ 8**;
- no unresolved legal/privacy issue;
- a lower score may pass only for a documented Azerbaijani public-interest need approved by the owner.

### 12.3 Removal review

At 90 days and every six months, review impressions, successful operations, repeat use, search exits, failure rate, performance, and maintenance cost. A low-use tool is not automatically removed if it is locally strategic, but it must have an explicit reason to remain. Tool count is never a KPI.

## 13. Tools rejected or deferred during research

| Candidate | Decision | Reason |
|---|---|---|
| PDF Compressor | Defer | Very strong demand, but reliable client-side compression with quality control needs a heavy raster/Wasm pipeline; pdf-lib alone is not enough. Prototype must prove size reduction, fidelity, and mobile bounds first. |
| PDF to Word/Excel/PowerPoint | Reject now | High fidelity usually needs server-side or paid SDKs, fonts/layout reconstruction, and high maintenance. |
| AI PDF chat/summarizer | Reject | Paid model/API cost, document privacy, hallucination, and ongoing infrastructure conflict with product principles. |
| Background remover | Defer | Strong demand but large model payload, weak low-end mobile performance, and quality/support burden; no lightweight prototype evidence yet. |
| Plagiarism checker / AI detector | Reject | Requires corpus/server access, has reliability and reputational risks, and cannot be honestly delivered client-side. |
| Dynamic/tracked QR codes | Reject | Requires hosted redirects, accounts/retention, analytics, and ongoing infrastructure; static QR remains private and durable. |
| Legal e-signature requests | Reject now | Visual signature placement is feasible, but identity, legal status, audit trail, storage, and delivery create legal/backend scope. |
| Live currency converter | Reject now | Requires current rate source/API and clear timing/source guarantees; browser-only static data would mislead. |
| Azerbaijan salary/tax calculator | Defer pending ownership | Official demand is real, but law/rate changes require an accountable source/effective-date/update process; official calculators already exist. |
| GPA calculator | Reject now | Grading systems vary, differentiation is weak, and no Azerbaijani standard/first-party demand evidence was established. |
| Color picker / screen ruler / stopwatch | Reject | Common OS/browser functionality with little product advantage. |
| Meme, fancy-text, random-name, coin-flip tools | Reject | Novelty/filler behavior would damage portfolio coherence. |
| Standalone CSV↔JSON converter | Defer | Useful, but primarily developer intent and does not outrank the selected consumer/document moves; could become a JSON Formatter mode after evidence. |
| Standalone Markdown preview | Defer | Useful but already strong in editors and developer tools; no local advantage or top-three unmet demand signal. |

## 14. Risks and dependencies

- **Bundle and memory:** OpenCV, Tesseract, PDF.js, and libheif are materially larger than the current app. Lazy loading, workers, mobile caps, and route budgets are mandatory.
- **OCR accuracy:** printed Azerbaijani must be benchmarked separately for Latin and Cyrillic; handwriting must be explicitly unsupported unless proven.
- **Browser coverage:** camera, HEIC, Canvas codecs, Wasm, and worker behavior require Chromium, Edge, Firefox, Safari/WebKit, Android, and iOS coverage.
- **SEO migration:** query-string routes and client-rendered metadata limit crawler clarity. Build-generated paths and host redirects require architectural approval.
- **Analytics:** even raw search queries can contain private text. The event schema needs an explicit privacy review before any provider is added.
- **Dependency security/licensing:** every new Wasm/model package needs pinned versions, license inventory, vulnerability monitoring, and a self-hosted artifact.
- **Official local rules:** IBAN structure and any future tax/rate logic need source URLs, last-verified dates, and owner alerts.
- **Scope creep:** Scanner/OCR can easily expand into cloud storage, AI cleanup, signatures, and document management; those are out of scope.
- **Migration parity:** old routes cannot redirect until their exact current successful behavior exists in the destination mode.

## 15. Product decisions requiring approval

1. Approve the target inventory of **30** and explicitly reject tool count as a success metric.
2. Approve removal without replacement of Lorem Ipsum and Slug Generator.
3. Approve the four consolidation destinations and their old-route redirects.
4. Approve replacing Grayscale Image with Document Scanner & Azerbaijani OCR at a new route, with no misleading redirect.
5. Approve the optional dependency/performance prototype for PDF.js, OpenCV.js, Tesseract.js plus `aze`, ZXing, and libheif before implementation.
6. Approve build-generated clean tool paths as the long-term SEO architecture; otherwise accept the limits of query-string/client metadata.
7. Approve the privacy-safe analytics event schema and provider/hosting choice; no raw search or payload collection.
8. Confirm that Azerbaijan salary/tax calculation remains deferred until a named legal/rule-maintenance owner exists.
9. Approve the mandatory admission standard and six-month portfolio review.

## 16. Compact approval table

Evidence: **H** = repeated strong market/workflow signal; **M** = credible but narrower signal; **L** = weak standalone demand. Confidence is the recommendation confidence.

| Current tool | Decision | Replacement/Merge | Evidence strength | Confidence | Iteration |
|---|---|---|---|---:|---:|
| PDF Merger | KEEP | — | H | 0.90 | — |
| PDF Splitter | MERGE | PDF Organizer / Split | H | 0.92 | 1 |
| PDF Page Remover | MERGE | PDF Organizer / Delete | M | 0.90 | 1 |
| PDF Page Extractor | MERGE | PDF Organizer / Extract | H | 0.92 | 1 |
| Image to PDF | IMPROVE | deeper layout/reorder controls | H | 0.90 | backlog |
| PDF Metadata Remover | KEEP | — | M | 0.78 | — |
| Image Resizer | MERGE | Image Editor / Resize | H | 0.90 | 2 |
| Image Compressor | IMPROVE | batch/target/compare | H | 0.95 | backlog |
| Image Converter | IMPROVE | add HEIC/HEIF | H | 0.88 | 2 |
| Image Cropper | MERGE | Image Editor / Crop | H | 0.90 | 2 |
| Image Rotator | MERGE | Image Editor / Rotate | M | 0.84 | 2 |
| Grayscale Image | REPLACE | Document Scanner & Azerbaijani OCR | H | 0.87 | 2 |
| Image Metadata Remover | KEEP | — | M | 0.80 | — |
| Word Counter | KEEP | — | H | 0.93 | — |
| Case Converter | KEEP | — | M | 0.75 | — |
| Line Sorter | MERGE | Text Cleanup / Sort | M | 0.80 | 3 |
| Duplicate-line Remover | MERGE | Text Cleanup / Deduplicate | M | 0.82 | 3 |
| Whitespace Cleaner | MERGE | Text Cleanup / Whitespace | M | 0.82 | 3 |
| Slug Generator | REMOVE | none | L | 0.80 | 1 |
| Lorem Ipsum Generator | REMOVE | none | L | 0.92 | 1 |
| Text Compare | IMPROVE | real diff workflow | H | 0.90 | backlog |
| JSON Formatter | IMPROVE | editor/tree/error depth | H | 0.90 | backlog |
| Base64 Encoder | IMPROVE | URL-safe and file modes | M | 0.72 | backlog |
| URL Encoder | KEEP | — | M | 0.68 | — |
| JWT Decoder | KEEP | — | M | 0.82 | — |
| Hash Generator | IMPROVE | File & Text Hash | M | 0.82 | backlog |
| UUID Generator | MERGE | ID & Token Studio / UUID | M | 0.76 | 3 |
| Timestamp Converter | KEEP | — | H | 0.86 | — |
| Regex Tester | KEEP | — | H | 0.86 | — |
| Percentage Calculator | KEEP | — | H | 0.95 | — |
| VAT Calculator | IMPROVE | clearer local scenarios | H | 0.88 | backlog |
| Unit Converter | IMPROVE | multi-dimension converter | H | 0.94 | backlog |
| Loan Calculator | IMPROVE | amortization/scenarios | H | 0.90 | backlog |
| QR Generator | IMPROVE | QR Studio Generate & Scan | H | 0.85 | backlog |
| Password Generator | KEEP | — | H | 0.88 | — |
| Password Strength | IMPROVE | deeper guidance/corpus | H | 0.84 | backlog |
| Secure Token Generator | MERGE | ID & Token Studio / Token | M | 0.76 | 3 |
| AZ IBAN Validator | KEEP | — | H/local | 0.95 | — |
| Latin/Cyrillic Transliterator | IMPROVE | mixed-script and workflow depth | H/local | 0.92 | backlog |

## 17. Final accounting

| Measure | Result |
|---|---:|
| Current tool count | **39** |
| Proposed final tool count | **30** |
| Current tools removed with no replacement | **2** |
| Current tools merged | **11 into 4 destinations** |
| Net reduction from merges | **7** |
| Current tools replaced | **1** |
| Newly introduced tools/routes | **1 replacement; 0 net-new slots** |
| Current tools marked improve | **13** |
| Ranked weak/fragmented tools | **14** |
| Rejected/deferred candidates documented | **14** |
| Decisions requiring approval | **9** |

Arithmetic: `39 − 2 outright removals − 7 consolidation reduction = 30`; the Grayscale-to-Scanner replacement is count-neutral.

The recommended portfolio is not final because it has exactly 30 tools. It is final because every retained route has a defensible job, and every future route must earn its place under the admission standard.
