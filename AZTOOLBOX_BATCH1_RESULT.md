# AzToolbox Batch 1 — final verification result

Verification date: **13 July 2026**  
Branch: **`main`**  
Commit: **`b1b13eb731bbe0fa685970638f8ae123c4d98b43`**  
Scope: **AZT-003, AZT-004, AZT-008, AZT-009, AZT-016 only**

## 1. Exact working-tree baseline

The verification started on `main`, tracking `origin/main`, at commit `b1b13eb731bbe0fa685970638f8ae123c4d98b43`.

Tracked diff at the start of verification:

```text
assets/js/app.js            |  73 +++++++++++++++++++++---
assets/js/simple-tools.js   | 135 +++++++++++++++++++++++++++++++++-----------
assets/js/tools-data.js     |   2 +-
assets/vendor/qrcode.min.js |   2 +-
4 files changed, 169 insertions(+), 43 deletions(-)
```

The new production modules and all Batch 1 tests are untracked, so they are not included in that `git diff --stat` output.

## 2. Final issue disposition

| Issue | Final disposition | Verified result |
|---|---|---|
| **AZT-003** | **FIXED AND VERIFIED** | The cleaned PDF reopens; page count, sizes, visible content, 90° rotation, AcroForm field and attachment/name tree are preserved. Title, author, subject, keywords, creator, producer, creation/modification dates and custom Info values are absent. No `AzToolBox` attribution is inserted. |
| **AZT-004** | **FIXED; INDEPENDENT DECODER CHECK BLOCKED** | Exact whitespace, Azerbaijani letters, emoji/ZWJ UTF-8 bytes, PNG creation, 192/256/384 sizes, 1,200-byte valid input, over-limit failure and stale-output cleanup pass in Chrome and Edge. Serialized byte count equals the actual serialized array. An independent decoder is unavailable in this environment. |
| **AZT-008** | **FIXED AND VERIFIED** | PNG/JPEG/WebP format, MIME, signature, dimensions, extension and transparency behavior pass. Animated inputs fail clearly. Null/fallback output fails closed. A larger/equal result is not presented as successful compression and the original is the primary choice. |
| **AZT-009** | **FIXED AND VERIFIED** | Reversed, partial, unsafe, out-of-range and over-work page expressions are rejected atomically. Valid input works after failure. Current sort/deduplicate semantics are intentionally retained until Batch 4. |
| **AZT-016** | **BATCH 1 HARD-LIMIT SCOPE VERIFIED; OVERALL PARTIAL** | File count/bytes/total bytes, PDF pages, combined PDF pages, page expression/tokens/expansion, image dimensions/pixels, generated output, QR UTF-8 bytes, general text and regex lengths are bounded. Image-to-PDF rejects unsafe dimensions and corrupt data before `embedPng`/expensive image decoding. True worker termination/cancellation of already-started operations is not implemented and remains deferred; no fake timeout guarantee is claimed. |

## 3. Unit tests

Command:

```powershell
node --test tests/batch1/guards.test.mjs tests/batch1/pdf-metadata.test.mjs
```

Final result on the exact current tree: **8 passed, 0 failed, 0 skipped**.

Covered contracts:

- strict/atomic PDF page grammar and bounded expansion;
- file count, per-file size, total-size and generated-size limits;
- QR UTF-8 byte limits with exact whitespace preservation;
- text, canvas-side and decoded-pixel limits;
- PNG/JPEG/WebP signature, dimensions and animation inspection;
- complete PDF Info removal and page/catalog/form/attachment fidelity.

Node emitted only the existing `MODULE_TYPELESS_PACKAGE_JSON` warning. No package file was changed to suppress it.

## 4. PDF metadata independent structural inspection

The cleaner was exercised outside the test assertion using a two-page in-memory PDF containing:

- mixed page sizes (`321×456` and `612×792`);
- a 90° rotated first page;
- visible `BATCH1_SENTINEL` content;
- an AcroForm text field (`profile.name = Alice`);
- an embedded attachment (`batch1.txt`, description and exact bytes);
- title, author, subject, keywords, creator, producer, creation/modification dates and a custom Info key.

Confirmed output:

- reopened successfully with pdf-lib;
- 2 pages and both page sizes preserved;
- 90° rotation preserved;
- decoded visible-content sentinel preserved;
- AcroForm and field value preserved;
- catalog Names/EmbeddedFiles tree, attachment name, description and bytes preserved;
- trailer `/Info` reference absent;
- all queried standard metadata undefined;
- custom Info value absent;
- raw output contains no `AzToolBox` attribution.

The first current-tree test run was **7 pass / 1 fail** because the test assumed an attachment filename must appear as plain ASCII in raw serialized PDF bytes. Structural inspection proved pdf-lib had encoded and preserved the active attachment correctly. The test fixture was corrected to traverse the active name tree and verify the embedded bytes. The final rerun passed **8/8**. No production change was needed.

## 5. Browser regression

### Chromium

```powershell
node --test tests/batch1/browser-regression.cjs
```

Final exact-current result: **10 passed, 0 failed, 0 skipped**.

### Microsoft Edge

```powershell
$env:BROWSER_EXECUTABLE='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
node --test tests/batch1/browser-regression.cjs
```

Final exact-current result: **10 passed, 0 failed, 0 skipped**.

The ten cases cover QR, PDF metadata, Image-to-PDF guards, PDF grammar, three compressor groups, animation/text/regex limits, representative previously passing tools, and all 39 direct tool routes without page errors.

## 6. Latest Image-to-PDF pre-decode guard

