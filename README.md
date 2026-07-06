# AzToolbox

Azerbaijan-first free mini-tool platform for daily digital tasks.

AzToolbox is a practical public utility website with small tools for CV, PDF, image, text, student, business, QR, WhatsApp, and Azerbaijani language workflows. The UI is Azerbaijani-first and the tools are designed to be fast, simple, and useful without login.

## Current Tools

### Azərbaycan dili

- Azərbaycan klaviatura düzəldici
- Azərbaycan hərf düzəldici

### Şəkil alətləri

- Şəkil alətləri toolkit
- Şəkil ölçüləndirici
- Şəkil sıxışdırıcı

### PDF alətləri

- PDF alətləri toolkit
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

## Key Principles

- Free
- No login
- Client-side where possible
- Privacy-first
- Azerbaijani UI

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- jsPDF for client-side PDF generation
- pdf-lib for client-side PDF operations
- qrcode for QR generation
- Browser canvas APIs for image processing

## Local Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build for production:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## Deployment

AzToolbox is built with the Next.js App Router and is Vercel-ready.

## Privacy Note

Files are processed in the browser where possible and are not intentionally uploaded to a server. Some local preferences, such as favorites and recently used tools, may be stored in the user's browser localStorage.

## Roadmap

- Better UI polish
- More local tools
- SEO improvements
- PWA support
- Accessibility improvements
