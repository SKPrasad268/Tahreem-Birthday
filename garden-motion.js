/* A small, fixed collection of petals: no frame loop or growing particle list. */
(() => {
  'use strict';
  const air = document.getElementById('garden-air');
  const fireflies = document.getElementById('garden-fireflies');
  const toggle = document.getElementById('motion-toggle');
  if (!air || !fireflies || !toggle) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-height: 650px) and (orientation: landscape)');
  const portrait = window.matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  const preferenceKey = 'tahreem-birthday-garden:breeze';
  let enabled = true;
  try { enabled = localStorage.getItem(preferenceKey) !== 'off'; } catch (_) { /* The breeze also works without storage. */ }
  const random = (min,max) => min + Math.random() * (max-min);
  const choose = values => values[Math.floor(Math.random() * values.length)];

  function populateGarden() {
    const small = compact.matches;
    const petals = small ? 8 : 13;
    const leaves = small ? 4 : 7;
    const airFragment = document.createDocumentFragment();
    for (let index=0; index<petals+leaves; index+=1) {
      const leaf = index >= petals;
      const particle = document.createElement('span');
      particle.className = `garden-drifter${leaf ? ' is-leaf' : ''}`;
      const duration = random(12,23);
      particle.style.setProperty('--start-x', `${random(-12,98).toFixed(2)}%`);
      particle.style.setProperty('--size', `${random(leaf ? 13 : 8, leaf ? 23 : 16) * (small ? .8 : 1)}px`);
      particle.style.setProperty('--fall-duration', `${duration.toFixed(2)}s`);
      particle.style.setProperty('--fall-delay', `${(-random(0,duration)).toFixed(2)}s`);
      particle.style.setProperty('--wind-distance', `${random(70,230).toFixed(0)}px`);
      particle.style.setProperty('--sway-width', `${random(12,34).toFixed(0)}px`);
      particle.style.setProperty('--sway-duration', `${random(2.8,5).toFixed(2)}s`);
      particle.style.setProperty('--sway-delay', `${(-random(0,4)).toFixed(2)}s`);
      particle.style.setProperty('--flutter-duration', `${random(5,10).toFixed(2)}s`);
      particle.style.setProperty('--drift-opacity', random(.42,.76).toFixed(2));
      particle.style.setProperty('--petal-color', choose(leaf ? ['#a4ae7d','#b4af77','#8b9a66'] : ['#dca0b7','#e6b4c4','#c5809b','#ecc3cb']));
      const sway = document.createElement('span');
      sway.className = 'garden-drift-sway';
      const shape = document.createElement('span');
      shape.className = 'garden-drift-shape';
      sway.append(shape);particle.append(sway);airFragment.append(particle);
    }
    air.replaceChildren(airFragment);
    const glowFragment = document.createDocumentFragment();
    for(let index=0;index<(small ? 3 : 5);index+=1) {
      const light = document.createElement('span');
      light.className = 'garden-firefly';
      // Lights stay around the planting borders, away from the central greeting.
      light.style.setProperty('--start-x', `${index%2 ? random(79,96) : random(3,21)}%`);
      light.style.setProperty('--start-y', `${random(28,86)}%`);
      light.style.setProperty('--glow-duration', `${random(4,8)}s`);
      light.style.setProperty('--glow-delay', `${-random(0,8)}s`);
      glowFragment.append(light);
    }
    fireflies.replaceChildren(glowFragment);
  }

  function syncBreeze() {
    const active = enabled && !reduced.matches;
    document.body.classList.toggle('garden-motion-paused', !active || document.hidden || portrait.matches);
    document.body.classList.toggle('garden-motion-off', !active);
    toggle.setAttribute('aria-pressed', String(active));
    toggle.disabled = reduced.matches;
    toggle.setAttribute('aria-label', reduced.matches
      ? 'Garden breeze is off to respect your reduced motion setting'
      : active ? 'Pause the garden breeze' : 'Resume the garden breeze');
    const label = toggle.querySelector('[data-motion-label]');
    if (label) label.textContent = active ? 'Breeze on' : 'Breeze off';
  }

  toggle.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem(preferenceKey, enabled ? 'on' : 'off'); } catch (_) { /* Optional preference. */ }
    syncBreeze();
  });
  reduced.addEventListener('change', syncBreeze);
  portrait.addEventListener('change', syncBreeze);
  compact.addEventListener('change', () => { populateGarden();syncBreeze(); });
  document.addEventListener('visibilitychange', syncBreeze);
  populateGarden();syncBreeze();
})();
