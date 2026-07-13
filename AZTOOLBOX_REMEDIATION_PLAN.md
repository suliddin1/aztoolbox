# AzToolBox remediation plan

Plan date: **12 July 2026**  
Verified baseline: **`main` / `b1b13eb731bbe0fa685970638f8ae123c4d98b43`**  
Structured source of truth: **`AZTOOLBOX_ISSUES.json`**  
Cross-check sources: **`AZTOOLBOX_QA_AUDIT.md`**, **`AZTOOLBOX_TEST_MATRIX.md`**, current tracked source, and current runtime preview  
Scope of this task: planning only. No production source, dependency, package, or release artifact was changed.

## 1. Verification method and baseline

The three audit artifacts were read completely. `git rev-parse HEAD` is exactly the JSON baseline commit, so no tracked production change exists between the original audit and this verification. The 28 JSON issues were then checked against both Markdown reports and the functions named in the current source.

Representative runtime checks were repeated in headless Chrome against `python -m http.server` without writing fixtures to the repository. In-memory fixtures were used for PDF, PNG, WebP, and corrupt-image cases. Output types, PDF metadata, UI state, page errors, resource requests, and localStorage failure behavior were inspected. Potentially harmful unbounded workloads (very large PDF ranges, adversarial regexes, and decoded-pixel exhaustion) were not executed to exhaustion; their reproducibility is confirmed by the still-present unbounded synchronous code paths and bounded checks.

Current verification highlights:

- Transliteration still returns `гҝјыГҜЈЫ` for `gqjyGQJY`.
- A fresh 1,000-password sample still omitted selected groups: 27 uppercase, 25 lowercase, 416 digit, and 228 symbol omissions.
- `Password1234!` still reports `Çox güclü — 5/5`.
- Synthetic checksum-valid `AZ97000000000000000000000000` is still accepted.
- A valid non-global regex still reports a syntax error; invalid timestamp still returns `Invalid Date`; blank loan input still returns three `NaN` results.
- Invalid slug still renders PDF merger and records `pdf-merger` in recent history.
- Stale calculator output remains visible after input changes; malformed recent storage still prevents the tool H1 from rendering.
- Google Fonts requests still occur and are not disclosed in privacy copy; generic tool description/canonical and eager PDF/QR script loading remain unchanged.
- WebP-to-PDF still fails. PDF cleaning still emits creator/producer and date metadata. A 100-byte transparent PNG still became a 772-byte JPEG. Repeated image work created six object URLs but revoked only three.
- Long QR input still shows the success panel and then raises an uncaught page error.
- Tracked source and `.vercel/output/static` hashes still differ for every sampled critical file; `motion.js` is absent from the saved artifact.
- All seven tracked JavaScript files still pass `node --check`.

No structured issue was disproved. “Confirmed” below means runtime-reproduced or deterministically code-confirmed on this commit; it does not turn an unresolved product-policy question into an approved behavior change.

## 2. Complete issue map

Root-cause group keys are defined in section 3. Classification distinguishes a defect from a missing guard or an unresolved behavior contract.

