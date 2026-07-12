const define = (slug, name, description, category, icon, kind, keywords = [], featured = false) => ({
  slug, name, description, category, icon, kind, keywords, featured,
});

export const categoryMeta = {
  pdf: { name: 'PDF alətləri', description: 'Sənədləri birləşdir, böl və təhlükəsiz emal et.' },
  image: { name: 'Şəkil alətləri', description: 'Ölçü, format və keyfiyyət işlərini brauzerdə həll et.' },
  text: { name: 'Mətn alətləri', description: 'Mətni ölç, təmizlə, müqayisə et və hazırla.' },
  developer: { name: 'Developer alətləri', description: 'Data, kod və veb utilitlərini sürətləndir.' },
  business: { name: 'Hesablama alətləri', description: 'Gündəlik faiz, vergi və maliyyə hesablamaları.' },
  security: { name: 'Təhlükəsizlik', description: 'Güclü parol və təhlükəsiz tokenlər yarat.' },
  az: { name: 'Azərbaycan dili', description: 'Yerli yazı və bank məlumatları üçün utilitlər.' },
};

const rawTools = [
  define('pdf-merger', 'PDF birləşdirici', 'Bir neçə PDF faylını tək sənəddə birləşdir.', 'pdf', 'PDF', 'pdf', ['merge', 'birləşdir', 'fayl'], true),
  define('pdf-splitter', 'PDF bölücü', 'Seçilmiş səhifələri ayrıca PDF kimi çıxar.', 'pdf', 'SPL', 'pdf-split', ['split', 'böl', 'səhifə'], true),
  define('pdf-page-remover', 'PDF səhifə silici', 'Lazımsız səhifələri sənəddən çıxar.', 'pdf', 'DEL', 'pdf-remove', ['remove', 'sil', 'səhifə']),
  define('pdf-page-extractor', 'PDF səhifə çıxarıcı', 'Lazım olan səhifələrdən yeni PDF yarat.', 'pdf', 'EXT', 'pdf-extract', ['extract', 'çıxar', 'səhifə']),
  define('image-to-pdf', 'Şəkildən PDF', 'JPG və PNG şəkillərini bir PDF sənədinə çevir.', 'pdf', 'IMG', 'image-pdf', ['image', 'jpg', 'png', 'pdf']),
  define('pdf-metadata-remover', 'PDF metadata təmizləyici', 'Sənədin müəllif və başlıq məlumatlarını təmizlə.', 'pdf', 'META', 'pdf-clean', ['metadata', 'privacy', 'məxfilik']),

  define('image-resizer', 'Şəkil ölçü dəyişdirici', 'Şəkli dəqiq piksel ölçüsünə gətir.', 'image', 'SIZE', 'image', ['resize', 'ölçü', 'png', 'jpg'], true),
  define('image-compressor', 'Şəkil sıxışdırıcı', 'Keyfiyyəti idarə edərək fayl ölçüsünü azalt.', 'image', 'ZIP', 'image-compress', ['compress', 'sıx', 'quality'], true),
  define('image-converter', 'Şəkil format çevirici', 'PNG, JPG və WebP arasında çevirmə et.', 'image', 'TYPE', 'image-convert', ['convert', 'format', 'webp']),
  define('image-cropper', 'Şəkil kəsici', 'Şəkli mərkəzdən istədiyin ölçüyə kəs.', 'image', 'CROP', 'image-crop', ['crop', 'kəs', 'şəkil']),
  define('image-rotator', 'Şəkil döndürücü', 'Şəkli 90°, 180° və ya 270° döndər.', 'image', 'TURN', 'image-rotate', ['rotate', 'döndür']),
  define('grayscale-image', 'Qara-ağ şəkil', 'Şəkli təmiz qara-ağ versiyaya çevir.', 'image', 'B&W', 'image-gray', ['grayscale', 'qara ağ']),
  define('image-metadata-remover', 'Şəkil metadata təmizləyici', 'Şəkli yenidən kodlayaraq metadata izlərini sil.', 'image', 'META', 'image-clean', ['exif', 'metadata', 'privacy']),

  define('text-counter', 'Söz sayacı', 'Söz, simvol, cümlə və sətir sayını canlı hesabla.', 'text', 'COUNT', 'text', ['söz', 'simvol', 'say'], true),
  define('case-converter', 'Böyük/kiçik hərf', 'Mətni böyük, kiçik və başlıq formatına çevir.', 'text', 'Aa', 'text-case', ['uppercase', 'lowercase', 'hərf'], true),
  define('line-sorter', 'Sətir sıralayıcı', 'Sətirləri əlifba və ya əks sıra ilə düz.', 'text', 'A↓', 'line-sort', ['sort', 'sıra', 'sətir']),
  define('duplicate-line-remover', 'Təkrarlanan sətirləri sil', 'Eyni sətirlərin yalnız bir nüsxəsini saxla.', 'text', 'UNIQ', 'line-unique', ['duplicate', 'təkrar', 'unikal']),
  define('whitespace-cleaner', 'Boşluq təmizləyici', 'Artıq boşluqları və boş sətirləri yığcamlaşdır.', 'text', 'TRIM', 'space-clean', ['space', 'boşluq', 'təmizlə']),
  define('slug-generator', 'Slug yaradan', 'Başlıqdan URL üçün oxunaqlı slug hazırla.', 'text', 'SLUG', 'slug', ['url', 'slug', 'başlıq']),
  define('lorem-ipsum-generator', 'Lorem ipsum yaradan', 'Maketlər üçün sürətli nümunə mətn yarat.', 'text', 'LOREM', 'lorem', ['lorem', 'placeholder', 'mətn']),
  define('text-compare', 'Mətn müqayisəsi', 'İki mətnin fərqli sətirlərini sadə şəkildə gör.', 'text', 'DIFF', 'text-diff', ['diff', 'compare', 'müqayisə']),

  define('json-formatter', 'JSON formatter', 'JSON məlumatını yoxla, formatla və ya minify et.', 'developer', '{}', 'json', ['json', 'format', 'validate'], true),
  define('base64-encoder', 'Base64 kodlayıcı', 'Mətni Base64 formatına çevir və geri aç.', 'developer', '64', 'base64', ['base64', 'encode', 'decode']),
  define('url-encoder', 'URL kodlayıcı', 'URL mətnini təhlükəsiz kodla və decode et.', 'developer', '%', 'url-codec', ['url', 'encode', 'decode']),
  define('jwt-decoder', 'JWT decoder', 'JWT header və payload hissəsini lokal oxu.', 'developer', 'JWT', 'jwt', ['jwt', 'token', 'decode']),
  define('hash-generator', 'Hash yaradan', 'Mətn üçün SHA-256 və SHA-512 hash yarat.', 'developer', '#', 'hash', ['sha', 'hash', 'crypto']),
  define('uuid-generator', 'UUID yaradan', 'Bir kliklə standart UUID v4 yarat.', 'developer', 'ID', 'uuid', ['uuid', 'guid', 'id']),
  define('timestamp-converter', 'Timestamp çevirici', 'Unix timestamp və tarixi qarşılıqlı çevir.', 'developer', 'TIME', 'timestamp', ['unix', 'timestamp', 'date']),
  define('regex-tester', 'Regex tester', 'Regular expression nümunəsini mətn üzərində sına.', 'developer', '.*', 'regex', ['regex', 'regexp', 'test']),

  define('percentage-calculator', 'Faiz kalkulyatoru', 'Ədədin faizini və faiz dəyişimini hesabla.', 'business', '%', 'percentage', ['faiz', 'percent', 'hesabla'], true),
  define('vat-calculator', 'ƏDV kalkulyatoru', 'Məbləğə ƏDV əlavə et və ya daxilindən ayır.', 'business', 'ƏDV', 'vat', ['vergi', 'edv', 'vat']),
  define('unit-converter', 'Vahid çevirici', 'Uzunluq vahidlərini sürətli çevir.', 'business', '↔', 'unit', ['metr', 'km', 'inch', 'convert']),
  define('loan-calculator', 'Kredit kalkulyatoru', 'Aylıq ödənişi və ümumi faizi hesabla.', 'business', '₼', 'loan', ['kredit', 'loan', 'faiz']),
  define('qr-generator', 'QR kod yaradan', 'Link və ya mətn üçün lokal QR kod yarat.', 'business', 'QR', 'qr', ['qr', 'link', 'generator'], true),

  define('password-generator', 'Parol generatoru', 'Güclü və təsadüfi parolları cihazında yarat.', 'security', 'KEY', 'password', ['parol', 'password', 'generator'], true),
  define('password-strength', 'Parol gücü yoxlayıcı', 'Parolun gücünü və təxmini təhlükəsizlik səviyyəsini ölç.', 'security', 'SAFE', 'password-check', ['parol', 'strength', 'təhlükəsizlik']),
  define('secure-token-generator', 'Təhlükəsiz token yaradan', 'Kriptoqrafik təsadüfi tokenlər yarat.', 'security', 'TOKEN', 'token', ['token', 'random', 'crypto']),

  define('az-iban-validator', 'AZ IBAN yoxlayıcı', 'Azərbaycan IBAN nömrəsinin quruluşunu və checksum-ını yoxla.', 'az', 'IBAN', 'iban', ['iban', 'bank', 'azərbaycan'], true),
  define('az-transliterator', 'Latın/Kiril çevirici', 'Azərbaycan mətnini latın və kiril yazıları arasında çevir.', 'az', 'AZ', 'transliterate', ['latın', 'kiril', 'azərbaycan']),
];

export const tools = rawTools.map((tool) => ({
  ...tool,
  categoryName: categoryMeta[tool.category].name,
}));

export const categories = Object.entries(categoryMeta).map(([id, meta]) => ({
  id,
  ...meta,
  count: tools.filter((tool) => tool.category === id).length,
}));

export const toolUrl = (base, slug) => `${base}/tool/?slug=${encodeURIComponent(slug)}`;
