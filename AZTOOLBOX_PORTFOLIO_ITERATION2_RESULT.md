# AzToolBox Portfolio Redesign — Iteration 2 Result

## Outcome

**PASS.** Iteration 2 consolidates five active tools into two canonical workspaces without losing their verified primary behavior:

- Line Sorter, Duplicate-line Remover, and Whitespace Cleaner → **Text Cleanup Workspace**
- UUID Generator and Secure Token Generator → **ID & Token Studio**

The active inventory moves from **35 tools after Iteration 1 to 32 tools after Iteration 2**. No unrelated backlog work was included.

## Starting gate

- Branch: `main`
- Iteration 1 checkpoint: `597f3ec11390d52bb7f1c1c45dbbe116c946a1d4`
- Iteration 1 status before this work: committed and clean
- Active tools before Iteration 2: 35
- Active tools after Iteration 2: 32

## Source behavior reproduced before consolidation

| Source tool | Verified previous default | Previous limits and output |
|---|---|---|
| Line Sorter | Split on CRLF/LF, Azerbaijani locale sort, ascending by default, descending optional, preserve blank/whitespace/case values | 1,000,000-character input cap; LF text output; copy; reload reset |
| Duplicate-line Remover | Exact, case-sensitive `Set` semantics; preserve the first occurrence and original order, including the first blank line | 1,000,000-character input cap; LF text output; copy; reload reset |
| Whitespace Cleaner | Trim each line, collapse repeated whitespace to one space, remove empty lines | 1,000,000-character input cap; LF text output; copy; reload reset |
| UUID Generator | UUID v4 through `crypto.randomUUID()`; default count 5; previous UI bounded count to 1–50 | Newline-separated output; copy; reload reset |
| Secure Token Generator | Web Crypto random bytes; default 32 bytes; lowercase hexadecimal; previous UI bounded length to 8–128 bytes | One token; copy; reload reset |

The new preset defaults reproduce these outputs. Iteration 2 adds strict error handling instead of silently clamping invalid numeric settings.

## Internal parity checklist

### Text Cleanup Workspace

| Contract | Result |
|---|---|
| Valid input | Empty and non-empty Unicode text up to 1,000,000 characters is accepted. Azerbaijani, Turkish dotted/dotless I, Cyrillic, emoji, and joined grapheme sequences remain intact. |
| Invalid input | Oversized text and invalid/duplicate/empty operation definitions are rejected atomically with an Azerbaijani error. |
| Boundary cases | Empty text, blank lines, CRLF, LF, duplicate blanks, case-sensitive and case-insensitive duplicates, and the maximum text limit are covered. |
| Old Sort output | Sort preset uses `Intl.Collator("az")`, keeps line content unchanged, defaults to ascending order, and emits LF by default. |
| Old Deduplicate output | Deduplicate preset is case-sensitive by default, preserves first occurrence and original order, and emits LF by default. |
| Old Whitespace output | Whitespace preset defaults to trim + collapse repeated whitespace + remove empty lines and emits LF. |
| Ordered pipeline | One operation or any non-duplicated ordered combination of Sort, Deduplicate, and Whitespace is supported. Up/down/remove controls expose the active order. |
| Optional cleanup | Trim, collapse repeated spaces, remove empty lines, sort direction, and duplicate case sensitivity are explicit controls. |
| Newline policy | LF and CRLF are explicit. Preserve mode tracks the raw newline style of pasted text in page memory so textarea normalization cannot silently discard CRLF intent. |
| Statistics | Before/after line count, non-empty line count, grapheme-aware character count, and removed duplicate count are shown. |
| Preview | Labelled before/after regions are visible; the scrollable before region is keyboard focusable and the output textarea has an accessible name. |
| Undo/reset | Applying output to input creates one in-memory undo point. Reset restores the selected legacy preset and clears input, output, and undo state. |
| Copy/download | Exact in-memory output is copied or downloaded as `aztoolbox-temizlenmis-metn.txt`; CRLF output is retained even though textarea display values normalize line endings. |
| Stale state | Input, option, or pipeline changes clear visible output and the in-memory copy/download value. Invalid input clears prior success; valid input works immediately afterward. |
| Privacy | Text is never written to URL/query parameters, localStorage, sessionStorage, favorites, recent history, console logs, network requests, or analytics. |
| Route behavior | Canonical modes are `sort`, `deduplicate`, and `whitespace`. Invalid modes fail closed. |
| Favorites/recent | Old references migrate once to the canonical workspace while preserving the first legacy mode intent; repeated migration is idempotent and deduplicated. |

### ID & Token Studio

| Contract | Result |
|---|---|
| UUID generation | Prefers `crypto.randomUUID()` and validates the returned UUID v4. A Web Crypto fallback sets RFC-compatible version and variant bits. |
| UUID count | Strict integer 1–50; blank, zero, negative, decimal, exponent, unsafe, and excessive values are rejected rather than clamped. |
| UUID output | Configurable batch; copy one, copy all, and `uuid-v4.txt` download. Each per-item copy button has an indexed accessible name. |
| Token randomness | Uses only `crypto.getRandomValues()`; no `Math.random()` path exists. Random bytes map directly to unbiased encodings. |
| Token formats | Lowercase hexadecimal and unpadded Base64URL. The UI distinguishes byte length from exact output-character length. |
| Token bounds | Strict count 1–50 and strict byte length 8–128. Invalid zero, negative, decimal, exponent, and excessive settings are rejected. |
| Token output | Copy one, copy all, and `tehlukesiz-tokenler.txt` download. A visible warning discourages unsafe reuse or sharing. |
| Stale state | Any setting change, invalid generation, reset, page hide, or BFCache restoration clears generated values. Valid generation works immediately after an error. |
| Privacy | UUIDs and tokens never enter URL, history state, localStorage, sessionStorage, logs, analytics, or network requests. Settings are not persisted. |
| Route behavior | Canonical modes are `uuid` and `token`. Invalid modes and unknown kinds fail closed. |
| Favorites/recent | Old UUID/token references migrate to one canonical studio entry with the first mode intent and no duplicate history. |