| ID | Severity/status | Current-commit verification | Classification | Root group | Batch |
|---|---|---|---|---|---:|
| AZT-001 | P1 FAIL | Runtime reproduced; parallel strings remain at `simple-tools.js:217` | Confirmed bug | RG-1 | 2 |
| AZT-002 | P1 FAIL | In-memory WebP still reaches `embedJpg` and fails | Confirmed capability/implementation bug; animation policy unresolved | RG-2 | 2 |
| AZT-003 | P1 FAIL | Output still contains creator/producer and dates | Confirmed bug under current privacy promise; exact cleaning policy unresolved | RG-2 | 1 |
| AZT-004 | P1 FAIL | Trim and long-input success-then-pageerror reproduced; vendor encoder unchanged | Confirmed bug | RG-3 | 1 |
| AZT-005 | P1 FAIL | 1,000-sample group omission reproduced | Confirmed bug | RG-1 | 2 |
| AZT-006 | P1 FAIL | Misleading 5/5 result reproduced | Confirmed algorithm defect | RG-1 | 2 |
| AZT-007 | P1 FAIL | Invalid BBAN subtype accepted | Missing domain validation; registry-depth decision unresolved | RG-1 | 2 |
| AZT-008 | P1 FAIL | PNG-to-larger-JPEG and transparency loss reproduced | Confirmed data-fidelity bug under current “reduce size” promise; output policy unresolved | RG-2 | 1 |
| AZT-009 | P1 WARNING | Unbounded synchronous range expansion remains at `parsePages` | Missing security/robustness validation | RG-4 | 1 |
| AZT-010 | P2 FAIL | Non-global regex failure reproduced; unbounded main-thread execution remains | Confirmed bug plus missing robustness guard | RG-4 | 3 |
| AZT-011 | P2 FAIL | Invalid and negative timestamp behavior reproduced | Confirmed bug/missing validation | RG-5 | 3 |
| AZT-012 | P2 FAIL | Blank loan `NaN` output reproduced | Missing validation; valid formula remains correct | RG-5 | 3 |
| AZT-013 | P2 NOT IMPLEMENTED | Description promises a mode absent from DOM/handler | Product-spec mismatch | RG-5 | 3 |
| AZT-014 | P2 WARNING | Invalid slug fallback and recent-history pollution reproduced | Confirmed routing bug; case policy unresolved | RG-6 | 3 |
| AZT-015 | P2 WARNING | Set/sort/reversed/partial parser behavior remains deterministic in source | Product-spec ambiguity plus permissive parser | RG-7 | 4 |
| AZT-016 | P2 WARNING | No byte/page/pixel/canvas/text limits exist in current handlers | Missing security/robustness validation | RG-4 | 1 |
| AZT-017 | P2 WARNING | Stale percentage result reproduced; shared handlers lack invalidation | Confirmed state-lifecycle bug | RG-8 | 4 |
| AZT-018 | P2 WARNING | Object URL create/revoke imbalance reproduced | Confirmed resource-lifecycle bug | RG-8 | 4 |
| AZT-019 | P2 WARNING | WebP input still produces static PNG | Intentional implementation limitation not disclosed; policy unresolved | RG-2 | 4 |
| AZT-020 | P2 WARNING | Corrupt image leaves resizer disabled with no error | Missing validation/error state; output policy unresolved | RG-2 | 4 |
| AZT-021 | P2 WARNING | `👩‍💻` still counts as five; no `aria-live` | Product semantics plus accessibility defect | RG-9 | 5 |
| AZT-022 | P2 WARNING | Blank VAT still returns successful zero result | Shared missing numeric validation | RG-5 | 3 |
| AZT-023 | P2 WARNING | Object-shaped recent storage still crashes render | Confirmed shape/exception-handling bug | RG-6 | 5 |
| AZT-024 | P2 WARNING | Fonts requests observed; privacy copy has no disclosure | Confirmed privacy-copy mismatch; remediation choice unresolved | RG-10 | 5 |
| AZT-025 | P2 WARNING | Critical source/artifact hashes still differ | Confirmed release-process defect; deployed state environment-blocked | RG-11 | 6 |
| AZT-026 | P3 WARNING | Generic description and zero canonical links reproduced | Confirmed SEO omission | RG-10 | 5 |
| AZT-027 | P3 WARNING | Both vendor scripts load on JSON route | Confirmed performance defect | RG-10 | 5 |
| AZT-028 | P3 WARNING | Hard-coded counts/copy remain in HTML and `renderHome` | Confirmed drift risk | RG-10 | 5 |

## 3. Shared root-cause groups and dependencies

The 28 issues reduce to **11 root-cause groups**, rather than 28 unrelated fixes.

| Group | Issues | Shared cause | Important dependency |
|---|---|---|---|
| RG-1 Domain algorithms | 001, 005, 006, 007 | Compact heuristics or implicit tables are used where explicit domain invariants are required | Approved transliteration table, password model, and AZ BBAN rule source must precede implementation |
| RG-2 File capability and fidelity contract | 002, 003, 008, 019, 020 | Accepted input, actual codec path, output format, metadata, transparency, and animation promises are not represented as one capability contract | Product decisions on metadata/format/animation must drive both Batch 1 and Batch 4 tests |
| RG-3 QR encoder/error boundary | 004 | Legacy encoder behavior, trimming, no capacity preflight, and no try/catch produce semantically wrong or false-success output | Encoder choice and independent decoder fixtures precede code replacement |
| RG-4 Bounded processing | 009, 010, 016 | Untrusted size/work is executed synchronously without caps, timeout, worker, or abort | One central limits policy should be consumed by PDF, image, text, and regex paths |
| RG-5 Numeric parsing and financial validation | 011, 012, 013, 022 | `Number('')`, implicit units, missing finite/range checks, and undefined precision/mode policy | One raw-input parser and field-error contract should solve percentage, VAT, unit, and loan defects safely; timestamp uses the same finite parser but explicit unit logic |
| RG-6 Route/persistent-state contracts | 014, 023 | External strings are trusted as known slug/array state | Harden storage before relying on recent history in not-found routing tests |
| RG-7 PDF page grammar | 015 | Parser silently normalizes order, duplicates, reversed ranges, and partial errors while products have different semantics | Product decisions PD-1 to PD-3 are mandatory before modifying `parsePages` |
| RG-8 Result and resource lifecycle | 017, 018 | Handlers have no shared result version, cancellation ownership, or disposable URL registry | Shared lifecycle helper should land before format/output work so all new downloads inherit invalidation and cleanup |
| RG-9 Unicode/a11y semantics | 021 | UTF-16 implementation is presented as user-visible “characters”; live updates lack announcement semantics | Decide grapheme definition, then use `Intl.Segmenter` with a throttled live region |
| RG-10 Static shell duplication | 024, 026, 027, 028 | Repeated static heads/copy and eager dependencies drift away from registry/capability data | Introduce a single shell/metadata contract without turning the zero-build app into a framework migration |
| RG-11 Release provenance | 025 | Ignored prebuilt output has no clean-generation/parity/deployment gate | All prior batches and regression gates must pass before regenerating or deploying |

