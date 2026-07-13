(() => {
  const key = 'aztoolbox-theme';
  let saved = 'light';
  try { saved = localStorage.getItem(key) || 'light'; } catch {}
  if (!['light', 'dark', 'system'].includes(saved)) saved = 'light';
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = saved === 'system' ? (dark ? 'dark' : 'light') : saved;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = saved;
})();
