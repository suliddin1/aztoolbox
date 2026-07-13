import './ambient-waves.js';
import { tools, categories, toolUrl } from './tools-data.js';
import { getBase, getFavorites, getRecent, recordRecent, toolCard, toolIcon } from './components.js';
import { simpleToolWorkspace, initSimpleTool } from './simple-tools.js';
import { initMotion } from './motion.js';
import { generateSecurePassword } from './batch2-tools.js';
import {
  LIMITS,
  ToolInputError,
  inspectImageFile,
  validateFileSet,
  validateGeneratedSize,
  validateImageDimensions,
  validatePdfPageCount,
  validateQrText,
  validateTextLength,
} from './tool-guards.js';

const base = getBase();
const page = document.body.dataset.page || 'home';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function initReveal() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { $$('.reveal').forEach((element) => element.classList.add('visible')); return; }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: .08, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((element) => observer.observe(element));
}

function renderHome() {
  const featured = $('[data-featured-tools]');
  const categoryGrid = $('[data-category-grid]');
  const descriptions = {
    pdf: 'Birləşdirin, sıxın və səhifələri idarə edin.',
    image: 'Ölçü, format və görünüşü dəyişin.',
    text: 'Mətni sayın, təmizləyin və müqayisə edin.',
    developer: 'Kod və məlumat formatlarını emal edin.',
    business: 'Gündəlik hesablamaları sürətləndirin.',
    security: 'Parol və təhlükəsizlik yoxlamaları aparın.',
    az: 'Azərbaycan dili ilə bağlı işləri həll edin.'
  };
  $('[data-total-tools]')?.replaceChildren(document.createTextNode(String(tools.length)));
  if (featured) featured.innerHTML = tools.filter((tool) => tool.featured).slice(0, 6).map((tool) => `<article class="quick-tool-card category-${tool.category}">${toolIcon(tool)}<div><strong><a href="${toolUrl(base, tool.slug)}">${tool.name}</a></strong><p>${tool.description}</p></div><span aria-hidden="true">→</span></article>`).join('');
  if (categoryGrid) categoryGrid.innerHTML = categories.map((category) => `<a class="dashboard-category-card category-${category.id}" href="${base}/tools/?category=${category.id}">${toolIcon({ category: category.id, icon: String(category.count).padStart(2,'0') })}<footer><div><strong>${category.name}</strong><p>${descriptions[category.id]}</p></div><span>${category.count} alət →</span></footer></a>`).join('');
}

