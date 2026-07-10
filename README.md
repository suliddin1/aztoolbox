# AzToolbox

AzToolbox Azərbaycanca gündəlik rəqəmsal işlər üçün hazırlanmış pulsuz mini alətlər platformasıdır. Məqsəd CV, PDF, şəkil, QR, WhatsApp, qəbz, mətn və tələbə işlərini qeydiyyatsız, sürətli və mümkün olduqca brauzerdə həll etməkdir.

## Xüsusiyyətlər

- Azərbaycanca və lokal ehtiyaclara uyğun interfeys
- Qeydiyyatsız istifadə
- Reklamsız və ödənişsiz v0.1 buraxılışı
- PDF, şəkil və mətn işləri üçün praktik alətlər
- Favorit və son istifadə edilən alətlər üçün localStorage dəstəyi
- Mümkün olduğu qədər client-side emal
- Mobil və desktop üçün responsive UI

## Mövcud alətlər

### Azərbaycan dili

- Azərbaycan klaviatura düzəldici
- Azərbaycan hərf düzəldici
- Azərbaycan Kiril–Latın çeviricisi
- Ədədi Azərbaycan dilində yazı ilə

### Şəkil alətləri

- Şəkil alətləri toolkit
- Şəkil ölçüləndirici
- Şəkil sıxışdırıcı
- CV şəkli hazırlayıcı
- Şəkil format çevirici
- Şəkil metadata və GPS təmizləyicisi
- Rəng palitrası çıxarıcı
- Favicon və app icon generator

### PDF alətləri

- PDF alətləri toolkit
- PDF birləşdirmə
- PDF səhifə ayırma
- PDF səhifələrini təşkil etmə
- Şəkli PDF et
- PDF-dən JPG/PNG şəkilə
- PDF su nişanı
- PDF səhifə nömrələri
- PDF-ə vizual imza
- PDF metadata göstəricisi və təmizləyicisi

### CV və karyera

- CV hazırlayıcı
- CV şəkli hazırlayıcı
- LinkedIn headline generator

### Biznes alətləri

- WhatsApp link generator
- Rəqəmsal vizitka QR generator
- Qəbz / invoice generator
- ƏDV kalkulyatoru
- Endirim / faiz kalkulyatoru
- Azərbaycan IBAN yoxlayıcısı

### Tələbə alətləri

- GPA / ortalama kalkulyatoru
- Söz və simvol sayğacı

### Mətn alətləri

- Mətn təmizləyici
- Mətn müqayisəsi

### Developer alətləri

- QR kod generator
- QR kod oxuyucu və kamera skaneri
- SVG optimizer
- JSON formatter və validator
- Base64 və Base64URL encoder/decoder
- JWT decoder
- UUID v4 və secure random ID generator
- Unix timestamp çevirici
- URL encoder, decoder və query parser

## Texnologiyalar

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- pdf-lib
- jsPDF
- qrcode
- pdfjs-dist
- JSZip
- jsQR
- exifr
- diff
- Browser canvas APIs

## Lokal quraşdırma

Asılılıqları quraşdır:

```bash
npm install
```

Development server-i başlad:

```bash
npm run dev
```

Brauzerdə aç:

```text
http://localhost:3000
```

Production build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Formatter, typecheck və unit testlər:

```bash
npm run format:check
npm run typecheck
npm test
```

## Məxfilik

AzToolbox hazırkı versiyada backend, database, authentication, analytics, reklam və ödəniş sistemi istifadə etmir. Alət girişləri və fayllar brauzerdə emal olunur və serverə göndərilmir.

Favoritlər və son istifadə edilən alətlər yalnız brauzerin localStorage sahəsində saxlanılır. Bu məlumatlar login hesabı ilə sinxronlaşdırılmır.

## Deployment

Layihə Next.js App Router üzərində qurulub və Vercel kimi Next.js dəstəkləyən platformalara deploy üçün hazırdır.

Əgər production URL istifadə olunursa, metadata və sitemap üçün `NEXT_PUBLIC_SITE_URL` environment dəyişəni təyin edilə bilər.

## Security qeydi

Bu repoda API key, token, database connection string və ya şəxsi secret saxlanılmamalıdır. `.env*`, build output-ları, log faylları və dependency qovluqları `.gitignore` ilə istisna edilib.

## Status

Hazırkı branch: `release-v0.1`

Buraxılış tipi: public v0.1
