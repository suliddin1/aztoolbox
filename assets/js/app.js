import './ambient-waves.js';
import { categories, findToolSearchTargets, resolveToolRoute, tools, toolUrl } from './tools-data.js';
import { getBase, getFavoriteEntries, getFavorites, getRecentEntries, recordRecent, toolCard, toolIcon } from './components.js';
import { simpleToolWorkspace, initSimpleTool } from './simple-tools.js';
import { initMotion } from './motion.js';
import { generateSecurePassword } from './batch2-tools.js';
import { createResultLifecycle, imageExtension } from './batch4-tools.js';
import {
  canonicalToolUrl,
  categoryCapabilityDescription,
  requiredVendor,
  textStatistics,
  toolSeo,
} from './batch5-tools.js';
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
const resultLifecycle = createResultLifecycle((url) => URL.revokeObjectURL(url));

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
  document.title = `AzToolBox — gündəlik işlər üçün ${tools.length} brauzer aləti`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `PDF, şəkil, mətn, developer və hesablama işləri üçün ${tools.length} sürətli, qeydiyyatsız və brauzerdə işləyən alət.`);
  $('[data-total-tools]')?.replaceChildren(document.createTextNode(String(tools.length)));
  $('[data-total-tools-link]')?.replaceChildren(document.createTextNode(String(tools.length)));
  if (featured) featured.innerHTML = tools.filter((tool) => tool.featured).slice(0, 6).map((tool) => `<article class="quick-tool-card category-${tool.category}">${toolIcon(tool)}<div><strong><a href="${toolUrl(base, tool.slug)}">${tool.name}</a></strong><p>${tool.description}</p></div><span aria-hidden="true">→</span></article>`).join('');
  if (categoryGrid) categoryGrid.innerHTML = categories.map((category) => `<a class="dashboard-category-card category-${category.id}" href="${base}/tools/?category=${category.id}">${toolIcon({ category: category.id, icon: String(category.count).padStart(2,'0') })}<footer><div><strong>${category.name}</strong><p>${categoryCapabilityDescription(category.id, tools)}</p></div><span>${category.count} alət →</span></footer></a>`).join('');
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
  document.title = `${tools.length} alət — AzToolBox`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `AzToolBox-un ${tools.length} alətdən ibarət axtarılan və kateqoriyalara bölünmüş kataloqu.`);
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
    const favoriteEntries = getFavoriteEntries();
    const recentEntries = getRecentEntries();
    let list = tools.filter((tool) => activeCategory === 'all' || tool.category === activeCategory);
    let storedTargets = null;
    if (view === 'favorites') {
      const allowed = new Set(list.map((tool) => tool.slug));
      storedTargets = favoriteEntries.map((entry) => ({ ...entry, tool: tools.find((tool) => tool.slug === entry.slug) })).filter((entry) => entry.tool && allowed.has(entry.slug));
      list = storedTargets.map((entry) => entry.tool);
    }
    if (view === 'recent') {
      const allowed = new Set(list.map((tool) => tool.slug));
      storedTargets = recentEntries.map((entry) => ({ ...entry, tool: tools.find((tool) => tool.slug === entry.slug) })).filter((entry) => entry.tool && allowed.has(entry.slug));
      list = storedTargets.map((entry) => entry.tool);
    }
    const targets = query ? findToolSearchTargets(query, list) : (storedTargets || list.map((tool) => ({ tool, mode: null })));
    const category = categories.find((item) => item.id === activeCategory);
    title.textContent = view === 'favorites' ? 'Seçilmiş alətlər' : view === 'recent' ? 'Son istifadə' : category?.name || 'Bütün alətlər';
    copy.textContent = view === 'favorites' ? 'Sonra qayıtmaq üçün saxladığınız alətlər.' : view === 'recent' ? 'Ən son açdığınız alətlər.' : category ? `${category.count} aləti axtarın və ya aşağıdakı siyahıdan seçin.` : 'Tapşırığınızı yazın və ya iş sahəsinə görə süzün.';
    grid.innerHTML = targets.map(({ tool, mode }) => toolCard(tool, base, { mode })).join('');
    $$('[data-tool-card]', grid).forEach((card) => { card.style.viewTransitionName = `tool-${card.dataset.slug.replace(/[^a-z0-9-]/giu, '-')}`; });
    count.textContent = `${targets.length} alət`;
    empty.hidden = targets.length > 0;
    grid.hidden = targets.length === 0;
    if (!targets.length) {
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
      const recentTools = recentEntries.map((entry) => ({ ...entry, tool: tools.find((tool) => tool.slug === entry.slug) })).filter((entry) => entry.tool).slice(0, 3);
      recentSection.hidden = recentTools.length === 0 || view !== 'all' || activeCategory !== 'all' || Boolean(query);
      recentGrid.innerHTML = recentTools.map(({ tool, mode }) => toolCard(tool, base, { mode })).join('');
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
  if (tool.kind === 'text') return `${commonInput}<div class="field"><label for="text-input">Mətn</label><textarea class="textarea" id="text-input" maxlength="${LIMITS.textChars}" data-text-input placeholder="Mətni buraya yazın və ya yapışdırın..."></textarea><span class="field-hint">Simvol sayı insanın gördüyü qrafemlər üzrə hesablanır. Maksimum ${LIMITS.textChars.toLocaleString('az-AZ')} giriş vahidi.</span></div><div class="workspace-actions"><button class="button button-secondary" type="button" data-copy-input>Kopyala</button><button class="button button-ghost" type="button" data-reset>Sıfırla</button></div></div><section class="workspace-panel result-panel"><h2>Canlı statistika</h2><div class="stats-grid" data-text-stats></div><p class="sr-only" data-text-announcement aria-live="polite" aria-atomic="true"></p></section>`;
  if (tool.kind === 'password') return `${commonInput}<div class="field"><label for="password-length">Uzunluq</label><div class="range-row"><input id="password-length" type="range" min="8" max="64" value="20" data-password-length /><input class="input" type="number" min="8" max="64" value="20" data-password-number aria-label="Parol uzunluğu" /></div></div><div class="field"><label>Simvol qrupları</label><div class="check-row"><label class="check-pill"><input type="checkbox" checked data-password-set="upper" /> Böyük hərf</label><label class="check-pill"><input type="checkbox" checked data-password-set="lower" /> Kiçik hərf</label><label class="check-pill"><input type="checkbox" checked data-password-set="number" /> Rəqəm</label><label class="check-pill"><input type="checkbox" checked data-password-set="symbol" /> Simvol</label></div></div><div class="workspace-actions"><button class="button button-primary" type="button" data-password-generate>Parol yarat</button></div></div>${result}`;
  if (tool.kind === 'image') return `${commonInput}<label class="upload-zone" data-drop-zone><input type="file" accept="image/png,image/jpeg,image/webp" data-image-file /><div><span class="tool-icon category-image">IMG</span><strong>Şəkli buraya sürükləyin</strong><p>PNG, JPG və WebP · brauzerdə emal</p><span class="button button-secondary">Şəkil seç</span></div></label><div class="selected-files" data-selected-files></div><div class="check-row"><div class="field"><label for="image-width">En</label><input class="input" id="image-width" type="number" min="1" data-image-width /></div><div class="field"><label for="image-height">Hündürlük</label><input class="input" id="image-height" type="number" min="1" data-image-height /></div></div><label class="check-pill"><input type="checkbox" checked data-image-ratio /> Nisbəti qoru</label><p class="privacy-note"><span aria-hidden="true">⌁</span>Statik PNG, JPG və WebP çıxışında mənbə formatı saxlanılır; animasiyalı girişlər rədd edilir.</p><div class="workspace-actions"><button class="button button-primary" type="button" data-image-resize disabled>Ölçünü dəyiş</button><button class="button button-ghost" type="button" data-reset>Sıfırla</button></div></div>${result}`;
  if (tool.kind === 'qr') return `${commonInput}<div class="field"><label for="qr-input">Mətn və ya link</label><textarea class="textarea" maxlength="${LIMITS.qrBytes}" style="min-height:180px" id="qr-input" data-qr-input aria-describedby="qr-hint qr-error" placeholder="https://aztoolbox.example"></textarea><span class="field-hint" id="qr-hint">Kənar boşluqlar olduğu kimi saxlanır. Maksimum ${LIMITS.qrBytes} UTF-8 bayt.</span><span class="field-error" id="qr-error" data-field-error role="alert" hidden></span></div><div class="field"><label for="qr-size">Ölçü</label><select class="select" id="qr-size" data-qr-size><option value="192">192 px</option><option value="256" selected>256 px</option><option value="384">384 px</option></select></div><div class="workspace-actions"><button class="button button-primary" type="button" data-qr-generate>QR yarat</button><button class="button button-ghost" type="button" data-reset>Sıfırla</button></div></div>${result}`;
  if (tool.kind === 'pdf') return `${commonInput}<label class="upload-zone" data-drop-zone><input type="file" accept="application/pdf" multiple data-pdf-files /><div><span class="tool-icon category-pdf">PDF</span><strong>PDF-ləri buraya sürükləyin</strong><p>Bir neçə PDF seçin · fayllar cihazınızda qalır</p><span class="button button-secondary">Faylları seç</span></div></label><div class="selected-files" data-selected-files></div><p class="privacy-note"><span aria-hidden="true">⌁</span>Fayllar serverə göndərilmir; əməliyyat bu brauzerdə aparılır.</p><div class="workspace-actions"><button class="button button-primary" type="button" data-pdf-merge disabled>Birləşdir və endir</button><button class="button button-secondary" type="button" data-pdf-cancel hidden>Dayandır</button><button class="button button-ghost" type="button" data-reset>Sıfırla</button></div><div class="processing-status" data-processing-status aria-live="polite"></div></div>${result}`;
  return null;
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
function resetResultDom() { const output = $('[data-output]'); const empty = $('[data-empty]'); if (output) { output.hidden = true; output.innerHTML = ''; output.classList.remove('is-entering'); } if (empty) empty.hidden = false; }
function clearResult() { resultLifecycle.invalidate(); resetResultDom(); }
function beginOperation() { const id = resultLifecycle.begin(); resetResultDom(); return id; }
function isCurrentOperation(id) { return resultLifecycle.isCurrent(id); }
function createPreviewUrl(blob) { return resultLifecycle.trackPreview(URL.createObjectURL(blob)); }
async function copyText(value, button) { await navigator.clipboard.writeText(value); const previous = button.textContent; button.textContent = 'Kopyalandı'; setTimeout(() => button.textContent = previous, 1200); }
function downloadBlob(blob, name) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
const userMessage = (error, fallback) => error instanceof ToolInputError ? error.message : fallback;

function initToolBehavior(tool) {
  if (initSimpleTool(tool, { showResult, clearResult, beginOperation, isCurrent: isCurrentOperation, createPreviewUrl, copyText, downloadBlob, escapeHtml })) return;
  if (tool.kind === 'json') {
    const input = $('[data-json-input]');
    const error = $('[data-field-error]');
    const clearFieldError = () => { error.hidden = true; error.textContent = ''; input.removeAttribute('aria-invalid'); };
    const run = (minify) => { try { validateTextLength(input.value); const value = JSON.stringify(JSON.parse(input.value), null, minify ? 0 : 2); clearFieldError(); showResult(`<button class="button button-secondary" type="button" data-copy-result>Kopyala</button><pre class="output-code">${escapeHtml(value)}</pre>`, 'success'); $('[data-copy-result]').onclick = (event) => copyText(value, event.currentTarget); } catch (reason) { const message = reason instanceof ToolInputError ? reason.message : jsonErrorMessage(reason, input.value); error.textContent = message; error.hidden = false; input.setAttribute('aria-invalid', 'true'); input.focus(); clearResult(); showResult('', message); } };
    input.addEventListener('input', clearFieldError);
    $('[data-json-format]').onclick = () => run(false); $('[data-json-minify]').onclick = () => run(true); $('[data-reset]').onclick = () => { input.value = ''; clearFieldError(); clearResult(); };
  }
  if (tool.kind === 'text') {
    const input = $('[data-text-input]'); const stats = $('[data-text-stats]'); const announcement = $('[data-text-announcement]'); let announcementTimer;
    const update = (announce = true) => {
      const current = textStatistics(input.value);
      stats.innerHTML = [['Söz',current.words],['Simvol',current.characters],['Boşluqsuz',current.charactersWithoutWhitespace],['Cümlə',current.sentences],['Sətir',current.lines],['Oxuma vaxtı',`${current.readingMinutes} dəq`]].map(([label,value]) => `<div class="stat-card"><strong>${value}</strong><span>${label}</span></div>`).join('');
      clearTimeout(announcementTimer);
      if (announce) announcementTimer = setTimeout(() => { announcement.textContent = `${current.words} söz, ${current.characters} simvol, ${current.lines} sətir.`; }, 300);
      else announcement.textContent = '';
    };
    input.oninput = () => update(); $('[data-copy-input]').onclick = (event) => copyText(input.value, event.currentTarget); $('[data-reset]').onclick = () => { input.value = ''; update(); }; update(false);
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
    const fileInput = $('[data-image-file]'); const width = $('[data-image-width]'); const height = $('[data-image-height]'); const ratio = $('[data-image-ratio]'); const button = $('[data-image-resize]'); let image = null; let file = null; let sourceInfo = null; let aspect = 1;
    const load = async (selected) => {
      const operation = beginOperation(); button.disabled = true; image = null; file = null; sourceInfo = null;
      try {
        if (!selected) return;
        validateFileSet([selected], { fileBytes: LIMITS.imageFileBytes });
        const inspected = await inspectImageFile(selected);
        if (!isCurrentOperation(operation)) return;
        if (inspected.animated) throw new ToolInputError('Animasiyalı şəkillər bu əməliyyatda dəstəklənmir. Statik PNG, JPG və ya WebP seçin.');
        const decoded = new Blob([selected], { type: inspected.type });
        const temporaryUrl = URL.createObjectURL(decoded);
        try {
          const loaded = await new Promise((resolve, reject) => {
            const candidate = new Image();
            candidate.onload = () => resolve(candidate);
            candidate.onerror = () => reject(new ToolInputError('Şəkil emal edilə bilmədi.'));
            candidate.src = temporaryUrl;
          });
          if (!isCurrentOperation(operation)) return;
          validateImageDimensions(loaded.naturalWidth, loaded.naturalHeight);
          image = loaded; file = selected; sourceInfo = inspected;
          width.value = loaded.naturalWidth; height.value = loaded.naturalHeight; aspect = loaded.naturalWidth / loaded.naturalHeight; button.disabled = false;
          $('[data-selected-files]').innerHTML = `<div class="file-row"><span>${escapeHtml(file.name)}</span><span>${Math.round(file.size/1024)} KB</span></div>`;
        } finally { URL.revokeObjectURL(temporaryUrl); }
      } catch (error) { if (isCurrentOperation(operation)) showResult('', userMessage(error, 'Şəkil emal edilə bilmədi.')); }
    };
    fileInput.onchange = () => load(fileInput.files[0]); setupDropZone(fileInput, load);
    width.oninput = () => { if (ratio.checked) height.value = Math.max(1, Math.round(Number(width.value) / aspect)); }; height.oninput = () => { if (ratio.checked) width.value = Math.max(1, Math.round(Number(height.value) * aspect)); };
    button.onclick = async () => {
      if (!image || !file || !sourceInfo) return;
      const operation = beginOperation();
      try {
        const dimensions = validateImageDimensions(Number(width.value), Number(height.value));
        const canvas = document.createElement('canvas'); canvas.width = dimensions.width; canvas.height = dimensions.height;
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, sourceInfo.type, .9));
        if (!isCurrentOperation(operation)) return;
        if (!blob?.size) throw new ToolInputError('Brauzer şəkil çıxışını yarada bilmədi.');
        validateGeneratedSize(blob.size, LIMITS.imageFileBytes, 'Nəticə şəkli');
        const extension = imageExtension(sourceInfo.type);
        await inspectImageFile(new File([blob], `result.${extension}`, { type: sourceInfo.type }));
        if (!isCurrentOperation(operation)) return;
        const url = createPreviewUrl(blob);
        showResult(`<img class="image-preview" src="${url}" alt="Ölçüsü dəyişdirilmiş şəkil" /><button class="button button-primary" type="button" data-image-download>Şəkli endir</button>`, 'success');
        $('[data-image-download]').onclick = () => downloadBlob(blob, `resized-${file.name.replace(/\.[^.]+$/u,'')}.${extension}`);
      } catch (error) { if (isCurrentOperation(operation)) showResult('', userMessage(error, 'Şəkil emal edilə bilmədi.')); }
    };
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
    const load = (selected) => { clearResult(); files = Array.from(selected instanceof FileList ? selected : [selected]).filter((file) => file?.type === 'application/pdf'); button.disabled = files.length < 2; $('[data-selected-files]').innerHTML = files.map((file, index) => `<div class="file-row"><span>${index+1}. ${escapeHtml(file.name)}</span><span>${(file.size/1024/1024).toFixed(2)} MB</span></div>`).join(''); };
    input.onchange = () => load(input.files); setupDropZone(input, (fileList) => load(fileList));
    cancel.onclick = () => { cancelRequested = true; cancel.disabled = true; progress.textContent = 'Əməliyyat dayandırılır…'; };
    button.onclick = async () => { if (!window.PDFLib || files.length < 2) return; const operation = beginOperation(); cancelRequested = false; cancel.disabled = false; cancel.hidden = false; button.disabled = true; button.setAttribute('aria-busy', 'true'); try { validateFileSet(files, { fileBytes: LIMITS.pdfFileBytes }); const merged = await PDFLib.PDFDocument.create(); let totalPages = 0; for (const [index, file] of files.entries()) { if (cancelRequested || !isCurrentOperation(operation)) { progress.textContent = 'Əməliyyat dayandırıldı.'; return; } progress.textContent = `${index + 1}/${files.length} fayl hazırlanır: ${file.name}`; button.textContent = `Birləşdirilir ${index + 1}/${files.length}`; const source = await PDFLib.PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false }); if (!isCurrentOperation(operation)) return; validatePdfPageCount(source.getPageCount()); totalPages += source.getPageCount(); if (totalPages > LIMITS.combinedPdfPages) throw new ToolInputError(`Birləşmiş PDF ən çox ${LIMITS.combinedPdfPages} səhifə ola bilər.`); const pages = await merged.copyPages(source, source.getPageIndices()); pages.forEach((page) => merged.addPage(page)); } if (cancelRequested || !isCurrentOperation(operation)) { progress.textContent = 'Əməliyyat dayandırıldı.'; return; } progress.textContent = 'Yeni PDF yaradılır…'; const bytes = await merged.save(); if (!isCurrentOperation(operation)) return; validateGeneratedSize(bytes.length, LIMITS.totalFileBytes, 'Birləşmiş PDF'); downloadBlob(new Blob([bytes], { type:'application/pdf' }), 'aztoolbox-birlesdirilmis.pdf'); progress.textContent = 'Hazırdır. Endirmə başladıldı.'; showResult(`${files.length} PDF uğurla birləşdirildi.`, 'success'); } catch (error) { if (isCurrentOperation(operation)) { progress.textContent = ''; showResult('', userMessage(error, 'PDF faylları birləşdirilə bilmədi. Faylların zədələnmədiyini yoxlayın.')); } } finally { cancel.hidden = true; button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = 'Birləşdir və endir'; } };
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

