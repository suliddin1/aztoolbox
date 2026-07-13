# AzToolBox — forensic production-grade QA auditi

Audit tarixi: **12 iyul 2026**  
Tapşırıq növü: **yalnız audit; production source dəyişdirilməyib**  
Baseline: `main` / `b1b13eb731bbe0fa685970638f8ae123c4d98b43`

## A. İcraçı xülasə

Repository-dən **39 unikal alət**, **7 kateqoriya**, **39 logical slug**, **1 generic tool HTML route** və ümumilikdə **6 physical HTML entry route** aşkar edildi. Registry, catalog, global search və route handler-ləri arasında orphan alət və duplicate slug yoxdur. Bununla belə iki alət — PDF splitter və PDF extractor — eyni handler davranışını verir.

Yekun alət statusları:

| Status | Say |
|---|---:|
| PASS | 5 |
| PASS WITH LIMITATION | 12 |
| WARNING | 9 |
| FAIL | 12 |
| NOT IMPLEMENTED | 1 |
| BLOCKED tool | 0 |

Case səviyyəsində **1,955 ssenari icra edildi**. Image-to-PDF üçün son 24 case-dən 8-i tamamlandı, 16-sı iki bounded runner cəhdinin vaxt limitinə görə ayrıca `BLOCKED` qeyd edildi və heç biri PASS sayılmadı.

Əsas nəticə: app shell sabitdir — 39/39 tracked route və 39/39 saved-artifact route Chrome-da direct visit və refresh zamanı render oldu, route sweep-də console/page error və 4xx/5xx resource alınmadı. Lakin “səhifə açılır” səviyyəsindən aşağıda bir sıra yüksək təsirli wrong-result qüsurları var:

1. Azərbaycan transliterasiyası əsas hərflərdə səhvdir.
2. Image-to-PDF UI-nin qəbul etdiyi WebP-ni emal etmir.
3. PDF metadata “təmizləyici” metadata-nı tam silmir və yeni dəyərlər əlavə edir.
4. QR Unicode/emoji exact round-trip, kənar boşluq və uzun giriş hallarında yanlışdır.
5. Parol generatoru seçilmiş qrupları zəmanət vermir; strength checker proqnozlaşdırılan parolları 5/5 göstərir.
6. AZ IBAN checksum-u yoxlayır, lakin ölkəyəxas bank identifikatoru strukturunu tam yoxlamır.
7. Image compressor bütün formatları JPEG-ə çevirir, alpha-nı itirir və kiçik faylı böyüdə bilir.
8. Timestamp, regex, loan və percentage alətlərində əsas validation/scope qüsurları var.

### Browser/build matrisi

- Chrome `150.0.7871.101`: bütün kritik və full route/tool matrisi.
- Microsoft Edge `150.0.4078.65`: 7 representative route + JSON əməliyyatı; console/network error yoxdur.
- Firefox/WebKit: Windows mühitində runtime/executable olmadığı üçün `BLOCKED`.
- Tracked source: documented zero-build production-equivalent static preview üzərində test edildi.
- Saved `.vercel/output/static`: ayrıca test edildi; shell işləyir, lakin source ilə müqayisədə köhnə artifact-dır.
- Clean Vercel build: temporary copy-də `npx vercel@latest build --yes` işə salındı, 304 saniyə ərzində output vermədiyi üçün environment/CLI mərhələsində `BLOCKED`.
- Repository-də `package.json`, lint, typecheck, build və existing test script-i yoxdur.
- 7 tracked JavaScript faylı syntax check-dən keçdi.

### Git təhlükəsizliyi

İlkin `git status` təmiz idi. Production source və tracked fayllarda dəyişiklik edilməyib. Final tracked `git diff` boşdur; yalnız bu üç tələb olunan audit faylı untracked artifact kimi qalır. Heç bir commit yaradılmayıb.

## B. Real tətbiq inventarı

### Sayların uzlaşdırılması

| Mənbə | Say | Qeyd |
|---|---:|---|
| `tools-data.js` registry | 39 | 39 unikal slug və kind |
| Catalog UI | 39 | registry-dən dinamik render |
| Logical tool route | 39 | `/tool/?slug=<slug>` |
| Physical tool HTML route | 1 | `tool/index.html` |
| Handler branch body | 26 | shared generic branch-lər |
| Orphan registry entry | 0 | hamısı handler-ə çatır |
| Orphan handler | 0 | current kind-lərə uyğundur |
| Duplicate slug/kind | 0 | yoxdur |
| Home featured flag | 11 | home yalnız ilk 6-nı göstərir |

