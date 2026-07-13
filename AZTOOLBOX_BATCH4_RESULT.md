# AzToolBox Remediation Batch 4 Result

## Scope and baseline

- Starting commit: `da9324b516171d77300023f449235f3b65048378` (`fix: complete AzToolbox remediation batch 3`).
- Starting branch/status: `main`; clean working tree; local `main` and `origin/main` synchronized.
- Exact issue IDs: **AZT-015, AZT-017, AZT-018, AZT-019, AZT-020**.
- Scope was limited to PDF page grammar/output semantics, shared result/download lifecycle, Blob URL cleanup, image metadata-remover fidelity, and image-resizer validation/fidelity. No Batch 5/6 implementation, portfolio work, redesign, deployment, or product-decision change was performed.

## Reproduced defects

| Issue | Reproduction on starting tree | Result |
|---|---|---|
| AZT-015 | `3,1,3` was normalized to `[1,3]`; splitter and extractor both produced one combined PDF. Reversed and partial expressions were already rejected by Batch 1 guards. | Confirmed order/duplicate/output defect; strict-error subcases already fixed. |
| AZT-017 | A successful percentage result remained visible after changing its input. The same unversioned publication pattern existed in async image/PDF paths. | Confirmed. |
| AZT-018 | Three metadata-removal runs created six object URLs but revoked only three temporary decode URLs; preview URLs remained live. | Confirmed. |
| AZT-019 | JPEG and WebP metadata-remover inputs were always re-encoded as PNG. Animation policy was not presented next to the controls. | Confirmed. |
| AZT-020 | JPEG resize output was always PNG. Corrupt input already produced a clear signature error because of the Batch 1 guard, so that original sub-defect was not reproduced. | Format defect confirmed; corrupt-silence subcase not reproduced. |

## Files and functions changed

- `assets/js/batch4-tools.js` (new): `imageExtension`, `imageOutputType`, `createResultLifecycle`, `createStoredZip`.
- `assets/js/tool-guards.js`: `parsePageSelection` now supports explicit order/duplicate policies while retaining sorted/deduplicated defaults for remover and earlier callers.
- `assets/js/simple-tools.js`: `simpleToolWorkspace`, `setupFile`, `imageFrom`, PDF split/extract/remove execution, Image-to-PDF invalidation, image-family execution, hash/regex async publication.
- `assets/js/app.js`: shared result lifecycle integration, tool-wide input/change invalidation, image-resizer decode/output path, PDF merger async publication, preview URL disposal, image capability copy.
- `tests/batch4/core-tools.test.mjs` (new): parser policy, stored ZIP, image-format contract, and lifecycle tests.
- `tests/batch4/browser-regression.cjs` (new): independent PDF/ZIP/image output and state/resource tests.
- `tests/batch1/browser-regression.cjs`: updated extractor expectation to the approved order/duplicate policy and replaced a fixed Image-to-PDF delay with a bounded readiness wait.
- `AZTOOLBOX_BATCH4_RESULT.md` (new): this result record.

## Fixes implemented

- Splitter now emits one single-page PDF per selected occurrence inside a stored ZIP, with ordered names such as `sehife-3.pdf`, `sehife-1.pdf`, `sehife-3-2.pdf`.
- Extractor preserves the exact entered order and duplicates in one combined PDF. Remover keeps deterministic deduplication. Reversed, partial, unsafe, blank, and out-of-range expressions fail atomically.
- A monotonic result lifecycle invalidates successes/download controls on input, option, and file changes. Async work can publish only when its operation ID is current.
- Preview Blob URLs are revoked on replacement, invalidation, error/reset flow, and unload; temporary download URLs retain their separate delayed cleanup.
- Metadata remover and resizer preserve the independently detected PNG/JPEG/WebP source format. MIME/extension/filename and decoded output signature are validated before publication.
- Static PNG/WebP alpha and dimensions are preserved. Animated inputs are explicitly rejected. Metadata removal is performed by canvas re-encoding and verified not to copy the injected JPEG EXIF marker.
- Corrupt and misleading-MIME files produce explicit errors, and a valid input works after an error. Existing dimension/pixel bounds remain enforced.

## Exact test results

### Targeted Batch 4

- `node --test tests/batch4/core-tools.test.mjs tests/batch1/guards.test.mjs`: **11 passed, 0 failed, 0 blocked**.
- `node --test tests/batch4/browser-regression.cjs` on Chromium: **5 passed, 0 failed, 0 blocked**.
- Same Batch 4 browser suite on installed Microsoft Edge: **5 passed, 0 failed, 0 blocked**.

