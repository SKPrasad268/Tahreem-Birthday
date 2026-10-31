/* Carry a surprise into its view, then return it to the same spot in the bouquet. */
(() => {
  'use strict';
  const panel = document.getElementById('experience-dialog');
  const body = document.getElementById('dialog-body');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  let current = null;
  let serial = 0;
  const allowed = () => panel?.open && !!Element.prototype.animate && !reduced.matches
    && !portrait.matches && !document.hidden && !document.body.classList.contains('garden-motion-off');

  function decorate(container) {
    const envelope = '<svg viewBox="0 0 100 76" fill="none"><rect x="5" y="9" width="90" height="60" rx="4" fill="#edc8d4" stroke="#c895a7" stroke-width="2"/><path d="m6 67 44-33 44 33" fill="#f6dce4" stroke="#d9adbd" stroke-width="2"/><path d="M6 11 50 44 94 11" fill="#fae6ea" stroke="#d9adbd" stroke-width="2"/><circle cx="50" cy="43" r="11" fill="#bb7c96"/><path d="M50 36v14m-7-7h14m-12-5 10 10m-10 0 10-10" stroke="#fff0d8" stroke-width="2"/></svg>';
    container.querySelectorAll('.gift-option').forEach(button => {
      const icon = button.querySelector('.gift-option-icon');
      if (!icon) return;
      icon.classList.add('gift-route-icon');
      if (button.dataset.gift === 'cake' && window.GardenCakeArt) {
        icon.innerHTML = window.GardenCakeArt.cakeSvg().replace('viewBox="0 0 560 380"', 'viewBox="130 0 360 375"');
      } else {
        icon.innerHTML = envelope;
        if (button.dataset.gift === 'notes') icon.classList.add('gift-route-notes-icon');
      }
    });
  }

  function menuArt(button) {
    return button?.querySelector('.gift-option-icon, .kinder-egg-piece') || button;
  }

  function viewArt(kind) {
    const selector = kind === 'letter' ? '.reading-envelope-art, .letter-paper'
      : kind === 'notes' ? '.openwhen-grid, .reading-envelope-art, .note-paper'
      : kind === 'cake' ? '.cake-theatre' : '.kinder-opening';
    // An opened envelope is removed; its unfolded paper becomes the return object.
    for (const part of selector.split(',')) {
      const node = [...body.querySelectorAll(part)].find(candidate => {
        const box = candidate.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && getComputedStyle(candidate).visibility !== 'hidden';
      });
      if (node) return node;
    }
  }

  function visible(box) {
    const bounds = panel.getBoundingClientRect();
    const header = panel.querySelector('.dialog-header').getBoundingClientRect();
    return box?.width > 0 && box.height > 0 && box.bottom > header.bottom
      && box.top < bounds.bottom && box.right > bounds.left && box.left < bounds.right;
  }

  function cancel() {
    const state = current;
    if (!state) return;
    current = null;
    clearTimeout(state.timer);
    state.animations.forEach(animation => animation.cancel());
    state.paused.forEach(animation => {
      if (animation.effect?.target?.isConnected && animation.playState === 'paused') animation.play();
    });
    state.ghost?.remove();
    panel.removeAttribute('data-surprise-transition');
  }

  function snapshot(element, box) {
    if (!element || !visible(box)) return null;
    const clone = element.cloneNode(true);
    const originals = [element, ...element.querySelectorAll('*')];
    const copies = [clone, ...clone.querySelectorAll('*')];
    const ids = new Map();
    const prefix = `gift-flight-${++serial}-`;
    originals.forEach((node, index) => {
      const style = getComputedStyle(node);
      copies[index].style.transform = style.transform;
      copies[index].style.opacity = style.opacity;
      if (copies[index].id) {
        ids.set(copies[index].id, prefix + copies[index].id);
        copies[index].id = prefix + copies[index].id;
      }
      copies[index].removeAttribute('autofocus');
      copies[index].removeAttribute('aria-controls');
    });
    // Keep SVG paint references local to the flight, including the cake's gradients.
    copies.forEach(node => [...node.attributes].forEach(attribute => {
      let value = attribute.value;
      ids.forEach((next, old) => {
        value = value.split(`url(#${old})`).join(`url(#${next})`);
        if (value === `#${old}`) value = `#${next}`;
      });
      if (value !== attribute.value) node.setAttribute(attribute.name, value);
    }));
    const ghost = document.createElement('div');
    ghost.className = 'gift-route-flight';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.inert = true;
    Object.assign(ghost.style, {left:`${box.left}px`, top:`${box.top}px`, width:`${box.width}px`, height:`${box.height}px`});
    Object.assign(clone.style, {position:'relative', inset:'auto', width:'100%', height:'100%', maxWidth:'none', margin:'0', transform:'none'});
    ghost.append(clone);
    return ghost;
  }

  function navigate({kind, opener, render, returning = false, destination}) {
    cancel();
    const animate = allowed();
    const origin = returning ? viewArt(kind) : menuArt(opener);
    const from = origin?.getBoundingClientRect();
    const fromVisible = animate && visible(from);
    const ghost = animate && returning ? snapshot(origin, from) : null;
    render(); // Navigation and focus stay immediate, even if motion is interrupted.
    const target = returning ? menuArt(destination?.()) : viewArt(kind);
    const to = target?.getBoundingClientRect();
    if (!fromVisible || !allowed() || !visible(to) || !target) return;

    const state = {animations:[], paused:[], ghost, timer:0};
    current = state;
    panel.dataset.surpriseTransition = returning ? 'returning' : 'opening';
    // Let the shell/flower and stationery reveals start after the journey finishes.
    (body.getAnimations?.({subtree:true}) || []).forEach(animation => {
      if (animation.playState === 'running') { animation.pause(); state.paused.push(animation); }
    });
    const duration = returning ? 460 : 580;
    const play = (node, frames, options = {}) => {
      const animation = node.animate(frames, {duration, easing:'cubic-bezier(.18,.76,.22,1)', fill:'both', ...options});
      state.animations.push(animation);
      animation.finished.catch(() => {});
    };
    play(body, [{opacity:.35}, {opacity:1}], {duration:duration-60});

    if (returning && ghost) {
      panel.append(ghost);
      const dx = to.left + to.width/2 - from.left - from.width/2;
      const dy = to.top + to.height/2 - from.top - from.height/2;
      play(ghost, [
        {transform:'none', opacity:1},
        {transform:`translate(${dx*.65}px,${dy*.65-12}px) scale(${.35+to.width/from.width*.65},${.35+to.height/from.height*.65})`, opacity:.9, offset:.65},
        {transform:`translate(${dx}px,${dy}px) scale(${to.width/from.width},${to.height/from.height})`, opacity:.25}
      ]);
      play(target, [{opacity:0, offset:0}, {opacity:0, offset:.65}, {opacity:1}]);
    } else {
      const dx = from.left + from.width/2 - to.left - to.width/2;
      const dy = from.top + from.height/2 - to.top - to.height/2;
      play(target, [
        {transform:`translate(${dx}px,${dy}px) scale(${from.width/to.width},${from.height/to.height})`, opacity:.8},
        {transform:'translate(0,-7px) scale(1.025)', opacity:1, offset:.8},
        {transform:'none', opacity:1}
      ]);
    }
    state.timer = setTimeout(() => { if (current === state) cancel(); }, duration + 20);
  }

  reduced.addEventListener('change', cancel);
  portrait.addEventListener('change', cancel);
  window.addEventListener('resize', cancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  new MutationObserver(() => { if (!allowed()) cancel(); }).observe(document.body, {attributes:true, attributeFilter:['class']});
  window.addEventListener('birthday-object-opened', cancel);
  window.addEventListener('pagehide', cancel);
  panel?.addEventListener('close', cancel);
  window.GardenSurpriseMotion = {decorate, navigate, cancel};
})();
