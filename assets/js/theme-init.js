(() => {
  const key = 'aztoolbox-theme';
  const saved = localStorage.getItem(key) || 'light';
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = saved === 'system' ? (dark ? 'dark' : 'light') : saved;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = saved;
})();
