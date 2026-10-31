/* A real alpha silhouette, then two local clips on the same unlocked audio element. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const preloaded = new Set();
  let current = null;
  const still = () => reduced.matches || document.body.classList.contains('garden-motion-off');
  const live = state => current === state && state.root.isConnected && state.panel.open && !document.hidden && !portrait.matches;

  function prepare(surprises) {
    (Array.isArray(surprises) ? surprises : []).filter(item => item.kind === 'pokemon').forEach(item => {
      [item.image, item.backdrop].filter(Boolean).forEach(src => {
        if (preloaded.has(src)) return;
        preloaded.add(src);
        const image = new Image();
        image.src = src;
        image.decode?.().catch(() => {});
      });
    });
  }

  function markup(surprise) {
    return `<section class="pokemon-surprise" aria-label="Kinder Joy 6: a Pokémon guessing surprise">
      <div class="pokemon-scene" data-phase="question">
        <img class="pokemon-backdrop" src="${escape(surprise.backdrop)}" alt="" aria-hidden="true" width="1298" height="666">
        <img class="pokemon-portrait" src="${escape(surprise.image)}" alt="A black mystery silhouette on the white splash." width="1066" height="1476">
        <div class="pokemon-copy" hidden><p class="eyebrow">KINDER JOY · SURPRISE 06</p><h3>${escape(surprise.title)}</h3><p class="pokemon-answer">${escape(surprise.text)}</p><span class="pokemon-copy-flower" aria-hidden="true">✦</span></div>
      </div>
      <div class="pokemon-controls"><p class="pokemon-status" role="status">Ye konsa Pokemon hai...?</p><div class="pokemon-actions">
        <button data-pokemon-sound type="button" hidden>Tap to play the sound</button>
        <button data-pokemon-skip type="button">Reveal now</button>
        <button data-pokemon-replay type="button" hidden>Watch it again ↻</button>
      </div></div>
    </section>`;
  }

  function clearTimers(state) {
    clearTimeout(state.watchdog);
    clearTimeout(state.finishTimer);
  }

  // Temporarily soften the radio without pausing, seeking, or changing its chosen volume.
  function softenRadio(state) {
    const radio = document.getElementById('radio-audio');
    if (!radio || radio.paused || state.radio) return;
    state.radio = radio;
    state.radioWasMuted = radio.muted;
    radio.muted = true;
  }

  function restoreRadio(state) {
    if (!state.radio) return;
    state.radio.muted = state.radioWasMuted;
    state.radio = null;
  }

  function finish(state, immediate = false) {
    clearTimers(state);
    state.audio.pause();
    restoreRadio(state);
    state.step = 'done';
    if (immediate || still()) state.scene.classList.add('pokemon-still');
    state.photo.alt = state.surprise.imageAlt || 'Tahreem, revealed as Tahreem-Mon.';
    state.copy.hidden = false;
    state.scene.dataset.phase = immediate || still() ? 'complete' : 'settling';
    state.sound.hidden = true;
    state.skip.hidden = true;
    state.replay.hidden = false;
    state.status.textContent = state.failed ? 'Ye hai Tahreem-Mon! Sound could not play — try watching again.' : 'Ye hai Tahreem-Mon!';
    if (!immediate && !still()) state.finishTimer = setTimeout(() => {
      if (live(state)) state.scene.dataset.phase = 'complete';
    }, 1900);
  }

  function cancel() {
    const state = current;
    if (!state) return;
    finish(state, true);
    current = null;
    state.events.abort();
    state.audio.removeAttribute('src');
    state.audio.load();
  }

  function mount(panel, surprise) {
    cancel();
    const root = panel.querySelector('.pokemon-surprise');
    if (!root) return;
    const state = {
      panel, root, surprise, audio:new Audio(), events:new AbortController(), step:'question',
      scene:root.querySelector('.pokemon-scene'), photo:root.querySelector('.pokemon-portrait'),
      copy:root.querySelector('.pokemon-copy'), status:root.querySelector('.pokemon-status'),
      sound:root.querySelector('[data-pokemon-sound]'), skip:root.querySelector('[data-pokemon-skip]'),
      replay:root.querySelector('[data-pokemon-replay]'), watchdog:0, finishTimer:0, attempt:0, failed:false
    };
    current = state;
    state.audio.preload = 'auto';
    const options = {signal:state.events.signal};

    const blocked = () => {
      if (!live(state) || state.step === 'done') return;
      clearTimeout(state.watchdog);
      restoreRadio(state);
      state.sound.hidden = false;
      state.sound.textContent = state.step === 'question' ? 'Tap to play the sound' : 'Tap for the reveal';
      state.status.textContent = 'One tap for the sound, then the surprise continues.';
    };

    const play = step => {
      if (!live(state)) return;
      clearTimers(state);
      const attempt = ++state.attempt;
      state.step = step;
      state.sound.hidden = true;
      state.audio.pause();
      state.audio.src = step === 'question' ? surprise.questionAudio : surprise.revealAudio;
      state.watchdog = setTimeout(blocked, 10000);
      // Keep this play call in the egg/replay click stack; reuse this element for clip two.
      state.audio.play().catch(error => {
        if (!live(state) || attempt !== state.attempt || error?.name === 'AbortError') return;
        if (error?.name === 'NotAllowedError') blocked();
        else failed();
      });
    };

    const reveal = () => {
      if (!live(state)) return;
      state.scene.dataset.phase = 'reveal';
      state.photo.alt = surprise.imageAlt || 'Tahreem, revealed as Tahreem-Mon.';
      state.status.textContent = surprise.text || 'Ye hai Tahreem-Mon';
      state.skip.hidden = true;
    };

    const failed = () => {
      if (!live(state) || state.step === 'done') return;
      clearTimers(state);
      state.failed = true;
      state.audio.pause();
      restoreRadio(state);
      if (state.step === 'question') play('answer');
      else {
        reveal();
        state.finishTimer = setTimeout(() => { if (live(state)) finish(state); }, 1200);
      }
    };

    const run = () => {
      clearTimers(state);
      state.attempt += 1;
      state.failed = false;
      state.scene.classList.toggle('pokemon-still', still());
      state.copy.hidden = true;
      state.scene.dataset.phase = 'question';
      state.photo.alt = 'A black mystery silhouette on the white splash.';
      state.status.textContent = 'Ye konsa Pokemon hai...?';
      state.skip.hidden = false;
      state.replay.hidden = true;
      play('question');
    };

    state.audio.addEventListener('playing', () => {
      if (!live(state) || state.step === 'done') { state.audio.pause(); return; }
      clearTimeout(state.watchdog);
      state.sound.hidden = true;
      softenRadio(state);
      if (state.step === 'answer') reveal();
      else state.status.textContent = 'Ye konsa Pokemon hai...?';
    }, options);
    state.audio.addEventListener('ended', () => {
      if (!live(state)) return;
      if (state.step === 'question') play('answer');
      else if (state.step === 'answer') finish(state);
    }, options);
    state.audio.addEventListener('error', failed, options);
    state.audio.addEventListener('stalled', () => {
      if (live(state) && state.step !== 'done') state.watchdog = setTimeout(blocked, 8000);
    }, options);
    state.sound.addEventListener('click', () => play(state.step), options);
    state.skip.addEventListener('click', () => play('answer'), options);
    state.replay.addEventListener('click', run, options);
    state.photo.addEventListener('error', () => {
      cancel();
      state.photo.hidden = true;
      state.status.textContent = 'This picture could not load. Please reopen the surprise.';
    }, {once:true, ...options});
    run();
  }

  document.getElementById('experience-dialog')?.addEventListener('close', cancel);
  window.addEventListener('birthday-object-opened', cancel);
  window.addEventListener('pagehide', cancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  portrait.addEventListener('change', () => { if (portrait.matches) cancel(); });
  reduced.addEventListener('change', () => { if (current) current.scene.classList.toggle('pokemon-still', still()); });
  new MutationObserver(() => {
    if (current) current.scene.classList.toggle('pokemon-still', still());
  }).observe(document.body, {attributes:true, attributeFilter:['class']});
  window.GardenPokemon = {prepare, markup, mount, cancel};
})();
