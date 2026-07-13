# AzToolbox Batch 2 — implementation and verification result

Implementation date: **13 July 2026**  
Branch: **`main`**  
Starting commit: **`499e0b77672ec0bdc96d15e2dd6e2bd6a4b15a43`**  
Scope: **AZT-001, AZT-002, AZT-005, AZT-006 and AZT-007 only**

No dependency was installed, no package file was changed, and no commit, push or deployment was performed. The original 1,955-scenario audit was not rerun.

## 1. Baseline and reproduction

Implementation started on a clean `main` working tree synchronized with `origin/main` at `499e0b77672ec0bdc96d15e2dd6e2bd6a4b15a43`.

All five Batch 2 findings were reproduced before production changes:

| Issue | Confirmed baseline result |
|---|---|
| **AZT-001** | `gqjyGQJY` became `гҝјыГҜЈЫ`; the `g/q/j/y` mapping and round trip were wrong. |
| **AZT-002** | A browser-created valid static WebP produced “Şəkillər PDF-ə çevrilə bilmədi” and no download. |
| **AZT-005** | In 1,000 eight-character all-group passwords, uppercase was absent 27 times, lowercase 16 times, numbers 385 times and symbols 240 times. |
| **AZT-006** | `Password1234!` was reported as `Çox güclü — 5/5`. |
| **AZT-007** | Checksum-valid but structurally invalid `AZ97000000000000000000000000` was accepted. |

The first Batch 2 browser characterization run against the unchanged production code failed **5/5**, one test for each issue.

## 2. Final issue disposition

| Issue | Disposition | Verified result |
|---|---|---|
| **AZT-001** | **FIXED AND VERIFIED** | Explicit lower/uppercase Latin↔Cyrillic maps now correctly cover the 32-letter Azerbaijani alphabet, including `g→ҝ`, `q→г`, `j→ж` and `y→ј`. Punctuation, digits, emoji and unsupported characters are preserved; the mapped alphabet round trips exactly. |
| **AZT-002** | **FIXED AND VERIFIED** | Static PNG, JPEG and WebP are detected by signature, decoded safely, rasterized to PNG for PDF embedding, and retained in selected order. Transparency and browser-applied EXIF orientation are preserved. Animated WebP/APNG/GIF are rejected clearly. Corrupt and mixed batches publish no partial result; a valid retry works and old downloads are cleared. Output PDFs reopen with the expected page count and sizes. |
| **AZT-005** | **FIXED AND VERIFIED** | Every selected group contributes at least one character, remaining positions are selected with rejection sampling, and the result is shuffled with WebCrypto-derived unbiased indices. No-group, non-integer and out-of-range lengths fail clearly. All 15 group combinations and 10,000 samples pass the invariant. |
| **AZT-006** | **FIXED AND VERIFIED AGAINST THE APPROVED LOCAL CORPUS** | The local conservative model detects common words, Azerbaijani common patterns, substitutions, repeats, sequences, keyboard rows and short date patterns. It recognizes long multiword passphrases, uses password input semantics and gives a reason, recommendation and explicit “local estimate, no guarantee” note. |
| **AZT-007** | **FIXED AND VERIFIED** | The validator now enforces `AZ2!n4!a20!c` before MOD-97: four letters for the bank identifier and 20 alphanumeric account characters. Success wording explicitly says that bank/account existence is not confirmed. |

Batch 2 fixed: **5**. Partial: **0**. Blocked: **0**.

## 3. Product-decision implementation

All product decisions were treated as approved requirements.

- **PD-11:** animated inputs are rejected rather than silently flattened to the first frame.
- **PD-13:** AZ IBAN validation is local structure plus checksum only; no bank or account existence claim is made.

The IBAN subtype is supported by the Central Bank of Azerbaijan’s published 28-character structure (four BIC characters plus a 20-character account number) and the SWIFT IBAN Registry’s exact `AZ2!n4!a20!c` pattern:

- <https://www.cbar.az/page-618/iban?language=en>
- <https://www.swift.com/sites/default/files/files/iban-registry-v101.pdf>

## 4. Files changed

Production files:

- `assets/js/batch2-tools.js` — new testable transliteration, password generation/strength and AZ IBAN logic.
- `assets/js/app.js` — password generator integration and validation.
- `assets/js/simple-tools.js` — transliteration, strength, IBAN and Image-to-PDF integration.
- `assets/js/tools-data.js` — Image-to-PDF WebP capability copy/keyword alignment.

Test files:

- `tests/batch2/core-tools.test.mjs` — new five-test pure-logic suite, including 10,000 password samples.
- `tests/batch2/browser-regression.cjs` — new five-test end-to-end Chromium/Edge suite.
- `tests/batch1/browser-regression.cjs` — mixed Image-to-PDF assertion updated to require complete preflight before the first embed. The user-visible Batch 1 atomic-failure contract is unchanged and stronger.

Documentation:

- `AZTOOLBOX_BATCH2_RESULT.md` — this result.

No Batch 3–6 production handler, route, calculator, regex behavior, PDF page semantics, shared result lifecycle, accessibility shell or deployment artifact was changed.

## 5. Batch 2 tests

