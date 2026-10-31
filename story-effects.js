/* Small, cancellable transitions. Media playback remains in app.js. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  const cleanups = new Set();
  let sequence = 0;
  const allowed = () => !reduced.matches && !document.hidden && !document.body.classList.contains('garden-motion-off');

  function play(element, frames, options) {
    if (!element?.animate || !allowed()) return Promise.resolve();
    const animation = element.animate(frames, {duration: 440, easing: 'cubic-bezier(.2,.75,.25,1)', ...options});
    animations.add(animation);
    return animation.finished.catch(() => {}).then(() => {
      animations.delete(animation);
      animation.cancel();
    });
  }

  function cancel() {
    sequence += 1;
    window.GardenGiftMagic?.cancel();
    window.GardenBookMotion?.cancel();
    animations.forEach(animation => animation.cancel());
    animations.clear();
    cleanups.forEach(cleanup => cleanup());
    cleanups.clear();
  }

  function origin(panel, opener) {
    const target = panel.getBoundingClientRect();
    const source = (opener?.querySelector('.object-art') || opener)?.getBoundingClientRect();
    if (!source || !target.width || !target.height) return null;
    const x = source.left + source.width / 2 - target.left - target.width / 2;
    const y = source.top + source.height / 2 - target.top - target.height / 2;
    return `translate(${x}px,${y}px) scale(${Math.max(.14, Math.min(.5, source.width / target.width))},${Math.max(.14, Math.min(.5, source.height / target.height))})`;
  }

  async function open(panel, opener, gift = false) {
    cancel();
    const current = sequence;
    window.GardenBookMotion?.prepare(panel, opener?.dataset.open);
    const bouquet = gift && allowed() ? panel.querySelector('.bouquet-interactive') : null;
    const artworkReady = bouquet?.querySelector('.surprise-bouquet')?.decode?.().catch(() => {});
    const restore = () => { bouquet?.style.removeProperty('visibility'); cleanups.delete(restore); };
    if (bouquet) { bouquet.style.visibility = 'hidden'; cleanups.add(restore); }
    const from = origin(panel, opener);
    if (from) await play(panel, [{opacity: .12, transform: from}, {opacity: 1, transform: 'none'}]);
    if (artworkReady) await artworkReady;
    restore();
    if (current === sequence && panel.open && gift) window.GardenGiftMagic?.reveal(panel);
    if (current === sequence && panel.open && !gift) window.GardenBookMotion?.open(panel);
  }

  async function close(panel, opener) {
    cancel();
    const to = origin(panel, opener);
    if (to) await play(panel, [{opacity: 1, transform: 'none'}, {opacity: 0, transform: to}], {duration: 260});
  }

  function snapshot(spread) {
    if (!allowed() || !spread) return null;
    const photo = spread.querySelector('.album-photo');
    if (!photo) return null;
    const copy = photo.cloneNode(true);
    copy.dataset.pageRest = photo.dataset.pageRest || getComputedStyle(photo).transform;
    copy.classList.remove('is-page-dragging');
    copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    // A turning paper never starts a second media player.
    copy.querySelectorAll('video').forEach(video => {
      const placeholder = document.createElement('div');
      placeholder.className = 'turn-video-memory';
      placeholder.textContent = 'Birthday girl in motion ✿';
      video.replaceWith(placeholder);
    });
    copy.setAttribute('aria-hidden', 'true');
    copy.inert = true;
    return copy;
  }

  function turn(copy, direction, progress = 0) {
    cancel();
    if (!copy || !allowed()) return;
    const spread = document.querySelector('.album-spread');
    const target = spread?.querySelector('.album-photo');
    if (!target) return;
    copy.classList.add('album-turn-sheet');
    Object.assign(copy.style, {
      left: `${target.offsetLeft}px`, top: `${target.offsetTop}px`,
      width: `${target.offsetWidth}px`, height: `${target.offsetHeight}px`,
      transformOrigin: direction > 0 ? '0% 50%' : '100% 50%'
    });
    spread.append(copy);
    const cleanup = () => { copy.remove(); cleanups.delete(cleanup); };
    cleanups.add(cleanup);
    const angle = direction > 0 ? -100 : 100;
    const base = copy.dataset.pageRest === 'none' ? '' : (copy.dataset.pageRest || '');
    const at = amount => window.GardenBookMotion?.pageTransform(base, direction, amount) || `perspective(1000px) rotateY(${angle * amount}deg)`;
    void play(copy, [
      {opacity: 1, transform: at(progress), offset: 0},
      {opacity: .8, transform: at(progress + (1-progress)*.7), offset: .65},
      {opacity: 0, transform: at(1), offset: 1}
    ], {duration: 520 - progress*220}).then(cleanup);
    void play(target, [{opacity: .35, transform: `rotate(${direction > 0 ? 1 : -6}deg) translateX(${direction * 12}px)`}, {opacity: 1, transform: getComputedStyle(target).transform}], {duration: 480});
    void play(spread.querySelector('.album-caption'), [{opacity:0, transform:'translateY(7px)'},{opacity:1, transform:'none'}], {duration:380,delay:100});
  }

  function finishForPreference() {
    if (allowed()) return;
    animations.forEach(animation => { try { animation.finish(); } catch (_) { animation.cancel(); } });
    cleanups.forEach(cleanup => cleanup());
    cleanups.clear();
  }
  reduced.addEventListener('change', finishForPreference);
  new MutationObserver(finishForPreference).observe(document.body, {attributes: true, attributeFilter: ['class']});
  document.addEventListener('visibilitychange', finishForPreference);
  window.addEventListener('pagehide', cancel);
  window.GardenStory = {open, close, cancel, snapshot, turn};
})();