Key dependency chain:

1. Product decisions and characterization tests.
2. Shared limits, validation, error, result-lifecycle, and output-capability primitives.
3. Tool-specific algorithms/codecs.
4. Format/metadata/output behavior.
5. UX/a11y/static-shell improvements.
6. Clean build, cross-browser, deployment, and full regression.

Do not combine RG-5 into a broad refactor: introduce a small `readFiniteNumber(control, policy)`-style helper, prove it against every current valid formula, and migrate one calculator at a time. Likewise, do not replace every file handler at once; define the capability/output contract first and migrate by tool family.

## 4. Product decisions required

No behavior in this section should change silently. Recommended choices are defaults for approval, not authorization.

| Decision | Related issues | Options | Recommended option |
|---|---|---|---|
| PD-1 Splitter output | 015 | One combined PDF; separate PDFs; ZIP of separate PDFs | Separate PDFs in a ZIP, because current copy says “ayrıca”; otherwise change name/copy to extractor |
| PD-2 Page order/duplicates | 015 | Preserve exact request order and duplicates; normalize/sort/dedupe | Preserve for splitter/extractor, reject duplicates only if explicitly documented; remover may dedupe because order is irrelevant |
| PD-3 Reversed/partial ranges | 009, 015 | Normalize; reject; partially accept | Reject reversed and any partially invalid expression atomically with field-level detail |
| PD-4 PDF metadata policy | 003 | Remove all possible Info metadata; retain AzToolBox attribution; document partial cleaning | Remove all standard/custom Info keys and dates, add no attribution; document that embedded document content is outside scope |
| PD-5 Image output format | 008, 019, 020 | Preserve source; always normalize; let user choose | Preserve when safe, otherwise require explicit output choice and show extension/MIME before processing |
| PD-6 Compressor size guarantee | 008 | Always return encoded result; return smaller of source/output; warn on growth | Do not call growth “compression”; offer original/no-download or explicit “larger result” confirmation |
| PD-7 Character semantics | 021 | UTF-16 units; code points; grapheme clusters | User-perceived grapheme clusters via `Intl.Segmenter`, with documented fallback |
| PD-8 JWT disclosure | Regression-only limitation | Small note; prominent warning; add validation | Keep decoder-only scope but show a persistent “signature/expiry not validated” warning next to result |
| PD-9 Percentage scope/precision | 013 | Add change mode; remove promise; separate tools | Add explicit “X% of Y” and “change from A to B” modes; preserve more precision and format only for display |
| PD-10 Feedback scope | Regression-only limitation | Local draft only; mailto/export; backend submit | Keep local behavior only if clearly labeled before submit; otherwise design backend as a separate project |
| PD-11 Animation policy | 002, 008, 019, 020 | Reject animated inputs; first-frame extraction; preserve animation | Reject with an explicit message until a tested animation-preserving pipeline exists |
| PD-12 Invalid slug/case policy | 014 | Exact match only; lowercase redirect; case-insensitive render | Exact match with a real not-found state; optionally add an explicit canonical redirect later |
| PD-13 AZ IBAN authority | 007 | Structural letters-only bank ID; static known-bank list; online authoritative lookup | Enforce published structural subtype locally; do not claim bank existence without a versioned authoritative dataset |

**Unresolved product decisions: 13.** Batch work that depends on a decision may add characterization tests and UI-safe guards, but must pause before changing output semantics.

## 5. Implementation batches

### Batch 1 — emergency correctness, security, privacy, and data-fidelity guardrails

**Issue IDs:** AZT-003, AZT-004, AZT-008, AZT-009, AZT-016  
**Affected tools:** PDF metadata remover; QR generator; image compressor; PDF splitter/remover/extractor; all PDF/image tools; regex/JSON/text transforms  
**Severity:** four P1 findings plus one cross-cutting P2 security/robustness finding  
**Estimated complexity:** **Large**

**Shared root cause:** trusted inputs and output promises cross codec/parser boundaries without a capability policy, work limit, or atomic error boundary. This batch addresses the highest-impact false-success, privacy, data-loss, and browser-lock risks before lower-risk feature work.

**Exact current source:**

- `assets/js/simple-tools.js`: `parsePages` (49–57), `initSimpleTool` PDF branches (113–136), image compression branch (163–188).
- `assets/js/app.js`: `toolWorkspace` QR/image/PDF shells (132–142), `showResult`/`clearResult`/`downloadBlob` (145–156), `initToolBehavior/qr` (187–193), file/PDF handlers (179–200).
- `assets/vendor/qrcode.min.js`: legacy QR encoder, line 1.
- `assets/js/tools-data.js`: PDF metadata, compressor, and QR promises.
- `tool/index.html`: current eager vendor inclusion.