### Pure logic

```powershell
node --test tests/batch2/core-tools.test.mjs
```

Final result: **5 passed, 0 failed, 0 skipped**.

Coverage includes the full bidirectional alphabet, punctuation/unsupported Unicode, all 15 password group combinations, 10,000 generated samples, min/max/invalid lengths, injected WebCrypto-compatible randomness, predictable/repeated/sequential/common/passphrase strength cases, Unicode/empty input, and AZ IBAN normalization/subtype/checksum vectors.

Node emitted the existing `MODULE_TYPELESS_PACKAGE_JSON` warning. No package file was added or changed solely to suppress it.

### Chromium

```powershell
node --test tests/batch2/browser-regression.cjs
```

Final exact-current-tree result: **5 passed, 0 failed, 0 skipped**.

### Microsoft Edge

```powershell
$env:BROWSER_EXECUTABLE='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
node --test tests/batch2/browser-regression.cjs
```

Final exact-current-tree result: **5 passed, 0 failed, 0 skipped**.

## 6. Image-to-PDF output verification

The browser suite creates and processes real binary image/output objects, not only UI state. Confirmed in Chromium and Edge:

- ordered transparent PNG (`3×2`), JPEG (`4×3`), MIME-mismatched static WebP (`5×4`) and EXIF-orientation-6 JPEG (`6×3` source rendered as `3×6`);
- output begins with `%PDF-` and reopens successfully;
- four input files produce four pages in the same order and expected sizes;
- the PDF contains at least two image soft masks, confirming alpha preservation for transparent PNG and WebP;
- animated WebP, APNG and GIF each produce the approved no-animation message and no download;
- corrupt and valid+corrupt batches produce no misleading partial success;
- valid WebP works after failures, produces a reopenable one-page PDF and stale output remains cleared on failure;
- actual signature, rather than declared MIME alone, determines the decode path.

## 7. Batch 1 regression

```powershell
node --test tests/batch1/guards.test.mjs tests/batch1/pdf-metadata.test.mjs
```

Result: **8 passed, 0 failed, 0 skipped**.

```powershell
node --test tests/batch1/browser-regression.cjs
```

Final Chromium result: **10 passed, 0 failed, 0 skipped**.

With the existing Edge executable, the same Batch 1 browser suite also passed **10/10**.

This reverifies QR, PDF metadata, Image-to-PDF pre-decode limits/atomicity/recovery, PDF page grammar, image compressor format/signature/transparency, animation/text/regex limits, representative existing tools and all 39 direct routes.

## 8. Syntax and static preview

```powershell
Get-ChildItem assets/js/*.js | ForEach-Object { node --check $_.FullName }
node --check assets/vendor/qrcode.min.js
```

Result: **11/11 passed** (10 application JavaScript files plus the QR vendor file).

The repository remains a zero-build static app with no project build pipeline. A Python static preview using the documented server model loaded the homepage and all five Batch 2 routes with HTTP 200 and the expected H1 values.

Static-preview errors:

- console errors: **0**
- page errors: **0**
- failed requests: **0**
- HTTP responses ≥400: **0**

## 9. Remaining risks and intentional boundaries

- Password strength is deliberately conservative and local; it is not an online breach lookup and cannot guarantee real-world safety. The corpus should grow over time without weakening the current predictable-pattern expectations.
- Image-to-PDF rasterizes supported static inputs to PNG before embedding. This safely preserves alpha and browser-applied orientation but can increase PDF size for photographic JPEG/WebP; existing generated-output limits fail closed.
- Canvas color-management differences outside tested Chromium/Edge versions remain possible. Firefox/WebKit coverage belongs to Batch 6.
- Transliteration guarantees exact round trip for the reviewed Azerbaijani alphabet table; unsupported non-Azerbaijani Cyrillic letters are intentionally left unchanged.
- IBAN success confirms only published structure and MOD-97, never a real bank/account.

None of these risks blocks Batch 2 under the approved product decisions.

## 10. Safety-to-commit assessment

**YES — Batch 2 is safe to commit as a reviewable, Batch-2-only change set**, subject to normal human diff review.

Reasons:

- all five reproduced P1 issues pass focused pure and real-browser regression tests;
- actual PDF binary output, page order/sizes, alpha and orientation were verified;
- Batch 1 unit, Chromium and Edge regressions are green;
- static preview and JavaScript syntax checks are clean;
- no dependency, package, build, commit, push or deployment change occurred;
- no Batch 3–6 behavior was implemented.

## 11. Final Git status

Final branch/commit: `main` / `499e0b77672ec0bdc96d15e2dd6e2bd6a4b15a43`, still tracking synchronized `origin/main`; no new commit exists.

```text
## main...origin/main
 M assets/js/app.js
 M assets/js/simple-tools.js
 M assets/js/tools-data.js
 M tests/batch1/browser-regression.cjs
?? AZTOOLBOX_BATCH2_RESULT.md
?? assets/js/batch2-tools.js
?? tests/batch2/
```

`git diff --check` passed. The only Git messages were line-ending notices stating that Git may replace LF with CRLF in four already tracked working-copy files; no whitespace error was reported.