function bindResultInvalidation(root) {
  const invalidate = (event) => {
    if (event.target.matches('.workspace input, .workspace textarea, .workspace select')) clearResult();
  };
  root.addEventListener('input', invalidate, true);
  root.addEventListener('change', invalidate, true);
}

function setMetaContent(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) { meta = document.createElement('meta'); meta.name = name; document.head.append(meta); }
  meta.content = content;
  return meta;
}

function setToolDocumentMetadata(tool) {
  const seo = toolSeo(tool);
  document.title = seo.title;
  setMetaContent('description', seo.description);
  document.querySelector('meta[name="robots"]')?.remove();
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
  canonical.href = canonicalToolUrl(location.href, tool.slug);
}

const vendorLoads = new Map();
function loadVendor(dependency) {
  if (!dependency || window[dependency.global]) return Promise.resolve();
  if (vendorLoads.has(dependency.file)) return vendorLoads.get(dependency.file);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${base}/assets/vendor/${dependency.file}`;
    script.dataset.toolVendor = dependency.file;
    script.onload = () => window[dependency.global] ? resolve() : reject(new Error(`${dependency.label} hazır deyil.`));
    script.onerror = () => reject(new Error(`${dependency.label} yüklənmədi.`));
    document.head.append(script);
  });
  vendorLoads.set(dependency.file, promise);
  return promise;
}

async function renderToolPage() {
  const root = $('[data-tool-root]');
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  const requestedMode = params.get('mode') || null;
  const resolved = resolveToolRoute(slug, requestedMode);
  if (resolved.status === 'removed') {
    document.title = `${resolved.route.name} çıxarılıb — AzToolBox`;
    setMetaContent('description', `${resolved.route.name} artıq AzToolBox kataloqunda mövcud deyil.`);
    setMetaContent('robots', 'noindex');
    document.querySelector('link[rel="canonical"]')?.remove();
    root.dataset.toolRemoved = '';
    root.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="${base}/">Ana səhifə</a><span>/</span><a href="${base}/tools/">Alətlər</a><span>/</span><span>Çıxarılıb</span></nav>
      <section class="workspace-panel" data-removed><h1>${escapeHtml(resolved.route.name)} çıxarılıb</h1><p>${escapeHtml(resolved.route.reason)}</p><p>Bu köhnə ünvan başqa və əlaqəsiz alətə yönləndirilmir.</p><a class="button button-primary" href="${base}/tools/">Mövcud alətlərə bax</a></section>`;
    return;
  }
  if (!['active', 'replaced'].includes(resolved.status)) {
    const invalid = resolved.status === 'invalid';
    document.title = `${invalid ? 'Etibarsız alət ünvanı' : 'Alət tapılmadı'} — AzToolBox`;
    setMetaContent('description', invalid ? 'Sorğu edilən alət rejimi və ya köhnə ünvan etibarlı deyil.' : 'Sorğu edilən AzToolBox aləti tapılmadı. Naməlum ünvan heç bir alətə yönləndirilmədi.');
    setMetaContent('robots', 'noindex');
    document.querySelector('link[rel="canonical"]')?.remove();
    root.dataset.toolNotFound = '';
    root.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="${base}/">Ana səhifə</a><span>/</span><a href="${base}/tools/">Alətlər</a><span>/</span><span>Tapılmadı</span></nav>
      <section class="workspace-panel" data-not-found><h1>${invalid ? 'Alət ünvanı etibarsızdır' : 'Alət tapılmadı'}</h1><p>${invalid ? 'Bu rejim və ya köhnə alət keçidi etibarlı deyil.' : 'Bu ünvan heç bir mövcud alətə uyğun deyil.'}</p><a class="button button-primary" href="${base}/tools/">Bütün alətlərə bax</a></section>`;
    return;
  }
  const tool = resolved.mode ? { ...resolved.tool, mode: resolved.mode } : resolved.tool;
  const workspace = toolWorkspace(tool);
  if (!workspace) {
    document.title = 'Alət iş sahəsi dəstəklənmir — AzToolBox';
    setMetaContent('description', 'Alət iş sahəsi təhlükəsiz şəkildə açıla bilmədi.');
    setMetaContent('robots', 'noindex');
    document.querySelector('link[rel="canonical"]')?.remove();
    root.dataset.toolNotFound = '';
    root.innerHTML = `<section class="workspace-panel" data-not-found><h1>Alət açıla bilmədi</h1><p>Bu alətin iş sahəsi dəstəklənmir.</p><a class="button button-primary" href="${base}/tools/">Bütün alətlərə bax</a></section>`;
    return;
  }
  recordRecent(tool.slug, tool.mode || null); setToolDocumentMetadata(tool);
  if (resolved.status === 'replaced' || requestedMode) setMetaContent('robots', 'noindex,follow');
  root.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="${base}/">Ana səhifə</a><span>/</span><a href="${base}/tools/">Alətlər</a><span>/</span><span>${tool.name}</span></nav>
    <header class="tool-header"><div class="tool-heading category-${tool.category}">${toolIcon(tool)}<div><h1>${tool.name}</h1><p>${tool.description}</p><div class="tool-meta"><span class="badge">${tool.categoryName}</span><span class="badge badge-success">✓ Brauzerdə emal olunur</span></div></div></div><button class="favorite-button" type="button" data-favorite="${tool.slug}" ${tool.mode ? `data-favorite-mode="${tool.mode}"` : ''} aria-label="${tool.name}: ${getFavorites().includes(tool.slug) ? 'seçilmişlərdən çıxar' : 'seçilmişlərə əlavə et'}" aria-pressed="${getFavorites().includes(tool.slug)}">${getFavorites().includes(tool.slug) ? '★' : '☆'}</button></header>
    <div class="workspace">${workspace}</div>
    <section class="related-tools"><div class="section-heading"><div><h2>Oxşar alətlər</h2><p>İş axınınıza uyğun digər seçimlər.</p></div></div><div class="tool-grid">${[...tools.filter((item) => item.slug !== tool.slug && item.category === tool.category), ...tools.filter((item) => item.slug !== tool.slug && item.category !== tool.category)].slice(0,3).map((item) => toolCard(item, base)).join('')}</div></section>`;
  bindResultInvalidation(root);
  const dependency = requiredVendor(tool.kind);
  if (dependency) {
    const workspace = root.querySelector('.workspace');
    const controls = $$('button, input, textarea, select', workspace);
    const disabledStates = controls.map((control) => control.disabled);
    workspace.setAttribute('aria-busy', 'true');
    controls.forEach((control) => { control.disabled = true; });
    try { await loadVendor(dependency); }
    catch {
      workspace.removeAttribute('aria-busy');
      showResult('', `${dependency.label} yüklənmədi. Səhifəni yeniləyin və yenidən cəhd edin.`);
      return;
    }
    workspace.removeAttribute('aria-busy');
    controls.forEach((control, index) => { control.disabled = disabledStates[index]; });
  }
  initToolBehavior(tool);
}

function initFeedback() {
  const form = $('[data-feedback-form]'); if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const draft = ['AzToolBox rəyi', data.get('name') ? `Ad: ${data.get('name')}` : '', data.get('email') ? `E-poçt: ${data.get('email')}` : '', '', String(data.get('message') || '')].filter((line, index) => line || index === 3).join('\n');
    const status = $('[data-feedback-status]');
    status.hidden = false;
    status.innerHTML = `<p>Rəy mətni lokal hazırlandı və serverə göndərilmədi.</p><div class="workspace-actions"><button class="button button-secondary" type="button" data-feedback-copy>Mətni kopyala</button><a class="button button-secondary" data-feedback-email>E-poçtda aç</a></div>`;
    $('[data-feedback-copy]').onclick = (copyEvent) => copyText(draft, copyEvent.currentTarget);
    $('[data-feedback-email]').href = `mailto:?subject=${encodeURIComponent('AzToolBox rəyi')}&body=${encodeURIComponent(draft)}`;
  });
}

if (page === 'home') renderHome();
if (page === 'tools') renderCatalog();
if (page === 'tool') renderToolPage();
if (page === 'feedback') initFeedback();
initReveal();
initMotion();
addEventListener('beforeunload', () => resultLifecycle.dispose());