function renderCatalog() {
  const grid = $('[data-tools-grid]');
  const input = $('[data-catalog-search]');
  const count = $('[data-tool-count]');
  const empty = $('[data-catalog-empty]');
  const recentSection = $('[data-recent-section]');
  const recentGrid = $('[data-recent-grid]');
  const title = $('[data-catalog-title]');
  const copy = $('[data-catalog-copy]');
  const emptyTitle = $('[data-empty-title]');
  const emptyCopy = $('[data-empty-copy]');
  const emptyAction = $('[data-empty-action]');
  const params = new URLSearchParams(location.search);
  let activeCategory = params.get('category') || 'all';
  let view = params.get('view') || 'all';
  const filters = $('[data-filter-row]');
  const syncCatalogNavigation = () => {
    $$('[data-sidebar-category]').forEach((link) => {
      if (link.dataset.sidebarCategory === activeCategory) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const url = new URL(location.href);
    url.searchParams.delete('view');
    if (activeCategory === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', activeCategory);
    history.replaceState({}, '', url);
  };
  filters.innerHTML = [{ id: 'all', name: 'Hamısı' }, ...categories].map((category) => `<button class="filter-button" type="button" data-filter="${category.id}" aria-pressed="${activeCategory === category.id}">${category.name}</button>`).join('');

  const render = (animate = false) => {
    const update = () => {
    const query = input.value.trim().toLocaleLowerCase('az');
    const favorites = getFavorites();
    const recent = getRecent();
    let list = tools.filter((tool) => activeCategory === 'all' || tool.category === activeCategory);
    if (view === 'favorites') list = list.filter((tool) => favorites.includes(tool.slug));
    if (view === 'recent') list = recent.map((slug) => tools.find((tool) => tool.slug === slug)).filter(Boolean);
    if (query) list = list.filter((tool) => [tool.name, tool.description, ...tool.keywords].join(' ').toLocaleLowerCase('az').includes(query));
    const category = categories.find((item) => item.id === activeCategory);
    title.textContent = view === 'favorites' ? 'Seçilmiş alətlər' : view === 'recent' ? 'Son istifadə' : category?.name || 'Bütün alətlər';
    copy.textContent = view === 'favorites' ? 'Sonra qayıtmaq üçün saxladığınız alətlər.' : view === 'recent' ? 'Ən son açdığınız alətlər.' : category ? `${category.count} aləti axtarın və ya aşağıdakı siyahıdan seçin.` : 'Tapşırığınızı yazın və ya iş sahəsinə görə süzün.';
    grid.innerHTML = list.map((tool) => toolCard(tool, base)).join('');
    $$('[data-tool-card]', grid).forEach((card) => { card.style.viewTransitionName = `tool-${card.dataset.slug.replace(/[^a-z0-9-]/giu, '-')}`; });
    count.textContent = `${list.length} alət`;
    empty.hidden = list.length > 0;
    grid.hidden = list.length === 0;
    if (!list.length) {
      if (query) {
        emptyTitle.textContent = 'Axtarışa uyğun alət yoxdur';
        emptyCopy.textContent = `“${input.value.trim()}” üçün nəticə tapılmadı. Daha qısa açar söz sınayın.`;
        emptyAction.textContent = 'Axtarışı təmizlə';
      } else if (view === 'favorites') {
        emptyTitle.textContent = 'Hələ seçilmiş alətiniz yoxdur';
        emptyCopy.textContent = 'Bəyəndiyiniz alətin ulduz düyməsinə toxunaraq onu burada saxlayın.';
        emptyAction.textContent = 'Bütün alətlərə bax';
      } else if (view === 'recent') {
        emptyTitle.textContent = 'Son istifadə siyahısı boşdur';
        emptyCopy.textContent = 'Açdığınız alətlər daha sonra burada görünəcək.';
        emptyAction.textContent = 'Alət seç';
      } else {
        emptyTitle.textContent = 'Bu bölmədə alət tapılmadı';
        emptyCopy.textContent = 'Bütün kateqoriyalara qayıdaraq başqa alət seçin.';
        emptyAction.textContent = 'Bütün alətləri göstər';
      }
    }
    if (recentSection && recentGrid) {
      const recentTools = recent.map((slug) => tools.find((tool) => tool.slug === slug)).filter(Boolean).slice(0, 3);
      recentSection.hidden = recentTools.length === 0 || view !== 'all' || activeCategory !== 'all' || Boolean(query);
      recentGrid.innerHTML = recentTools.map((tool) => toolCard(tool, base)).join('');
    }
    };
    if (animate && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(update);
    else update();
  };
  filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]'); if (!button) return;
    activeCategory = button.dataset.filter; view = 'all';
    $$('[data-filter]', filters).forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    syncCatalogNavigation();
    render(true);
  });
  input.addEventListener('input', render);
  emptyAction.addEventListener('click', () => {
    if (input.value) input.value = '';
    else { activeCategory = 'all'; view = 'all'; }
    $$('[data-filter]', filters).forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.filter === activeCategory)));
    syncCatalogNavigation();
    input.focus();
    render(true);
  });
  document.addEventListener('favoriteschange', () => render(true));
  render();
}