Kateqoriyalar: PDF 6, şəkil 7, mətn 8, developer 8, business 5, security 3, Azərbaycan dili 2.

### Canonical alət inventarı

| # | Ad / slug / kateqoriya | Definition və handler | Giriş → nəticə/download | Dependency, emal, validation və mismatch |
|---:|---|---|---|---|
| 1 | PDF birləşdirici `pdf-merger` / PDF | `tools-data.js:16`; `app.js:132-142,194-200` | ≥2 PDF → bütün səhifələr seçim sırasında; `aztoolbox-birlesdirilmis.pdf` | pdf-lib, lokal; exact MIME filter; byte/page limit və reorder UI yoxdur |
| 2 | PDF bölücü `pdf-splitter` / PDF | `tools-data.js:17`; `simple-tools.js:12-15,49-57,113-136` | 1 PDF + page list → bir kombinə PDF | Description “ayrıca PDF” deyir; handler bir fayl yaradır, sort/dedupe edir |
| 3 | PDF səhifə silici `pdf-page-remover` / PDF | `tools-data.js:18`; eyni PDF branch | 1 PDF + page list → seçilənlərsiz PDF | Qalan 0 səhifəni rədd edir; malformed token-lər səssiz ignore ola bilir |
| 4 | PDF səhifə çıxarıcı `pdf-page-extractor` / PDF | `tools-data.js:19`; eyni PDF branch | 1 PDF + page list → seçilən səhifələrdən PDF | Splitter ilə davranışca eynidir |
| 5 | Şəkildən PDF `image-to-pdf` / PDF | `tools-data.js:20`; `simple-tools.js:17,140-160` | PNG/JPEG/WebP çoxlu input → bir PDF, page/image | PNG/JPEG işləyir; WebP advertised, faktiki uğursuz; natural pixel page size |
| 6 | PDF metadata təmizləyici `pdf-metadata-remover` / PDF | `tools-data.js:21`; `simple-tools.js:113-136` | 1 PDF → yeni PDF | Title/author/subject/keywords blank; creator/producer AzToolBox, tarixlər qalır |
| 7 | Şəkil ölçü dəyişdirici `image-resizer` / image | `tools-data.js:23`; `app.js:140,179-186` | image + width/height/ratio → PNG preview/download | FileReader/Image/Canvas, lokal; min=1 runtime clamp, max yoxdur; output həmişə PNG |
| 8 | Şəkil sıxışdırıcı `image-compressor` / image | `tools-data.js:24`; `simple-tools.js:18-24,163-188` | image + quality 20–95 → JPEG | Canvas, lokal; format/alpha saxlanmır, ölçü azalma zəmanəti yoxdur |
| 9 | Şəkil format çevirici `image-converter` / image | `tools-data.js:25`; eyni image branch | image → WebP/PNG/JPEG | Binary signature seçimə uyğundur; animation flatten olunur |
| 10 | Şəkil kəsici `image-cropper` / image | `tools-data.js:26`; eyni image branch | image + width/height → mərkəzdən PNG crop | Source-dan böyük dəyər clamp; koordinat seçimi yoxdur, description center scope-u deyir |
| 11 | Şəkil döndürücü `image-rotator` / image | `tools-data.js:27`; eyni image branch | 90/180/270 → PNG | Dimension swap düzgündür; arbitrary angle exposure yoxdur |
| 12 | Qara-ağ şəkil `grayscale-image` / image | `tools-data.js:28`; eyni image branch | image → grayscale PNG | Canvas filter; sampled piksellər R=G=B; alpha saxlanır |
| 13 | Şəkil metadata təmizləyici `image-metadata-remover` / image | `tools-data.js:29`; eyni image branch | redraw → PNG | Metadata silinir, lakin format/animation saxlanmır |
| 14 | Söz sayacı `text-counter` / text | `tools-data.js:31`; `app.js:138,168-172` | live text → word/char/nonspace/sentence/line/read time | Lokal; char = UTF-16 length; qrafem semantikası yoxdur |
| 15 | Böyük/kiçik hərf `case-converter` / text | `tools-data.js:32`; `simple-tools.js:26-28,193-201` | text + 4 mode → copyable text | `az` locale; title/sentence regex heuristic |
| 16 | Sətir sıralayıcı `line-sorter` / text | `tools-data.js:33`; eyni transform branch | lines + asc/desc → sorted lines | `localeCompare('az')`, lokal |
| 17 | Təkrarlanan sətirləri sil `duplicate-line-remover` / text | `tools-data.js:34`; transform branch | lines → exact unique lines | Raw/case-sensitive Set, first occurrence |
| 18 | Boşluq təmizləyici `whitespace-cleaner` / text | `tools-data.js:35`; transform branch | text → per-line trim/collapse, blank removal | Unicode whitespace regex |
| 19 | Slug yaradan `slug-generator` / text | `tools-data.js:36`; transform branch | title → ASCII AZ slug | NFD + explicit AZ mapping; digər Unicode çıxarılır |
| 20 | Lorem ipsum yaradan `lorem-ipsum-generator` / text | `tools-data.js:37`; `simple-tools.js:30,202` | count → fixed paragraphs | 1–12 silent clamp |
| 21 | Mətn müqayisəsi `text-compare` / text | `tools-data.js:38`; `simple-tools.js:31,203` | two texts → positional line diff | Line-level only; no LCS/word/char |
| 22 | JSON formatter `json-formatter` / developer | `tools-data.js:40`; `app.js:137,160-167` | JSON + format/minify → escaped/copy output | Native JSON, lokal; error location; size/depth cap yoxdur |
| 23 | Base64 `base64-encoder` / developer | `tools-data.js:41`; `simple-tools.js:32,204` | text encode/decode | Classic Base64; Unicode round-trip; URL-safe/binary yoxdur |
| 24 | URL kodlayıcı `url-encoder` / developer | `tools-data.js:42`; eyni codec branch | text encode/decode | encodeURIComponent/decodeURIComponent |
| 25 | JWT decoder `jwt-decoder` / developer | `tools-data.js:43`; `simple-tools.js:33,205` | JWT → parsed header/payload | Decode-only; signature/expiry/alg validate etmir |
| 26 | Hash yaradan `hash-generator` / developer | `tools-data.js:44`; `simple-tools.js:34,206` | text + SHA-256/512 → lowercase hex | WebCrypto, lokal |
| 27 | UUID yaradan `uuid-generator` / developer | `tools-data.js:45`; `simple-tools.js:35,207` | count → UUID v4 list | `crypto.randomUUID`; 1–50 silent clamp |
| 28 | Timestamp çevirici `timestamp-converter` / developer | `tools-data.js:46`; `simple-tools.js:36,208` | timestamp/date → localized date/epoch | Digit-length seconds/ms heuristic; invalid success mümkündür |
| 29 | Regex tester `regex-tester` / developer | `tools-data.js:47`; `simple-tools.js:37,209` | pattern/flags/text → matches/index | Sync `RegExp` + `matchAll`; g-siz valid regex yanlış rədd olunur |
| 30 | Faiz kalkulyatoru `percentage-calculator` / business | `tools-data.js:49`; `simple-tools.js:38,210` | a,b → b% × a | Description percentage-change də vəd edir, mode yoxdur |
| 31 | ƏDV kalkulyatoru `vat-calculator` / business | `tools-data.js:50`; `simple-tools.js:39,211` | amount/rate + add/extract → VAT/total | 2 decimal; invalid/blank/negative guard yoxdur |
| 32 | Vahid çevirici `unit-converter` / business | `tools-data.js:51`; `simple-tools.js:40,212` | m/km/cm/ft/in pairs → value | Faktorlar düzgündür; yalnız length; blank=0 |
| 33 | Kredit kalkulyatoru `loan-calculator` / business | `tools-data.js:52`; `simple-tools.js:41,213` | principal/rate/months → payment/total/interest | Formula valid hallarda doğru; input guard yoxdur |
| 34 | QR kod yaradan `qr-generator` / business | `tools-data.js:53`; `app.js:141,187-193` | text + size → canvas/PNG | Local vendored QR; trim, supplementary Unicode və long-input qüsurları |
| 35 | Parol generatoru `password-generator` / security | `tools-data.js:55`; `app.js:139,173-178` | length + groups → password/copy | WebCrypto; selected-group guarantee və bias-sız mapping yoxdur |
| 36 | Parol gücü yoxlayıcı `password-strength` / security | `tools-data.js:56`; `simple-tools.js:42,214` | password → 0–5 label | Yalnız length/classes; input `type=text` |
| 37 | Təhlükəsiz token `secure-token-generator` / security | `tools-data.js:57`; `simple-tools.js:43,215` | bytes → hex token | WebCrypto; 8–128 silent clamp |
| 38 | AZ IBAN `az-iban-validator` / AZ | `tools-data.js:59`; `simple-tools.js:44,216` | normalized IBAN → MOD-97 status | Checksum doğru; institution ID subtype natamam |
| 39 | Latın/Kiril `az-transliterator` / AZ | `tools-data.js:60`; `simple-tools.js:45,217` | text + direction → mapped text | Paralel string mapping-də indeks səhvləri |

