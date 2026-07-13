# AzToolBox — QA test matrisi

Audit tarixi: **12 iyul 2026**  
Baseline: `main` / `b1b13eb731bbe0fa685970638f8ae123c4d98b43`  
Əhatə: tracked source production preview, saxlanmış `.vercel/output/static` artifact-ı, Chrome 150 və Edge 150.

## 1. Sayım və status qaydası

- Alətəxas icra edilmiş ssenari: **1,535**
- Routing, refresh, responsive, shared interaction, saved-artifact və cross-browser ssenarisi: **420**
- Cəmi icra edilmiş ssenari: **1,955**
- Image-to-PDF-də mühit vaxt limitinə görə tamamlanmayan və ayrıca `BLOCKED` qeydə alınan case: **16**
- Non-file logic matrisi: **1,031** browser ssenarisi; 789 expectation uyğunluğu, 242 validation/scope/output uyğunsuzluğu
- File matrisi: **504** tamamlanmış alət ssenarisi; əlavə olaraq 16 case `BLOCKED`

Statuslar:

- `PASS`: nəzərdə tutulan əsas və kənar davranış yoxlanıb.
- `PASS WITH LIMITATION`: açıq şəkildə məhdud scope daxilində düzgündür.
- `WARNING`: əsas əməl işləyir, lakin meaningful validation, UX, privacy, compatibility və ya robustness qüsuru var.
- `FAIL`: əsas vəd edilən əməl ən azı bir əsas/advertised input üçün yanlış nəticə verir.
- `NOT IMPLEMENTED`: registry/UI vədi handler-də yoxdur.
- `BLOCKED`: konkret case mühit səbəbi ilə tamamlanmayıb; pass sayılmayıb.

## 2. Bütün 39 alət üzrə yekun matrisi

