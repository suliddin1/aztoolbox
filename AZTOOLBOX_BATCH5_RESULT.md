# AzToolBox Remediation Batch 5 Result

## Scope and baseline

- Starting commit: `6b5b63d92f07e8ed9c203b95e54c7761c6930002` (`fix: complete AzToolbox remediation batch 4`).
- Starting branch/status: `main`; clean working tree after the Batch 4 checkpoint.
- Exact issue IDs: **AZT-021, AZT-023, AZT-024, AZT-026, AZT-027, AZT-028**.
- Approved dependencies applied without expanding tool scope: PD-7 grapheme counting, PD-8 decoder-only JWT disclosure, and PD-10 local-only feedback disclosure/copy/mailto handoff.
- No Batch 6 artifact/build work, portfolio research, tool removal/replacement, redesign, deployment, or new product feature was performed.

## Reproduced defects

| Issue | Starting-tree reproduction | Result |
|---|---|---|
| AZT-021 | `👩‍💻` used UTF-16 `.length` and displayed five characters; the statistics surface had no live region. | Confirmed. |
| AZT-023 | `aztoolbox-recent={}` made `recordRecent` call `.filter` on an object and stopped tool rendering; other non-array shapes and storage exceptions had the same unsafe boundary. | Confirmed. |
| AZT-024 | All six HTML routes referenced Google Fonts despite the local-processing privacy position. | Confirmed. |
| AZT-026 | Tool title changed, but all 39 routes reused one generic description and had no canonical link. | Confirmed. |
| AZT-027 | `tool/index.html` eagerly loaded both `pdf-lib.min.js` and `qrcode.min.js` for text, calculator, image, PDF, and QR routes alike. | Confirmed. |
| AZT-028 | `39` appeared in static home/catalog metadata and copy; home PDF capability copy claimed compression although no PDF-compression tool exists. | Confirmed. |

The intentional-limit baselines were also confirmed: JWT decoding did not visibly distinguish decoding from validation, and feedback cleared the form after a local-only submit message without offering the approved handoff controls.

## Files and functions changed

- `assets/js/batch5-tools.js` (new): grapheme fallback/segmentation, `textStatistics`, safe storage helpers, slug sanitization, registry capability copy, tool SEO/canonical helpers, and vendor dependency mapping.
- `assets/js/app.js`: `renderHome`, `renderCatalog`, text-counter workspace/update, tool metadata, dynamic vendor loading, not-found metadata, dependency error state, and `initFeedback`.
- `assets/js/components.js`: `readList`, `writeList`, favorites/recent sanitization, and storage-safe theme behavior.
- `assets/js/theme-init.js`: safe and validated theme-storage startup.
- `assets/js/simple-tools.js`: persistent decoder-only JWT warning.
- `assets/css/app.css`: 44 px breadcrumb, shortcut, and footer-link targets without changing hierarchy.
- `index.html`, `tools/index.html`: registry-filled count/title/description placeholders and removal of remote font links.
- `tool/index.html`: removal of remote fonts and eager PDF/QR vendor scripts.
- `about/index.html`, `privacy/index.html`, `feedback/index.html`: removal of remote fonts; privacy and local-feedback disclosures; feedback status live region.
- `tests/batch5/core-tools.test.mjs` (new): grapheme, storage, registry, SEO, canonical, and dependency contracts.
- `tests/batch5/browser-regression.cjs` (new): storage, 39-route metadata, network/lazy loading, disclosures, accessibility, keyboard, and viewport verification.
- `AZTOOLBOX_BATCH5_RESULT.md` (new): this result record.

## Fixes implemented

- Text character counts now use `Intl.Segmenter('az', { granularity: 'grapheme' })`; a documented dependency-free fallback keeps common combining marks, emoji modifiers, ZWJ sequences, flags, and CRLF together.
- Visible statistics update immediately while a single polite/atomic summary is announced after a 300 ms quiet period.
- Storage reads accept arrays only; malformed JSON, objects, strings, numbers, null, unknown slugs, non-strings, duplicates, and storage-denied exceptions fall back safely. Writes are exception-safe.
- External font requests were removed from all six HTML entry routes. The site uses its existing system-font fallbacks; PDF/QR libraries remain local.
- Each valid tool route now receives a unique title and registry-derived description plus an exact absolute canonical. Unknown slugs receive not-found copy, `noindex`, and no misleading canonical.
- PDF vendor code loads only for PDF/Image-to-PDF kinds; QR vendor code loads only for QR. Other tool routes request neither. A failed local dependency leaves controls disabled and shows a deterministic retry error.
- Home/catalog totals and metadata are populated from `tools.length`; category copy is selected from capabilities actually present in the registry and no longer promises absent PDF compression.
- Breadcrumb/shortcut/footer targets meet 44 px sizing. Existing focus trapping, Escape close/focus restoration, reduced motion, and responsive layout were retained and verified.
- JWT stays decoder-only and always states that signature, expiry, and validity are not checked.
- Feedback remains local: disclosure appears before submit, draft fields are not cleared, copy and recipient-free `mailto:` handoff are offered, and no backend/network submit was introduced.

## Exact test results

