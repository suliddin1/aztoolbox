# AzToolBox Remediation Batch 6 Result

## Scope and baseline

- Starting commit: `3b40e0067694637f8327f7f3934a19adc281ee1d` (`fix: complete AzToolbox remediation batch 5`).
- Starting branch/status: `main`; clean working tree after the Batch 5 checkpoint.
- Exact issue scope: **AZT-025**, plus closure verification for **AZT-001 through AZT-028**.
- This batch was limited to deterministic build/provenance, the 16 previously blocked Image-to-PDF cases, local artifact verification, and closure regressions. It did not modify application behavior.
- Per the task boundary, no push, deployment, promotion, rollback, or manual production mutation was performed.

## Reproduced defect

The starting ignored `.vercel/output/static` tree was stale:

- Missing shipped files: `assets/js/batch2-tools.js`, `batch3-tools.js`, `batch4-tools.js`, `batch5-tools.js`, `motion.js`, `pdf-tools.js`, and `tool-guards.js`.
- Fifteen common shipped files had source/artifact hash mismatches, including route HTML, CSS, application modules, and the QR vendor.
- The artifact had no commit/source digest manifest and no tracked deterministic build command.

This reproduced **AZT-025** and confirmed that a `--prebuilt` deployment from the saved output would not represent current source.

## Files and functions changed

- `.gitignore`: ignores deterministic `dist/` output in addition to `.vercel`.
- `vercel.json` (new): runs the pinned dependency-free Node build command and declares `dist` as output.
- `scripts/build-static.mjs` (new): exact shipped-entry allowlist, recursive deterministic inventory, SHA-256 manifest, safe `dist` cleaning/copy, commit/dirty provenance, and artifact verification exports.
- `scripts/verify-static-artifact.mjs` (new): command-line parity gate for `dist` and `.vercel/output/static`.
- `tests/batch6/artifact.test.mjs` (new): repeatability, inventory, required-module, changed-file, and stale-extra-file tests.
- `tests/batch6/image-pdf-blocked.cjs` (new): all 16 formerly blocked Image-to-PDF cases with independent PDF reopen/page-size checks.
- `tests/batch6/artifact-browser.cjs` (new): build manifest, MIME, all physical routes, all 39 tool routes, refresh, network, and representative category operations.
- `tests/batch1/browser-regression.cjs`: replaced two compressor fixed-delay samples with bounded waits for the observable completion state after the final cross-batch run exposed timing sensitivity under load.
- `AZTOOLBOX_BATCH6_RESULT.md` (new): this result record.
- `AZTOOLBOX_BATCH456_SUMMARY.md` (new): final Batch 4-6 checkpoint, regression, browser, risk, and readiness summary.

No application HTML, CSS, runtime JavaScript, vendor, or product-decision file changed in Batch 6.

## Fixes implemented

- A cross-platform Node build removes only the verified project `dist` target and copies an exact allowlist: root entry/favicons, six physical routes, and complete `assets/**`.
- Every shipped file is sorted and recorded with path, size, and SHA-256. The manifest records schema, current commit, dirty state, aggregate source digest, and the exact file list.
- Verification rejects missing, changed, extra, stale, or wrong-commit artifacts. Required helpers and `motion.js` are explicitly covered.
- `vercel.json` makes Vercel run the same tracked build and use `dist`, so `.vercel/output/static` is derived rather than reused.
- The 16 previously blocked Image-to-PDF scenarios are now bounded browser tests and cannot be omitted or counted as pass without output/error postconditions.

## The 16 formerly blocked Image-to-PDF cases

1. truncated PNG;
2. separate corrupt PNG repeat;
3. uppercase `.PNG` filename;
4. Unicode filename;
5. extensionless PNG;
6. PNG renamed `.jpg` with correct PNG MIME;
7. PNG bytes with correct MIME;
8. PNG bytes with JPEG MIME;
9. JPEG bytes with PNG MIME;
10. JPEG bytes with blank MIME;
11. WebP bytes with JPEG MIME;
12. valid PNG + WebP;
13. valid + corrupt + valid atomic batch;
14. four-file exact order;
15. same-file reselect;
16. ordinary metadata-bearing PNG.

Invalid/truncated/mixed-invalid cases produced no download or stale success. Every valid case produced `application/pdf`, `%PDF-`, reopened independently, preserved page count/order, and matched source dimensions.

## Exact build and artifact results

- Direct build: `node scripts/build-static.mjs` → **28 shipped files**, digest `7e9abe3b73a1acda8f735500b75a9a6d3bf0517339c4d755cd14b70fffcb03a4`.
- Direct verify: `node scripts/verify-static-artifact.mjs dist` → **28/28 inventory and hashes verified**.
- Pinned CLI: `npx.cmd --yes vercel@55.0.0 build --yes`.
- Vercel CLI: **55.0.0**, Node **24.15.0**.
- Bounded cached clean build duration: **1,476 ms**; exit code **0**; status **ok**; target **preview build only**; output `.vercel/output`.
- Vercel output config: Build Output API version **3**.
- `node scripts/verify-static-artifact.mjs .vercel/output/static` → **28/28 inventory and hashes verified**, same digest and manifest.
- No deploy command was run. The CLI’s suggested next `vercel deploy` action was intentionally not executed.

The CLI emitted an informational parent-environment pnpm lockfile detection and used pnpm 10 logic, but the project build itself has no package install and completed with unchanged tracked dependency state.

## Exact test results

### Unit/syntax/release