### Previous-batch regressions

- Batch 1 unit: **8 passed, 0 failed**.
- Batch 2 unit: **5 passed, 0 failed**.
- Batch 3 unit: **6 passed, 0 failed**.
- Batch 1 browser on Chromium: **10 passed, 0 failed**.
- Batch 2 browser on Chromium: **5 passed, 0 failed**.
- Batch 3 browser on Chromium: **6 passed, 0 failed**.
- Batch 1 browser on Edge: **10 passed, 0 failed**.
- Batch 2 browser on Edge: **5 passed, 0 failed**.
- Batch 3 browser on Edge: **6 passed, 0 failed**.
- Browser/static-preview totals across Chromium and Edge: **52 passed, 0 failed** (26 per browser).
- Unit totals for Batches 1–4: **23 passed, 0 failed**.
- JavaScript syntax: every `assets/js/*.js` file passed `node --check`.
- Static preview: Python static server loaded all exercised routes; monitored console errors, page errors, local HTTP errors, and failed local network requests: **0**.
- `git diff --check`: **passed**.

Two fixture-only failures were diagnosed and repaired within the bounded policy: the new test used the wrong QR slug (one repair), and an existing Edge fixture used a fixed 140 ms Image-to-PDF delay (one repair). Both suites passed after their affected checks were rerun. No production-code test failure remained.

## Independent output verification

- Extractor `3,1,3`: three-page PDF with page sizes **103×203, 101×201, 103×203** in that order.
- Remover `3,1,3`: one remaining page, **102×202**, confirming duplicate removal is idempotent.
- Splitter `3,1,3`: valid `application/zip` with ZIP signature `0x04034b50`; three independently reopened one-page PDFs in the approved order and with the approved duplicate filename suffix.
- Metadata remover: valid JPEG, PNG, WebP signatures and matching `.jpg`, `.png`, `.webp` names; all outputs reopened at **2×2**; PNG/WebP transparent pixels remained non-opaque; injected JPEG `Exif` marker was absent.
- Resizer: JPEG, PNG, WebP, and misleading-MIME PNG outputs independently decoded at **1×1** with matching MIME, extension, filename, and signature.
- Lifecycle stress: **100** repeated metadata-removal operations produced a **200 created / 200 revoked** object-URL balance after invalidation. A deliberately delayed stale completion published no result; the next valid run succeeded.

## Item disposition

- Fixed: **AZT-015, AZT-017, AZT-018, AZT-019, AZT-020**.
- Partial: none.
- Blocked: none.
- Not reproduced: only AZT-020's historical silent-corrupt-input subcase, already resolved by the committed Batch 1 signature guard; it remained covered and passing.

## Regressions checked

- Batch 1 limits, QR, PDF metadata, Image-to-PDF, compression fidelity, animation policy, and all registered direct routes.
- Batch 2 transliteration, password generator/strength, AZ IBAN, and Image-to-PDF fidelity/order/atomic recovery.
- Batch 3 numeric calculators, timestamp, regex, and not-found/history routing.
- Valid-after-invalid recovery, stale-result cleanup, old-download removal, rapid async invalidation, PDF/image binary reopening, MIME/extension consistency, and zero console/page/HTTP/network errors.

## Remaining risks

- ZIP construction intentionally uses uncompressed stored entries; this favors a small dependency-free implementation and deterministic verification but may create larger archives for image-heavy PDFs.
- Canvas codec quality remains browser-implementation-dependent, especially lossy JPEG/WebP re-encoding; format, signature, dimensions, transparency where supported, and metadata postconditions are enforced.
- Full original 1,955-scenario audit was intentionally not rerun.

## Final diff, status, and decision

- Expected Batch 4 working-tree paths before checkpoint: `AZTOOLBOX_BATCH4_RESULT.md`, `assets/js/app.js`, `assets/js/batch4-tools.js`, `assets/js/simple-tools.js`, `assets/js/tool-guards.js`, `tests/batch1/browser-regression.cjs`, `tests/batch4/core-tools.test.mjs`, `tests/batch4/browser-regression.cjs`.
- No Batch 5 or Batch 6 files are present.
- All configured tests pass, prior verified behavior passes, monitored browser errors are zero, and `git diff --check` passes.
- **Batch 4 is safe to commit locally with the required checkpoint message.**