function toolWorkspace(tool) {
  const simpleWorkspace = simpleToolWorkspace(tool);
  if (simpleWorkspace) return simpleWorkspace;
  const commonInput = `<div class="workspace-panel"><h2>Giriş</h2>`;
  const result = `<section class="workspace-panel result-panel" aria-live="polite"><h2>Nəticə</h2><div class="result-empty" data-empty><div><strong>Nəticə burada görünəcək</strong><span>Soldakı məlumatı daxil edib əsas əməliyyatı başladın.</span></div></div><div class="result-output" data-output hidden></div></section>`;
  if (tool.kind === 'json') return `${commonInput}<div class="field"><label for="json-input">JSON məlumatı</label><textarea class="textarea code" id="json-input" maxlength="${LIMITS.textChars}" data-json-input aria-describedby="json-hint json-error" placeholder='{"aztoolbox": true}'></textarea><span class="field-hint" id="json-hint">Məlumat cihazınızdan kənara göndərilmir. Maksimum ${LIMITS.textChars.toLocaleString('az-AZ')} simvol.</span><span class="field-error" id="json-error" data-field-error role="alert" hidden></span></div><div class="workspace-actions"><button class="button button-primary" type="button" data-json-format>Formatla</button><button class="button button-secondary" type="button" data-json-minify>Minify</button><button class="button button-ghost" type="button" data-reset>Sıfırla</button></div></div>${result}`;
  if (tool.kind === 'text') return `${commonInput}<div class="field"><label for="text-input">Mətn</label><textarea class="textarea" id="text-input" maxlength="${LIMITS.textChars}" data-text-input placeholder="Mətni buraya yazın və ya yapışdırın..."></textarea><span class="field-hint">Maksimum ${LIMITS.textChars.toLocaleString('az-AZ')} simvol.</span></div><div class="workspace-actions"><button class="button button-secondary" type="button" data-copy-input>Kopyala</button><button class="button button-ghost" type="button" data-reset>Sıfırla</button></div></div><section class="workspace-panel result-panel"><h2>Canlı statistika</h2><div class="stats-grid" data-text-stats></div></section>`;
  if (tool.kind === 'password') return `${commonInput}<div class="field"><label for="password-length">Uzunluq</label><div class="range-row"><input id="password-length" type="range" min="8" max="64" value="20" data-password-length /><input class="input" type="number" min="8" max="64" value="20" data-password-number aria-label="Parol uzunluğu" /></div></div><div class="field"><label>Simvol qrupları</label><div class="check-row"><label class="check-pill"><input type="checkbox" checked data-password-set="upper" /> Böyük hərf</label><label class="check-pill"><input type="checkbox" checked data-password-set="lower" /> Kiçik hərf</label><label class="check-pill"><input type="checkbox" checked data-password-set="number" /> Rəqəm</label><label class="check-pill"><input type="checkbox" checked data-password-set="symbol" /> Simvol</label></div></div><div class="workspace-actions"><button class="button button-primary" type="button" data-password-generate>Parol yarat</button></div></div>${result}`;
  if (tool.kind === 'image') return `${commonInput}<label class="upload-zone" data-drop-zone><input type="file" accept="image/png,image/jpeg,image/webp" data-image-file /><div><span class="tool-icon category-image">IMG</span><strong>Şəkli buraya sürükləyin</strong><p>PNG, JPG və WebP · brauzerdə emal</p><span class="button button-secondary">Şəkil seç</span></div></label><div class="selected-files" data-selected-files></div><div class="check-row"><div class="field"><label for="image-width">En</label><input class="input" id="image-width" type="number" min="1" data-image-width /></div><div class="field"><label for="image-height">Hündürlük</label><input class="input" id="image-height" type="number" min="1" data-image-height /></div></div><label class="check-pill"><input type="checkbox" checked data-image-ratio /> Nisbəti qoru</label><div class="workspace-actions"><button class="button button-primary" type="button" data-image-resize disabled>Ölçünü dəyiş</button><button class="button button-ghost" type="button" data-reset>Sıfırla</button></div></div>${result}`;
  if (tool.kind === 'qr') return `${commonInput}<div class="field"><label for="qr-input">Mətn və ya link</label><textarea class="textarea" maxlength="${LIMITS.qrBytes}" style="min-height:180px" id="qr-input" data-qr-input aria-describedby="qr-hint qr-error" placeholder="https://aztoolbox.example"></textarea><span class="field-hint" id="qr-hint">Kənar boşluqlar olduğu kimi saxlanır. Maksimum ${LIMITS.qrBytes} UTF-8 bayt.</span><span class="field-error" id="qr-error" data-field-error role="alert" hidden></span></div><div class="field"><label for="qr-size">Ölçü</label><select class="select" id="qr-size" data-qr-size><option value="192">192 px</option><option value="256" selected>256 px</option><option value="384">384 px</option></select></div><div class="workspace-actions"><button class="button button-primary" type="button" data-qr-generate>QR yarat</button><button class="button button-ghost" type="button" data-reset>Sıfırla</button></div></div>${result}`;
  return `${commonInput}<label class="upload-zone" data-drop-zone><input type="file" accept="application/pdf" multiple data-pdf-files /><div><span class="tool-icon category-pdf">PDF</span><strong>PDF-ləri buraya sürükləyin</strong><p>Bir neçə PDF seçin · fayllar cihazınızda qalır</p><span class="button button-secondary">Faylları seç</span></div></label><div class="selected-files" data-selected-files></div><p class="privacy-note"><span aria-hidden="true">⌁</span>Fayllar serverə göndərilmir; əməliyyat bu brauzerdə aparılır.</p><div class="workspace-actions"><button class="button button-primary" type="button" data-pdf-merge disabled>Birləşdir və endir</button><button class="button button-secondary" type="button" data-pdf-cancel hidden>Dayandır</button><button class="button button-ghost" type="button" data-reset>Sıfırla</button></div><div class="processing-status" data-processing-status aria-live="polite"></div></div>${result}`;
}

