/* A small birthday cartoon, with one clock and one owner for every callback. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  let active = null;
  const motionAllowed = () => !reduced.matches && !portrait.matches && !document.hidden
    && !document.body.classList.contains('garden-motion-off');

  function setPhase(state, phase) {
    state.scene.dataset.cakePhase = phase;
  }

  function finalPose(state) {
    state.scene.classList.remove('is-blowing');
    state.scene.classList.toggle('is-out', state.blown || state.initiallyOut);
    state.scene.classList.toggle('is-knocked-out', state.blown);
    state.helper.style.transform = state.blown ? 'translate(812.5%,0) rotate(90deg)' : 'none';
    setPhase(state, state.blown ? 'finished' : 'ready');
  }

  function clearWork(state) {
    state.timers.forEach(timer => clearTimeout(timer));
    state.timers.clear();
    state.animations.forEach(animation => animation.cancel());
    state.animations.clear();
  }

  function finish(state, cancelled = false) {
    if (active !== state) return;
    active = null;
    clearWork(state);
    finalPose(state);
    state.onFinished?.({cancelled, blown: state.blown});
  }

  function cancel() {
    if (active) finish(active, true);
  }

  function blow(state) {
    if (active !== state || state.blown) return;
    state.blown = true;
    state.scene.classList.add('is-out');
    state.onBlown?.();
  }

  function animate(state, frames, duration, end) {
    if (active !== state) return;
    state.helper.style.transform = end;
    if (!state.helper.animate) return;
    const animation = state.helper.animate(frames.map(frame => ({
      ...frame,
      transform: frame.transform.replace(/(-?\d+(?:\.\d+)?)u/g, (_, value) => `${Number(value) * state.scale}px`)
    })), {duration, easing: 'linear'});
    state.animations.add(animation);
    const done = () => state.animations.delete(animation);
    animation.addEventListener('finish', done, {once: true});
    animation.addEventListener('cancel', done, {once: true});
  }

  function at(state, delay, action) {
    const timer = setTimeout(() => {
      state.timers.delete(timer);
      if (active !== state) return;
      if (!state.scene.isConnected || !state.scene.closest('dialog[open]')) { cancel(); return; }
      action();
    }, delay);
    state.timers.add(timer);
  }

  function run(scene, {onBlown, onFinished} = {}) {
    cancel();
    const helper = scene?.querySelector('.cake-helper');
    if (!scene || !helper || !scene.isConnected) return false;
    const state = {scene, helper, onBlown, onFinished, blown: false, initiallyOut: scene.classList.contains('is-out'),
      scale: scene.clientWidth / 560, timers: new Set(), animations: new Set()};
    active = state;
    scene.classList.remove('is-blowing', 'is-knocked-out', 'is-out');
    helper.style.transform = 'none';
    if (!motionAllowed() || !helper.animate) {
      blow(state);
      finish(state);
      return true;
    }

    setPhase(state, 'jumping');
    animate(state, [
      {transform: 'translate(0u,0u) scale(1,1)', offset: 0},
      {transform: 'translate(0u,0u) scale(1.08,.8)', offset: .12},
      {transform: 'translate(45u,-185u) rotate(-12deg)', offset: .38},
      {transform: 'translate(130u,-287u) rotate(6deg)', offset: .69},
      {transform: 'translate(182u,-240u)', offset: 1}
    ], 1050, `translate(${182 * state.scale}px,${-240 * state.scale}px)`);
    at(state, 1050, () => {
      setPhase(state, 'blowing');
      scene.classList.add('is-blowing');
    });
    at(state, 1550, () => blow(state));
    at(state, 1950, () => {
      scene.classList.remove('is-blowing');
      setPhase(state, 'jumping-down');
      animate(state, [
        {transform: 'translate(182u,-240u)', offset: 0},
        {transform: 'translate(238u,-274u) rotate(9deg)', offset: .24},
        {transform: 'translate(330u,-131u) rotate(-8deg)', offset: .67},
        {transform: 'translate(390u,0u)', offset: 1}
      ], 1050, `translate(${390 * state.scale}px,0)`);
    });
    at(state, 3000, () => {
      setPhase(state, 'landing');
      animate(state, [
        {transform: 'translate(390u,0u) scale(1,1)'},
        {transform: 'translate(390u,0u) scale(1.13,.72)', offset: .5},
        {transform: 'translate(390u,0u) scale(1,1)'}
      ], 160, `translate(${390 * state.scale}px,0)`);
    });
    at(state, 3160, () => {
      setPhase(state, 'tumbling');
      animate(state, [
        {transform: 'translate(390u,0u) rotate(0deg)', offset: 0},
        {transform: 'translate(391u,0u) rotate(22deg)', offset: .3},
        {transform: 'translate(390u,0u) rotate(97deg)', offset: .84},
        {transform: 'translate(390u,0u) rotate(90deg)', offset: 1}
      ], 500, `translate(${390 * state.scale}px,0) rotate(90deg)`);
    });
    at(state, 3660, () => finish(state));
    return true;
  }

  function settleForMotion() {
    if (active && !motionAllowed()) {
      const state = active;
      blow(state);
      finish(state);
    }
  }
  reduced.addEventListener('change', settleForMotion);
  portrait.addEventListener('change', settleForMotion);
  document.addEventListener('visibilitychange', settleForMotion);
  new MutationObserver(settleForMotion).observe(document.body, {attributes: true, attributeFilter: ['class']});
  // A resize changes the scene's unit scale. Settle at the new scale cleanly.
  window.addEventListener('resize', () => {
    if (!active) return;
    const state = active;
    state.scale = state.scene.clientWidth / 560;
    if (state.blown) finish(state);
    else cancel();
  });
  window.addEventListener('pagehide', cancel);
  window.GardenCakePerformance = {run, cancel};
})();