**Proposed approach:**

1. Write failing binary/semantic tests first for complete PDF metadata removal, QR exact round-trip/capacity failure, alpha and size growth, bounded page grammar, and global limits.
2. Approve PD-4 and PD-6. Until approved, fail closed: do not present privacy-clean or compressed success when postconditions fail.
3. Add a central immutable limits policy for file bytes, PDF page count, page-expression length/range, decoded pixels, canvas dimensions, text/JSON length, and operation timeout. Validate before decode/expansion and return field-level errors.
4. Make PDF metadata postconditions testable: no new creator/producer/date fields, custom Info policy enforced, pages/content/rotation preserved.
5. Put QR encoding inside preflight plus try/catch, remove unconditional trim, render success only after a canvas is created, and validate with an independent decoder. Replace the encoder only after a pinned, licensed UTF-8-capable implementation is approved.
6. For compression, inspect source/output MIME, alpha, dimensions, and size before enabling download. Do not silently flatten/convert or claim reduction.
7. Do not add worker complexity everywhere in one change. First cap synchronously; then isolate regex and expensive decode/encode work in narrowly scoped workers.

**Regression risks:** PDF metadata libraries may auto-create dates/producer on save; strict caps may reject previously accepted large but legitimate files; new QR encoding may change capacity/error-correction behavior; alpha-preserving output may be larger; changing error timing may affect stale-result behavior.

**Tests required:** PDF standard/custom metadata and page fidelity; QR ASCII/AZ/emoji/ZWJ/leading/trailing spaces/capacity boundaries and independent decode; transparent PNG/WebP/JPEG, size-growth and dimension invariants; range safe-integer/maximum/atomic-invalid cases; near/over file/page/pixel/text limits; timeout/abort and no-success-on-error checks.

**Validation commands after the approved test harness exists:**

```powershell
Get-ChildItem assets/js/*.js | ForEach-Object { node --check $_.FullName }
node --test tests/unit/limits.test.mjs tests/unit/page-grammar.test.mjs
python -m pytest tests/binary/test_pdf_metadata.py tests/binary/test_image_compressor.py -q
npm exec -- playwright test tests/e2e/qr.spec.mjs tests/e2e/resource-limits.spec.mjs --project=chromium
```

**Rollback:** deliver limits, metadata, QR, and compressor as separate reviewable commits within the batch. Revert the failing sub-commit with `git revert <commit>`; keep characterization tests unless the test itself is proven wrong. No stored-data migration is involved. A codec replacement must be independently revertible from UI/error-boundary changes.

### Batch 2 — primary-operation FAIL tools

**Issue IDs:** AZT-001, AZT-002, AZT-005, AZT-006, AZT-007  
**Affected tools:** Azerbaijani Latin/Cyrillic converter; Image-to-PDF; password generator; password strength checker; AZ IBAN validator  
**Severity:** all P1 FAIL  
**Estimated complexity:** **Large**

**Shared root cause:** primary operations use implicit mappings/heuristics or accept types without implementing the corresponding domain invariant.

**Exact current source:**

- `assets/js/simple-tools.js`: `simpleToolWorkspace` for Image-to-PDF/password/IBAN/transliteration inputs (11–47); `initSimpleTool/image-pdf` (140–160); `password-check` (214); `iban` (216); `transliterate` (217).
- `assets/js/app.js`: password workspace (139), `initToolBehavior/password` (173–178).
- `assets/js/tools-data.js`: definitions for the five affected tools.

**Proposed approach:**

1. Replace transliteration’s parallel strings with explicit reviewed maps in both directions. Test every lower/upper character, Azerbaijani words, unsupported characters, and round-trip expectations. Document inherently ambiguous/script-specific cases rather than forcing false reversibility.
2. For passwords, select at least one unbiased random character from every selected group, fill from the combined pool with rejection sampling, then cryptographically shuffle. Enforce `length >= selectedGroupCount` even if UI limits later change.
3. Replace the strength class-count score with a vetted local estimator or a conservative, testable model covering common, repeated, sequential, keyboard, date, substitution, and passphrase patterns. Use password input semantics and avoid absolute safety claims.
4. For Image-to-PDF, approve PD-11, detect by decode/signature rather than trusting MIME alone, explicitly decode supported WebP to a safe raster before embedding, process mixed inputs atomically or report per-file failures according to an approved contract, and preserve file order/page count.
5. For IBAN, enforce the published AZ BBAN field classes before MOD-97. Separate “structure/checksum valid” from any claim that a real bank/account exists.

**Regression risks:** transliteration may break existing expectations for ambiguous letters; guaranteed group inclusion can introduce bias if shuffle/index selection is wrong; a strength-library replacement can increase payload; rasterizing WebP can affect color/alpha/page size; overly strict IBAN checks may reject legitimate values if the domain rule source is wrong.