| # | Alət | Route | İcra | Status | Əsas əhatə | Kritik sübut |
|---:|---|---|---:|---|---|---|
| 1 | PDF birləşdirici | `/tool/?slug=pdf-merger` | 40 | WARNING | 1/2/çox fayl, sıra, dublikat, mixed size, rotate, invalid/encrypted, MIME, adlar, repeat/cancel/double-click | 27 çıxışın 27-si `%PDF-`, pypdf ilə açıldı; page count/sıra düzgündür; MIME silently filter və limit yoxdur |
| 2 | PDF bölücü | `/tool/?slug=pdf-splitter` | 40 | FAIL | page grammar, first/last, range, order, duplicates, invalid/partial, output semantics | 29 çıxış açıldı; həmişə bir kombinə PDF, order sort edilir; description “ayrıca PDF” ilə uyğun deyil |
| 3 | PDF səhifə silici | `/tool/?slug=pdf-page-remover` | 40 | WARNING | first/last/middle/all, duplicate, range, invalid/partial, order | 26 çıxış açıldı və valid hallarda page removal düzgündür; parser səssiz normallaşdırır |
| 4 | PDF səhifə çıxarıcı | `/tool/?slug=pdf-page-extractor` | 40 | WARNING | splitter ilə eyni page corpus, exact selected content/order | 29 çıxış açıldı; splitter ilə eyni page-count paylanması və eyni handler semantikası |
| 5 | Şəkildən PDF | `/tool/?slug=image-to-pdf` | 24 + 16 BLOCKED | FAIL | PNG/JPEG/WebP, alpha, EXIF, çoxlu sıra, odd/wide/tall/large, unsupported/animated, corrupt | 14 successful PDF açıldı; page size/order təsdiq; advertised WebP rədd; son 16 MIME/mixed case timeout səbəbi ilə BLOCKED |
| 6 | PDF metadata təmizləyici | `/tool/?slug=pdf-metadata-remover` | 40 | FAIL | standard/custom metadata, dates, content/pages/sizes/rotate, invalid/encrypted | 32 çıxış açıldı; Producer/Creator `AzToolBox`, Creation/ModDate qalır |
| 7 | Şəkil ölçü dəyişdirici | `/tool/?slug=image-resizer` | 40 | WARNING | exact/ratio/1×1/up/down, alpha, EXIF, formats, corrupt/MIME, repeat/stale/download | 34 Blob çıxışı Pillow ilə açıldı, hamısı PNG; 1×1 və 14×10 exact; invalid seçim error göstərmir |
| 8 | Şəkil sıxışdırıcı | `/tool/?slug=image-compressor` | 40 | FAIL | quality 20/80/95, formats, alpha, dimensions, size delta, animation, repeat | 37 çıxışın hamısı JPEG; alpha itdi; kiçik PNG 163 B-dan təxminən 805 B-a böyüdü |
| 9 | Şəkil format çevirici | `/tool/?slug=image-converter` | 40 | WARNING | PNG/JPEG/WebP input-output pairs, same-format, alpha, animation, signatures | 35 WebP + 1 PNG + 1 JPEG müstəqil decode edildi; signature/extension uyğun; animasiya flatten olunur |
| 10 | Şəkil kəsici | `/tool/?slug=image-cropper` | 40 | WARNING | full, 1×1, center, larger-than-source, alpha, formats, invalid files | 37 valid PNG; 1×1 exact, 999×999 source-a clamp; yalnız center crop scope-u |
| 11 | Şəkil döndürücü | `/tool/?slug=image-rotator` | 40 | PASS WITH LIMITATION | 90/180/270, dimension swap, alpha, formats, repeat | 37 valid PNG; 90/270 üçün 8×6 → 6×8, 180 üçün 8×6; arbitrary angle UI-də yoxdur |
| 12 | Qara-ağ şəkil | `/tool/?slug=grayscale-image` | 40 | PASS WITH LIMITATION | RGB equality, alpha, already-small/various formats, animation policy | 37 valid PNG; bütün sampled pixellərdə R=G=B; transparent alpha saxlanıb; animasiya flatten olunur |
| 13 | Şəkil metadata təmizləyici | `/tool/?slug=image-metadata-remover` | 40 | WARNING | metadata present/absent, dimensions, alpha, JPEG/PNG/WebP/GIF/SVG, repeat | 37 valid PNG, metadata info boş; source format/animation saxlanmır |
| 14 | Söz sayacı | `/tool/?slug=text-counter` | 26 | WARNING | empty/space/CRLF/Unicode/emoji/ZWJ/combining/HTML/long | Söz/sətir əsas hallarda doğru; UTF-16 `.length` qrafemləri çox sayır və live announcement yoxdur |
| 15 | Böyük/kiçik hərf | `/tool/?slug=case-converter` | 24 | PASS WITH LIMITATION | az locale upper/lower/title/sentence, punctuation, Unicode, empty | `i ı ə ş` → `İ I Ə Ş`; title/sentence sadə heuristic scope-u |
| 16 | Sətir sıralayıcı | `/tool/?slug=line-sorter` | 22 | PASS | asc/desc, az locale, duplicates, blank/CRLF/Unicode | Azərbaycan locale sırası və əks sıra expectation-a uyğundur |
| 17 | Təkrarlanan sətirləri sil | `/tool/?slug=duplicate-line-remover` | 22 | PASS WITH LIMITATION | exact duplicates, case, whitespace, blank, Unicode | Exact raw-line `Set`; first occurrence saxlanır; case/whitespace normalization etmir |
| 18 | Boşluq təmizləyici | `/tool/?slug=whitespace-cleaner` | 23 | PASS | tabs, Unicode whitespace, blank lines, leading/trailing, CRLF | Per-line trim/collapse və blank-line removal expectation-a uyğundur |
| 19 | Slug yaradan | `/tool/?slug=slug-generator` | 26 | PASS WITH LIMITATION | bütün AZ hərfləri, punctuation, whitespace, Unicode, emoji, empty | ASCII AZ transliterasiya və hyphen cleanup düzgündür; qeyri-AZ Unicode çıxarılır |
| 20 | Lorem ipsum yaradan | `/tool/?slug=lorem-ipsum-generator` | 20 | PASS WITH LIMITATION | min/max/blank/negative/decimal/large/repeat | 1–12-ə clamp olunan sabit mətn; scope məhduddur, validation mesajı yoxdur |
| 21 | Mətn müqayisəsi | `/tool/?slug=text-compare` | 22 | PASS WITH LIMITATION | same/different line, insert/delete, empty, Unicode | Dəqiq line-position diff; word/character diff nəzərdə tutulmur |
| 22 | JSON formatter | `/tool/?slug=json-formatter` | 25 | PASS WITH LIMITATION | object/array/scalar, format/minify, invalid, duplicate keys, Unicode, HTML, deep | Standard JSON parse/stringify, output escaped; size/depth tətbiq limiti yoxdur |
| 23 | Base64 kodlayıcı | `/tool/?slug=base64-encoder` | 50 | PASS WITH LIMITATION | ASCII/AZ/emoji/multiline/empty/invalid/padding/URL-safe/round-trip | Classic Base64 Unicode round-trip keçdi; URL-safe/binary scope-u yoxdur |
| 24 | URL kodlayıcı | `/tool/?slug=url-encoder` | 52 | PASS | URL/query/%/space/Unicode/malformed/round-trip | encodeURIComponent/decodeURIComponent expectation-a uyğundur, malformed input error verir |
| 25 | JWT decoder | `/tool/?slug=jwt-decoder` | 24 | PASS WITH LIMITATION | valid/malformed segments, Base64URL, alg none, expired, Unicode | Header/payload decode edir; imza/expiry doğrulamır; metadata “decoder” deyir, UI disclosure zəifdir |
| 26 | Hash yaradan | `/tool/?slug=hash-generator` | 48 | PASS | SHA-256/512 vectors, empty, Unicode, long, deterministic | WebCrypto nəticəsi standard vectors və lowercase hex uzunluqları ilə eynidir |
| 27 | UUID yaradan | `/tool/?slug=uuid-generator` | 21 (+5,000 sample) | PASS | count bounds, v4/version/variant, uniqueness, repeat | 5,000 nümunədə format/bit/unikallıq uyğunluğu |
| 28 | Timestamp çevirici | `/tool/?slug=timestamp-converter` | 25 | FAIL | seconds/ms/0/negative/pre-1970/future/invalid/decimal/blank/timezone | Mənfi saniyə uzunluğa görə ms sayılır; invalid success içində `Invalid Date` |
| 29 | Regex tester | `/tool/?slug=regex-tester` | 27 | FAIL | flags, global/non-global, invalid, groups, Unicode, zero-length, bounded robustness | Valid non-global regex `matchAll` səbəbilə sintaksis xətası; runtime sərhədi yoxdur |
| 30 | Faiz kalkulyatoru | `/tool/?slug=percentage-calculator` | 42 | NOT IMPLEMENTED | blank/0/negative/decimal/large/precision/basic/change promise | b%×a işləyir; description-dakı faiz dəyişimi rejimi yoxdur; default 3-decimal display |
| 31 | ƏDV kalkulyatoru | `/tool/?slug=vat-calculator` | 42 | WARNING | add/extract, 0/negative/-100, decimal, blank, rounding | Normal 100+18%=118 və 118-dən 18 extraction doğrudur; invalid/blank validation yoxdur |
| 32 | Vahid çevirici | `/tool/?slug=unit-converter` | 42 | PASS WITH LIMITATION | 25 exposed pairs, inverse/identity/reference/precision/blank | Faktorlar düzgündür; yalnız length units və blank→0 davranışı |
| 33 | Kredit kalkulyatoru | `/tool/?slug=loan-calculator` | 42 | FAIL | valid formula, 0%, blank/0/negative period/rate/principal/large/rounding | Valid formula uyğundur; blank/0 period NaN/Infinity-ni success göstərir |
| 34 | QR kod yaradan | `/tool/?slug=qr-generator` | 54 | FAIL | blank, ASCII/AZ/emoji/ZWJ/URL/long/space, sizes, PNG, independent decode | PNG signature düzgündür; Unicode/emoji exact decode və trim/long-input davranışı yanlışdır |
| 35 | Parol generatoru | `/tool/?slug=password-generator` | 57 (+1,000 sample) | FAIL | 15 group combinations, lengths, no group, repeats, randomness/guarantees | 1,000 length-8 all-group sample: upper 26, lower 22, digit 385, symbol 231 omission |
| 36 | Parol gücü yoxlayıcı | `/tool/?slug=password-strength` | 40 | FAIL | repeat/common/sequential/keyboard/date/substitution/passphrase/Unicode | Predictable/common pattern 5/5, passphrase 3/5; class+length model misleadingdir |
| 37 | Təhlükəsiz token yaradan | `/tool/?slug=secure-token-generator` | 41 (+5,000 sample) | PASS WITH LIMITATION | byte length, hex length, bounds, 0/negative/huge, uniqueness | WebCrypto və 2 hex/byte düzgündür; invalid count səssiz clamp olunur |
| 38 | AZ IBAN yoxlayıcı | `/tool/?slug=az-iban-validator` | 48 | FAIL | synthetic valid/checksum/country/length/case/spaces/hyphen/BBAN structure | MOD-97 düzgündür; checksum-valid rəqəmli bank ID səhvən valid olur |
| 39 | Latın/Kiril çevirici | `/tool/?slug=az-transliterator` | 166 | FAIL | hər kiçik/böyük hərf, words/sentences, punctuation, unsupported, round-trip | g/q, j/y və bəzi registr mappings səhv; round-trip itkilidir |