function showResult(content, status = '') {
  const output = $('[data-output]'); const empty = $('[data-empty]');
  if (!output) return;
  const state = status === 'success' ? 'success' : status ? 'error' : '';
  const message = status === 'success' ? 'Əməliyyat uğurla tamamlandı.' : status;
  empty.hidden = true; output.hidden = false; output.innerHTML = `${message ? `<div class="status ${state}">${escapeHtml(message)}</div>` : ''}${content}`;
  output.classList.remove('is-entering');
  requestAnimationFrame(() => output.classList.add('is-entering'));
}
function clearResult() { const output = $('[data-output]'); const empty = $('[data-empty]'); if (output) { output.hidden = true; output.innerHTML = ''; output.classList.remove('is-entering'); } if (empty) empty.hidden = false; }
async function copyText(value, button) { await navigator.clipboard.writeText(value); const previous = button.textContent; button.textContent = 'Kopyalandı'; setTimeout(() => button.textContent = previous, 1200); }
function downloadBlob(blob, name) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
const userMessage = (error, fallback) => error instanceof ToolInputError ? error.message : fallback;

function initToolBehavior(tool) {
  if (initSimpleTool(tool, { showResult, clearResult, copyText, downloadBlob, escapeHtml })) return;
  if (tool.kind === 'json') {
    const input = $('[data-json-input]');
    const error = $('[data-field-error]');
    const clearFieldError = () => { error.hidden = true; error.textContent = ''; input.removeAttribute('aria-invalid'); };
    const run = (minify) => { try { validateTextLength(input.value); const value = JSON.stringify(JSON.parse(input.value), null, minify ? 0 : 2); clearFieldError(); showResult(`<button class="button button-secondary" type="button" data-copy-result>Kopyala</button><pre class="output-code">${escapeHtml(value)}</pre>`, 'success'); $('[data-copy-result]').onclick = (event) => copyText(value, event.currentTarget); } catch (reason) { const message = reason instanceof ToolInputError ? reason.message : jsonErrorMessage(reason, input.value); error.textContent = message; error.hidden = false; input.setAttribute('aria-invalid', 'true'); input.focus(); clearResult(); showResult('', message); } };
    input.addEventListener('input', clearFieldError);
    $('[data-json-format]').onclick = () => run(false); $('[data-json-minify]').onclick = () => run(true); $('[data-reset]').onclick = () => { input.value = ''; clearFieldError(); clearResult(); };
  }
  if (tool.kind === 'text') {
    const input = $('[data-text-input]'); const stats = $('[data-text-stats]');
    const update = () => { const text = input.value; const words = text.trim() ? text.trim().split(/\s+/u).length : 0; const sentences = text.trim() ? text.split(/[.!?]+/u).filter((item) => item.trim()).length : 0; const lines = text ? text.split(/\r?\n/u).length : 0; stats.innerHTML = [['Söz',words],['Simvol',text.length],['Boşluqsuz',text.replace(/\s/gu,'').length],['Cümlə',sentences],['Sətir',lines],['Oxuma vaxtı',`${Math.max(0,Math.ceil(words/200))} dəq`]].map(([label,value]) => `<div class="stat-card"><strong>${value}</strong><span>${label}</span></div>`).join(''); };
    input.oninput = update; $('[data-copy-input]').onclick = (event) => copyText(input.value, event.currentTarget); $('[data-reset]').onclick = () => { input.value = ''; update(); }; update();
  }
  if (tool.kind === 'password') {
    const range = $('[data-password-length]'); const number = $('[data-password-number]');
    range.oninput = () => { number.value = range.value; };
    number.oninput = () => {
      const value = Number(number.value);
      if (Number.isInteger(value) && value >= 8 && value <= 64) range.value = String(value);
    };
    $('[data-password-generate]').onclick = () => {
      clearResult();
      try {
        const groups = $$('[data-password-set]:checked').map((item) => item.dataset.passwordSet);
        const value = generateSecurePassword({ length: number.value, groups });
        range.value = number.value;
        showResult(`<div class="field"><label>Hazır parol</label><div class="file-row"><code>${escapeHtml(value)}</code><button class="button button-secondary" type="button" data-copy-result>Kopyala</button></div></div>`, 'success');
        $('[data-copy-result]').onclick = (event) => copyText(value, event.currentTarget);
      } catch (error) { showResult('', error?.message || 'Parol yaradıla bilmədi.'); }
    };
  }
  if (tool.kind === 'image') {
    const fileInput = $('[data-image-file]'); const width = $('[data-image-width]'); const height = $('[data-image-height]'); const ratio = $('[data-image-ratio]'); const button = $('[data-image-resize]'); let image = null; let file = null; let aspect = 1;
    const load = async (selected) => {
      button.disabled = true; image = null; file = null; clearResult();
      try {
        if (!selected) return;
        validateFileSet([selected], { fileBytes: LIMITS.imageFileBytes });
        await inspectImageFile(selected);
        file = selected;
        const reader = new FileReader();
        reader.onerror = () => showResult('', 'Şəkil faylı oxuna bilmədi.');
        reader.onload = () => {
          image = new Image();
          image.onerror = () => { image = null; file = null; button.disabled = true; showResult('', 'Şəkil emal edilə bilmədi.'); };
          image.onload = () => {
            try {
              validateImageDimensions(image.naturalWidth, image.naturalHeight);
              width.value = image.naturalWidth; height.value = image.naturalHeight; aspect = image.naturalWidth / image.naturalHeight; button.disabled = false;
              $('[data-selected-files]').innerHTML = `<div class="file-row"><span>${escapeHtml(file.name)}</span><span>${Math.round(file.size/1024)} KB</span></div>`;
            } catch (error) { image = null; file = null; button.disabled = true; showResult('', userMessage(error, 'Şəkil emal edilə bilmədi.')); }
          };
          image.src = reader.result;
        };
        reader.readAsDataURL(file);
      } catch (error) { showResult('', userMessage(error, 'Şəkil emal edilə bilmədi.')); }
    };
    fileInput.onchange = () => load(fileInput.files[0]); setupDropZone(fileInput, load);
    width.oninput = () => { if (ratio.checked) height.value = Math.max(1, Math.round(Number(width.value) / aspect)); }; height.oninput = () => { if (ratio.checked) width.value = Math.max(1, Math.round(Number(height.value) * aspect)); };
    button.onclick = () => { if (!image) return; try { const dimensions = validateImageDimensions(Number(width.value), Number(height.value)); const canvas = document.createElement('canvas'); canvas.width = dimensions.width; canvas.height = dimensions.height; canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); canvas.toBlob((blob) => { if (!blob?.size) { showResult('', 'Brauzer şəkil çıxışını yarada bilmədi.'); return; } if (blob.size > LIMITS.imageFileBytes) { showResult('', `Nəticə ${Math.round(LIMITS.imageFileBytes/1024/1024)} MB həddini aşır.`); return; } const url = URL.createObjectURL(blob); showResult(`<img class="image-preview" src="${url}" alt="Ölçüsü dəyişdirilmiş şəkil" /><button class="button button-primary" type="button" data-image-download>Şəkli endir</button>`, 'success'); $('[data-image-download]').onclick = () => downloadBlob(blob, `resized-${file.name.replace(/\.[^.]+$/u,'')}.png`); }, 'image/png'); } catch (error) { clearResult(); showResult('', userMessage(error, 'Şəkil emal edilə bilmədi.')); } };
    $('[data-reset]').onclick = () => location.reload();
  }
  if (tool.kind === 'qr') {
    const qrInput = $('[data-qr-input]'); const qrError = $('[data-field-error]');
    const clearQrError = () => { qrError.hidden = true; qrError.textContent = ''; qrInput.removeAttribute('aria-invalid'); };
    qrInput.addEventListener('input', clearQrError);
    $('[data-qr-generate]').onclick = () => {
      clearResult(); clearQrError();
      try {
        const value = validateQrText(qrInput.value);
        if (!window.QRCode) throw new ToolInputError('QR mühərriki yüklənmədi. Səhifəni yeniləyin.');
        const size = Number($('[data-qr-size]').value);
        const staging = document.createElement('div');
        const qr = new QRCode(staging, { text: value, width: size, height: size, correctLevel: QRCode.CorrectLevel.H });
        const canvas = staging.querySelector('canvas');
        if (!canvas) throw new ToolInputError('QR kod yaradıla bilmədi. Mətnin uzunluğunu azaldın.');
        const renderedCanvas = document.createElement('canvas'); renderedCanvas.width = canvas.width; renderedCanvas.height = canvas.height;
        renderedCanvas.getContext('2d').drawImage(canvas, 0, 0);
        showResult('<div id="qr-output"></div><button class="button button-primary" type="button" data-qr-download>PNG endir</button>', 'success');
        const output = $('#qr-output'); output.title = value; output.__aztoolboxQr = qr; output.append(renderedCanvas);
        $('[data-qr-download]').onclick = () => renderedCanvas.toBlob((blob) => {
          if (!blob?.size || blob.type !== 'image/png') { clearResult(); showResult('', 'QR PNG çıxışı yaradıla bilmədi.'); return; }
          downloadBlob(blob, 'aztoolbox-qr.png');
        }, 'image/png');
      } catch (error) {
        const message = userMessage(error, 'QR kod yaradıla bilmədi. Mətnin uzunluğunu azaldın.');
        qrError.textContent = message; qrError.hidden = false; qrInput.setAttribute('aria-invalid', 'true'); qrInput.focus(); clearResult(); showResult('', message);
      }
    };
    $('[data-reset]').onclick = () => { qrInput.value = ''; clearQrError(); clearResult(); };
  }
  if (tool.kind === 'pdf') {
    const input = $('[data-pdf-files]'); const button = $('[data-pdf-merge]'); const cancel = $('[data-pdf-cancel]'); const progress = $('[data-processing-status]'); let files = []; let cancelRequested = false;
    const load = (selected) => { files = Array.from(selected instanceof FileList ? selected : [selected]).filter((file) => file?.type === 'application/pdf'); button.disabled = files.length < 2; $('[data-selected-files]').innerHTML = files.map((file, index) => `<div class="file-row"><span>${index+1}. ${escapeHtml(file.name)}</span><span>${(file.size/1024/1024).toFixed(2)} MB</span></div>`).join(''); };
    input.onchange = () => load(input.files); setupDropZone(input, (fileList) => load(fileList));
    cancel.onclick = () => { cancelRequested = true; cancel.disabled = true; progress.textContent = 'Əməliyyat dayandırılır…'; };
    button.onclick = async () => { if (!window.PDFLib || files.length < 2) return; cancelRequested = false; cancel.disabled = false; cancel.hidden = false; button.disabled = true; button.setAttribute('aria-busy', 'true'); clearResult(); try { validateFileSet(files, { fileBytes: LIMITS.pdfFileBytes }); const merged = await PDFLib.PDFDocument.create(); let totalPages = 0; for (const [index, file] of files.entries()) { if (cancelRequested) { progress.textContent = 'Əməliyyat dayandırıldı.'; return; } progress.textContent = `${index + 1}/${files.length} fayl hazırlanır: ${file.name}`; button.textContent = `Birləşdirilir ${index + 1}/${files.length}`; const source = await PDFLib.PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false }); validatePdfPageCount(source.getPageCount()); totalPages += source.getPageCount(); if (totalPages > LIMITS.combinedPdfPages) throw new ToolInputError(`Birləşmiş PDF ən çox ${LIMITS.combinedPdfPages} səhifə ola bilər.`); const pages = await merged.copyPages(source, source.getPageIndices()); pages.forEach((page) => merged.addPage(page)); } if (cancelRequested) { progress.textContent = 'Əməliyyat dayandırıldı.'; return; } progress.textContent = 'Yeni PDF yaradılır…'; const bytes = await merged.save(); validateGeneratedSize(bytes.length, LIMITS.totalFileBytes, 'Birləşmiş PDF'); downloadBlob(new Blob([bytes], { type:'application/pdf' }), 'aztoolbox-birlesdirilmis.pdf'); progress.textContent = 'Hazırdır. Endirmə başladıldı.'; showResult(`${files.length} PDF uğurla birləşdirildi.`, 'success'); } catch (error) { progress.textContent = ''; showResult('', userMessage(error, 'PDF faylları birləşdirilə bilmədi. Faylların zədələnmədiyini yoxlayın.')); } finally { cancel.hidden = true; button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = 'Birləşdir və endir'; } };
    $('[data-reset]').onclick = () => location.reload();
  }
}