**Tests required:** full alphabet table and bidirectional properties; all 15 password group combinations, min/max lengths, selected-group invariant over at least 10,000 samples, versioned deterministic test RNG plus production WebCrypto smoke; password corpus expectations; PNG/JPEG/WebP mixed order, MIME/signature mismatch, animation rejection, corrupt/zero-byte and page-size checks; AZ BBAN subtype/checksum/normalization vectors.

**Validation commands:**

```powershell
Get-ChildItem assets/js/*.js | ForEach-Object { node --check $_.FullName }
node --test tests/unit/transliteration.test.mjs tests/unit/passwords.test.mjs tests/unit/az-iban.test.mjs
python -m pytest tests/binary/test_image_to_pdf.py -q
npm exec -- playwright test tests/e2e/primary-fail-tools.spec.mjs --project=chromium
```

**Rollback:** one commit per tool algorithm, with tables/fixtures reviewed independently. Use `git revert <tool-fix-commit>` for an affected tool; never revert the Batch 1 error/limit guards merely to restore permissive behavior. If a new strength dependency is rejected, revert it independently and retain conservative UI wording/tests.

### Batch 3 — numeric validation, timestamp, calculators, regex, and invalid routes

**Issue IDs:** AZT-010, AZT-011, AZT-012, AZT-013, AZT-014, AZT-022  
**Affected tools:** regex tester; timestamp converter; percentage, VAT, unit, and loan/credit calculators; all generic tool routes/recent history  
**Severity:** P2 (three FAIL, one NOT IMPLEMENTED, two WARNING)  
**Estimated complexity:** **Medium**

**Shared root cause:** raw strings are coerced directly into calculations/dates/regex execution, and unknown route values are coerced into the first registry item. Error state is not a shared contract.

**Exact current source:**

- `assets/js/simple-tools.js`: workspace builders for timestamp/regex/calculators (approximately 36–41), `timestamp` (208), `regex` (209), `percentage` (210), `vat` (211), `unit` (212), `loan` (213).
- `assets/js/app.js`: `showResult`/`clearResult` (145–154), `renderToolPage` (226–235).
- `assets/js/components.js`: `recordRecent` (14–17).
- `assets/js/tools-data.js`: percentage and calculator descriptions.

**Proposed approach:**

1. Add a small shared raw-input validator that distinguishes blank from zero, requires finite values, applies integer/min/max policies, and produces a field-associated message. Do not globally reject negatives: each formula supplies its own policy.
2. Migrate percentage, VAT, unit, and loan one at a time. Preserve all verified valid formulas and explicitly cover zero-rate loans. Clear old results on invalid input.
3. Make timestamp units explicit in the UI, validate `Number.isFinite` and `Date.getTime`, preserve zero and negative/pre-1970 values, and test timezone-independent epoch conversion separately from localized display.
4. For regex, use `exec` correctly for non-global mode; iterate global/sticky matches safely including zero-length cases. Apply Batch 1 length/time policy and execute untrusted patterns in a terminable worker.
5. Approve PD-9 before implementing percentage-change mode. If rejected, remove the promise and retain the single mode with documented precision.
6. Render a dedicated not-found state before calling `recordRecent`; approve exact-match/case policy and set appropriate title/metadata. Preserve valid encoded slugs, refresh, back/forward, and query behavior.

**Regression risks:** a shared numeric helper may accidentally reject valid zero/negative values; locale comma handling can silently change numeric meaning; regex iteration can loop on zero-length matches; client-side 404 UI cannot change HTTP status on a plain static server; percentage rounding changes can break screenshot/text expectations.

**Tests required:** blank/whitespace/NaN/Infinity/decimal-comma/negative/boundary matrices per calculator; independent amortization formula including 0%; timestamp seconds/milliseconds/zero/negative/invalid/future/timezone; regex global/non-global/flags/groups/Unicode/zero-length/timeout; missing/empty/unknown/case/encoded/duplicate slug with recent-history assertions.

**Validation commands:**

```powershell
Get-ChildItem assets/js/*.js | ForEach-Object { node --check $_.FullName }
node --test tests/unit/numeric-validation.test.mjs tests/unit/calculators.test.mjs tests/unit/timestamp.test.mjs tests/unit/regex.test.mjs
npm exec -- playwright test tests/e2e/calculators.spec.mjs tests/e2e/routing.spec.mjs --project=chromium
```

**Rollback:** commit the validator separately from each migration. Revert only the affected calculator/tool commit if valid calculations regress; the helper can remain unused. Route not-found work must be an independent commit because static hosting rewrites may require separate rollback.

### Batch 4 — PDF/image grammar, format preservation, metadata, transparency, and output lifecycle

**Issue IDs:** AZT-015, AZT-017, AZT-018, AZT-019, AZT-020  
**Affected tools:** PDF splitter/extractor/remover; all image routes; image metadata remover; image resizer; most result/download surfaces  
**Severity:** P2 WARNING  
**Estimated complexity:** **Large**