## 3. PDF fixture matrisi və nəticə doğrulaması

Fixture korpusu 45 harmless lokal fayldan ibarət idi: single/multi/mixed-size/rotated/metadata/encrypted/malformed/truncated/zero/wrong-MIME PDF-lər; PNG/JPEG/WebP/GIF/BMP/SVG, alpha, animation, CMYK, EXIF orientation, 1×1, odd, wide/tall/large, corrupt/truncated/zero və Unicode/uzun adlar.

Müstəqil pypdf nəticəsi:

| Tool | Uğurlu download | `%PDF-` doğru | Reopen doğru | Əsas page-count sübutu |
|---|---:|---:|---:|---|
| PDF merger | 27 | 27 | 27 | 2, 3, 4, 5, 6, 7 və 61 səhifə ssenariləri |
| PDF splitter | 29 | 29 | 29 | 1/2/3/5 səhifə; grammar normallaşdırması görünür |
| PDF remover | 26 | 26 | 26 | 2/3/4 səhifə qalıqları |
| PDF extractor | 29 | 29 | 29 | splitter ilə eyni nəticə pattern-i |
| PDF metadata | 32 | 32 | 32 | 1/2/3/5/60 səhifə qorunub |
| Image-to-PDF | 14 | 14 | 14 | 1/2/3 səhifə və dəqiq ölçülər |