Verified in both Chromium and Edge:

- valid PNG still creates a reopenable one-page PDF with the correct `3×2` page size;
- a PNG header declaring a side above 8,192 pixels is rejected before `PDFDocument.embedPng` is called;
- corrupt bytes are rejected before `embedPng` with a clear format error;
- a valid+corrupt mixed batch publishes no download or misleading partial success;
- a valid operation succeeds after invalid and mixed failures;
- an earlier successful download is cleared when the next operation fails.

This verifies the latest production change without implementing the separate Batch 2 WebP-to-PDF capability fix.

## 7. Reverified Batch 1 behavior

- **Image Compressor:** source format/MIME/signature/extension, dimensions, PNG/WebP transparency, smaller-output path, no-reduction path, animation rejection, null Blob and MIME fallback.
- **PDF page parser:** valid selection, reversed range, partial-invalid token, unsafe/out-of-range expansion, valid retry and output page sizes.
- **QR:** exact Azerbaijani/emoji/ZWJ/whitespace serialization, PNG signature, all offered dimensions, 1,200-byte valid input and over-limit cleanup.
- **Shared limits:** file count/size/total, PDF pages/combined pages, expression/tokens/ranges, image sides/pixels, generated bytes, text/JSON, regex pattern/text and QR UTF-8 bytes.
- **Regression:** line sorter, whitespace cleaner, URL encoder, SHA-256 and 39 registered routes.

## 8. Independent QR decoder status

The existing environment was checked before considering any dependency:

- `zbarimg`, ZXing command-line tools, `qrdecode`, ImageMagick and equivalent commands: not found;
- Python `cv2`, `pyzbar`, `PIL` and `zxingcpp`: not installed;
- Chrome and Edge `BarcodeDetector`: undefined;
- `agent-browser` CLI: not installed.

No dependency was installed. Therefore independent QR decoding remains **BLOCKED by environment**, while all other QR functional checks pass. This does not mark AZT-004 as failed.

## 9. QR vendor modification review

`assets/vendor/qrcode.min.js` changed for functional reasons, not formatting alone.

The baseline file is 19,927 UTF-8 bytes and the current file is 19,558 bytes. Comparison identified three functional regions plus a final newline:

1. The legacy hand-written character serializer was replaced with `TextEncoder` UTF-8 bytes, with the library's existing non-ASCII BOM convention retained.
2. Capacity calculation now uses the same `TextEncoder` byte length and the same conditional three-byte BOM as serialization.
3. The capacity-table loop changed from an inclusive end check to `g > f`, preventing an out-of-range table access on long input.

Chrome and Edge tests confirm that `getLength()` equals `parsedData.length`, the serialized Azerbaijani/emoji payload equals the expected bytes, and 1,200-byte inputs work without the prior runtime page error. The change is functionally necessary for AZT-004.

## 10. Build and static preview

`README.md` explicitly describes AzToolBox as a **zero-build** client-side app. The repository has no `package.json`, lockfile, build configuration or documented build command.

Build result: **NOT APPLICABLE — static app with no build pipeline**.

Documented preview command:

```powershell
python -m http.server 8000
```

An equivalent bound local preview was started and independently smoke-tested. `/`, `/tool/?slug=qr-generator` and `/tool/?slug=image-to-pdf` returned HTTP 200 with the expected titles/H1 values. Console errors, page errors and failed requests: **0**.

The Batch 1 browser suites also used the same Python static-server model and passed in Chrome and Edge.

## 11. Syntax result

All nine current `assets/js/*.js` files plus `assets/vendor/qrcode.min.js` passed `node --check`: **10/10 PASS**.

## 12. Files changed

Batch 1 production changes already present before this verification:

- `assets/js/app.js`
- `assets/js/simple-tools.js`
- `assets/js/tools-data.js`
- `assets/vendor/qrcode.min.js`
- `assets/js/pdf-tools.js` (new)
- `assets/js/tool-guards.js` (new)

Production files changed during this verification: **none**.

Test files changed during this verification:

- `tests/batch1/pdf-metadata.test.mjs` — replaced an invalid raw-string attachment assertion with active PDF name-tree/stream validation.
- `tests/batch1/browser-regression.cjs` — added exact Image-to-PDF guard/recovery coverage and QR serialized-length consistency checks.

No Batch 2–6 production behavior was implemented. The current shared safety caps affect later-batch tools only as the intended cross-cutting AZT-016 guardrail; no later-batch primary operation is claimed fixed.

## 13. Safety-to-commit assessment

**YES — the current Batch 1 change set is safe to commit as a reviewable Batch 1 unit**, subject to normal human diff review.

Reasons:

- exact-current unit, Chromium and Edge suites are green;
- PDF privacy/fidelity postconditions are independently confirmed;
- static preview is clean;
- vendor QR changes are functional and internally consistent;
- no production file changed during final verification;
- no dependency/package/build/deployment change occurred;
- independent QR decoding is explicitly recorded as environment-blocked;
- AZT-016's non-preemptive worker/cancellation defense is explicitly deferred and is not misrepresented as complete.

## 14. Commands not run

- The original 1,955-scenario audit was not rerun.
- No Batch 2–6 suite or implementation was started.
- No dependency install, Vercel build, deployment, commit or push was performed.

## 15. Final Git validation

The final `git diff --check`, `git diff --stat` and `git status` results are recorded after this document update in the task's final response. The expected tracked production stat remains 4 files / 169 insertions / 43 deletions; untracked modules, tests and documents are not included in that Git stat.