### Targeted Batch 5

- `node --test tests/batch5/core-tools.test.mjs`: **5 passed, 0 failed, 0 blocked**.
- `node --test tests/batch5/browser-regression.cjs` on Chromium: **6 passed, 0 failed, 0 blocked**.
- Same browser suite on installed Microsoft Edge: **6 passed, 0 failed, 0 blocked**.

### Previous-batch regressions

- Batch 1 unit: **8 passed, 0 failed**.
- Batch 2 unit: **5 passed, 0 failed**.
- Batch 3 unit: **6 passed, 0 failed**.
- Batch 4 unit: **4 passed, 0 failed**.
- Batch 1 browser: **10/10 Chromium; 10/10 Edge**.
- Batch 2 browser: **5/5 Chromium; 5/5 Edge**.
- Batch 3 browser: **6/6 Chromium; 6/6 Edge**.
- Batch 4 browser: **5/5 Chromium; 5/5 Edge**.
- Unit total for Batches 1–5: **28 passed, 0 failed**.
- Browser total for Batches 1–5: **64 passed, 0 failed** (**32 per browser**).
- JavaScript syntax: every `assets/js/*.js` file passed `node --check`.
- Static preview: all exercised physical and logical routes loaded from the Python server.
- Monitored console errors, page errors, local HTTP errors, and unexpected failed local network requests: **0**.
- `git diff --check`: **passed**.

One fixture-only Edge failure used a fixed 250 ms sample for a 220 ms animated focus restore. It was diagnosed as test timing, changed once to a bounded state wait, and the complete affected Edge and Chromium checks passed. No production failure remained.

## Independent output verification

- Grapheme corpus: `👩‍💻`, `👍🏽`, `e` + combining acute, CRLF, and Azerbaijani text produced **16 visible characters**, **13 non-whitespace characters**, and **2 lines** for the combined fixture; the live summary mutated once after rapid input.
- Storage matrix: malformed JSON/object/string/null/number and denied get/set access rendered the requested tool without page errors; recovery stored `['qr-generator','text-counter']` after unknown/duplicate sanitization.
- SEO sweep: **39/39** tool routes had matching H1, unique title, unique description, exact canonical, and no `noindex`; the unknown route had not-found metadata, `noindex`, and no canonical.
- Network matrix: JSON requested no vendor; PDF requested only `pdf-lib.min.js`; QR requested only `qrcode.min.js`; no Google Font or other external request occurred. A JSON operation emitted no fetch/XHR.
- Registry UI: home total, home CTA, catalog total, title, and description all matched `tools.length`; PDF category copy contained no compression claim.
- Viewports **320, 375, 768, 1440, and 1920 px** had no horizontal overflow; tested breadcrumb/favorite targets were at least 44 px. Mobile/desktop navigation visibility, menu/search focus restoration, keyboard Escape, focus traps, and reduced-motion behavior passed.
- Feedback remained populated after draft creation and produced local copy plus a recipient-free encoded `mailto:` handoff. JWT decoded a valid fixture while its non-validation warning remained visible.

## Item disposition

- Fixed: **AZT-021, AZT-023, AZT-024, AZT-026, AZT-027, AZT-028**.
- Approved limitation contracts completed: **PD-8 JWT warning, PD-10 local feedback disclosure/handoff**.
- Partial: none.
- Blocked: none.
- Not reproduced: none.

## Regressions checked

- All Batch 1 file limits, QR, PDF/image outputs, compression fidelity, direct registered routes, and error recovery.
- All Batch 2 transliteration, password, IBAN, and Image-to-PDF contracts.
- All Batch 3 calculator, timestamp, regex, route/history/not-found contracts.
- All Batch 4 page grammar, ZIP/PDF outputs, image format/metadata/alpha, lifecycle, URL-balance, and stale-async contracts.
- Valid-after-invalid recovery, stale-result cleanup, direct routes/refresh, dependency failure, keyboard focus, responsive layout, privacy/network allowlist, and console/page/HTTP/network cleanliness.

## Remaining risks

- System font rendering varies slightly by operating system now that remote Manrope/DM Mono requests are removed; layout was verified at all configured widths in both installed browsers.
- Canonical/description metadata is client-rendered by the static application. Crawlers that do not execute JavaScript will see the generic shell metadata.
- An uncached offline PDF/QR vendor request cannot complete; the tool fails explicitly without false success. All vendor files are local and work when the static site itself is available.
- Full original 1,955-scenario audit was intentionally not rerun.

## Final diff, status, and decision

- Expected Batch 5 paths before checkpoint: `AZTOOLBOX_BATCH5_RESULT.md`, all six physical HTML entry files, `assets/css/app.css`, `assets/js/app.js`, `assets/js/batch5-tools.js`, `assets/js/components.js`, `assets/js/simple-tools.js`, `assets/js/theme-init.js`, and `tests/batch5/{core-tools.test.mjs,browser-regression.cjs}`.
- No Batch 6 source, artifact, result, or summary file is present.
- All configured tests and earlier regressions pass; browser errors are zero; `git diff --check` passes.
- **Batch 5 is safe to commit locally with the required checkpoint message.**
