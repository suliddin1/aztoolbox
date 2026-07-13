import { cleanPdfMetadata } from './pdf-tools.js';
import {
  assessPasswordStrength,
  transliterateAzerbaijani,
  validateAzIban,
} from './batch2-tools.js';
import {
  calculateLoan,
  calculatePercentage,
  calculateVat,
  convertLength,
  dateToTimestamp,
  runRegexSafely,
  timestampToDate,
} from './batch3-tools.js';
import { createStoredZip, imageExtension, imageOutputType } from './batch4-tools.js';
import {
  LIMITS,
  ToolInputError,
  formatBytes,
  inspectImageFile,
  parsePageSelection,
  validateFileSet,
  validateGeneratedSize,
  validateImageDimensions,
  validatePdfPageCount,
  validateTextLength,
} from './tool-guards.js';

const inputPanel = (body, actions = '') => `<div class="workspace-panel"><h2>Giriş</h2>${body}${actions ? `<div class="workspace-actions">${actions}</div>` : ''}<div class="processing-status" data-processing-status aria-live="polite" hidden></div></div>`;
const resultPanel = () => `<section class="workspace-panel result-panel" aria-live="polite"><h2>Nəticə</h2><div class="result-empty" data-empty><div><strong>Nəticə burada görünəcək</strong><span>Məlumatı daxil edib əməliyyatı başladın.</span></div></div><div class="result-output" data-output hidden></div></section>`;
const upload = (accept, multiple, label, hint, attr) => `<label class="upload-zone" data-drop-zone><input type="file" accept="${accept}" ${multiple ? 'multiple' : ''} ${attr} /><div><span class="tool-icon">＋</span><strong>${label}</strong><p>${hint}</p><span class="button button-secondary">Fayl seç</span></div></label><div class="selected-files" data-selected-files></div><p class="privacy-note"><span aria-hidden="true">⌁</span>Fayl bu brauzerdə emal olunur və serverə göndərilmir.</p>`;
const textArea = (label = 'Mətn', attr = 'data-simple-input', placeholder = 'Mətni buraya yazın...') => `<div class="field"><label>${label}</label><textarea class="textarea" maxlength="${LIMITS.textChars}" ${attr} placeholder="${placeholder}"></textarea></div>`;
const actions = (primary, attr, secondary = '') => `<button class="button button-primary" type="button" ${attr}>${primary}</button>${secondary}<button class="button button-ghost" type="button" data-reset>Sıfırla</button>`;

const imageKinds = new Set(['image-compress', 'image-convert', 'image-crop', 'image-rotate', 'image-gray', 'image-clean']);
const pdfKinds = new Set(['pdf-clean']);
const transformKinds = new Set(['text-case', 'line-sort', 'line-unique', 'space-clean']);

const pdfOrganizerModes = Object.freeze({
  split: {
    label: 'Böl', action: 'PDF-ləri ZIP-də yarat',
    hint: 'Sıra və təkrarlar saxlanılır; hər seçim ayrıca bir səhifəlik PDF olur.',
  },
  extract: {
    label: 'Çıxar', action: 'Seçilmiş səhifələrdən PDF yarat',
    hint: 'Sıra və təkrarlar yazdığınız kimi saxlanılır və bir PDF-də birləşdirilir.',
  },
  delete: {
    label: 'Sil', action: 'Seçilmiş səhifələri sil',
    hint: 'Təkrar nömrələr bir dəfə sayılır; qalan səhifələrin ilkin sırası saxlanılır.',
  },
});

const PDF_THUMBNAIL_LIMIT = 48;
const PDF_THUMBNAIL_CONCURRENCY = 2;
const PDF_THUMBNAIL_PIXEL_BUDGET = 8_000_000;
let pdfThumbnailEnginePromise;

function loadPdfThumbnailEngine() {
  if (!pdfThumbnailEnginePromise) {
    const moduleUrl = new URL('../vendor/pdfjs-6.1.200.min.js', import.meta.url);
    pdfThumbnailEnginePromise = import(moduleUrl.href).then((engine) => {
      engine.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs-6.1.200.worker.min.js', import.meta.url).href;
      return engine;
    });
  }
  return pdfThumbnailEnginePromise;
}

