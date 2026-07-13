const define = (slug, name, description, category, icon, kind, keywords = [], featured = false, options = {}) => ({
  id: slug,
  slug,
  name,
  description,
  category,
  icon,
  kind,
  keywords,
  featured,
  lifecycle: 'active',
  indexable: true,
  sitemap: true,
  ...options,
});

export const categoryMeta = {
  pdf: { name: 'PDF alətləri', description: 'Sənədləri birləşdir, böl və təhlükəsiz emal et.' },
  image: { name: 'Şəkil alətləri', description: 'Ölçü, format və keyfiyyət işlərini brauzerdə həll et.' },
  text: { name: 'Mətn alətləri', description: 'Mətni ölç, təmizlə, müqayisə et və hazırla.' },
  developer: { name: 'Developer alətləri', description: 'Data, kod və veb utilitlərini sürətləndir.' },
  business: { name: 'Hesablama alətləri', description: 'Gündəlik faiz, vergi və maliyyə hesablamaları.' },
  security: { name: 'Təhlükəsizlik', description: 'Güclü parol yarat və parol gücünü yoxla.' },
  az: { name: 'Azərbaycan dili', description: 'Yerli yazı və bank məlumatları üçün utilitlər.' },
};

const rawTools = [
  define('pdf-merger', 'PDF birləşdirici', 'Bir neçə PDF faylını tək sənəddə birləşdir.', 'pdf', 'PDF', 'pdf', ['merge', 'birləşdir', 'fayl'], true),
  define('pdf-organizer', 'PDF təşkilatçısı', 'Səhifələri böl, seçilmiş qaydada çıxar və ya sənəddən sil.', 'pdf', 'ORG', 'pdf-organizer', ['pdf', 'split', 'extract', 'delete', 'böl', 'çıxar', 'sil', 'səhifə', 'təşkil et'], true, { modes: ['split', 'extract', 'delete'], defaultMode: 'split' }),
  define('image-to-pdf', 'Şəkildən PDF', 'JPG, PNG və WebP şəkillərini bir PDF sənədinə çevir.', 'pdf', 'IMG', 'image-pdf', ['image', 'jpg', 'png', 'webp', 'pdf']),
  define('pdf-metadata-remover', 'PDF metadata təmizləyici', 'Sənədin müəllif və başlıq məlumatlarını təmizlə.', 'pdf', 'META', 'pdf-clean', ['metadata', 'privacy', 'məxfilik']),

  define('image-resizer', 'Şəkil ölçü dəyişdirici', 'Şəkli dəqiq piksel ölçüsünə gətir.', 'image', 'SIZE', 'image', ['resize', 'ölçü', 'png', 'jpg'], true),
  define('image-compressor', 'Şəkil sıxışdırıcı', 'Formatı qoruyaraq mümkün olduqda fayl ölçüsünü azalt.', 'image', 'ZIP', 'image-compress', ['compress', 'sıx', 'quality'], true),
  define('image-converter', 'Şəkil format çevirici', 'PNG, JPG və WebP arasında çevirmə et.', 'image', 'TYPE', 'image-convert', ['convert', 'format', 'webp']),
  define('image-cropper', 'Şəkil kəsici', 'Şəkli mərkəzdən istədiyin ölçüyə kəs.', 'image', 'CROP', 'image-crop', ['crop', 'kəs', 'şəkil']),
  define('image-rotator', 'Şəkil döndürücü', 'Şəkli 90°, 180° və ya 270° döndər.', 'image', 'TURN', 'image-rotate', ['rotate', 'döndür']),
  define('grayscale-image', 'Qara-ağ şəkil', 'Şəkli təmiz qara-ağ versiyaya çevir.', 'image', 'B&W', 'image-gray', ['grayscale', 'qara ağ']),
  define('image-metadata-remover', 'Şəkil metadata təmizləyici', 'Şəkli yenidən kodlayaraq metadata izlərini sil.', 'image', 'META', 'image-clean', ['exif', 'metadata', 'privacy']),

  define('text-counter', 'Söz sayacı', 'Söz, simvol, cümlə və sətir sayını canlı hesabla.', 'text', 'COUNT', 'text', ['söz', 'simvol', 'say'], true),
  define('case-converter', 'Böyük/kiçik hərf', 'Mətni böyük, kiçik və başlıq formatına çevir.', 'text', 'Aa', 'text-case', ['uppercase', 'lowercase', 'hərf'], true),
  define('text-cleanup-workspace', 'Mətn təmizləmə iş sahəsi', 'Sətirləri sırala, təkrarları sil və boşluqları ardıcıl əməliyyatlarla təmizlə.', 'text', 'CLEAN', 'text-cleanup-workspace', ['sort', 'sıra', 'sətir', 'duplicate', 'təkrar', 'unikal', 'space', 'boşluq', 'trim', 'təmizlə'], false, { modes: ['sort', 'deduplicate', 'whitespace'], defaultMode: 'sort' }),
  define('text-compare', 'Mətn müqayisəsi', 'İki mətnin fərqli sətirlərini sadə şəkildə gör.', 'text', 'DIFF', 'text-diff', ['diff', 'compare', 'müqayisə']),

  define('json-formatter', 'JSON formatter', 'JSON məlumatını yoxla, formatla və ya minify et.', 'developer', '{}', 'json', ['json', 'format', 'validate'], true),
  define('base64-encoder', 'Base64 kodlayıcı', 'Mətni Base64 formatına çevir və geri aç.', 'developer', '64', 'base64', ['base64', 'encode', 'decode']),
  define('url-encoder', 'URL kodlayıcı', 'URL mətnini təhlükəsiz kodla və decode et.', 'developer', '%', 'url-codec', ['url', 'encode', 'decode']),
  define('jwt-decoder', 'JWT decoder', 'JWT header və payload hissəsini lokal oxu.', 'developer', 'JWT', 'jwt', ['jwt', 'token', 'decode']),
  define('hash-generator', 'Hash yaradan', 'Mətn üçün SHA-256 və SHA-512 hash yarat.', 'developer', '#', 'hash', ['sha', 'hash', 'crypto']),
  define('id-token-studio', 'ID və token studiyası', 'UUID v4 identifikatorları və kriptoqrafik təhlükəsiz tokenlər yarat.', 'developer', 'ID+', 'id-token-studio', ['uuid', 'guid', 'id', 'token', 'random', 'crypto', 'base64url', 'hex'], false, { modes: ['uuid', 'token'], defaultMode: 'uuid' }),
  define('timestamp-converter', 'Timestamp çevirici', 'Unix timestamp və tarixi qarşılıqlı çevir.', 'developer', 'TIME', 'timestamp', ['unix', 'timestamp', 'date']),
  define('regex-tester', 'Regex tester', 'Regular expression nümunəsini mətn üzərində sına.', 'developer', '.*', 'regex', ['regex', 'regexp', 'test']),

  define('percentage-calculator', 'Faiz kalkulyatoru', 'Ədədin faizini və faiz dəyişimini hesabla.', 'business', '%', 'percentage', ['faiz', 'percent', 'hesabla'], true),
  define('vat-calculator', 'ƏDV kalkulyatoru', 'Məbləğə ƏDV əlavə et və ya daxilindən ayır.', 'business', 'ƏDV', 'vat', ['vergi', 'edv', 'vat']),
  define('unit-converter', 'Vahid çevirici', 'Uzunluq vahidlərini sürətli çevir.', 'business', '↔', 'unit', ['metr', 'km', 'inch', 'convert']),
  define('loan-calculator', 'Kredit kalkulyatoru', 'Aylıq ödənişi və ümumi faizi hesabla.', 'business', '₼', 'loan', ['kredit', 'loan', 'faiz']),
  define('qr-generator', 'QR kod yaradan', 'Link və ya mətn üçün lokal QR kod yarat.', 'business', 'QR', 'qr', ['qr', 'link', 'generator'], true),

  define('password-generator', 'Parol generatoru', 'Güclü və təsadüfi parolları cihazında yarat.', 'security', 'KEY', 'password', ['parol', 'password', 'generator'], true),
  define('password-strength', 'Parol gücü yoxlayıcı', 'Parolun gücünü və təxmini təhlükəsizlik səviyyəsini ölç.', 'security', 'SAFE', 'password-check', ['parol', 'strength', 'təhlükəsizlik']),

  define('az-iban-validator', 'AZ IBAN yoxlayıcı', 'Azərbaycan IBAN nömrəsinin quruluşunu və checksum-ını yoxla.', 'az', 'IBAN', 'iban', ['iban', 'bank', 'azərbaycan'], true),
  define('az-transliterator', 'Latın/Kiril çevirici', 'Azərbaycan mətnini latın və kiril yazıları arasında çevir.', 'az', 'AZ', 'transliterate', ['latın', 'kiril', 'azərbaycan']),
];