Image-to-PDF ölçü nümunələri: `1×1`, `7×5`, `8×6`, `12000×2`, `2×12000`, `2048×2048`. 4 fayllıq sıra case-i son 16 `BLOCKED` case daxilində qaldığı üçün pass sayılmayıb.

### Image-to-PDF üzrə qalan 24 case-in yekunu

Tamamlanan 8 case:

1. animated WebP — aydın ümumi rejection, download yoxdur.
2. static GIF — rejection, download yoxdur.
3. animated GIF — rejection, download yoxdur.
4. BMP — rejection, download yoxdur.
5. safe SVG — rejection, download yoxdur.
6. SVG image-context unsafe markup — rejection; script icrası müşahidə edilmədi.
7. zero-byte PNG — rejection, download yoxdur.
8. wrong/corrupt PNG bytes — rejection, download yoxdur.

`BLOCKED` qalan 16 case (iki bounded runner cəhdində ümumi vaxt limiti): truncated PNG; ayrı corrupt PNG təkrarı; uppercase PNG; Unicode filename PNG; extension-siz PNG; PNG renamed JPG; PNG bytes/correct MIME; PNG bytes/JPEG MIME; JPEG bytes/PNG MIME; JPEG bytes/blank MIME; WebP bytes/JPEG MIME; valid+WebP; valid+corrupt+valid; four-file order; same-file reselect; ordinary metadata-bearing PNG. Bu case-lər **omitted və ya PASS deyil**.

## 4. Image binary doğrulaması

Pillow 12.3 ilə nəticələr:

- Resizer: 34/34 decode, hamısı PNG; alpha saxlanıb; 1×1 və 14×10 exact.
- Compressor: 37/37 decode, hamısı JPEG; alpha yoxdur; source format saxlanmır.
- Converter: 37/37 decode; 35 WebP, 1 PNG, 1 JPEG; binary signature seçimlə uyğun.
- Cropper: 37/37 decode, hamısı PNG; 1×1 və source clamp düzgündür.
- Rotator: 37/37 decode, hamısı PNG; 90/270 dimension swap düzgündür.
- Grayscale: 37/37 decode; sampled bütün piksellərdə `R=G=B`; alpha saxlanıb.
- Image metadata remover: 37/37 decode; hamısı PNG; metadata info açarları boşdur.

GIF/animated GIF/animated WebP/BMP/SVG faylları file picker `accept` siyahısında olmasa da proqramatik/drop yolu ilə Canvas ailəsində decode edilə bildi; nəticə yalnız ilk statik frame-dir.

## 5. Routing və shared interaction matrisi

| Yoxlama | Tracked source | Saved Vercel artifact | Nəticə |
|---|---:|---:|---|
| 39 valid slug direct visit | 39/39 | 39/39 | title/H1/handler identity uyğun |
| 39 route refresh | 39/39 | 39/39 | HTTP 200, identity saxlanır |
| Console/page error on route sweep | 0 | 0 | PASS shell səviyyəsi |
| Failed/bad resource | 0 | 0 | PASS; Google Fonts xarici request olaraq ayrıca qeyd edildi |
| Missing/empty/unknown/case slug | fallback | fallback | WARNING: pdf-merger açılır |
| Encoded valid slug | doğru | doğru | PASS |
| Duplicate query param | birinci dəyər | birinci dəyər | Documented observation |
| Unknown physical path | 404 | 404 | Python static-server 404; custom app 404 yoxdur |
| Catalog search `JSON` | 1 nəticə | 1 nəticə | PASS (animation settle sonrası) |
| PDF filter | 6 nəticə, URL sync | 6 nəticə, URL sync yoxdur | Saved artifact stale difference |
| Favorites/recent | doğru | doğru | PASS normal storage |
| Malformed storage shape | tool root crash | tool root crash | WARNING |
| Clipboard | exact `bir iki` | exact | PASS Chrome localhost |
| Back/forward | JSON ↔ UUID | JSON ↔ UUID | PASS |
| Global search focus trap/Escape | pass | focus restore zəif | Current tracked PASS; artifact stale |
| Mobile menu/Escape | pass | köhnə artifact-da fail | Current tracked PASS; artifact stale |
| Feedback form | lokal status, network 0 | eyni | PASS WITH LIMITATION; rəy göndərilmir |

