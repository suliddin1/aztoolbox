import { tools, categories, toolUrl } from './tools-data.js';
import { readStoredList, sanitizeToolSlugs, writeStoredList } from './batch5-tools.js';

const themeKey = 'aztoolbox-theme';
const favoriteKey = 'aztoolbox-favorites';
const recentKey = 'aztoolbox-recent';
const validToolSlugs = new Set(tools.map((tool) => tool.slug));

export const getBase = () => document.body.dataset.base || '.';
export const readList = (key) => readStoredList(localStorage, key);
export const writeList = (key, value) => writeStoredList(localStorage, key, value);
export const getFavorites = () => sanitizeToolSlugs(readList(favoriteKey), validToolSlugs);
export const getRecent = () => sanitizeToolSlugs(readList(recentKey), validToolSlugs, 8);
export const recordRecent = (slug) => {
  const next = [slug, ...getRecent().filter((item) => item !== slug)].slice(0, 8);
  writeList(recentKey, next);
};
export const toggleFavorite = (slug) => {
  const current = getFavorites();
  const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
  writeList(favoriteKey, next);
  document.dispatchEvent(new CustomEvent('favoriteschange', { detail: next }));
  return next.includes(slug);
};

export const toolIcon = (tool, extra = '') => `<span class="tool-icon category-${tool.category} ${extra}" aria-hidden="true">${tool.icon}</span>`;

export const toolCard = (tool, base = getBase()) => {
  const favorite = getFavorites().includes(tool.slug);
  return `<article class="tool-card category-${tool.category}" data-tool-card data-slug="${tool.slug}" data-category="${tool.category}" data-search="${[tool.name, tool.description, ...tool.keywords].join(' ').toLocaleLowerCase('az')}">
    <div class="tool-card-top">
      ${toolIcon(tool)}
      <button class="favorite-button" type="button" data-favorite="${tool.slug}" aria-label="${tool.name}: ${favorite ? 'seçilmişlərdən çıxar' : 'seçilmişlərə əlavə et'}" aria-pressed="${favorite}">${favorite ? '★' : '☆'}</button>
    </div>
    <h3><a href="${toolUrl(base, tool.slug)}">${tool.name}</a></h3>
    <p>${tool.description}</p>
    <div class="tool-card-footer"><span>${tool.categoryName}</span><span aria-hidden="true">→</span></div>
  </article>`;
};