function setupDropZone(input, onFiles) {
  const zone = input.closest('[data-drop-zone]');
  ['dragenter','dragover'].forEach((type) => zone.addEventListener(type, (event) => { event.preventDefault(); zone.classList.add('dragging'); }));
  ['dragleave','drop'].forEach((type) => zone.addEventListener(type, (event) => { event.preventDefault(); zone.classList.remove('dragging'); }));
  zone.addEventListener('drop', (event) => onFiles(event.dataTransfer.files.length === 1 ? event.dataTransfer.files[0] : event.dataTransfer.files));
}
function jsonErrorMessage(error, source) {
  const raw = String(error?.message || 'JSON sintaksisi düzgün deyil.');
  const lineColumn = raw.match(/line\s+(\d+)\s+column\s+(\d+)/iu);
  if (lineColumn) return `JSON sintaksisini yoxlayın — sətir ${lineColumn[1]}, sütun ${lineColumn[2]}.`;
  const position = raw.match(/position\s+(\d+)/iu);
  if (position) {
    const offset = Number(position[1]);
    const before = source.slice(0, offset);
    const line = before.split(/\r?\n/u).length;
    const column = offset - Math.max(before.lastIndexOf('\n'), before.lastIndexOf('\r'));
    return `JSON sintaksisini yoxlayın — sətir ${line}, sütun ${column}.`;
  }
  return 'JSON sintaksisini yoxlayın. Məlumat düzgün formatda deyil.';
}
function escapeHtml(value) { return String(value).replace(/[&<>'"]/gu, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }

function renderToolPage() {
  const slug = new URLSearchParams(location.search).get('slug') || tools[0].slug;
  const tool = tools.find((item) => item.slug === slug) || tools[0];
  recordRecent(tool.slug); document.title = `${tool.name} — AzToolBox`;
  const root = $('[data-tool-root]');
  root.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="${base}/">Ana səhifə</a><span>/</span><a href="${base}/tools/">Alətlər</a><span>/</span><span>${tool.name}</span></nav>
    <header class="tool-header"><div class="tool-heading category-${tool.category}">${toolIcon(tool)}<div><h1>${tool.name}</h1><p>${tool.description}</p><div class="tool-meta"><span class="badge">${tool.categoryName}</span><span class="badge badge-success">✓ Brauzerdə emal olunur</span></div></div></div><button class="favorite-button" type="button" data-favorite="${tool.slug}" aria-label="${tool.name}: ${getFavorites().includes(tool.slug) ? 'seçilmişlərdən çıxar' : 'seçilmişlərə əlavə et'}" aria-pressed="${getFavorites().includes(tool.slug)}">${getFavorites().includes(tool.slug) ? '★' : '☆'}</button></header>
    <div class="workspace">${toolWorkspace(tool)}</div>
    <section class="related-tools"><div class="section-heading"><div><h2>Oxşar alətlər</h2><p>İş axınınıza uyğun digər seçimlər.</p></div></div><div class="tool-grid">${[...tools.filter((item) => item.slug !== tool.slug && item.category === tool.category), ...tools.filter((item) => item.slug !== tool.slug && item.category !== tool.category)].slice(0,3).map((item) => toolCard(item, base)).join('')}</div></section>`;
  initToolBehavior(tool);
}

function initFeedback() {
  const form = $('[data-feedback-form]'); if (!form) return;
  form.addEventListener('submit', (event) => { event.preventDefault(); const status = $('[data-feedback-status]'); status.hidden = false; status.textContent = 'Rəyiniz lokal olaraq hazırlandı. Bu statik versiyada serverə göndərilmir.'; form.reset(); });
}

if (page === 'home') renderHome();
if (page === 'tools') renderCatalog();
if (page === 'tool') renderToolPage();
if (page === 'feedback') initFeedback();
initReveal();
initMotion();