export const tools = rawTools.map((tool) => ({
  ...tool,
  categoryName: categoryMeta[tool.category].name,
}));

const legacyRoutes = Object.freeze([
  {
    id: 'pdf-splitter', slug: 'pdf-splitter', name: 'PDF bölücü', lifecycle: 'replaced',
    destination: 'pdf-organizer', mode: 'split', indexable: false, sitemap: false,
    searchTerms: ['PDF splitter', 'PDF split', 'PDF böl', 'səhifələri ayır', 'səhifələri ayrıca PDF et'],
  },
  {
    id: 'pdf-page-remover', slug: 'pdf-page-remover', name: 'PDF səhifə silici', lifecycle: 'replaced',
    destination: 'pdf-organizer', mode: 'delete', indexable: false, sitemap: false,
    searchTerms: ['PDF page remover', 'PDF səhifə sil', 'səhifələri sil', 'PDF-dən səhifə çıxar'],
  },
  {
    id: 'pdf-page-extractor', slug: 'pdf-page-extractor', name: 'PDF səhifə çıxarıcı', lifecycle: 'replaced',
    destination: 'pdf-organizer', mode: 'extract', indexable: false, sitemap: false,
    searchTerms: ['PDF page extractor', 'PDF extract', 'PDF səhifə çıxar', 'seçilmiş səhifələrdən PDF yarat'],
  },
  {
    id: 'line-sorter', slug: 'line-sorter', name: 'Sətir sıralayıcı', lifecycle: 'replaced',
    destination: 'text-cleanup-workspace', mode: 'sort', indexable: false, sitemap: false,
    searchTerms: ['Line sorter', 'Sort lines', 'Sətirləri sırala', 'əlifba sırası'],
  },
  {
    id: 'duplicate-line-remover', slug: 'duplicate-line-remover', name: 'Təkrarlanan sətirləri sil', lifecycle: 'replaced',
    destination: 'text-cleanup-workspace', mode: 'deduplicate', indexable: false, sitemap: false,
    searchTerms: ['Duplicate line remover', 'Remove duplicate lines', 'Təkrar sətirləri sil', 'unikal sətirlər'],
  },
  {
    id: 'whitespace-cleaner', slug: 'whitespace-cleaner', name: 'Boşluq təmizləyici', lifecycle: 'replaced',
    destination: 'text-cleanup-workspace', mode: 'whitespace', indexable: false, sitemap: false,
    searchTerms: ['Whitespace cleaner', 'Clean whitespace', 'Boş sətirləri sil', 'Artıq boşluqları təmizlə'],
  },
  {
    id: 'uuid-generator', slug: 'uuid-generator', name: 'UUID yaradan', lifecycle: 'replaced',
    destination: 'id-token-studio', mode: 'uuid', indexable: false, sitemap: false,
    searchTerms: ['UUID generator', 'GUID generator', 'UUID v4 yarat', 'ID yarat'],
  },
  {
    id: 'secure-token-generator', slug: 'secure-token-generator', name: 'Təhlükəsiz token yaradan', lifecycle: 'replaced',
    destination: 'id-token-studio', mode: 'token', indexable: false, sitemap: false,
    searchTerms: ['Secure token generator', 'Random token', 'Kriptoqrafik token yarat', 'Base64URL token', 'hex token'],
  },
  {
    id: 'slug-generator', slug: 'slug-generator', name: 'Slug yaradan', lifecycle: 'removed',
    indexable: false, sitemap: false, reason: 'Bu alət AzToolBox kataloqundan çıxarılıb.',
  },
  {
    id: 'lorem-ipsum-generator', slug: 'lorem-ipsum-generator', name: 'Lorem ipsum yaradan', lifecycle: 'removed',
    indexable: false, sitemap: false, reason: 'Bu alət AzToolBox kataloqundan çıxarılıb.',
  },
]);

