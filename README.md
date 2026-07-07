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

### Şəkil alətləri

- Şəkil alətləri toolkit
- Şəkil ölçüləndirici
- Şəkil sıxışdırıcı
- CV şəkli hazırlayıcı
- Şəkil format çevirici

### PDF alətləri

- PDF alətləri toolkit
- PDF birləşdirmə
- PDF səhifə ayırma
- PDF səhifələrini təşkil etmə
- Şəkli PDF et

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

### Tələbə alətləri

- GPA / ortalama kalkulyatoru
- Söz və simvol sayğacı

### Mətn alətləri

- Mətn təmizləyici

### Developer alətləri

- QR kod generator

## Texnologiyalar

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- pdf-lib
- jsPDF
- qrcode
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

## Məxfilik

AzToolbox hazırkı versiyada backend, database, authentication, analytics, reklam və ödəniş sistemi istifadə etmir. Fayl emalı mümkün olduğu qədər istifadəçinin brauzerində aparılır.

Favoritlər və son istifadə edilən alətlər yalnız brauzerin localStorage sahəsində saxlanılır. Bu məlumatlar login hesabı ilə sinxronlaşdırılmır.

## Deployment

Layihə Next.js App Router üzərində qurulub və Vercel kimi Next.js dəstəkləyən platformalara deploy üçün hazırdır.

Əgər production URL istifadə olunursa, metadata və sitemap üçün `NEXT_PUBLIC_SITE_URL` environment dəyişəni təyin edilə bilər.

## Security qeydi

Bu repoda API key, token, database connection string və ya şəxsi secret saxlanılmamalıdır. `.env*`, build output-ları, log faylları və dependency qovluqları `.gitignore` ilə istisna edilib.

## Status

Hazırkı branch: `release-v0.1`

Buraxılış tipi: public v0.1