## 6. Responsive və accessibility matrisi

Yoxlanan ölçülər: 320×800, 375×812, 768×900, 1440×900, 1920×1080. Hər ölçüdə `/`, `/tools/` və PDF/image/text/developer/business/security/AZ representative route-ları.

- Tracked source üçün 45/45 səhifədə document-level horizontal overflow yoxdur.
- Filter row məqsədli `overflow-x:auto` istifadə edir; viewport xaricindəki filter düymələri document overflow kimi qiymətləndirilməyib.
- Visible form controls üçün label/accessible-name çatışmazlığı tapılmadı.
- Duplicate ID, nameless visible button və heading jump route sweep-də tapılmadı.
- `:focus-visible` 3px outline mövcuddur; global search və mobile menu focus trap/Escape current source-da keçdi.
- Breadcrumb text links təxminən 18px hündürdür və 24px minimum touch-target guidance-dan kiçikdir.
- Text counter-in canlı dəyişən stats bölməsində `aria-live` yoxdur.
- `prefers-reduced-motion: reduce` representative matrix-də istifadə edildi və layout pozulmadı.
- Firefox və WebKit bu Windows mühitində mövcud olmadığı üçün cross-browser coverage `BLOCKED`; Edge 150-də 7 representative route və JSON əməliyyatı keçdi.

## 7. Network, cache və privacy matrisi

- Tool əməliyyatları zamanı `fetch`, XHR, WebSocket və sendBeacon çağırışı tapılmadı.
- Xarici traffic Google Fonts stylesheet/font resursları ilə məhdud idi.
- Service worker registration: `0`; Cache Storage key: `[]`; manifest: yoxdur.
- PDF və QR vendor kitabxanaları lokal host edilir.
- Hər tool route PDF və QR kitabxanasını birlikdə yükləyir; lazy loading yoxdur.

## 8. Build və environment matrisi

| Check | Command/state | Nəticə |
|---|---|---|
| Dependency install integrity | `package.json` yoxdur | N/A — zero-build statik app |
| Lint | script yoxdur | N/A |
| Typecheck | script yoxdur | N/A |
| Existing tests | script/test config yoxdur | N/A |
| JS syntax | 7 tracked JS faylı `node --check` | PASS |
| Production-equivalent preview | `python -m http.server` | PASS, Chrome/Edge browser smoke + full matrix |
| Saved production artifact | `.vercel/output/static` ayrıca serve edildi | PASS load; WARNING stale |
| Clean Vercel build | temporary copy-də `npx vercel@latest build --yes` | BLOCKED — 304s environment/CLI acquisition ceiling, output yoxdur |
| Deployed URL | yalnız project ID/name, etibarlı URL yoxdur | BLOCKED, URL təxmin edilmədi |
| Chrome | 150.0.7871.101 | full critical coverage |
| Edge | 150.0.4078.65 | representative coverage |
| Firefox/WebKit | executable/runtime yoxdur | BLOCKED |

## 9. Final təkrar yoxlama matrisi

- Invalid slugs tracked və saved artifact-da yenidən yoxlandı — eyni fallback.
- Password generator 1,000 yeni sample ilə yenidən yoxlandı — qrup omission təkrarlandı.
- Password strength üç representative nümunə ilə yenidən yoxlandı — misleading score təkrarlandı.
- Timestamp, regex, percentage precision, text grapheme count və transliteration yenidən yoxlandı — eyni nəticələr.
- Uzun QR case yenidən yoxlandı — success shell + pageerror təkrarlandı.
- Bütün yaradılmış PDF-lər signature və pypdf reopen ilə yenidən yoxlandı.
- Image Blob çıxışları Pillow ilə decode edildi; dimensions/format/alpha/grayscale pikselləri yoxlandı.
- Production preview route console/network logları yenidən yoxlandı.