Digər physical route-lar: `/`, `/tools/`, `/about/`, `/privacy/`, `/feedback/`. Feedback submit serverə data göndərmir; formu təmizləyib bunu açıq statusla bildirir.

## C. Alət üzrə test nəticəsi

Tam per-tool ssenari ailələri, case sayları və binary/page sübutları [AZTOOLBOX_TEST_MATRIX.md](./AZTOOLBOX_TEST_MATRIX.md) faylındadır. Yekun cədvəl:

| Kateqoriya | PASS | PASS WITH LIMITATION | WARNING | FAIL | NOT IMPLEMENTED |
|---|---:|---:|---:|---:|---:|
| PDF | 0 | 0 | 3 | 3 | 0 |
| Image | 0 | 2 | 4 | 1 | 0 |
| Text | 2 | 5 | 1 | 0 | 0 |
| Developer | 3 | 3 | 0 | 2 | 0 |
| Business | 0 | 1 | 1 | 2 | 1 |
| Security | 0 | 1 | 0 | 2 | 0 |
| Azərbaycan | 0 | 0 | 0 | 2 | 0 |
| **Cəmi** | **5** | **12** | **9** | **12** | **1** |

## D. Tam issue siyahısı — severity, ehtimal, user impact sırası

Strukturlaşdırılmış tam qeydlər [AZTOOLBOX_ISSUES.json](./AZTOOLBOX_ISSUES.json) faylındadır. Prioritet sırası:

### P1 High

1. `AZT-001` — transliteration əsas mapping səhvləri; həmişə reproduksiya olunur.
2. `AZT-003` — PDF metadata cleaner metadata-nı tam silmir və yenisini əlavə edir.
3. `AZT-004` — QR exact Unicode/emoji və uzun giriş nəticəsi yanlışdır.
4. `AZT-002` — Image-to-PDF advertised WebP-ni emal etmir.
5. `AZT-005` — password selected-group guarantee yoxdur.
6. `AZT-006` — password-strength misleading 5/5 nəticəsi.
7. `AZT-007` — AZ IBAN BBAN structure validation natamamdır.
8. `AZT-008` — image compressor alpha/format itirir və faylı böyüdə bilər.
9. `AZT-009` — PDF page range expansion üçün high-impact robustness limiti yoxdur.

### P2 Medium

10. `AZT-010` — valid non-global regex rədd edilir; bounded runtime yoxdur.
11. `AZT-011` — timestamp negative/invalid parsing səhvləri.
12. `AZT-012` — loan blank/zero period NaN/Infinity.
13. `AZT-013` — percentage-change mode yoxdur və precision display məhduddur.
14. `AZT-014` — invalid slug əlaqəsiz pdf-merger fallback edir.
15. `AZT-015` — PDF page grammar order/dedupe/reversed/partial semantics.
16. `AZT-016` — file/text/pixel/canvas limits yoxdur.
17. `AZT-017` — stale result/download və async file race.
18. `AZT-018` — image Blob URL lifecycle leak.
19. `AZT-019` — image metadata cleaner format/animation itirir.
20. `AZT-020` — resizer invalid input üçün aydın error vermir.
21. `AZT-021` — text counter qrafemləri səhv sayır və live announcement yoxdur.
22. `AZT-022` — calculator blank/invalid dəyərləri zero/NaN kimi göstərir.
23. `AZT-023` — malformed localStorage shape tool renderini dayandırır.
24. `AZT-024` — privacy copy Google Fonts xarici request-i açıqlamır.
25. `AZT-025` — saved Vercel artifact tracked source-dan köhnədir.