export function simpleToolWorkspace(tool) {
  if (tool.kind === 'pdf-organizer') {
    const mode = pdfOrganizerModes[tool.mode] ? tool.mode : 'split';
    const current = pdfOrganizerModes[mode];
    const modeLinks = Object.entries(pdfOrganizerModes).map(([value, details]) => `<a class="mode-tab" href="?slug=pdf-organizer&amp;mode=${value}" ${value === mode ? 'aria-current="page"' : ''}>${details.label}</a>`).join('');
    const body = `<nav class="mode-tabs" aria-label="PDF əməliyyatı">${modeLinks}</nav>
      ${upload('application/pdf', false, 'PDF faylını seçin', 'Fayl cihazınızda emal olunur · maksimum 500 səhifə', 'data-simple-file')}
      <div class="organizer-summary" data-organizer-summary hidden aria-live="polite"><span><strong data-page-count>0</strong> səhifə</span><span><strong data-selected-count>0</strong> seçilib</span><span data-thumbnail-status>Nömrəli önizləmə</span></div>
      <div class="field"><label for="page-list">Səhifələr</label><input class="input" id="page-list" maxlength="${LIMITS.pageExpressionChars}" data-page-list aria-describedby="page-list-hint page-list-error" placeholder="Məsələn: 3, 1, 3 və ya 2-5" /><span class="field-hint" id="page-list-hint">${current.hint}</span><span class="field-error" id="page-list-error" data-page-error role="alert" hidden></span></div>
      <div class="page-selection-head"><strong>Səhifə seçimi</strong><div><button class="button button-secondary" type="button" data-select-all disabled>Hamısını seç</button><button class="button button-secondary" type="button" data-clear-pages disabled>Seçimi təmizlə</button></div></div>
      <div class="pdf-page-grid" data-page-grid aria-label="PDF səhifələri"><p class="field-hint">Fayl seçdikdən sonra səhifələr burada görünəcək.</p></div>
      <p class="privacy-note"><span aria-hidden="true">⌁</span>PDF və yaradılan nəticələr yalnız bu brauzerdə emal olunur. Miniatürlər yalnız bu alətdə, fayl seçildikdən sonra və məhdud növbə ilə hazırlanır.</p>`;
    return `${inputPanel(body, `<button class="button button-primary" type="button" data-simple-run disabled>${current.action}</button><button class="button button-ghost" type="button" data-reset>Sıfırla</button>`)}${resultPanel()}`;
  }
  if (pdfKinds.has(tool.kind)) {
    const privacy = '<p class="privacy-note"><span aria-hidden="true">⌁</span>Müəllif, proqram, tarix və digər sənəd məlumatları silinəcək; səhifədə görünən mətn dəyişməyəcək.</p>';
    return `${inputPanel(`${upload('application/pdf', false, 'PDF faylını seçin', 'Fayl cihazınızda emal olunur', 'data-simple-file')}${privacy}`, actions('Metadata-nı təmizlə', 'data-simple-run'))}${resultPanel()}`;
  }
  if (tool.kind === 'image-pdf') return `${inputPanel(upload('image/png,image/jpeg,image/webp', true, 'Şəkilləri seçin', 'PNG, JPG və WebP · bir neçə fayl seçilə bilər', 'data-simple-files'), actions('PDF yarat', 'data-simple-run'))}${resultPanel()}`;
  if (imageKinds.has(tool.kind)) {
    let options = '';
    if (tool.kind === 'image-compress') options = '<div class="field"><label>Keyfiyyət: <span data-quality-label>80%</span></label><input type="range" min="20" max="95" value="80" data-quality /><span class="field-hint">PNG şəffaf və itkisiz saxlanır; keyfiyyət seçimi JPG və WebP-yə tətbiq olunur.</span></div>';
    if (tool.kind === 'image-convert') options = '<div class="field"><label>Çıxış formatı</label><select class="select" data-format><option value="image/webp">WebP</option><option value="image/png">PNG</option><option value="image/jpeg">JPG</option></select></div>';
    if (tool.kind === 'image-crop') options = '<div class="check-row"><div class="field"><label>En</label><input class="input" type="number" min="1" data-crop-width /></div><div class="field"><label>Hündürlük</label><input class="input" type="number" min="1" data-crop-height /></div></div>';
    if (tool.kind === 'image-rotate') options = '<div class="field"><label>Döndərmə</label><select class="select" data-angle><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></div>';
    const formatNote = tool.kind === 'image-convert' ? 'Çıxış seçdiyiniz formatda yaradılır.' : 'Statik PNG, JPG və WebP çıxışında mənbə formatı saxlanılır.';
    return `${inputPanel(`${upload('image/png,image/jpeg,image/webp', false, 'Şəkli seçin', 'PNG, JPG və WebP', 'data-simple-file')}${options}<p class="privacy-note"><span aria-hidden="true">⌁</span>${formatNote} Animasiyalı girişlər rədd edilir.</p>`, actions('Şəkli hazırla', 'data-simple-run'))}${resultPanel()}`;
  }
  if (transformKinds.has(tool.kind)) {
    const options = tool.kind === 'text-case' ? '<div class="field"><label>Çevirmə</label><select class="select" data-mode><option value="upper">BÖYÜK HƏRF</option><option value="lower">kiçik hərf</option><option value="title">Başlıq Forması</option><option value="sentence">Cümlə forması</option></select></div>' : tool.kind === 'line-sort' ? '<div class="field"><label>Sıra</label><select class="select" data-mode><option value="asc">A → Z</option><option value="desc">Z → A</option></select></div>' : '';
    return `${inputPanel(`${textArea()}${options}`, actions('Emal et', 'data-simple-run'))}${resultPanel()}`;
  }
  if (tool.kind === 'text-diff') return `${inputPanel(`${textArea('Birinci mətn', 'data-left')}${textArea('İkinci mətn', 'data-right')}`, actions('Müqayisə et', 'data-simple-run'))}${resultPanel()}`;
  if (['base64','url-codec'].includes(tool.kind)) return `${inputPanel(textArea(), actions('Kodla', 'data-encode', '<button class="button button-secondary" type="button" data-decode>Geri aç</button>'))}${resultPanel()}`;
  if (tool.kind === 'jwt') return `${inputPanel(`${textArea('JWT token', 'data-simple-input', 'eyJ...')}<p class="privacy-note" role="note"><span aria-hidden="true">!</span>Bu alət tokeni yalnız oxuyur. İmza, bitmə tarixi və etibarlılıq yoxlanmır.</p>`, actions('Tokeni oxu', 'data-simple-run'))}${resultPanel()}`;
  if (tool.kind === 'hash') return `${inputPanel(`${textArea()}<div class="field"><label>Alqoritm</label><select class="select" data-algorithm><option>SHA-256</option><option>SHA-512</option></select></div>`, actions('Hash yarat', 'data-simple-run'))}${resultPanel()}`;
  if (tool.kind === 'uuid') return `${inputPanel('<div class="field"><label>Say</label><input class="input" type="number" min="1" max="50" value="5" data-count /></div>', actions('UUID yarat', 'data-simple-run'))}${resultPanel()}`;
  if (tool.kind === 'timestamp') return `${inputPanel('<div class="field"><label>Timestamp vahidi</label><select class="select" data-timestamp-unit><option value="seconds">Saniyə</option><option value="milliseconds">Millisaniyə</option></select></div><div class="field"><label>Unix timestamp</label><input class="input" inputmode="decimal" data-timestamp placeholder="1710000000" /></div><div class="field"><label>Tarix və saat</label><input class="input" type="datetime-local" step="1" data-date /><span class="field-hint">Tarix və saat cihazınızın yerli vaxt qurşağında şərh olunur.</span></div>', actions('Çevir', 'data-simple-run'))}${resultPanel()}`;
  if (tool.kind === 'regex') return `${inputPanel('<div class="check-row"><div class="field"><label>Pattern</label><input class="input code" data-pattern placeholder="\\b[A-Z]+\\b" /></div><div class="field"><label>Flag</label><input class="input code" data-flags value="gi" /></div></div>'+textArea('Test mətni'), actions('Sına', 'data-simple-run'))}${resultPanel()}`;
  if (tool.kind === 'percentage') return `${inputPanel('<div class="field"><label>Hesablama rejimi</label><select class="select" data-percentage-mode><option value="part">Ədədin faizi</option><option value="change">Faiz dəyişimi</option></select></div><div class="check-row"><div class="field"><label><span data-a-label>Ədəd</span></label><input class="input" inputmode="decimal" data-a /></div><div class="field"><label><span data-b-label>Faiz</span></label><input class="input" inputmode="decimal" data-b /></div></div>', actions('Hesabla', 'data-simple-run'))}${resultPanel()}`;
  if (tool.kind === 'vat') return `${inputPanel('<div class="check-row"><div class="field"><label>Məbləğ</label><input class="input" inputmode="decimal" data-a /></div><div class="field"><label>ƏDV faizi</label><input class="input" inputmode="decimal" value="18" data-b /></div></div><div class="field"><label>Hesablama</label><select class="select" data-mode><option value="add">ƏDV əlavə et</option><option value="extract">Məbləğin içindən ƏDV-ni ayır</option></select></div>', actions('Hesabla', 'data-simple-run'))}${resultPanel()}`;
  if (tool.kind === 'unit') return `${inputPanel('<div class="field"><label>Dəyər</label><input class="input" inputmode="decimal" data-a /></div><div class="check-row"><div class="field"><label>Buradan</label><select class="select" data-from><option value="m">metr</option><option value="km">kilometr</option><option value="cm">santimetr</option><option value="ft">fut</option><option value="in">düym</option></select></div><div class="field"><label>Buraya</label><select class="select" data-to><option value="km">kilometr</option><option value="m">metr</option><option value="cm">santimetr</option><option value="ft">fut</option><option value="in">düym</option></select></div></div>', actions('Çevir', 'data-simple-run'))}${resultPanel()}`;
  if (tool.kind === 'loan') return `${inputPanel('<div class="field"><label>Kredit məbləği</label><input class="input" inputmode="decimal" data-a /></div><div class="check-row"><div class="field"><label>İllik faiz</label><input class="input" inputmode="decimal" data-b /></div><div class="field"><label>Müddət (ay)</label><input class="input" inputmode="numeric" data-c /></div></div>', actions('Hesabla', 'data-simple-run'))}${resultPanel()}`;
  if (tool.kind === 'password-check') return `${inputPanel(`<div class="field"><label>Parol</label><input class="input" type="password" autocomplete="off" maxlength="${LIMITS.textChars}" data-simple-input /><span class="field-hint">Yoxlama lokaldır; parol cihazınızdan kənara göndərilmir.</span></div>`, actions('Gücünü yoxla', 'data-simple-run'))}${resultPanel()}`;
  if (tool.kind === 'token') return `${inputPanel('<div class="field"><label>Uzunluq (bayt)</label><input class="input" type="number" min="8" max="128" value="32" data-count /></div>', actions('Token yarat', 'data-simple-run'))}${resultPanel()}`;
  if (tool.kind === 'iban') return `${inputPanel('<div class="field"><label>AZ IBAN</label><input class="input code" data-simple-input placeholder="AZ00 XXXX ..." /></div>', actions('IBAN-ı yoxla', 'data-simple-run'))}${resultPanel()}`;
  if (tool.kind === 'transliterate') return `${inputPanel(`${textArea('Azərbaycan mətni')}<div class="field"><label>İstiqamət</label><select class="select" data-mode><option value="latin-cyr">Latın → Kiril</option><option value="cyr-latin">Kiril → Latın</option></select></div>`, actions('Çevir', 'data-simple-run'))}${resultPanel()}`;
  return null;
}