function setTheme(preference) {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = preference === 'system' ? (dark ? 'dark' : 'light') : preference;
  try { localStorage.setItem(themeKey, preference); } catch {}
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#070b14' : '#f7f9fd');
  document.querySelectorAll('[data-theme-option]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.themeOption === preference)));
  document.dispatchEvent(new CustomEvent('themechange', { detail: { preference, resolved } }));
}

function categoryLink(category, base, activeCategory) {
  return `<a class="sidebar-link category-${category.id}" data-sidebar-category="${category.id}" href="${base}/tools/?category=${category.id}" ${activeCategory === category.id ? 'aria-current="page"' : ''}>${toolIcon({ category: category.id, icon: String(category.count).padStart(2, '0') })}<span><strong>${category.name}</strong><small>${category.count} alət</small></span></a>`;
}

export class AzHeader extends HTMLElement {
  connectedCallback() {
    const base = getBase();
    const page = document.body.dataset.page;
    if (document.querySelector('main') && !document.querySelector('main').id) document.querySelector('main').id = 'main-content';
    const params = new URLSearchParams(location.search);
    const activeCategory = params.get('category');
    this.innerHTML = `<a class="skip-link" href="#main-content">Əsas məzmuna keç</a>
      <header class="site-header" data-site-header>
        <div class="header-inner">
          <a class="brand mobile-brand" href="${base}/"><b>Az</b>ToolBox</a>
          <nav class="desktop-nav" aria-label="Əsas naviqasiya">
            <a href="${base}/tools/" ${page === 'tools' ? 'aria-current="page"' : ''}>Alətlər</a>
            <a href="${base}/tools/?view=favorites">Seçilmişlər</a>
            <a href="${base}/tools/?view=recent">Son istifadə</a>
            <a href="${base}/about/" ${page === 'about' ? 'aria-current="page"' : ''}>Haqqında</a>
          </nav>
          <div class="header-actions">
            <button class="header-search" type="button" data-open-search aria-label="Alət axtarışını aç"><span>⌕ &nbsp; Axtar</span><kbd>Ctrl K</kbd></button>
            <button class="icon-button" type="button" data-theme-toggle aria-label="Tema seçimini aç" aria-expanded="false">◐</button>
            <button class="icon-button mobile-menu-button" type="button" data-mobile-toggle aria-label="Mobil menyunu aç" aria-expanded="false">☰</button>
            <div class="theme-popover" data-theme-popover hidden>
              ${[['light','İşıqlı','☀'],['dark','Qaranlıq','☾'],['system','Sistem','◐']].map(([value,label,icon]) => `<button class="theme-option" type="button" data-theme-option="${value}" aria-pressed="false"><strong>${icon} ${label}</strong><span>${value === 'system' ? 'Avtomatik' : ''}</span></button>`).join('')}
            </div>
          </div>
        </div>
      </header>
      <aside class="app-sidebar" data-app-sidebar aria-label="Alət naviqasiyası">
        <a class="brand sidebar-brand" href="${base}/"><b>Az</b>ToolBox</a>
        <nav class="sidebar-nav">
          <div class="sidebar-label">Kateqoriyalar</div>
          <a class="sidebar-link sidebar-link-all" data-sidebar-category="all" href="${base}/tools/" ${page === 'tools' && !activeCategory && !params.get('view') ? 'aria-current="page"' : ''}><span class="sidebar-symbol" aria-hidden="true">⌂</span><span><strong>Hamısı</strong><small>${tools.length} alət</small></span></a>
          ${categories.map((category) => categoryLink(category, base, activeCategory)).join('')}
          <div class="sidebar-separator"></div>
          <div class="sidebar-label">Kitabxananız</div>
          <a class="sidebar-link sidebar-link-simple" href="${base}/tools/?view=favorites" ${params.get('view') === 'favorites' ? 'aria-current="page"' : ''}><span class="sidebar-symbol" aria-hidden="true">♡</span><span><strong>Seçilmişlər</strong></span></a>
          <a class="sidebar-link sidebar-link-simple" href="${base}/tools/?view=recent" ${params.get('view') === 'recent' ? 'aria-current="page"' : ''}><span class="sidebar-symbol" aria-hidden="true">◷</span><span><strong>Son istifadə</strong></span></a>
        </nav>
        <a class="sidebar-feedback" href="${base}/feedback/">Rəy və təklif bildir <span>→</span></a>
      </aside>
      <div class="mobile-backdrop" data-mobile-backdrop hidden></div>
      <div class="mobile-panel" data-mobile-panel hidden role="dialog" aria-modal="true" aria-label="Mobil menyu">
        <div class="mobile-panel-head"><strong>Naviqasiya</strong><button class="icon-button" type="button" data-mobile-close aria-label="Mobil menyunu bağla">×</button></div>
        <nav class="mobile-nav" aria-label="Mobil naviqasiya">
          <a href="${base}/tools/">Bütün alətlər <span>${tools.length}</span></a>
          ${categories.map((category) => `<a href="${base}/tools/?category=${category.id}">${category.name}<span>${category.count}</span></a>`).join('')}
          <a href="${base}/tools/?view=favorites">Seçilmişlər</a><a href="${base}/tools/?view=recent">Son istifadə</a><a href="${base}/about/">Haqqında</a>
        </nav>
        <div class="mobile-theme"><strong>Görünüş</strong><div class="mobile-theme-options">
          ${[['light','☀ İşıqlı'],['dark','☾ Qaranlıq'],['system','◐ Sistem']].map(([value,label]) => `<button class="filter-button" type="button" data-theme-option="${value}" aria-pressed="false">${label}</button>`).join('')}
        </div></div>
      </div>
      <div class="search-dialog" data-search-dialog hidden role="dialog" aria-modal="true" aria-labelledby="search-title">
        <div class="search-box">
          <div class="search-input-row"><span aria-hidden="true">⌕</span><label class="sr-only" for="global-tool-search">Alət axtar</label><input id="global-tool-search" type="search" data-global-search placeholder="Nə etmək istəyirsiniz?" /><button class="icon-button" type="button" data-close-search aria-label="Axtarışı bağla">×</button></div>
          <div class="search-list-head"><strong id="search-title" data-search-title>Tez istifadə olunanlar</strong><span data-search-count></span></div>
          <div class="search-list" data-global-results></div>
        </div>
      </div>`;
    this.bind();
  }

  bind() {
    const header = this.querySelector('[data-site-header]');
    const toggle = this.querySelector('[data-theme-toggle]');
    const popover = this.querySelector('[data-theme-popover]');
    const mobileToggle = this.querySelector('[data-mobile-toggle]');
    const mobilePanel = this.querySelector('[data-mobile-panel]');
    const mobileBackdrop = this.querySelector('[data-mobile-backdrop]');
    const dialog = this.querySelector('[data-search-dialog]');
    const searchBox = this.querySelector('.search-box');
    const input = this.querySelector('[data-global-search]');
    const results = this.querySelector('[data-global-results]');
    const searchTitle = this.querySelector('[data-search-title]');
    const searchCount = this.querySelector('[data-search-count]');
    const preference = document.documentElement.dataset.themePreference || 'light';
    let lastFocus = null;
    let menuTimer = null;
    let searchClosing = false;

    this.querySelectorAll('[data-theme-option]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.themeOption === preference)));
    this.addEventListener('click', (event) => {
      const option = event.target.closest('[data-theme-option]');
      if (!option) return;
      setTheme(option.dataset.themeOption);
      popover.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    });

    const onScroll = () => header.classList.toggle('scrolled', scrollY > 10);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    toggle.addEventListener('click', () => {
      popover.hidden = !popover.hidden;
      toggle.setAttribute('aria-expanded', String(!popover.hidden));
      if (!popover.hidden) popover.querySelector('[data-theme-option][aria-pressed="true"]')?.focus();
    });

    const setPageInert = (inert) => {
      document.querySelectorAll('main, az-footer, .site-header, .app-sidebar').forEach((element) => { element.inert = inert; });
    };

    const openMenu = () => {
      clearTimeout(menuTimer);
      lastFocus = document.activeElement;
      mobilePanel.hidden = false;
      mobileBackdrop.hidden = false;
      setPageInert(true);
      document.body.classList.add('menu-open');
      mobileToggle.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => mobilePanel.classList.add('open'));
      mobilePanel.querySelector('[data-mobile-close]').focus();
    };
    const closeMenu = () => {
      mobilePanel.classList.remove('open');
      document.body.classList.remove('menu-open');
      setPageInert(false);
      mobileToggle.setAttribute('aria-expanded', 'false');
      menuTimer = setTimeout(() => { mobilePanel.hidden = true; mobileBackdrop.hidden = true; }, 220);
      lastFocus?.focus();
    };
    mobileToggle.addEventListener('click', openMenu);
    this.querySelector('[data-mobile-close]').addEventListener('click', closeMenu);
    mobileBackdrop.addEventListener('click', closeMenu);
    mobilePanel.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });

    const render = (query = '') => {
      const value = query.trim().toLocaleLowerCase('az');
      const recent = getRecent().map((slug) => tools.find((tool) => tool.slug === slug)).filter(Boolean);
      const starting = recent.length ? recent : tools.filter((tool) => tool.featured);
      const matches = value ? tools.filter((tool) => [tool.name, tool.description, ...tool.keywords].join(' ').toLocaleLowerCase('az').includes(value)) : starting;
      const visible = matches.slice(0, 12);
      searchTitle.textContent = value ? 'Axtarış nəticələri' : recent.length ? 'Son istifadə' : 'Tez istifadə olunanlar';
      searchCount.textContent = value ? `${matches.length} nəticə` : '';
      results.innerHTML = visible.length ? visible.map((tool, index) => `<a class="search-item" style="--search-index:${index}" href="${toolUrl(getBase(), tool.slug)}">${toolIcon(tool)}<span><strong>${tool.name}</strong><small>${tool.description}</small></span><b aria-hidden="true">→</b></a>`).join('') : `<div class="search-empty"><strong>Uyğun alət tapılmadı</strong><span>Başqa söz yazın və ya kateqoriyalardan seçim edin.</span><a class="button button-secondary" href="${getBase()}/tools/">Bütün alətlərə bax</a></div>`;
    };
    const searchMotion = (from, to, options) => searchBox.animate([
      { transform: from.transform, opacity: from.opacity, borderRadius: from.radius },
      { transform: to.transform, opacity: to.opacity, borderRadius: to.radius }
    ], options);
    const searchOrigin = () => {
      const source = lastFocus?.getBoundingClientRect?.();
      const target = searchBox.getBoundingClientRect();
      if (!source || !source.width || !target.width) return { transform: 'translate3d(0, -12px, 0) scale(.96)', opacity: .4, radius: '14px' };
      const dx = source.left + source.width / 2 - (target.left + target.width / 2);
      const dy = source.top + source.height / 2 - (target.top + target.height / 2);
      const sx = Math.max(.2, Math.min(1, source.width / target.width));
      const sy = Math.max(.12, Math.min(1, source.height / target.height));
      return { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`, opacity: .5, radius: '12px' };
    };
    const openSearch = (opener = document.activeElement) => {
      if (!dialog.hidden || searchClosing) return;
      lastFocus = opener;
      dialog.hidden = false;
      document.body.classList.add('dialog-open');
      setPageInert(true);
      render('');
      requestAnimationFrame(() => {
        dialog.classList.add('is-open');
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
          searchMotion(searchOrigin(), { transform: 'none', opacity: 1, radius: '20px' }, { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
          dialog.animate([{ backgroundColor:'rgba(5,12,25,0)', backdropFilter:'blur(0px)' }, { backgroundColor:'rgba(5,12,25,.45)', backdropFilter:'blur(10px)' }], { duration: 260, easing:'ease-out' });
        }
        input.focus();
      });
    };
    const closeSearch = () => {
      if (dialog.hidden || searchClosing) return;
      searchClosing = true;
      dialog.classList.remove('is-open');
      const finish = () => {
        dialog.hidden = true;
        searchClosing = false;
        document.body.classList.remove('dialog-open');
        setPageInert(false);
        lastFocus?.focus();
      };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
      const boxAnimation = searchMotion({ transform:'none', opacity:1, radius:'20px' }, searchOrigin(), { duration: 220, easing:'cubic-bezier(.4,0,1,1)', fill:'both' });
      const backdropAnimation = dialog.animate([{ backgroundColor:'rgba(5,12,25,.45)', backdropFilter:'blur(10px)' }, { backgroundColor:'rgba(5,12,25,0)', backdropFilter:'blur(0px)' }], { duration:220, easing:'ease-in', fill:'both' });
      Promise.allSettled([boxAnimation.finished, backdropAnimation.finished]).then(finish);
    };
    this.querySelector('[data-open-search]').addEventListener('click', (event) => openSearch(event.currentTarget));
    this.querySelector('[data-close-search]').addEventListener('click', closeSearch);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) closeSearch(); });
    input.addEventListener('input', () => render(input.value));
    document.addEventListener('click', (event) => {
      const opener = event.target.closest('[data-open-global-search]');
      if (opener) openSearch(opener);
    });
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(document.activeElement); }
      if (event.key === 'Escape') {
        if (!dialog.hidden) closeSearch();
        else if (!mobilePanel.hidden) closeMenu();
        else if (!popover.hidden) { popover.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
      }
      if (event.key === 'Tab' && !dialog.hidden) {
        const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')];
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      if (event.key === 'Tab' && dialog.hidden && !mobilePanel.hidden) {
        const focusable = [...mobilePanel.querySelectorAll('a[href], button:not([disabled])')];
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }
}

export class AzFooter extends HTMLElement {
  connectedCallback() {
    const base = getBase();
    this.innerHTML = `<footer class="site-footer"><div class="footer-inner">
      <div class="footer-brand"><a class="brand" href="${base}/"><b>Az</b>ToolBox</a><p>Gündəlik rəqəmsal işlər üçün sürətli və məxfi brauzer alətləri.</p></div>
      <div class="footer-column"><strong>Alətlər</strong><a href="${base}/tools/">Bütün alətlər</a><a href="${base}/tools/?view=favorites">Seçilmişlər</a><a href="${base}/tools/?view=recent">Son istifadə</a></div>
      <div class="footer-column"><strong>Məlumat</strong><a href="${base}/about/">Haqqımızda</a><a href="${base}/privacy/">Məxfilik</a><a href="${base}/feedback/">Rəy bildir</a></div>
    </div><div class="footer-bottom"><span>© 2026 AzToolBox</span><span>Məlumatlarınız mümkün olduqda cihazınızda emal olunur.</span></div></footer>`;
  }
}

customElements.define('az-header', AzHeader);
customElements.define('az-footer', AzFooter);

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-favorite]');
  if (!button) return;
  const active = toggleFavorite(button.dataset.favorite);
  button.setAttribute('aria-pressed', String(active));
  button.setAttribute('aria-label', `${button.dataset.favorite}: ${active ? 'seçilmişlərdən çıxar' : 'seçilmişlərə əlavə et'}`);
  button.textContent = active ? '★' : '☆';
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  let preference = 'light';
  try { preference = localStorage.getItem(themeKey) || 'light'; } catch {}
  if (preference === 'system') setTheme('system');
});
