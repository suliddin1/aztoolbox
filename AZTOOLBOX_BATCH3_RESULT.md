# AzToolbox Batch 3 — implementation and verification result

Implementation date: **13 July 2026**
Branch: **`main`**
Starting commit: **`0d811ec008cf9e9b0f1993719307682037f34c30`**
Scope: **AZT-010, AZT-011, AZT-012, AZT-013, AZT-014 and AZT-022 only**

No dependency was installed, no package or build file was changed, and no commit, push or deployment was performed. The original full audit was not rerun.

## 1. Baseline reproduction

All six Batch 3 findings were reproduced against the clean starting commit before implementation.

| Issue | Reproduced baseline behavior |
|---|---|
| **AZT-010** | Valid non-global `/a/i` returned “Regex sintaksisini yoxlayın” because `matchAll` requires a global expression. Regex execution was still on the main thread. |
| **AZT-011** | `-2208988800` seconds was misread as milliseconds and displayed a December 1969 date. `not-a-number` produced a successful result containing `Invalid Date`. |
| **AZT-012** | Blank loan fields produced successful `NaN` monthly payment, total, and interest rows. |
| **AZT-013** | The percentage tool had only “Ədəd” and “Faiz” inputs; the promised percentage-change mode was absent. |
| **AZT-014** | `/tool/?slug=unknown` rendered PDF merger and changed recent history from `json-formatter` to `pdf-merger, json-formatter`. |
| **AZT-022** | Blank VAT and unit inputs were coerced to zero and shown as successful results. |

## 2. Issue disposition

| Issue | Disposition | Implemented and verified result |
|---|---|---|
| **AZT-010** | **FIXED AND VERIFIED** | Non-global expressions return the first match; global and sticky expressions iterate safely; flags, capture groups, named groups, Unicode and zero-length matches are supported. Browser execution uses a terminable worker with a 500 ms timeout and a 1,000-match output cap. Invalid syntax/flags and timeouts clear prior success; a valid retry works. |
| **AZT-011** | **FIXED AND VERIFIED** | Seconds/milliseconds are selected explicitly. Zero, negative/pre-1970, millisecond, date-to-timestamp and range cases are validated. Results show ISO UTC and labeled local timezone output. Blank, invalid, ambiguous dual input and out-of-range dates fail clearly without `Invalid Date`, `NaN` or `Infinity`; valid retry works. |
| **AZT-012** | **FIXED AND VERIFIED** | Principal must be positive, rate non-negative, and term a 1–1,200 month integer. The amortization formula matches an independent calculation, including the explicit 0% branch and a 360-month case. Non-finite results fail closed; display rounding is limited to currency presentation. |
| **AZT-013** | **FIXED AND VERIFIED** | Approved PD-9 behavior is implemented in one tool with “Ədədin faizi” and “Faiz dəyişimi” modes. `200` at `15%` gives `30`; `100` to `120` gives `20% artım`; decrease/no-change and high-precision decimal cases pass. Calculation values are not pre-rounded. |
| **AZT-014** | **FIXED AND VERIFIED** | Exact known slugs render normally. Missing, empty, unknown, case-different, encoded-unknown and invalid duplicate-first slugs render “Alət tapılmadı,” never initialize PDF merger, and never enter recent history. Encoded valid slugs, refresh and back/forward navigation pass. |
| **AZT-022** | **FIXED AND VERIFIED** | A shared raw-number parser distinguishes blank from zero, accepts decimal comma or dot, requires finite values, and applies per-formula negative/integer/range rules. Percentage, VAT, length conversion and loan handlers clear stale success before validation, show clear errors, and recover on the next valid input. |

Batch 3 fixed: **6**. Partial: **0**. Blocked: **0**.

## 3. Product decisions applied

- **PD-9:** one percentage calculator with two explicit modes: “Ədədin faizi” and “Faiz dəyişimi.”
- **PD-12:** exact slug matching; invalid slugs show a dedicated not-found state and do not update recent history.

No Batch 4–6 product behavior was changed.

## 4. Files changed

Production:

- `assets/js/batch3-tools.js` — shared finite-number parsing, percentage/VAT/unit/loan formulas, timestamp conversion, regex matching and worker timeout.
- `assets/js/simple-tools.js` — Batch 3 input controls, two percentage modes, validated calculator/timestamp handlers and worker-backed regex UI integration.
- `assets/js/app.js` — exact slug lookup and dedicated not-found rendering before recent-history recording.

Tests:

- `tests/batch3/core-tools.test.mjs` — six pure-logic tests for numeric policies, formulas, timestamps and regex semantics.
- `tests/batch3/browser-regression.cjs` — six focused end-to-end cases for calculator recovery, timestamp presentation, regex termination and route/history behavior.

Documentation:

- `AZTOOLBOX_BATCH3_RESULT.md` — this result.

`assets/js/tools-data.js` already contained the approved two-mode percentage description, so no metadata change was necessary. `assets/js/components.js` did not require modification because invalid routes now return before `recordRecent` is called.

## 5. Batch 3 test results

### Pure logic

```powershell
node --test tests/batch3/core-tools.test.mjs
```