### P3 Low

26. `AZT-026` — 39 tool route-da canonical yoxdur və description generic-dir.
27. `AZT-027` — bütün tool route-lar lazımsız PDF/QR vendor payload yükləyir.
28. `AZT-028` — 39 sayı və capability copy hardcode-dur.

## E. Global/shared qüsurlar

- Invalid slug not-found əvəzinə PDF merger açır və recent history-yə yazılır.
- Nəticələrin əksəriyyəti input dəyişəndə invalid olmur.
- Shared clipboard helper permission/availability xətasını idarə etmir.
- `readList` JSON parse edir, lakin array şəklini yoxlamır; storage exception fallback-i yoxdur.
- Home 11 `featured` flag-dan yalnız ilk 6-nı göstərir; bu məqsədli ola bilər, lakin metadata/UI fərqidir.
- PDF splitter və extractor ayrılmış product capability kimi görünür, lakin eyni çıxışı yaradır.
- Generic result renderer `innerHTML` istifadə edir; cari çağırışlarda user text escape edilir və real DOM-XSS tapılmadı. Gələcək caller-lər üçün regression guard tələb olunur.
- Unknown future `kind` generic PDF UI-yə düşə bilər; current registry-də belə orphan yoxdur.

## F. Security və privacy tapıntıları

Bu bölmə yalnız yüksək səviyyəli cause/remediation təqdim edir; exploit payload və prosedur daxil edilmir.

| Komponent | Severity | Yüksək səviyyəli səbəb | Təhlükəsiz düzəliş istiqaməti | Regression |
|---|---|---|---|---|
| PDF page parser | P1 | Range əvvəlcədən bound edilmədən sync genişlənir | Safe integer/range cap, worker və abort | bounded range/time tests |
| Regex tester | P2 | Arbitrary sync regex və input üçün vaxt/uzunluq cap yoxdur | Worker/timeout/length guard | bounded runtime corpus |
| File/image processing | P2 | Byte/page/pixel/canvas limitləri yoxdur | Pre-decode caps və aydın rejection | near/over-limit fixtures |
| Blob URL lifecycle | P2 | Preview URL-ləri tam revoke edilmir | change/reset/error/unmount revoke | created/revoked balance |
| Privacy/network | P2 | Remote fonts xarici metadata request yaradır | Self-host və ya disclosure | network allowlist/offline |
| DOM rendering | P3 risk watch | Raw `innerHTML` sink var, cari user caller-ləri escapedir | Typed DOM/textContent və sink regression | HTML/script inert corpus |

Müşahidə edilən fakt: tool payload emalı zamanı fetch/XHR/WebSocket/sendBeacon yoxdur və file/text payload-un xaricə göndərilməsi tapılmadı. External network Google Fonts-la məhdud idi.

## G. Performance və file-limit tapıntıları

- Heç bir file byte limit, PDF page limit, decoded pixel limit, canvas dimension cap və text length cap yoxdur.
- `tool/index.html` hər tool üçün həm pdf-lib (~525 KB), həm QR vendor script-i (~20 KB) yükləyir.
- Böyük wide/tall image (`12000×2`, `2×12000`) və `2048×2048` işləyib; bu, limitin təhlükəsiz olduğunu deyil, limitin olmadığını sübut edir.
- Image preview Blob URL-ləri repeat hallarında leak edir.
- PDF və image handler-ləri əsasən main thread-dədir; progress/cancel bütün daxili işi preempt etmir.
- Saved production artifact source ilə stale-dir; `--prebuilt` istifadəsində release drift riski var.

## H. Mobile və accessibility tapıntıları

- Current tracked source 320/375/tablet/desktop/wide representative 45 səhifədə document-level horizontal overflow yaratmadı.
- Filter chip row məqsədli horizontal scroll-dur.
- Visible input/select/textarea-larda label/accessible name boşluğu tapılmadı.
- Global search və mobile menu current source-da focus trap/Escape/focus restore keçdi.
- Breadcrumb text links 24px touch-target guidance-dan kiçikdir.
- Text counter canlı stats dəyişikliklərini screen reader üçün elan etmir.
- Result/error association JSON və QR-də mövcuddur; sadə calculator-larda validation ümumiyyətlə yoxdur.
- Saved artifact mobile-menu keyboard davranışında zəifdir, lakin bu artifact current source deyil.