**Shared root cause:** product-specific output semantics are flattened through shared handlers that have neither an explicit capability record nor ownership of result/download/Blob URL lifecycle.

**Exact current source:**

- `assets/js/simple-tools.js`: `parsePages` (49–57), `setupFile` (60–73), `imageFrom` (93–97), PDF branches (113–136), image branches (163–188).
- `assets/js/app.js`: `showResult`, `clearResult`, `downloadBlob` (145–156); JSON/text/password/image/QR/PDF handlers (158–200), especially resizer (179–185).
- `assets/js/tools-data.js`: splitter/extractor/remover and image output promises.

**Proposed approach:**

1. Resolve PD-1 to PD-3 before changing page output. Split parsing from execution: parser returns an ordered typed result or an atomic structured error; each PDF tool applies its approved duplicate/order/output semantics.
2. Introduce an output capability object per image tool: accepted decoded formats, output MIME/extension, alpha behavior, animation behavior, metadata behavior, and dimension limits. Render that contract next to controls.
3. Implement a shared result controller with monotonic operation ID, input snapshot, cancel/invalidate, current downloadable Blob, and a disposable object-URL set. Any input/file/option change invalidates old success and download. Async completion may publish only if its operation ID is current.
4. Revoke preview URLs on replacement, reset, error, and unload. Keep temporary download URL revocation separate.
5. For image metadata remover/resizer, either preserve approved source format or require an explicit output choice. Validate decoded content/signature and display errors for corrupt or misleading files instead of leaving controls silently disabled.
6. Re-run Batch 1 metadata/compression postconditions here to ensure the capability and lifecycle refactor did not undo them.

**Regression risks:** exact page-order changes alter current output; preserving JPEG/WebP can affect quality and metadata stripping; URL revocation may occur too early and break preview/download; result invalidation may clear useful output during harmless focus/input events; cancellation races may publish stale blobs.

**Tests required:** PDF order/duplicates/reversed/partial/separate-vs-combined; JPEG/PNG/WebP signature-extension-alpha-dimension-metadata matrix; animated input policy; corrupt/MIME mismatch errors; input/option/file after result; rapid double run; file change during async; error then retry; 100-operation URL create/revoke balance; old download impossible after invalidation.

**Validation commands:**

```powershell
Get-ChildItem assets/js/*.js | ForEach-Object { node --check $_.FullName }
node --test tests/unit/page-grammar.test.mjs tests/unit/result-lifecycle.test.mjs
python -m pytest tests/binary/test_pdf_pages.py tests/binary/test_image_outputs.py -q
npm exec -- playwright test tests/e2e/file-output-state.spec.mjs --project=chromium
```

**Rollback:** land parser, capability metadata, result controller, and individual tool migrations separately. Revert a tool migration without reverting the tested lifecycle controller. If URL cleanup breaks downloads, revert only the revocation timing commit while retaining stale-result invalidation and tests.

### Batch 5 — warnings, intentional limitations, accessibility, mobile, privacy, SEO, and UX

**Issue IDs:** AZT-021, AZT-023, AZT-024, AZT-026, AZT-027, AZT-028  
**Affected tools/surfaces:** text counter; favorites/recent; every HTML route; all 39 tool pages; home/catalog; static shell and vendor loading  
**Severity:** three P2 and three P3 warnings  
**Estimated complexity:** **Medium**

**Shared root cause:** repeated static shell and loosely typed client state allow copy, metadata, loading, accessibility, and registry-derived UI to drift.

**Exact current source:**

- `assets/js/app.js`: `renderHome` (21–35), text counter workspace/update (138, 168–172), `renderToolPage` (226–235).
- `assets/js/components.js`: `readList`, `writeList`, `recordRecent`, `toggleFavorite` (8–23), shared header/footer/search.
- `assets/js/tools-data.js`: registry/category metadata.
- `index.html`, `tools/index.html`, `tool/index.html`, `about/index.html`, `privacy/index.html`, `feedback/index.html`: head metadata/font links and hard-coded copy/counts.
- `assets/css/app.css`: breadcrumb/touch targets, responsive and result styles.

**Proposed approach:**

1. Make `readList` return `[]` unless parsing succeeds and `Array.isArray` is true; catch get/set storage exceptions. Sanitize entries against known slugs at consumption boundaries.
2. Resolve PD-7, use grapheme segmentation for visible character count, and provide a throttled polite live summary that does not announce every keystroke/card mutation.
3. Self-host fonts or disclose the external request per PD-24 choice; prefer self-hosting for the current local-processing privacy position. Verify zero tool-payload network traffic.
4. Generate tool title, description, and canonical from registry data at render time. Ensure invalid slug gets not-found metadata.
5. Lazy-load PDF/QR vendor code by tool capability with deterministic error/loading states and offline behavior.
6. Derive counts/category capability copy from `tools`/`categories`; do not duplicate `39` or claim absent tools.
7. Increase breadcrumb/touch targets without changing visual hierarchy; preserve current 320/375/tablet/desktop no-overflow behavior, focus traps, Escape, focus restore, labels, reduced motion, and visible focus.