export const toolLifecycle = Object.freeze([
  ...tools,
  ...legacyRoutes,
]);

const activeBySlug = new Map(tools.map((tool) => [tool.slug, tool]));
const legacyBySlug = new Map(legacyRoutes.map((route) => [route.slug, route]));
const normalizeSearch = (value) => String(value || '').trim().toLocaleLowerCase('az');

export function resolveToolRoute(slug, requestedMode = null) {
  if (typeof slug !== 'string' || !slug) return { status: 'not-found' };
  const active = activeBySlug.get(slug);
  if (active) {
    const hasModes = Array.isArray(active.modes) && active.modes.length > 0;
    if (!hasModes && requestedMode) return { status: 'invalid' };
    const mode = hasModes ? (requestedMode || active.defaultMode) : null;
    if (hasModes && !active.modes.includes(mode)) return { status: 'invalid' };
    return { status: 'active', tool: active, canonicalSlug: active.slug, mode };
  }
  const legacy = legacyBySlug.get(slug);
  if (!legacy) return { status: 'not-found' };
  if (legacy.lifecycle === 'removed') return { status: 'removed', route: legacy };
  if (legacy.lifecycle !== 'replaced' || requestedMode) return { status: 'invalid' };
  const destination = activeBySlug.get(legacy.destination);
  if (!destination || !destination.modes?.includes(legacy.mode)) return { status: 'invalid' };
  return { status: 'replaced', route: legacy, tool: destination, canonicalSlug: destination.slug, mode: legacy.mode };
}

