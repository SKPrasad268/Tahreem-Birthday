/* A flower for each Kinder Joy: the original surprises remain the destinations. */
(() => {
  'use strict';

  const storageKey = 'tahreem-birthday-garden:2026:kinder-opened';
  const ids = Array.from({length: 7}, (_, index) => `kinder-${index + 1}`);
  const valid = new Set(ids);
  let discovered = new Set();

  function readSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return new Set(Array.isArray(saved) ? saved.filter(id => valid.has(id)) : []);
    } catch (_) { return new Set(); }
  }
  discovered = readSaved();

  function label(id, index) {
    return `${discovered.has(id) ? 'Reopen' : 'Open'} Kinder Joy surprise ${index + 1}, ${discovered.has(id) ? 'already discovered' : 'not explored yet'}`;
  }

  function flower(index) {
    return `<svg class="discovery-flower" viewBox="0 0 44 44" aria-hidden="true" focusable="false"><g class="discovery-petals"><ellipse cx="22" cy="12" rx="6.5" ry="9"/><ellipse cx="22" cy="12" rx="6.5" ry="9" transform="rotate(72 22 22)"/><ellipse cx="22" cy="12" rx="6.5" ry="9" transform="rotate(144 22 22)"/><ellipse cx="22" cy="12" rx="6.5" ry="9" transform="rotate(216 22 22)"/><ellipse cx="22" cy="12" rx="6.5" ry="9" transform="rotate(288 22 22)"/></g><circle class="discovery-centre" cx="22" cy="22" r="7.5"/><text x="22" y="25.5" text-anchor="middle">${index + 1}</text></svg>`;
  }

  function status() {
    return discovered.size === ids.length
      ? '7 of 7 little joys discovered · Your bouquet is in bloom.'
      : `${discovered.size} of 7 little joys discovered`;
  }

  function markup() {
    return `<div class="discovery-trail${discovered.size === ids.length ? ' is-complete' : ''}" role="group" aria-label="Your seven Kinder Joy surprises"><div class="discovery-vine">${ids.map((id, index) => `<button class="discovery-bloom${discovered.has(id) ? ' is-discovered' : ''}" type="button" data-kinder="${id}" aria-label="${label(id, index)}">${flower(index)}</button>`).join('')}</div><p class="discovery-status" aria-live="polite" aria-atomic="true">${status()}</p></div>`;
  }

  function attach(container = document) {
    container.querySelectorAll('.discovery-trail').forEach(trail => {
      trail.closest('.bouquet-portrait')?.classList.add('has-discovery-trail');
      trail.classList.toggle('is-complete', discovered.size === ids.length);
      trail.querySelectorAll('.discovery-bloom').forEach(button => {
        const id = button.dataset.kinder;
        const index = ids.indexOf(id);
        if (index < 0) return;
        button.classList.toggle('is-discovered', discovered.has(id));
        button.setAttribute('aria-label', label(id, index));
      });
      const message = trail.querySelector('.discovery-status');
      if (message && message.textContent !== status()) message.textContent = status();
    });
  }

  function opened(id) {
    if (!valid.has(id)) return;
    const firstVisit = !discovered.has(id);
    discovered.add(id);
    try { localStorage.setItem(storageKey, JSON.stringify([...discovered])); } catch (_) { /* Memory-only progress is still useful. */ }
    attach();
    if (firstVisit) document.querySelectorAll('.discovery-bloom').forEach(button => {
      if (button.dataset.kinder === id) button.classList.add('just-discovered');
    });
  }

  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    discovered = readSaved();
    attach();
  });

  window.GardenDiscovery = {markup, opened, attach, has: id => discovered.has(id)};
})();