**Regression risks:** storage hardening may discard recoverable legacy values; frequent `aria-live` updates can become noisy; dynamic metadata/canonical handling can be wrong under deployment base paths; lazy scripts can race first click or fail offline; removing hard-coded counts can cause layout shift before modules render.

**Tests required:** malformed JSON/object/string/null/storage-denied/recovery; grapheme/ZWJ/combining/CRLF/AZ and screen-reader announcement cadence; network allowlist/offline; 39 unique titles/descriptions/canonicals; dependency presence/absence by tool kind; registry count mutation; 320/375/768/1440/1920 layout, touch target, keyboard/focus, reduced-motion checks.

**Validation commands:**

```powershell
Get-ChildItem assets/js/*.js | ForEach-Object { node --check $_.FullName }
node --test tests/unit/storage.test.mjs tests/unit/registry-contract.test.mjs tests/unit/graphemes.test.mjs
npm exec -- playwright test tests/e2e/a11y-mobile.spec.mjs tests/e2e/metadata-network.spec.mjs --project=chromium
```

**Rollback:** separate storage, a11y, fonts/privacy, metadata, lazy-loading, and dynamic-copy commits. Revert a lazy-load or canonical change independently. Never restore misleading privacy copy without also restoring the prior external-network behavior and documenting the rollback.

### Batch 6 — blocked coverage, clean production build, Vercel verification, and full regression

**Issue IDs:** AZT-025, plus closure verification for AZT-001 through AZT-028  
**Affected tools/surfaces:** release process, `.vercel/output`, deployed site, all 39 tools/routes  
**Severity:** P2 release warning plus environment-blocked coverage  
**Estimated complexity:** **Large**

**Shared root cause:** no deterministic build/provenance gate ties tracked source, generated artifact, deployed URL, and cross-browser regression results together.

**Exact current source/state:**

- `.vercel/project.json`, `.vercel/output/config.json`, `.vercel/output/static/**` (ignored generated state).
- All six HTML entry routes and `assets/**`.
- No current `package.json`, lint, typecheck, build, or committed test runner.

**Proposed approach:**

1. Finish the 16 blocked Image-to-PDF cases exactly as listed in the matrix: truncated/corrupt variants, uppercase/Unicode/extensionless names, MIME/signature mismatches, mixed valid/error sets, four-file order, reselect, and metadata-bearing PNG.
2. Run Chromium, Firefox, and WebKit critical paths in a controlled CI/runtime with pinned versions. Edge remains a representative Windows check.
3. Define a documented deterministic static build/copy process. Remove any stale local output before generation; never deploy with `--prebuilt` unless parity gates pass.
4. Compare source/artifact inventories and hashes for all shipped files, confirm required additions such as `motion.js`, and reject extra/stale files.
5. Run a clean Vercel build in an environment with bounded diagnostics and capture command, CLI version, duration, logs, and output. Do not treat a timeout as pass.
6. Obtain the actual deployment URL from the linked project/authorized operator; do not guess it. Smoke all routes, check headers/cache, network policy, and critical operations on the deployed artifact.
7. Run the complete regression suite below and require zero unresolved P1, zero false-success outputs, zero corrupt outputs, and explicit waivers for accepted limitations.

**Regression risks:** generated artifact may omit dotfiles/routes/assets; platform routing can differ from Python static preview; cache can serve a stale deployment; cross-browser image/Canvas/Intl behavior can differ; a deployment rollback may not roll back local artifact state.

**Tests required:** the complete suite in section 6; artifact/source manifest; deployed route/resource/error smoke; cache-busting/current-commit marker; rollback deployment drill; all blocked Image-to-PDF cases; Firefox/WebKit critical sample.

**Validation commands:**

```powershell
Get-ChildItem assets/js/*.js | ForEach-Object { node --check $_.FullName }
node --test tests/unit/*.test.mjs
python -m pytest tests/binary -q
npm exec -- playwright test --project=chromium --project=firefox --project=webkit
npx vercel@latest build --yes
git status --short
```

The Vercel command must use an explicitly approved, pinned CLI version in CI rather than silently accepting `latest`; it is shown here to match the previous audit command. Deployment verification commands must be added only after the real project URL and authorization are known.

**Rollback:** retain the last verified deployment and artifact manifest. If post-deploy smoke fails, use Vercel’s deployment rollback/promote mechanism to the last verified deployment, then `git revert` the responsible batch commit. Do not use `git reset --hard`, do not reuse a failed prebuilt artifact, and do not delete evidence logs.

## 6. Regression suite preserving working behavior

The suite must test fixes and preserve the behavior that already passed.

