/* Short arrivals and pointer depth; the birthday table always stays still. */
(() => {
  'use strict';
  const garden = document.getElementById('garden');
  if (!garden) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const portrait = window.matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  const supportsTranslate = !!window.CSS?.supports('translate', '1px 1px');
  let arrivalPlayed = false;
  let arrivalTimer = null;
  let depthFrame = 0;
  let depthX = 0;
  let depthY = 0;
  const arrivals = [garden.querySelector('.garden-title'), ...garden.querySelectorAll('.table-object')].filter(Boolean);
  // DOM order is not the visual order of the table: the gift sits after Nakhre.
  const objects = arrivals.slice(1).sort((left, right) => left.offsetLeft - right.offsetLeft);
  const orderedArrivals = [arrivals[0], ...objects].filter(Boolean);

  function motionAllowed() {
    return !reduced.matches && !document.hidden && !portrait.matches
      && !document.body.classList.contains('garden-motion-off')
      && !document.body.classList.contains('garden-motion-paused');
  }

  function finishArrival() {
    window.clearTimeout(arrivalTimer);
    arrivalTimer = null;
    for (const element of orderedArrivals) {
      element.classList.remove('ambient-arrival');
      element.style.removeProperty('--arrival-delay');
    }
  }

  function enterGarden() {
    if (arrivalPlayed) return;
    arrivalPlayed = true;
    if (window.GardenEntrance) { window.GardenEntrance.start(); return; }
    if (!motionAllowed() || !supportsTranslate) return;
    orderedArrivals.forEach((element, index) => {
      element.style.setProperty('--arrival-delay', `${index === 0 ? 0 : 120 + index * 85}ms`);
      element.classList.add('ambient-arrival');
    });
    // No hidden base state: even interrupted animations end in the usable garden.
    arrivalTimer = window.setTimeout(finishArrival, 1250);
  }

  function resetDepth() {
    window.cancelAnimationFrame(depthFrame);
    depthFrame = 0;
    depthX = depthY = 0;
    garden.style.removeProperty('--garden-depth-x');
    garden.style.removeProperty('--garden-depth-y');
  }

  function depthAllowed() {
    return supportsTranslate && finePointer.matches && motionAllowed()
      && !garden.classList.contains('garden-is-entering')
      && !document.body.dataset.openObject
      && !document.getElementById('welcome-dialog')?.open
      && document.getElementById('radio-player')?.hidden !== false;
  }

  function syncMotion() {
    if (!motionAllowed()) finishArrival();
    garden.classList.toggle('garden-depth-ready', supportsTranslate && finePointer.matches && motionAllowed());
    if (!depthAllowed()) resetDepth();
  }

  garden.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !depthAllowed()) return;
    const bounds = garden.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    depthX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    depthY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    if (depthFrame) return;
    depthFrame = window.requestAnimationFrame(() => {
      depthFrame = 0;
      if (!depthAllowed()) { resetDepth(); return; }
      garden.style.setProperty('--garden-depth-x', `${(depthX * 5).toFixed(2)}px`);
      garden.style.setProperty('--garden-depth-y', `${(depthY * 4).toFixed(2)}px`);
    });
  }, {passive: true});
  garden.addEventListener('pointerleave', resetDepth, {passive: true});
  garden.addEventListener('pointerdown', finishArrival, {passive: true});
  document.addEventListener('keydown', finishArrival);
  window.addEventListener('birthday-entered', enterGarden);
  window.addEventListener('birthday-object-opened', () => { finishArrival(); resetDepth(); });
  window.addEventListener('birthday-radio-playing', () => { finishArrival(); resetDepth(); });
  window.addEventListener('blur', resetDepth);
  window.addEventListener('resize', resetDepth, {passive: true});
  window.addEventListener('pagehide', () => { finishArrival(); resetDepth(); });
  document.addEventListener('visibilitychange', syncMotion);
  reduced.addEventListener('change', syncMotion);
  finePointer.addEventListener('change', syncMotion);
  portrait.addEventListener('change', syncMotion);
  new MutationObserver(syncMotion).observe(document.body, {attributes: true, attributeFilter: ['class', 'data-open-object']});
  syncMotion();
})();