## I. Məhsul qərarı tələb edən qeyri-müəyyən spesifikasiyalar

1. PDF splitter hər seçilmiş səhifəni ayrı PDF/ZIP etməlidir, yoxsa bir kombinə PDF?
2. Split/extract page order və duplicate request saxlanmalıdırmı?
3. Reversed range normalizə edilməlidir, yoxsa validation error?
4. Metadata “cleaner” bütün metadata-nı silməlidir, yoxsa AzToolBox attribution əlavə edə bilər?
5. Image tools source format/animation saxlamalıdır, yoxsa çıxış formatı dəyişməsi açıq limitation olmalıdır?
6. Compressor üçün “ölçü mütləq azalır” vədi varmı; böyüyən nəticə necə təqdim edilməlidir?
7. Character count UTF-16 unit, Unicode code point, yoxsa user-perceived grapheme olmalıdır?
8. JWT səhifəsində “decode, validate etmir” warning-i nə qədər prominent olmalıdır?
9. Percentage change rejimi əlavə edilməlidir, yoxsa metadata copy silinməlidir?
10. Feedback formunun lokal “hazırla” davranışı final product scope-dur, yoxsa submit backend planlanır?
11. GIF/WebP animation bütün Canvas tools-da rədd olunmalıdır, yoxsa first-frame extraction açıq göstərilməlidir?

## J. Tövsiyə olunan təmir sırası

1. **Wrong-result P1:** transliteration, metadata cleaner, QR Unicode, Image-to-PDF WebP, IBAN BBAN validation.
2. **Security/password correctness:** group guarantee və strength model.
3. **Data fidelity:** compressor alpha/format/size behavior.
4. **Robustness limits:** page-range, regex runtime, byte/page/pixel/canvas/text cap.
5. **Core validation:** timestamp, loan, percentage mode, calculator blanks.
6. **State integrity:** stale results, async file snapshot/cancel, object URL lifecycle.
7. **Routing/storage:** invalid slug not-found və localStorage shape guard.
8. **Format/product policy:** splitter semantics, animation/output-format disclosure.
9. **Privacy/performance/a11y:** self-host fonts, lazy vendor loading, live region/touch targets.
10. **Release discipline:** clean artifact generation və source/artifact parity gate.

Bu audit fix etmir; yalnız repair order təklif edir.

## K. Tövsiyə olunan avtomatlaşdırılmış regression suite

1. Registry contract testi: 39+ entries, unique slug/kind, handler existence, category count, dynamic copy.
2. Playwright route contract: hər slug direct/refresh/title/H1/not-found/back-forward.
3. Pure logic property suite: text transforms, Base64/URL round-trip, hash vectors, formulas, IBAN, transliteration table.
4. Password statistical suite: 15 group combination, selected-group invariant, 10k uniqueness/sanity.
5. QR suite: independent decoder ilə ASCII/AZ/emoji/ZWJ/space/long boundaries.
6. PDF fixture suite: signature, reopen, page order/count/size/rotation/text/metadata/encryption errors.
7. Image fixture suite: Pillow decode, signature/extension, dimensions, alpha, pixels, EXIF, animation policy, size delta.
8. Invalid/stale-state suite: blank/malformed/retry/input-after-result/old-download/rapid-double.
9. Resource-limit suite: safe near/over limits, worker timeout, abort, memory/object-URL balance.
10. Accessibility suite: labels/names/error association/live region/focus trap/touch targets/reduced motion.
11. Cross-browser CI: Chromium + Firefox + WebKit critical sample.
12. Release gate: clean Vercel build, artifact/source hash inventory, deployed smoke only from verified URL.

## Final verification qeydi

FAIL və P1/P2 tapıntıların representative nümunələri yenidən icra edildi; password generator 1,000 yeni sample ilə, transliteration simvol səviyyəsində, QR long input, invalid slug, timestamp, regex, percentage precision və Unicode counter yenidən təsdiqləndi. Bütün uğurlu PDF çıxışları yenidən açıldı; bütün saxlanmış image Blob-ları müstəqil decode edildi. Final source syntax check və production-equivalent preview keçdi. Clean Vercel build cəhdi environment ceiling səbəbi ilə `BLOCKED` qaldı.