1. **Registry contract:** unique slug/kind, handler coverage, seven categories, dynamically derived counts/copy, no orphan entries, featured behavior explicitly tested.
2. **Route contract:** all 39 slugs direct visit and refresh, correct H1/title/metadata, encoded slug, back/forward, favorites/recent, not-found behavior, no console/resource errors.
3. **Existing PASS tools:** line sorter Azerbaijani asc/desc and duplicates; whitespace cleaner Unicode/CRLF; URL codec round-trip and malformed error; SHA-256/512 standard vectors; UUID v4 version/variant/uniqueness.
4. **Intentional limitations locked as contracts until changed:** 90/180/270-only rotation; center-only crop; heuristic title/sentence case; exact case-sensitive line dedupe; ASCII Azerbaijani slug policy; 1–12 fixed lorem; positional line diff; standard JSON parse/stringify; classic text Base64; decoder-only JWT; length-only unit conversion; 8–128-byte secure token. Tests must assert UI disclosure, not expand scope accidentally.
5. **Pure logic/property tests:** transliteration tables; codecs; hashes; formula vectors; IBAN; timestamps; regex iteration; grapheme counting; validators and limit boundaries.
6. **Password tests:** 15 group combinations, selected-group invariant, unbiased selection sanity, at least 10,000 generated samples, common/predictable/passphrase strength corpus. Statistical tests use generous non-flaky bounds and deterministic algorithm-unit tests.
7. **QR tests:** independent decoder equality for ASCII, AZ, emoji, ZWJ, exact whitespace, URLs, and capacity boundaries; success only after valid canvas/download exists.
8. **PDF binary tests:** `%PDF-`, independent reopen, page count/order/size/rotation/content, split semantics, metadata absence, encrypted/corrupt errors, near/over limits.
9. **Image binary tests:** independent decode, signature/extension/MIME, dimensions, alpha/pixels, EXIF/metadata, animation policy, size delta, corrupt/MIME mismatch, near/over pixel/canvas limits.
10. **State/error tests:** blank/malformed/retry, input-after-result, option-after-result, file-during-async, rapid double-run, cancel, old download disabled, success never shown after exception.
11. **Resource/privacy tests:** object URL balance, bounded memory repeat, worker timeout/termination, network allowlist, no payload fetch/XHR/WebSocket/sendBeacon, offline local vendor/font behavior.
12. **Accessibility/mobile tests:** labels/names, field-error association, live-region cadence, focus trap/Escape/restore, visible focus, touch targets, reduced motion, and no document overflow at 320/375/768/1440/1920 widths.
13. **Cross-browser:** full Chromium matrix; Firefox/WebKit critical tools and all codec/Intl differences; Edge representative Windows smoke.
14. **Release gate:** clean build, complete source/artifact inventory and hash manifest, deployed URL route/operation smoke, cache/current-commit verification, and rollback drill.

The future test harness should be introduced as a test-only, reviewable change before production fixes. Because this repository currently has no package manifest or committed runner, dependency/package changes require explicit approval during implementation; none are made by this plan.

## 7. Safest implementation order and gates

1. Approve PD-3/4/6/11/13 first because they gate security/privacy/data-fidelity behavior.
2. Add characterization tests and the minimal test harness; prove existing PASS behavior before production edits.
3. Execute Batch 1. Stop if any output postcondition or limit boundary is untestable.
4. Execute Batch 2 one tool per commit, beginning with transliteration and password invariants, then IBAN and Image-to-PDF.
5. Approve PD-9/12 and execute Batch 3, migrating calculators individually through the shared validator.
6. Approve PD-1/2/5 and execute Batch 4; land result lifecycle before image/PDF migrations.
7. Approve PD-7/8/10 and execute Batch 5, keeping zero-build/static architecture unless a separate migration is authorized.
8. Execute Batch 6 only after all earlier batch gates pass. Generate and deploy from a clean source checkout, never from the current stale saved artifact.

Each batch exit gate requires: targeted tests green, all seven JS syntax checks green, no new console/page errors, no regression in previously passing tools, `git diff` reviewed for scope, and a documented rollback commit/deployment.

## 8. Final accounting

- **Total structured issues mapped:** 28 of 28.
- **Issues grouped by shared root cause:** 28 issues in 11 root-cause groups.
- **Proposed implementation batches:** 6.
- **Unresolved product decisions:** 13.
- **Audit findings not reproducible on current commit:** 0. Some high-impact resource-exhaustion findings were confirmed by current code and bounded review rather than unsafe exhaustion tests.
- **Environment-blocked coverage still open:** 16 Image-to-PDF cases; clean Vercel build; deployed URL verification; Firefox/WebKit coverage.
- **Git status before creating this plan:** only the three audit artifacts were untracked.
- **Expected git status after creating this plan:** the three audit artifacts plus `AZTOOLBOX_REMEDIATION_PLAN.md` are untracked; tracked production diff remains empty.