## Registry, routes, and discovery

The lifecycle registry now contains metadata-only replaced aliases:

| Old slug | Canonical destination | Mode |
|---|---|---|
| `line-sorter` | `text-cleanup-workspace` | `sort` |
| `duplicate-line-remover` | `text-cleanup-workspace` | `deduplicate` |
| `whitespace-cleaner` | `text-cleanup-workspace` | `whitespace` |
| `uuid-generator` | `id-token-studio` | `uuid` |
| `secure-token-generator` | `id-token-studio` | `token` |

- Old direct visits and refreshes retain intent without redirect loops.
- Old aliases produce canonical metadata and `noindex,follow` route metadata.
- Old task names and phrases produce mode-aware search links in global and catalog search.
- Active catalog, category, homepage, related-tool, and sitemap-policy data contain only the two canonical tools.
- Favorites and recent-history migrations are ordered, canonical, deduplicated, and idempotent.
- Text inputs and generated values are never part of stored references.
- Unknown tool kinds, invalid aliases, and invalid modes fail closed.

## Final inventory after Iteration 2

| Category | After Iteration 1 | After Iteration 2 | Change |
|---|---:|---:|---:|
| PDF | 4 | 4 | 0 |
| Image | 7 | 7 | 0 |
| Text | 6 | 4 | -2 |
| Developer | 8 | 8 | 0 |
| Business | 5 | 5 | 0 |
| Security | 3 | 2 | -1 |
| Azerbaijani | 2 | 2 | 0 |
| **Total** | **35** | **32** | **-3** |

Developer stays at eight because UUID Generator is replaced by ID & Token Studio in the same category. Secure Token Generator is removed from Security and represented by the Studio's Token mode.

## Production changes

- `assets/js/portfolio-iteration2-tools.js`
  - pure text pipeline, statistics, strict integer policy, UUID v4, and secure token helpers
- `assets/js/simple-tools.js`
  - both canonical workspaces, result lifecycle, copy/download, undo/reset, privacy, keyboard, and accessible result controls
- `assets/js/tools-data.js`
  - canonical inventory, five replaced aliases, mode-aware search, lifecycle/migration data, and current category copy
- `assets/js/batch5-tools.js`
  - category capability copy for the two canonical kinds; legacy capability entries removed
- `assets/css/app.css`
  - operation pipeline, before/after, studio result, responsive, and touch-target styling

No legacy text/UUID/token workspace or handler remains hidden in production code.

## Tests added and adapted

Added:

- `tests/portfolio-iteration2/core-tools.test.mjs` — 15 pure tests
- `tests/portfolio-iteration2/browser-regression.cjs` — 8 end-to-end tests

Adapted only for the approved new inventory/workspaces:

- `tests/batch1/browser-regression.cjs`
- `tests/batch6/artifact-browser.cjs`
- `tests/portfolio-iteration1/core-tools.test.mjs`
- `tests/portfolio-iteration1/browser-regression.cjs`

## Verified test results before the Iteration 2 checkpoint

| Verification | Engine | Passed | Failed | Blocked |
|---|---|---:|---:|---:|
| Iteration 1 core | Node | 7 | 0 | 0 |
| Iteration 2 core | Node | 15 | 0 | 0 |
| Batch 1 browser regression | Chrome | 10 | 0 | 0 |
| Batch 5 browser regression | Chrome | 6 | 0 | 0 |
| Iteration 1 browser regression | Chrome | 9 | 0 | 0 |
| Iteration 2 browser regression | Chrome | 8 | 0 | 0 |
| Iteration 2 browser regression | Edge | 8 | 0 | 0 |
| **Successful executions** |  | **63** | **0** | **0** |

Also passed:

- JavaScript syntax checks for changed modules and the new test files
- `git diff --check`
- 32-tool registry and category-count assertions
- 10,000 generated UUID v4 format/version/variant/uniqueness checks
- Chrome and Edge coverage at 320px, 375px, and 1440px
- keyboard activation, result accessibility, copy/download capture, URL/storage privacy, console/page/network/HTTP error monitoring

## Review and repair record

- One initial browser run reported four test-harness failures: asynchronous catalog rendering, textarea CRLF display normalization, a missing Preview click, and a synthetic copy click. Each was classified and repaired in test logic; production behavior was unchanged.
- A read-only review found three P2 issues: pasted CRLF Preserve intent, missing result accessible names/focusability, and duplicate per-item copy names. All three were fixed and the full Iteration 2 Chrome and Edge suites passed again.
- No P0, P1, or P2 finding remains open at this checkpoint.

## Deferred by approved scope

The following remain postponed: Image Editor, Document Scanner, Azerbaijani OCR, HEIC/HEIF support, QR Studio, clean `/tools/...` paths, analytics, and unrelated improvements to compression, text comparison, JSON, or calculators.

## Checkpoint decision

Iteration 2 is safe to commit locally with:

`feat: consolidate AzToolbox portfolio iteration 2`

No push or deployment is authorized.