Result: **6 passed, 0 failed, 0 skipped**.

Coverage includes blank/whitespace, zero, negative, decimal comma/dot, integer policy, NaN/Infinity text, formula overflow, both percentage modes, VAT add/extract, unit conversion, loan 0% and amortized interest, 360-month term, seconds/milliseconds, pre-1970 and date range, regex flags/groups/non-global/global/sticky/Unicode/zero-length cases.

### Chromium

```powershell
node --test tests/batch3/browser-regression.cjs
```

Final result: **6 passed, 0 failed, 0 skipped**.

### Microsoft Edge

```powershell
$env:BROWSER_EXECUTABLE='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
node --test tests/batch3/browser-regression.cjs
```

Final result: **6 passed, 0 failed, 0 skipped**.

The browser suite explicitly verifies that invalid input removes old successful content and that valid input succeeds after calculator, timestamp and regex errors. It also checks route direct navigation, refresh, back/forward, encoded valid/invalid slugs, unknown/case-different/duplicate slug values, recent history, page errors, console errors and failed/HTTP-error requests.

## 6. Batch 1 and Batch 2 regression results

Pure tests:

```powershell
node --test tests/batch1/guards.test.mjs tests/batch1/pdf-metadata.test.mjs tests/batch2/core-tools.test.mjs
```

Result: **13 passed, 0 failed, 0 skipped** — Batch 1 **8/8**, Batch 2 **5/5**.

Browser results:

| Suite | Chromium | Edge |
|---|---:|---:|
| Batch 1 browser regression | **10/10** | **10/10** |
| Batch 2 browser regression | **5/5** | **5/5** |

This preserves the verified PDF metadata, QR, bounded page/image/text processing, image compressor, Image-to-PDF, transliteration, password generator/strength and AZ IBAN behavior.

Node printed the existing `MODULE_TYPELESS_PACKAGE_JSON` warning during ESM tests. No package file was added merely to suppress it.

## 7. Syntax and static preview

All current `assets/js/*.js` files and `assets/vendor/qrcode.min.js` passed `node --check`.

A clean Python static preview checked the homepage, all six Batch 3 tool routes and an unknown route. All eight returned HTTP 200 under the plain static server and rendered the expected H1.

Static-preview errors:

- console errors: **0**
- page errors: **0**
- failed requests: **0**
- HTTP responses ≥400: **0**

## 8. Formula and rounding verification

- Percentage calculations retain the JavaScript numeric result and format only for display, up to 12 fractional digits.
- VAT add uses `amount × rate`; extract uses `amount − amount / (1 + rate)`.
- Length conversion uses explicit metre factors and formats only the displayed result.
- Loan payment uses the standard amortization formula with `log1p`/exponential growth for numerical stability and a separate `principal / months` branch at 0%.
- Loan payment, total and interest were compared with an independently written power-form formula before two-decimal currency display.
- Every successful calculator result is checked for finiteness before rendering; `NaN` and `Infinity` are never successful output.

## 9. Remaining risks and intentional boundaries

- The app is a zero-build static site. Its dedicated not-found UI is correct client behavior, but a plain static host still returns HTTP 200 for `/tool/`; a real transport-level 404 requires hosting rewrites or a separate route architecture and is not introduced in Batch 3.
- Regex patterns are capped by existing Batch 1 text limits and executed in a worker with a 500 ms deadline. Browser scheduling can make the visible timeout slightly later than 500 ms, but the worker is terminated and the UI remains responsive.
- Regex output is capped at the first 1,000 matches to prevent excessive DOM/result work.
- `datetime-local` is intentionally interpreted in the device timezone and the result says so. Different user timezones therefore produce different local display strings while UTC conversion remains invariant.
- Loan terms above 1,200 months are rejected as outside the supported boundary. This prevents implausible/unstable calculations while preserving normal and long-term credit cases.
- Number display separators depend on browser `Intl` data; tests accept comma/dot locale variants while formulas remain identical.

None of these risks blocks Batch 3.

## 10. Safety-to-commit assessment

**YES — Batch 3 is safe to commit as a reviewable Batch-3-only change set**, subject to normal human diff review.

Reasons:

- all six reproduced issues pass focused pure and Chromium/Edge browser tests;
- formulas were independently verified and no successful result can contain non-finite values;
- error cleanup and valid-after-error recovery pass for every affected handler family;
- invalid routes no longer open or record an unrelated tool;
- Batch 1 and Batch 2 pure and browser regressions remain green in Chromium and Edge;
- the targeted static preview and JavaScript syntax checks are clean;
- no dependency, package, build, commit, push or deployment change occurred;
- no Batch 4–6 behavior was implemented.

## 11. Final Git status

Expected Batch 3-only working tree:

```text
## main...origin/main
 M assets/js/app.js
 M assets/js/simple-tools.js
?? AZTOOLBOX_BATCH3_RESULT.md
?? assets/js/batch3-tools.js
?? tests/batch3/browser-regression.cjs
?? tests/batch3/core-tools.test.mjs
```

Final `git diff --check` and `git status` are run after this document is added and reported in the task handoff.
