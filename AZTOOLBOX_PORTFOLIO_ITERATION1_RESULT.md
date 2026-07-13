# AzToolBox Portfolio Consolidation — Iteration 1 Result

## Result

Iteration 1 status: **PASS**

The approved Iteration 1 scope is implemented and verified locally:

- PDF Splitter, PDF Page Extractor, and PDF Page Remover are represented by one active **PDF Organizer**.
- Lorem Ipsum Generator and Slug Generator are removed from the active product and their runtime implementations are deleted.
- Old high-value PDF routes preserve Split, Extract, or Delete intent.
- Old removed routes show a named retired state, do not redirect, and are marked `noindex`.
- The active catalog contains **35** tools.
- No push or deployment was performed.

## Starting checkpoint

- Branch: `main`
- Clean starting HEAD: `c45f649c377a2a64dc1ea5ccc9fd67c447855f41`
- Production baseline below the documentation-only checkpoint: `b5dd88f08f3cbc6d0f8df7611a64fd60c9e82ccc`
- Upstream at start: `origin/main` = `b5dd88f08f3cbc6d0f8df7611a64fd60c9e82ccc`
- Starting relationship: local `main` ahead by the approved documentation commit only; behind by 0
- Starting active tool count: 39

Starting category counts:

| Category | Count |
|---|---:|
| PDF | 6 |
| Image | 7 |
| Text | 8 |
| Developer | 8 |
| Business | 5 |
| Security | 3 |
| Azerbaijani | 2 |

## Final Iteration 1 inventory

| Category | Before | After | Change |
|---|---:|---:|---:|
| PDF | 6 | 4 | -2 |
| Image | 7 | 7 | 0 |
| Text | 8 | 6 | -2 |
| Developer | 8 | 8 | 0 |
| Business | 5 | 5 | 0 |
| Security | 3 | 3 | 0 |
| Azerbaijani | 2 | 2 | 0 |
| **Total** | **39** | **35** | **-4** |

Active canonical additions:

- `pdf-organizer` — PDF Organizer

Replaced active entries:

- `pdf-splitter` → `pdf-organizer`, mode `split`
- `pdf-page-extractor` → `pdf-organizer`, mode `extract`
- `pdf-page-remover` → `pdf-organizer`, mode `delete`

Removed entries:

- `slug-generator`
- `lorem-ipsum-generator`

## Source behavior and parity checklist

### PDF Splitter → Organizer Split mode

| Contract | Before | Iteration 1 result |
|---|---|---|
| Input | One valid PDF; page expression required | Preserved |
| Valid expression | Comma-separated pages and ascending ranges | Preserved |
| Invalid expression | Blank, malformed, reversed, zero, negative, out-of-range, unsafe, or excessive input rejected atomically | Preserved |
| Ordering | Requested order preserved | Preserved |
| Duplicates | Preserved | Preserved |
| Output | One one-page PDF per selected occurrence in one stored ZIP | Preserved |
| Entry names | `sehife-N.pdf`; repeated occurrence adds `-2`, `-3`, and so on | Preserved |
| ZIP name | `<source>-sehifeler.zip` | Preserved |
| Download | One ZIP download | Preserved |

### PDF Page Extractor → Organizer Extract mode

| Contract | Before | Iteration 1 result |
|---|---|---|
| Input/parser | One valid PDF and strict page expression | Preserved |
| Ordering | Requested order preserved | Preserved |
| Duplicates | Preserved | Preserved |
| Output | One combined, independently reopenable PDF | Preserved |
| Filename | `pdf-page-extractor.pdf` | Preserved |
| Download | One PDF download | Preserved |

### PDF Page Remover → Organizer Delete mode

| Contract | Before | Iteration 1 result |
|---|---|---|
| Input/parser | One valid PDF and strict page expression | Preserved |
| Duplicate removals | Count once | Preserved |
| Remaining order | Original document order | Preserved |
| Delete first/middle/last/multiple | Supported | Preserved |
| Delete all | Rejected; at least one page must remain | Preserved with a clearer Azerbaijani error |
| Output | One combined, independently reopenable PDF | Preserved |
| Filename | `pdf-page-remover.pdf` | Preserved |