function setupFile(root, multiple = false, onChange = () => {}) {
  const input = root.querySelector(multiple ? '[data-simple-files]' : '[data-simple-file]');
  const list = root.querySelector('[data-selected-files]');
  let files = [];
  const set = (incoming) => {
    files = [...(incoming instanceof FileList ? incoming : [incoming])].filter(Boolean);
    list.innerHTML = files.map((file) => `<div class="file-row"><span>${escapeMarkup(file.name)}</span><span>${(file.size / 1024).toFixed(0)} KB</span></div>`).join('');
    onChange();
  };
  input.addEventListener('change', () => set(input.files));
  const zone = input.closest('[data-drop-zone]');
  ['dragenter','dragover'].forEach((type) => zone.addEventListener(type, (event) => { event.preventDefault(); zone.classList.add('dragging'); }));
  ['dragleave','drop'].forEach((type) => zone.addEventListener(type, (event) => { event.preventDefault(); zone.classList.remove('dragging'); }));
  zone.addEventListener('drop', (event) => set(multiple ? event.dataTransfer.files : event.dataTransfer.files[0]));
  return () => files;
}

function escapeMarkup(value) {
  return String(value).replace(/[&<>'"]/gu, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function setBusy(button, status, message = '') {
  const busy = Boolean(message);
  button.disabled = busy;
  button.toggleAttribute('aria-busy', busy);
  status.hidden = !busy;
  status.textContent = message;
}

function resultText(ctx, value, label = 'Nəticə') {
  ctx.showResult(`<div class="field"><label>${label}</label><button class="button button-secondary" type="button" data-copy-simple>Kopyala</button><pre class="output-code">${ctx.escapeHtml(value)}</pre></div>`, 'success');
  document.querySelector('[data-copy-simple]').onclick = (event) => ctx.copyText(value, event.currentTarget);
}

async function imageFrom(file, sourceInfo) {
  const source = sourceInfo && file.type !== sourceInfo.type ? new Blob([await file.arrayBuffer()], { type: sourceInfo.type }) : file;
  const url = URL.createObjectURL(source); const image = new Image();
  try {
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function inspectImageForPdf(file) {
  const header = new Uint8Array(await file.slice(0, 6).arrayBuffer());
  const gif = header.length === 6 && header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46
    && header[3] === 0x38 && (header[4] === 0x37 || header[4] === 0x39) && header[5] === 0x61;
  if (gif) throw new ToolInputError('Bu alət animasiyanı saxlamır. Statik PNG, JPG və ya WebP seçin.');
  const info = await inspectImageFile(file);
  if (info.animated) throw new ToolInputError('Bu alət animasiyanı saxlamır. Statik PNG, JPG və ya WebP seçin.');
  return info;
}

async function rasterizeImageForPdf(file, sourceInfo) {
  const decodeSource = file.type === sourceInfo.type ? file : new Blob([await file.arrayBuffer()], { type: sourceInfo.type });
  const image = await imageFrom(decodeSource);
  const dimensions = validateImageDimensions(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width; canvas.height = dimensions.height;
  const context = canvas.getContext('2d');
  if (!context) throw new ToolInputError('Brauzer şəkli PDF üçün hazırlaya bilmədi.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob?.size || blob.type !== 'image/png') throw new ToolInputError('Brauzer şəkli PDF üçün hazırlaya bilmədi.');
  validateGeneratedSize(blob.size, LIMITS.imageFileBytes, 'Şəkil rasteri');
  return { bytes: await blob.arrayBuffer(), ...dimensions };
}

const userMessage = (error, fallback) => error instanceof ToolInputError ? error.message : fallback;
const formatNumber = (value, maximumFractionDigits = 12) => value.toLocaleString('az-AZ', { maximumFractionDigits });
const formatMoney = (value) => value.toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function initSimpleTool(tool, ctx) {
  if (!simpleToolWorkspace(tool)) return false;
  const root = document;
  root.querySelectorAll('.workspace .field').forEach((field, index) => {
    const label = field.querySelector('label');
    const control = field.querySelector('input, textarea, select');
    if (label && control && !control.id) {
      control.id = `tool-field-${index + 1}`;
      label.htmlFor = control.id;
    }
  });
  const reset = root.querySelector('[data-reset]');
  if (reset) reset.onclick = () => location.reload();
  root.querySelectorAll('[data-simple-run], [data-encode], [data-decode]').forEach((button) => {
    button.addEventListener('click', (event) => {
      try {
        root.querySelectorAll('.workspace textarea, .workspace input:not([type]), .workspace input[type="text"], .workspace input[type="search"], .workspace input[type="password"]').forEach((control) => {
          const limit = tool.kind === 'regex' && control.matches('[data-pattern]') ? LIMITS.regexPatternChars
            : tool.kind === 'regex' && control.matches('[data-simple-input]') ? LIMITS.regexTextChars
              : LIMITS.textChars;
          validateTextLength(control.value, limit);
        });
      } catch (error) {
        event.stopImmediatePropagation();
        ctx.clearResult();
        ctx.showResult('', userMessage(error, 'Giriş emal edilə bilmədi.'));
      }
    }, true);
  });

  if (tool.kind === 'pdf-organizer') {
    const mode = pdfOrganizerModes[tool.mode] ? tool.mode : 'split';
    const pageInput = root.querySelector('[data-page-list]');
    const pageError = root.querySelector('[data-page-error]');
    const pageGrid = root.querySelector('[data-page-grid]');
    const pageCountOutput = root.querySelector('[data-page-count]');
    const selectedCountOutput = root.querySelector('[data-selected-count]');
    const summary = root.querySelector('[data-organizer-summary]');
    const thumbnailStatus = root.querySelector('[data-thumbnail-status]');
    const selectAll = root.querySelector('[data-select-all]');
    const clearPages = root.querySelector('[data-clear-pages]');
    const button = root.querySelector('[data-simple-run]');
    const status = root.querySelector('[data-processing-status]');
    let source = null;
    let sourceBytes = null;
    let file = null;
    let pageCount = 0;
    let thumbnailGeneration = 0;
    let thumbnailLoadingTask = null;
    let thumbnailDocument = null;
    const thumbnailRenderTasks = new Set();

    const clearPageError = () => {
      pageError.hidden = true;
      pageError.textContent = '';
      pageInput.removeAttribute('aria-invalid');
    };
    const setPageError = (message) => {
      pageError.textContent = message;
      pageError.hidden = false;
      pageInput.setAttribute('aria-invalid', 'true');
    };
    const parseSelected = () => parsePageSelection(pageInput.value, pageCount, {
      preserveOrder: mode !== 'delete',
      allowDuplicates: mode !== 'delete',
    });
    const syncSelection = () => {
      clearPageError();
      if (!source || !pageCount) {
        selectedCountOutput.textContent = '0';
        pageGrid.querySelectorAll('input').forEach((control) => { control.checked = false; });
        button.disabled = true;
        return [];
      }
      if (!pageInput.value.trim()) {
        selectedCountOutput.textContent = '0';
        pageGrid.querySelectorAll('input').forEach((control) => { control.checked = false; });
        button.disabled = false;
        return [];
      }
      try {
        const selected = parseSelected();
        const selectedSet = new Set(selected);
        selectedCountOutput.textContent = String(selected.length);
        pageGrid.querySelectorAll('[data-page-index]').forEach((control) => { control.checked = selectedSet.has(Number(control.dataset.pageIndex)); });
        button.disabled = false;
        return selected;
      } catch (error) {
        selectedCountOutput.textContent = '0';
        pageGrid.querySelectorAll('input').forEach((control) => { control.checked = false; });
        button.disabled = false;
        setPageError(userMessage(error, 'Səhifə seçimi düzgün deyil.'));
        return [];
      }
    };
    const renderPages = () => {
      pageGrid.innerHTML = Array.from({ length: pageCount }, (_, index) => `<label class="pdf-page-card"><input type="checkbox" data-page-index="${index}" /><span class="pdf-page-sheet" aria-hidden="true"><b>${index + 1}</b><canvas data-page-thumbnail="${index}" hidden></canvas></span><span>Səhifə ${index + 1}</span></label>`).join('');
    };
    const stopThumbnails = () => {
      thumbnailGeneration += 1;
      thumbnailRenderTasks.forEach((task) => { try { task.cancel(); } catch {} });
      thumbnailRenderTasks.clear();
      const loadingTask = thumbnailLoadingTask;
      const document = thumbnailDocument;
      thumbnailLoadingTask = null; thumbnailDocument = null;
      if (document) void document.destroy().catch(() => {});
      else if (loadingTask) void loadingTask.destroy().catch(() => {});
    };
    const renderThumbnails = async (bytes) => {
      const generation = thumbnailGeneration;
      let rendered = 0;
      let pixelBudget = 0;
      thumbnailStatus.textContent = 'Miniatürlər hazırlanır…';
      try {
        const engine = await loadPdfThumbnailEngine();
        if (generation !== thumbnailGeneration) return;
        const loadingTask = engine.getDocument({ data: new Uint8Array(bytes.slice(0)), useWasm: false });
        thumbnailLoadingTask = loadingTask;
        const document = await loadingTask.promise;
        if (generation !== thumbnailGeneration) { await document.destroy(); return; }
        thumbnailDocument = document;
        if (document.numPages !== pageCount) throw new ToolInputError('PDF səhifə önizləməsi uyğun gəlmədi.');
        const limit = Math.min(pageCount, PDF_THUMBNAIL_LIMIT);
        let nextPage = 1;
        const worker = async () => {
          while (generation === thumbnailGeneration) {
            const pageNumber = nextPage;
            nextPage += 1;
            if (pageNumber > limit) return;
            const page = await document.getPage(pageNumber);
            if (generation !== thumbnailGeneration) { page.cleanup(); return; }
            const original = page.getViewport({ scale: 1 });
            const scale = Math.min(1, 112 / original.width, 132 / original.height);
            const viewport = page.getViewport({ scale });
            const pixels = Math.ceil(viewport.width) * Math.ceil(viewport.height);
            if (pixelBudget + pixels > PDF_THUMBNAIL_PIXEL_BUDGET) { page.cleanup(); return; }
            pixelBudget += pixels;
            const canvas = pageGrid.querySelector(`[data-page-thumbnail="${pageNumber - 1}"]`);
            const context = canvas?.getContext('2d', { alpha: false });
            if (!canvas || !context) { page.cleanup(); continue; }
            canvas.width = Math.max(1, Math.ceil(viewport.width));
            canvas.height = Math.max(1, Math.ceil(viewport.height));
            const renderTask = page.render({ canvasContext: context, viewport });
            thumbnailRenderTasks.add(renderTask);
            try { await renderTask.promise; }
            catch (error) { if (error?.name !== 'RenderingCancelledException') throw error; }
            finally { thumbnailRenderTasks.delete(renderTask); page.cleanup(); }
            if (generation !== thumbnailGeneration) return;
            canvas.hidden = false;
            canvas.closest('.pdf-page-card')?.setAttribute('data-thumbnail-ready', '');
            rendered += 1;
          }
        };
        await Promise.all(Array.from({ length: Math.min(PDF_THUMBNAIL_CONCURRENCY, limit) }, () => worker()));
        if (generation !== thumbnailGeneration) return;
        thumbnailStatus.textContent = rendered === pageCount ? `${rendered} miniatür hazırdır` : `${rendered}/${pageCount} miniatür hazırdır`;
      } catch {
        if (generation === thumbnailGeneration) thumbnailStatus.textContent = 'Nömrəli önizləmə hazırdır';
      }
    };
    const prepare = async (selectedFile) => {
      const operation = ctx.beginOperation();
      stopThumbnails();
      source = null; sourceBytes = null; file = null; pageCount = 0;
      pageInput.value = ''; clearPageError(); pageGrid.innerHTML = '<p class="field-hint">PDF səhifələri oxunur…</p>';
      summary.hidden = true; selectAll.disabled = true; clearPages.disabled = true; button.disabled = true;
      if (!selectedFile) { pageGrid.innerHTML = '<p class="field-hint">PDF faylını seçin.</p>'; return; }
      setBusy(button, status, 'PDF səhifələri oxunur…');
      try {
        validateFileSet([selectedFile], { fileBytes: LIMITS.pdfFileBytes });
        const bytes = await selectedFile.arrayBuffer();
        if (!ctx.isCurrent(operation)) return;
        const loaded = await PDFLib.PDFDocument.load(bytes, { updateMetadata: false });
        if (!ctx.isCurrent(operation)) return;
        pageCount = validatePdfPageCount(loaded.getPageCount());
        source = loaded; sourceBytes = bytes; file = selectedFile;
        pageCountOutput.textContent = String(pageCount); selectedCountOutput.textContent = '0';
        summary.hidden = false; selectAll.disabled = false; clearPages.disabled = false;
        renderPages();
        void renderThumbnails(bytes);
      } catch (error) {
        if (ctx.isCurrent(operation)) {
          pageGrid.innerHTML = '<p class="field-hint">Səhifələr göstərilə bilmədi.</p>';
          ctx.showResult('', userMessage(error, 'PDF açıla bilmədi. Fayl zədəli, şifrəli və ya dəstəklənməyən ola bilər.'));
        }
      } finally {
        if (ctx.isCurrent(operation)) { setBusy(button, status); syncSelection(); }
      }
    };
    const files = setupFile(root, false, () => prepare(files()[0]));
    addEventListener('pagehide', stopThumbnails, { once: true });

    pageInput.addEventListener('input', syncSelection);
    pageGrid.addEventListener('change', (event) => {
      const control = event.target.closest('[data-page-index]');
      if (!control || !pageCount) return;
      let selected = [];
      try { selected = parseSelected(); } catch {}
      const page = Number(control.dataset.pageIndex) + 1;
      const pages = selected.map((index) => index + 1);
      const next = control.checked ? [...pages, page] : pages.filter((value) => value !== page);
      pageInput.value = next.join(', ');
      pageInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    selectAll.onclick = () => {
      pageInput.value = `1-${pageCount}`;
      pageInput.dispatchEvent(new Event('input', { bubbles: true }));
      pageInput.focus();
    };
    clearPages.onclick = () => {
      pageInput.value = '';
      pageInput.dispatchEvent(new Event('input', { bubbles: true }));
      pageInput.focus();
    };
    button.onclick = async () => {
      if (!source || !sourceBytes || !file) return ctx.showResult('', 'PDF faylını seçin.');
      const operation = ctx.beginOperation();
      setBusy(button, status, 'PDF hazırlanır…');
      try {
        const selected = parseSelected();
        const allIndices = [...source.getPageIndices()];
        const indices = mode === 'delete' ? allIndices.filter((index) => !selected.includes(index)) : selected;
        if (!indices.length) throw new ToolInputError('Bütün səhifələri silmək olmaz. Nəticədə ən azı bir səhifə qalmalıdır.');
        if (mode === 'split') {
          const occurrences = new Map();
          const entries = [];
          for (const index of indices) {
            const output = await PDFLib.PDFDocument.create();
            const [copied] = await output.copyPages(source, [index]);
            output.addPage(copied);
            const bytes = await output.save();
            if (!ctx.isCurrent(operation)) return;
            validateGeneratedSize(bytes.length, LIMITS.pdfFileBytes, 'PDF səhifə nəticəsi');
            const occurrence = (occurrences.get(index) || 0) + 1;
            occurrences.set(index, occurrence);
            entries.push({ name: `sehife-${index + 1}${occurrence > 1 ? `-${occurrence}` : ''}.pdf`, data: bytes });
          }
          const zipBytes = createStoredZip(entries);
          validateGeneratedSize(zipBytes.length, LIMITS.totalFileBytes, 'ZIP nəticəsi');
          const blob = new Blob([zipBytes], { type: 'application/zip' });
          const baseName = file.name.replace(/\.[^.]+$/u, '') || 'sened';
          ctx.showResult(`<p>${indices.length} ayrıca PDF seçdiyiniz sırada ZIP paketində hazırdır.</p><button class="button button-primary" type="button" data-download-simple>ZIP-i endir</button>`, 'success');
          root.querySelector('[data-download-simple]').onclick = () => ctx.downloadBlob(blob, `${baseName}-sehifeler.zip`);
          return;
        }
        const output = await PDFLib.PDFDocument.create();
        const copied = await output.copyPages(source, indices);
        copied.forEach((page) => output.addPage(page));
        const outputBytes = await output.save();
        if (!ctx.isCurrent(operation)) return;
        validateGeneratedSize(outputBytes.length, LIMITS.pdfFileBytes, 'PDF nəticəsi');
        const blob = new Blob([outputBytes], { type: 'application/pdf' });
        const outputName = mode === 'extract' ? 'pdf-page-extractor.pdf' : 'pdf-page-remover.pdf';
        const message = mode === 'extract' ? `${indices.length} səhifədən bir PDF hazırdır.` : `${selected.length} səhifə silindi, ${indices.length} səhifə saxlanıldı.`;
        ctx.showResult(`<p>${message}</p><button class="button button-primary" type="button" data-download-simple>PDF-i endir</button>`, 'success');
        root.querySelector('[data-download-simple]').onclick = () => ctx.downloadBlob(blob, outputName);
      } catch (error) {
        if (ctx.isCurrent(operation)) {
          ctx.showResult('', userMessage(error, 'PDF emal edilə bilmədi. Faylın sağlam olduğunu yoxlayın.'));
          if (error instanceof ToolInputError) pageInput.focus();
        }
      } finally {
        if (ctx.isCurrent(operation)) { setBusy(button, status); syncSelection(); }
      }
    };
    return true;
  }

  if (pdfKinds.has(tool.kind)) {
    const files = setupFile(root, false, ctx.clearResult);
    const button = root.querySelector('[data-simple-run]'); const status = root.querySelector('[data-processing-status]');
    button.onclick = async () => {
      const file = files()[0]; if (!file) return ctx.showResult('', 'PDF faylını seçin.');
      const operation = ctx.beginOperation();
      setBusy(button, status, 'PDF hazırlanır…');
      try {
        validateFileSet([file], { fileBytes: LIMITS.pdfFileBytes });
        const sourceBytes = await file.arrayBuffer();
        if (!ctx.isCurrent(operation)) return;
        const cleanedBytes = await cleanPdfMetadata(PDFLib, sourceBytes);
        if (!ctx.isCurrent(operation)) return;
        validateGeneratedSize(cleanedBytes.length, LIMITS.pdfFileBytes, 'PDF nəticəsi');
        const blob = new Blob([cleanedBytes], { type: 'application/pdf' });
        ctx.showResult('<p>Metadata silindi; səhifə məzmunu dəyişdirilmədi.</p><button class="button button-primary" data-download-simple>PDF-i endir</button>', 'success');
        root.querySelector('[data-download-simple]').onclick = () => ctx.downloadBlob(blob, `${tool.slug}.pdf`);
      } catch (error) { if (ctx.isCurrent(operation)) ctx.showResult('', userMessage(error, 'PDF emal edilə bilmədi. Faylın sağlam olduğunu yoxlayın.')); }
      finally { setBusy(button, status); }
    };
    return true;
  }

  if (tool.kind === 'image-pdf') {
    const files = setupFile(root, true, ctx.clearResult);
    const button = root.querySelector('[data-simple-run]'); const status = root.querySelector('[data-processing-status]');
    button.onclick = async () => {
      const selected = files(); if (!selected.length) return ctx.showResult('', 'Ən azı bir şəkil seçin.');
      const operation = ctx.beginOperation();
      setBusy(button, status, `${selected.length} şəkil hazırlanır…`);
      try {
        validateFileSet(selected, { fileBytes: LIMITS.imageFileBytes });
        validatePdfPageCount(selected.length);
        const inspected = [];
        for (const file of selected) {
          inspected.push({ file, info: await inspectImageForPdf(file) });
          if (!ctx.isCurrent(operation)) return;
        }
        const pdf = await PDFLib.PDFDocument.create();
        for (const [index, entry] of inspected.entries()) {
          status.textContent = `${index + 1}/${selected.length} şəkil əlavə olunur`;
          const raster = await rasterizeImageForPdf(entry.file, entry.info);
          if (!ctx.isCurrent(operation)) return;
          const embedded = await pdf.embedPng(raster.bytes);
          const page = pdf.addPage([raster.width, raster.height]);
          page.drawImage(embedded, { x: 0, y: 0, width: raster.width, height: raster.height });
        }
        const outputBytes = await pdf.save();
        if (!ctx.isCurrent(operation)) return;
        validateGeneratedSize(outputBytes.length, LIMITS.pdfFileBytes, 'PDF nəticəsi');
        const blob = new Blob([outputBytes], { type:'application/pdf' });
        ctx.showResult('<p>Şəkillər PDF sənədinə çevrildi.</p><button class="button button-primary" data-download-simple>PDF-i endir</button>', 'success');
        root.querySelector('[data-download-simple]').onclick = () => ctx.downloadBlob(blob, 'sekiller.pdf');
      } catch (error) { if (ctx.isCurrent(operation)) ctx.showResult('', userMessage(error, 'Şəkillər PDF-ə çevrilə bilmədi.')); }
      finally { setBusy(button, status); }
    };
    return true;
  }

  if (imageKinds.has(tool.kind)) {
    const files = setupFile(root, false, ctx.clearResult); let outputBlob;
    const button = root.querySelector('[data-simple-run]'); const status = root.querySelector('[data-processing-status]');
    const quality = root.querySelector('[data-quality]');
    if (quality) quality.oninput = () => { root.querySelector('[data-quality-label]').textContent = `${quality.value}%`; };
    button.onclick = async () => {
      const file = files()[0]; if (!file) return ctx.showResult('', 'Şəkli seçin.');
      const operation = ctx.beginOperation();
      setBusy(button, status, 'Şəkil hazırlanır…');
      try {
        validateFileSet([file], { fileBytes: LIMITS.imageFileBytes });
        const sourceInfo = await inspectImageFile(file);
        if (!ctx.isCurrent(operation)) return;
        if (sourceInfo.animated) {
          throw new ToolInputError('Bu alət animasiyanı saxlamır. Statik PNG, JPG və ya WebP seçin.');
        }
        const image = await imageFrom(file, sourceInfo);
        if (!ctx.isCurrent(operation)) return;
        validateImageDimensions(image.naturalWidth, image.naturalHeight);
        let width = image.naturalWidth; let height = image.naturalHeight; let angle = 0;
        if (tool.kind === 'image-crop') { width = Math.min(width, Number(root.querySelector('[data-crop-width]').value) || width); height = Math.min(height, Number(root.querySelector('[data-crop-height]').value) || height); }
        if (tool.kind === 'image-rotate') { angle = Number(root.querySelector('[data-angle]').value); if (angle % 180) [width,height] = [height,width]; }
        validateImageDimensions(width, height);
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const c = canvas.getContext('2d');
        if (tool.kind === 'image-gray') c.filter = 'grayscale(1)';
        if (tool.kind === 'image-rotate') { c.translate(width/2,height/2); c.rotate(angle*Math.PI/180); c.drawImage(image,-image.naturalWidth/2,-image.naturalHeight/2); }
        else if (tool.kind === 'image-crop') { const sx=(image.naturalWidth-width)/2, sy=(image.naturalHeight-height)/2; c.drawImage(image,sx,sy,width,height,0,0,width,height); }
        else c.drawImage(image,0,0,width,height);
        const type = imageOutputType(tool.kind, sourceInfo.type, root.querySelector('[data-format]')?.value);
        const q = tool.kind === 'image-compress' ? Number(quality.value)/100 : .92;
        outputBlob = await new Promise((resolve) => canvas.toBlob(resolve,type,q));
        if (!ctx.isCurrent(operation)) return;
        if (!outputBlob?.size) throw new ToolInputError('Brauzer şəkil çıxışını yarada bilmədi.');
        if (outputBlob.size > LIMITS.imageFileBytes) throw new ToolInputError(`Nəticə ${formatBytes(LIMITS.imageFileBytes)} həddini aşır.`);
        const extension = imageExtension(type);
        const outputInfo = await inspectImageFile(new File([outputBlob], `output.${extension}`, { type: outputBlob.type }));
        if (outputInfo.type !== type) throw new ToolInputError('Brauzer seçilmiş çıxış formatını dəstəkləmir.');
        if (outputInfo.width !== width || outputInfo.height !== height) throw new ToolInputError('Şəkil çıxışının ölçüləri gözlənilən nəticəyə uyğun deyil.');
        if (!ctx.isCurrent(operation)) return;
        const url = ctx.createPreviewUrl(outputBlob);
        if (tool.kind === 'image-compress') {
          const format = sourceInfo.extension === 'jpg' ? 'JPG' : sourceInfo.extension.toUpperCase();
          const sizes = `<p>Orijinal: ${formatBytes(file.size)} · Yeni: ${formatBytes(outputBlob.size)}</p>`;
          if (outputBlob.size < file.size) {
            ctx.showResult(`<img class="image-preview" src="${url}" alt="Sıxışdırılmış şəkil" />${sizes}<p>Fayl ölçüsü ${formatBytes(file.size - outputBlob.size)} azaldı.</p><button class="button button-primary" data-download-simple>Şəkli endir</button>`, 'success');
            root.querySelector('[data-download-simple]').onclick = () => ctx.downloadBlob(outputBlob, `${tool.slug}.${sourceInfo.extension}`);
          } else {
            ctx.showResult(`<img class="image-preview" src="${url}" alt="Yeni kodlanmış şəkil" />${sizes}<div class="workspace-actions"><button class="button button-primary" data-download-original>Orijinalı saxla</button><button class="button button-secondary" data-download-simple>Yenə də ${format}-i endir</button></div>`, 'Ölçü azalmadı. Orijinal fayl əsas seçim kimi saxlanılır.');
            root.querySelector('[data-download-original]').onclick = () => ctx.downloadBlob(file, file.name);
            root.querySelector('[data-download-simple]').onclick = () => ctx.downloadBlob(outputBlob, `${tool.slug}.${sourceInfo.extension}`);
          }
        } else {
          ctx.showResult(`<img class="image-preview" src="${url}" alt="Hazır şəkil" /><p>${formatBytes(outputBlob.size)}</p><button class="button button-primary" data-download-simple>Şəkli endir</button>`, 'success');
          root.querySelector('[data-download-simple]').onclick = () => ctx.downloadBlob(outputBlob, `${tool.slug}.${extension}`);
        }
      } catch (error) { if (ctx.isCurrent(operation)) ctx.showResult('', userMessage(error, 'Şəkil emal edilə bilmədi.')); }
      finally { setBusy(button, status); }
    };
    return true;
  }

  const run = root.querySelector('[data-simple-run]');
  if (transformKinds.has(tool.kind)) run.onclick = () => {
    const input = root.querySelector('[data-simple-input]').value; let output = input;
    if (tool.kind === 'text-case') { const mode=root.querySelector('[data-mode]').value; output = mode==='upper'?input.toLocaleUpperCase('az'):mode==='lower'?input.toLocaleLowerCase('az'):mode==='title'?input.toLocaleLowerCase('az').replace(/(^|\s)\S/gu,(m)=>m.toLocaleUpperCase('az')):input.toLocaleLowerCase('az').replace(/(^\s*|[.!?]\s+)\S/gu,(m)=>m.toLocaleUpperCase('az')); }
    if (tool.kind === 'line-sort') output = input.split(/\r?\n/u).sort((a,b)=>a.localeCompare(b,'az')*(root.querySelector('[data-mode]').value==='desc'?-1:1)).join('\n');
    if (tool.kind === 'line-unique') output = [...new Set(input.split(/\r?\n/u))].join('\n');
    if (tool.kind === 'space-clean') output = input.split(/\r?\n/u).map((line)=>line.trim().replace(/\s+/gu,' ')).filter(Boolean).join('\n');
    resultText(ctx, output);
  };
  else if (tool.kind === 'text-diff') run.onclick = () => { const left=root.querySelector('[data-left]').value.split(/\r?\n/u), right=root.querySelector('[data-right]').value.split(/\r?\n/u); const out=[]; const max=Math.max(left.length,right.length); for(let i=0;i<max;i+=1){if(left[i]===right[i]) out.push(`  ${left[i]??''}`); else { if(left[i]!=null) out.push(`− ${left[i]}`); if(right[i]!=null) out.push(`+ ${right[i]}`); }} resultText(ctx,out.join('\n'),'Fərq'); };
  else if (['base64','url-codec'].includes(tool.kind)) { const input=()=>root.querySelector('[data-simple-input]').value; root.querySelector('[data-encode]').onclick=()=>{try{resultText(ctx,tool.kind==='base64'?btoa(unescape(encodeURIComponent(input()))):encodeURIComponent(input()));}catch{ctx.showResult('','Mətn kodlana bilmədi.');}}; root.querySelector('[data-decode]').onclick=()=>{try{resultText(ctx,tool.kind==='base64'?decodeURIComponent(escape(atob(input()))):decodeURIComponent(input()));}catch{ctx.showResult('','Məlumat geri açıla bilmədi.');}}; }
  else if (tool.kind === 'jwt') run.onclick = () => { try { const parts=root.querySelector('[data-simple-input]').value.split('.'); const decode=(p)=>JSON.parse(decodeURIComponent(escape(atob(p.replace(/-/gu,'+').replace(/_/gu,'/'))))); resultText(ctx,JSON.stringify({header:decode(parts[0]),payload:decode(parts[1])},null,2)); } catch { ctx.showResult('','JWT formatı düzgün deyil.'); } };
  else if (tool.kind === 'hash') run.onclick = async () => { const operation = ctx.beginOperation(); const bytes=new TextEncoder().encode(root.querySelector('[data-simple-input]').value); const hash=await crypto.subtle.digest(root.querySelector('[data-algorithm]').value,bytes); if (!ctx.isCurrent(operation)) return; resultText(ctx,[...new Uint8Array(hash)].map((b)=>b.toString(16).padStart(2,'0')).join('')); };
  else if (tool.kind === 'uuid') run.onclick = () => resultText(ctx,Array.from({length:Math.min(50,Math.max(1,Number(root.querySelector('[data-count]').value)||1))},()=>crypto.randomUUID()).join('\n'));
  else if (tool.kind === 'timestamp') run.onclick = () => {
    ctx.clearResult();
    try {
      const stamp = root.querySelector('[data-timestamp]').value.trim();
      const dateValue = root.querySelector('[data-date]').value;
      const unit = root.querySelector('[data-timestamp-unit]').value;
      if (stamp && dateValue) throw new ToolInputError('Timestamp və tarixdən yalnız birini daxil edin.');
      if (!stamp && !dateValue) throw new ToolInputError('Timestamp və ya tarix daxil edin.');
      if (stamp) {
        const date = timestampToDate(stamp, unit);
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'yerli vaxt';
        resultText(ctx, `UTC: ${date.toISOString()}\nYerli vaxt (${timezone}): ${date.toLocaleString('az-AZ', { dateStyle: 'medium', timeStyle: 'long' })}`);
      } else {
        const value = dateToTimestamp(dateValue, unit);
        const label = unit === 'seconds' ? 'Saniyə' : 'Millisaniyə';
        resultText(ctx, `${label}: ${formatNumber(value, 3)}\nQeyd: daxil edilən tarix cihazın yerli vaxt qurşağında şərh edildi.`);
      }
    } catch (error) { ctx.showResult('', userMessage(error, 'Timestamp çevrilə bilmədi.')); }
  };
  else if (tool.kind === 'regex') run.onclick = async () => {
    const operation = ctx.beginOperation();
    const status = root.querySelector('[data-processing-status]');
    setBusy(run, status, 'Regex yoxlanılır…');
    try {
      const pattern = root.querySelector('[data-pattern]').value;
      const flags = root.querySelector('[data-flags]').value.trim();
      const text = root.querySelector('[data-simple-input]').value;
      const result = await runRegexSafely(pattern, flags, text);
      if (!ctx.isCurrent(operation)) return;
      const lines = result.matches.map((match, index) => {
        const value = match.value || '∅';
        const groups = match.groups.length ? ` · qruplar: ${match.groups.map((group) => group ?? '∅').join(', ')}` : '';
        return `${index + 1}. ${value} — indeks ${match.index}${groups}`;
      });
      if (result.truncated) lines.push('Nəticə ilk 1000 uyğunluqla məhdudlaşdırıldı.');
      resultText(ctx, lines.join('\n') || 'Uyğunluq tapılmadı.');
    } catch (error) { if (ctx.isCurrent(operation)) ctx.showResult('', userMessage(error, 'Regex sintaksisini yoxlayın.')); }
    finally { setBusy(run, status); }
  };
  else if (tool.kind === 'percentage') {
    const mode = root.querySelector('[data-percentage-mode]');
    const syncLabels = () => {
      root.querySelector('[data-a-label]').textContent = mode.value === 'part' ? 'Ədəd' : 'İlkin dəyər';
      root.querySelector('[data-b-label]').textContent = mode.value === 'part' ? 'Faiz' : 'Son dəyər';
    };
    mode.onchange = syncLabels; syncLabels();
    run.onclick = () => {
      ctx.clearResult();
      try {
        const result = calculatePercentage(mode.value, root.querySelector('[data-a]').value, root.querySelector('[data-b]').value);
        if (result.mode === 'part') resultText(ctx, `${formatNumber(result.number)} ədədinin ${formatNumber(result.percent)}%-i = ${formatNumber(result.value)}`);
        else resultText(ctx, `${formatNumber(result.from)}-dən ${formatNumber(result.to)}-yə dəyişmə: ${formatNumber(Math.abs(result.value))}% ${result.direction}`);
      } catch (error) { ctx.showResult('', userMessage(error, 'Faiz hesablana bilmədi.')); }
    };
  }
  else if (tool.kind === 'vat') run.onclick = () => {
    ctx.clearResult();
    try {
      const result = calculateVat(root.querySelector('[data-a]').value, root.querySelector('[data-b]').value, root.querySelector('[data-mode]').value);
      resultText(ctx, `ƏDV: ${formatMoney(result.vat)} ₼\nYekun: ${formatMoney(result.total)} ₼`);
    } catch (error) { ctx.showResult('', userMessage(error, 'ƏDV hesablana bilmədi.')); }
  };
  else if (tool.kind === 'unit') run.onclick = () => {
    ctx.clearResult();
    try {
      const value = convertLength(root.querySelector('[data-a]').value, root.querySelector('[data-from]').value, root.querySelector('[data-to]').value);
      resultText(ctx, formatNumber(value, 8));
    } catch (error) { ctx.showResult('', userMessage(error, 'Vahid çevrilə bilmədi.')); }
  };
  else if (tool.kind === 'loan') run.onclick = () => {
    ctx.clearResult();
    try {
      const result = calculateLoan(root.querySelector('[data-a]').value, root.querySelector('[data-b]').value, root.querySelector('[data-c]').value);
      resultText(ctx, `Aylıq ödəniş: ${formatMoney(result.payment)} ₼\nÜmumi ödəniş: ${formatMoney(result.total)} ₼\nFaiz məbləği: ${formatMoney(result.interest)} ₼`);
    } catch (error) { ctx.showResult('', userMessage(error, 'Kredit hesablana bilmədi.')); }
  };
  else if (tool.kind === 'password-check') run.onclick = () => {
    const assessment = assessPasswordStrength(root.querySelector('[data-simple-input]').value);
    if (assessment.empty) { ctx.clearResult(); ctx.showResult('', 'Parolu daxil edin.'); return; }
    resultText(ctx, `Qiymətləndirmə: ${assessment.summary} — ${assessment.score}/4\nSəbəb: ${assessment.reasons.join(' ')}\nTövsiyə: ${assessment.suggestions.join(' ')}\nQeyd: Bu yalnız lokal təxmini qiymətləndirmədir və real təhlükəsizliyə zəmanət vermir.`);
  };
  else if (tool.kind === 'token') run.onclick = () => { const bytes=crypto.getRandomValues(new Uint8Array(Math.min(128,Math.max(8,Number(root.querySelector('[data-count]').value)||32)))); resultText(ctx,[...bytes].map((b)=>b.toString(16).padStart(2,'0')).join('')); };
  else if (tool.kind === 'iban') run.onclick = () => {
    const result = validateAzIban(root.querySelector('[data-simple-input]').value);
    const errors = {
      empty: 'IBAN daxil edin.',
      'country-or-length': 'AZ IBAN “AZ”, 2 yoxlama rəqəmi və 24 BBAN simvolundan ibarət olmalıdır.',
      'bank-identifier': 'AZ IBAN bank identifikatoru 4 hərfdən ibarət olmalıdır.',
      'account-structure': 'Hesab hissəsi 20 hərf və ya rəqəmdən ibarət olmalıdır.',
      checksum: 'IBAN checksum düzgün deyil.',
    };
    if (!result.valid) { ctx.clearResult(); ctx.showResult('', errors[result.reason] || 'IBAN düzgün deyil.'); return; }
    resultText(ctx, 'IBAN formatı və checksum uyğundur. Bu yoxlama bankın və hesabın mövcudluğunu təsdiqləmir.');
  };
  else if (tool.kind === 'transliterate') run.onclick = () => {
    resultText(ctx, transliterateAzerbaijani(root.querySelector('[data-simple-input]').value, root.querySelector('[data-mode]').value));
  };
  return true;
}