function resolveStoredReference(value) {
  if (typeof value === 'string') {
    const resolved = resolveToolRoute(value);
    return { resolved, requestedMode: null, legacyString: true };
  }
  if (!value || typeof value !== 'object' || typeof value.slug !== 'string') return { resolved: { status: 'invalid' } };
  const requestedMode = typeof value.mode === 'string' ? value.mode : null;
  return { resolved: resolveToolRoute(value.slug, requestedMode), requestedMode, legacyString: false };
}

export function migrateToolReferences(values, limit = Number.POSITIVE_INFINITY) {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const { resolved, requestedMode, legacyString } = resolveStoredReference(value);
    const canonical = resolved.status === 'active' || resolved.status === 'replaced' ? resolved.canonicalSlug : null;
    if (!canonical || result.some((entry) => entry.slug === canonical)) continue;
    const mode = resolved.status === 'replaced' ? resolved.mode : (!legacyString ? requestedMode : null);
    result.push({ slug: canonical, mode: mode || null });
    if (result.length >= limit) break;
  }
  return result;
}

export function serializeToolReferences(references) {
  return references.map((reference) => reference.mode ? { slug: reference.slug, mode: reference.mode } : reference.slug);
}

export function migrateToolSlugs(values, limit = Number.POSITIVE_INFINITY) {
  return migrateToolReferences(values, limit).map((reference) => reference.slug);
}

export function findToolSearchTargets(query, candidates = tools) {
  const needle = normalizeSearch(query);
  if (!needle) return candidates.map((tool) => ({ tool, mode: null, matchedAlias: null }));
  return candidates.flatMap((tool) => {
    const aliases = legacyRoutes.filter((route) => route.lifecycle === 'replaced' && route.destination === tool.slug);
    const matchedAlias = aliases.find((route) => [route.name, ...route.searchTerms].some((value) => normalizeSearch(value).includes(needle)));
    if (matchedAlias) return [{ tool, mode: matchedAlias.mode, matchedAlias }];
    const activeText = [tool.name, tool.description, ...tool.keywords].map(normalizeSearch).join(' ');
    return activeText.includes(needle) ? [{ tool, mode: null, matchedAlias: null }] : [];
  });
}

export const categories = Object.entries(categoryMeta).map(([id, meta]) => ({
  id,
  ...meta,
  count: tools.filter((tool) => tool.category === id).length,
}));

export const toolUrl = (base, slug, mode = null) => `${base}/tool/?slug=${encodeURIComponent(slug)}${mode ? `&mode=${encodeURIComponent(mode)}` : ''}`;
