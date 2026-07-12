const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

function initPointerSurfaces() {
  if (!finePointer() || reducedMotion()) return;
  const selector = '.dashboard-search, .dashboard-category-card, .quick-tool-card, .tool-card';
  document.querySelectorAll(selector).forEach((surface) => {
    if (surface.dataset.motionPointer === 'true') return;
    surface.dataset.motionPointer = 'true';
    let frame = 0;
    const update = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = surface.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const px = x / Math.max(1, rect.width) - .5;
        const py = y / Math.max(1, rect.height) - .5;
        surface.style.setProperty('--pointer-x', `${x}px`);
        surface.style.setProperty('--pointer-y', `${y}px`);
        if (!surface.classList.contains('dashboard-search')) {
          surface.style.setProperty('--tilt-x', `${(-py * 1.8).toFixed(2)}deg`);
          surface.style.setProperty('--tilt-y', `${(px * 1.8).toFixed(2)}deg`);
          surface.style.setProperty('--icon-x', `${(px * 4).toFixed(2)}px`);
          surface.style.setProperty('--icon-y', `${(py * 4).toFixed(2)}px`);
        }
      });
    };
    surface.addEventListener('pointerenter', () => surface.classList.add('is-pointer-active'));
    surface.addEventListener('pointermove', update, { passive: true });
    surface.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      surface.classList.remove('is-pointer-active');
      surface.style.setProperty('--tilt-x', '0deg');
      surface.style.setProperty('--tilt-y', '0deg');
      surface.style.setProperty('--icon-x', '0px');
      surface.style.setProperty('--icon-y', '0px');
    });
  });
}

function initMotionGrids() {
  const grids = [...document.querySelectorAll('[data-motion-grid]')];
  if (!grids.length) return;
  const prepare = (grid) => {
    [...grid.children].forEach((child, index) => child.style.setProperty('--motion-index', String(Math.min(index, 12))));
  };
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    prepare(entry.target);
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  }), { threshold: .08, rootMargin: '0px 0px -5% 0px' });
  grids.forEach((grid) => {
    prepare(grid);
    observer.observe(grid);
    new MutationObserver(() => {
      prepare(grid);
      if (grid.classList.contains('is-visible')) requestAnimationFrame(() => [...grid.children].forEach((child) => child.classList.add('motion-settled')));
      initPointerSurfaces();
    }).observe(grid, { childList: true });
  });
}

function positionGlider(container, active, glider, vertical = false) {
  if (!active) { glider.hidden = true; return; }
  glider.hidden = false;
  if (vertical) {
    glider.style.height = `${active.offsetHeight}px`;
    glider.style.transform = `translate3d(0, ${active.offsetTop}px, 0)`;
  } else {
    glider.style.width = `${active.offsetWidth}px`;
    glider.style.transform = `translate3d(${active.offsetLeft}px, 0, 0)`;
  }
}

function initGliders() {
  const sidebar = document.querySelector('.sidebar-nav');
  if (sidebar) {
    const glider = document.createElement('span');
    glider.className = 'sidebar-glider';
    glider.setAttribute('aria-hidden', 'true');
    sidebar.prepend(glider);
    const update = () => positionGlider(sidebar, sidebar.querySelector('.sidebar-link[aria-current="page"]'), glider, true);
    requestAnimationFrame(update);
    new MutationObserver(update).observe(sidebar, { attributes: true, subtree: true, attributeFilter: ['aria-current'] });
    addEventListener('resize', update, { passive: true });
  }
  const filters = document.querySelector('[data-filter-row]');
  if (filters) {
    const glider = document.createElement('span');
    glider.className = 'filter-glider';
    glider.setAttribute('aria-hidden', 'true');
    filters.prepend(glider);
    const update = () => positionGlider(filters, filters.querySelector('[aria-pressed="true"]'), glider);
    requestAnimationFrame(update);
    filters.addEventListener('click', () => requestAnimationFrame(update));
    new MutationObserver(update).observe(filters, { attributes: true, subtree: true, attributeFilter: ['aria-pressed'] });
    addEventListener('resize', update, { passive: true });
  }
}

function initNavigationMotion() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('.tool-card h3 a, .quick-tool-card a');
    if (!link) return;
    const card = link.closest('.tool-card, .quick-tool-card');
    card?.classList.add('is-navigating');
  }, { capture: true });
}

export function initMotion() {
  document.documentElement.classList.add('motion-ready');
  initMotionGrids();
  initPointerSurfaces();
  initGliders();
  initNavigationMotion();
}