- Complete Batch 1–6 unit command: **29 passed, 0 failed, 0 blocked**.
- Batch 6 artifact unit: **1 passed, 0 failed** (included above).
- Every `assets/js/*.js`, Batch 6 script, and Batch 6 browser test passed `node --check` where applicable.
- `git diff --check`: **passed**.

### Chromium

- Batch 1 browser: **10 passed**.
- Batch 2 browser: **5 passed**.
- Batch 3 browser: **6 passed**.
- Batch 4 browser: **5 passed**.
- Batch 5 browser: **6 passed**.
- Batch 6 formerly blocked Image-to-PDF: **1 test / 16 named cases passed**.
- Batch 6 built-artifact browser: **2 passed**.
- Complete Chromium browser total: **35 passed, 0 failed**.
- Extra Chromium smoke against the actual `.vercel/output/static`: **2 passed, 0 failed**.

### Microsoft Edge

- Batch 1 browser: **10 passed**.
- Batch 2 browser: **5 passed**.
- Batch 3 browser: **6 passed**.
- Batch 4 browser: **5 passed**.
- Batch 5 browser: **6 passed**.
- Batch 6 formerly blocked Image-to-PDF: **1 test / 16 named cases passed**.
- Batch 6 built-artifact browser: **2 passed**.
- Complete Edge browser total: **35 passed, 0 failed**.

### Browser/static preview errors

- Monitored console errors: **0**.
- Page errors: **0**.
- Unexpected failed local network requests: **0**.
- Local HTTP 4xx/5xx on expected resources/routes: **0**.
- External HTTP(S) requests during artifact smoke: **0**.

Fixture-only failures were repaired within one attempt per root cause: Python's valid `application/javascript` MIME was added to the accepted JavaScript MIME set; browser-generated `data:` UI resources were excluded from the external HTTP(S) request definition; and two existing compressor tests now wait for the observable completion state instead of fixed 80/180 ms delays. A parallel Chromium run also exhausted Puppeteer's protocol timeout during the 100-operation Batch 4 stress case; its isolated rerun passed all 5 tests in 27 seconds, including the stress case in 14 seconds, so no production fix was warranted. No production or build-code failure remained.

## Independent output verification

- Artifact parity was independently checked from both direct `dist` and Vercel `.vercel/output/static`, not inferred from the build exit code.
- Two consecutive direct builds had identical manifest content and source digest.
- Deliberately changed `assets/js/app.js` and an extra `stale.txt` in isolated temporary artifacts were both rejected.
- All six physical routes and **39/39** tool routes returned HTTP 200 from the built artifact, matched H1/title, and survived refresh.
- Artifact MIME checks passed for HTML, JavaScript, CSS, and PNG.
- Representative PDF, image, text, developer, business, security, and Azerbaijani operations produced correct primary results from built files. The PDF merger output reopened with two pages at **100×200** and **300×400** in order; the image resizer recovered a valid 1×1 output.
- Current-commit provenance was present in `.aztoolbox-build.json`; pre-checkpoint builds correctly recorded the Batch 5 starting commit with `dirty=true` because Batch 6 files were not yet committed.

## Closure disposition for AZT-001 through AZT-028

- **AZT-001–AZT-024 and AZT-026–AZT-028:** verified by the complete Batch 1–6 unit/browser closure suite; no unresolved P0/P1, false-success, corrupt-output, route, privacy, state, or accessibility regression found.
- **AZT-025:** fixed locally by deterministic tracked build/provenance and verified Vercel output parity.
- Fixed structured items: **28/28 locally**.
- Partial structured items: none.
- Blocked structured items: none.
- Not reproduced structured items: none.

## Blocked external checks

- Firefox and WebKit critical samples: **blocked/unavailable**; only Playwright Chromium binaries are installed, and the task did not authorize adding large browser runtimes. Chromium and installed Edge passed.
- Current production deployment URL/commit/cache/header smoke: **blocked by the explicit no-push/no-deploy boundary**; the uncommitted Batch 6 artifact cannot exist in production.
- Production rollback drill: **blocked by the explicit no-deploy/no-production-mutation boundary**. Local stale/tamper rejection was verified instead.

These blocked checks are not recorded as pass and must be performed after an authorized push/deployment. They do not conceal a failing local configured check.

## Remaining risks

- Production routing, cache propagation, and deployment alias behavior remain unverified until an authorized deployment exists.
- Firefox/WebKit codec, Canvas, and `Intl.Segmenter` differences remain unverified.
- The manifest proves exact shipped source parity, not reproducibility of third-party platform metadata outside `.vercel/output/static`.
- Full original 1,955-scenario audit was intentionally not rerun; the regression suite and exact 16 blocked cases were run instead.

## Final diff, status, and decision

- Expected Batch 6/final-closure paths before the final checkpoint: `.gitignore`, `AZTOOLBOX_BATCH6_RESULT.md`, `AZTOOLBOX_BATCH456_SUMMARY.md`, `vercel.json`, `scripts/build-static.mjs`, `scripts/verify-static-artifact.mjs`, `tests/batch1/browser-regression.cjs`, and `tests/batch6/{artifact.test.mjs,image-pdf-blocked.cjs,artifact-browser.cjs}`.
- Ignored generated state: `dist/**` and `.vercel/output/**`; neither is staged.
- All configured local checks pass, previous verified application bytes are unchanged, Vercel output parity passes, and `git diff --check` passes.
- **Batch 6 is safe to commit locally with the required checkpoint message.**