### Shared PDF boundaries and recovery

- Per-file limit remains 50 MiB.
- PDF page limit remains 500.
- Page expression limit remains 2,048 characters, 500 tokens, and 500 expanded selections.
- Invalid selections never produce partial output.
- Any input or option change invalidates the previous result and old download control.
- A valid expression works immediately after an invalid expression.
- Malformed, encrypted, oversized, and over-page-limit files fail without a downloadable result.
- Output PDFs and every ZIP-contained page PDF are reopened in regression coverage.

### Removed tools

- Lorem and Slug no longer exist in the active registry, categories, catalog, homepage-derived lists, global search, related tools, or sitemap-eligible lifecycle set.
- Their old routes show the retired tool name and a clear removal message.
- Their old routes add nothing to recent history, have no workspace, have no canonical link, and use `robots=noindex`.
- Their prior runtime branches were deleted; no hidden implementation remains.

## PDF Organizer experience

- Explicit Split, Extract, and Delete mode tabs.
- Standard file picker in addition to drag-and-drop.
- Page count and selected-occurrence count.
- Strict expression input plus keyboard-operable page checkboxes.
- Select-all and clear-selection actions.
- Responsive page-card grid verified at 320 px, 375 px, and 1440 px.
- Clear Azerbaijani validation and processing errors.
- Local-only PDF processing.
- Stale-result invalidation and async operation versioning.

### Thumbnails and bounded dependency use

- Self-hosted PDF.js `6.1.200` is used only by PDF Organizer.
- The PDF.js module is imported only after a PDF file is selected; it is absent from the application shell and other tool routes.
- Its worker and Apache-2.0 license are shipped locally.
- Rendering is limited to 48 pages, two concurrent jobs, and an 8,000,000-pixel aggregate budget.
- File change and page exit cancel active thumbnail work and destroy the thumbnail document.
- Numbered, selectable page cards remain available if preview rendering is unavailable or beyond the preview budget.
- PDF operations depend on the existing local PDF engine, not on successful thumbnail rendering.

## Registry, route, search, and storage migration

- Active tools have a stable canonical `id`, active lifecycle, index policy, and sitemap policy.
- Legacy entries are metadata-only `replaced` or `removed` records.
- Route resolution is exact and single-hop.
- Unknown slugs, invalid modes, mode parameters on unrelated tools, and unsupported workspaces fail closed.
- Old PDF routes render the canonical Organizer in the intended mode and retain their old URL across refresh.
- Alias and explicit mode pages point their canonical link at bare `pdf-organizer` and are `noindex,follow`.
- Global and catalog search recognize old Azerbaijani/English names and task phrases, then link to the correct canonical mode.
- Favorites and recent history migrate to one canonical Organizer reference while retaining the first applicable mode.
- Modeful saved references use `{ "slug": "pdf-organizer", "mode": "…" }`; ordinary tools remain stored as strings.
- Migration is order-preserving, deduplicating, bounded for recent history, safe under denied/malformed storage, and idempotent.
- Removed and unknown references are dropped rather than rendered as broken cards.
- Visiting an alias records only the canonical Organizer reference, so aliases cannot duplicate recent history.

## Production files changed

- `assets/js/tools-data.js`
- `assets/js/components.js`
- `assets/js/app.js`
- `assets/js/simple-tools.js`
- `assets/js/batch5-tools.js`
- `assets/css/app.css`
- `assets/vendor/pdfjs-6.1.200.min.js`
- `assets/vendor/pdfjs-6.1.200.worker.min.js`
- `assets/vendor/pdfjs-6.1.200.LICENSE.txt`

Existing regression adjustments:

- `tests/batch1/browser-regression.cjs`
- `tests/batch4/browser-regression.cjs`
- `tests/batch5/core-tools.test.mjs`
- `tests/batch6/artifact-browser.cjs`

New regression files:

- `tests/portfolio-iteration1/core-tools.test.mjs`
- `tests/portfolio-iteration1/browser-regression.cjs`

## Verification

The Iteration 1 suite covers:

- final inventory and category counts;
- lifecycle invariants, fail-closed routing, and sitemap eligibility;
- strict parser grammar and resource boundaries;
- all three old aliases and canonical mode routes;
- direct load, refresh, back/forward, and no-loop behavior;
- mode-aware search, favorites, and recent migration;
- removed routes and unknown routes;
- Split ZIP order, duplicates, deterministic entry names, MIME, signature, and reopen;
- Extract order, duplicates, filename, MIME, signature, and reopen;
- Delete first, middle, last, multiple, duplicate, and all-page behavior;
- malformed, encrypted, oversized, and over-page-limit PDFs;
- stale-output clearing and valid-after-invalid recovery;
- actual local/lazy PDF.js thumbnails;
- 320 px, 375 px, and 1440 px layouts;
- keyboard page selection;
- console, page, network, and HTTP error monitoring.

Final sequential verification result: **80 passed, 0 failed, 0 blocked** across 16 test files.

| Test file | Passed | Failed |
|---|---:|---:|
| `tests/batch1/guards.test.mjs` | 7 | 0 |
| `tests/batch1/pdf-metadata.test.mjs` | 1 | 0 |
| `tests/batch1/browser-regression.cjs` | 10 | 0 |
| `tests/batch2/core-tools.test.mjs` | 5 | 0 |
| `tests/batch2/browser-regression.cjs` | 5 | 0 |
| `tests/batch3/core-tools.test.mjs` | 6 | 0 |
| `tests/batch3/browser-regression.cjs` | 6 | 0 |
| `tests/batch4/core-tools.test.mjs` | 4 | 0 |
| `tests/batch4/browser-regression.cjs` | 5 | 0 |
| `tests/batch5/core-tools.test.mjs` | 5 | 0 |
| `tests/batch5/browser-regression.cjs` | 6 | 0 |
| `tests/batch6/artifact.test.mjs` | 1 | 0 |
| `tests/batch6/image-pdf-blocked.cjs` | 1 | 0 |
| `tests/batch6/artifact-browser.cjs` | 2 | 0 |
| `tests/portfolio-iteration1/core-tools.test.mjs` | 7 | 0 |
| `tests/portfolio-iteration1/browser-regression.cjs` | 9 | 0 |
| **Total** | **80** | **0** |

Additional gates:

- Production and test JavaScript syntax: PASS
- `git diff --check`: PASS
- Static build repeatability and provenance: PASS
- Static artifact inventory: 31 shipped files, including the PDF.js module, worker, and license
- Static production preview: PASS
- Chromium/Chrome browser path: `C:/Program Files/Google/Chrome/Application/chrome.exe`
- Viewports: 320 px, 375 px, 768 px, 1440 px, and 1920 px across the combined suite
- Console errors: 0
- Page errors: 0
- Failed local network requests: 0
- HTTP errors: 0

One preliminary invocation ran the two Batch 6 artifact files concurrently and produced a shared-`dist` test race. The confirmed cause was test orchestration, not production code. No production change was made; the files were rerun sequentially and both passed, then the complete 16-file sequential gate passed.

## Risks and deferred scope

- Thumbnail rendering intentionally stops at the stated page/pixel limits; every page remains available as a numbered selectable card.
- Complex PDFs that require optional PDF.js rendering resources may use the numbered fallback; core PDF operations remain independent.
- No physical sitemap existed in the baseline, so this iteration adds lifecycle sitemap eligibility rather than inventing a new domain-specific sitemap.
- Edge verification is reserved for the required final two-iteration pass when an installed Edge executable is available.
- Image Editor, Scanner, OCR, HEIC/HEIF, QR Studio, clean paths, analytics, and unrelated backlog work remain postponed exactly as required.

## Commit gate

The Iteration 1 commit may be created only after:

- all Iteration 1 tests pass;
- affected Batch 1–6 tests pass sequentially;
- JavaScript syntax and `git diff --check` pass;
- the static artifact and preview pass;
- no unresolved P0, P1, or P2 issue remains.

Planned local commit message:

`feat: consolidate AzToolbox portfolio iteration 1`
