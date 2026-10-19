/* Runs before paint. Only local appearance is stored; no account or record data. */
(function () {
  if (window.DormFixAppearance) return;
  const key = 'dormfix-appearance';
  const valid = value => ['light', 'dark'].includes(value);
  // Convert an older System choice once, preserving its appearance as an explicit choice.
  const resolveLegacy = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const listeners = new Set();
  let preference = 'light';
  try {
    const saved = window.localStorage.getItem(key);
    if (valid(saved)) preference = saved;
    else if (saved === 'system') {
      preference = resolveLegacy();
      window.localStorage.setItem(key, preference);
    }
  } catch { /* Appearance remains usable without storage. */ }
  function apply() {
    document.documentElement.dataset.theme = `dormfix-${preference}`;
    document.documentElement.style.colorScheme = preference;
    listeners.forEach(listener => listener());
  }
  window.DormFixAppearance = {
    getPreference: () => preference,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    setPreference: value => {
      if (!valid(value)) return;
      preference = value;
      try { window.localStorage.setItem(key, value); } catch { /* Keep the choice for this document. */ }
      apply();
    },
  };
  window.addEventListener('storage', event => {
    try { if (event.storageArea && event.storageArea !== window.localStorage) return; } catch { return; }
    if (event.key !== key && event.key !== null) return;
    if (event.newValue !== null && !valid(event.newValue) && event.newValue !== 'system') return;
    preference = event.newValue === 'system' ? resolveLegacy() : event.newValue || 'light';
    apply();
  });
  apply();
})();
