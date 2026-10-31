/* Small paper interactions; the original writing remains in the same DOM. */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = window.matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  let current = null;
  let sequence = 0;

  function motionAllowed() {
    return !reduced.matches && !portrait.matches && !document.hidden
      && !document.body.classList.contains('garden-motion-off');
  }

  function cancel() {
    const state = current;
    if (!state) return;
    current = null;
    state.disposed = true;
    state.cleanups.forEach(cleanup => cleanup());
    state.timers.forEach(timer => window.clearTimeout(timer));
    state.animations.forEach(animation => animation.cancel());
    if (state.frame) window.cancelAnimationFrame(state.frame);
    state.observer?.disconnect();
    state.resizeObserver?.disconnect();
    state.mutationObserver?.disconnect();
    state.paper?.classList.remove('reading-envelope-sealed', 'reading-envelope-opening');
    state.unfold?.remove();
    state.light?.remove();
    state.emblem?.remove();
    state.cover?.remove();
    state.progress?.remove();
    if (state.content) {
      state.content.inert = false;
      state.content.hidden = false;
      state.content.replaceWith(...state.content.childNodes);
    }
  }

  function enhance(view, options = {}) {
    const dialog = document.getElementById('experience-dialog');
    const body = document.getElementById('dialog-body');
    if (!dialog || !body) return;
    const selector = {letter: '.letter-paper', note: '.note-paper', notes: '.openwhen-grid', nakhre: '.nakhre-grid', cake: '.cake-scene'}[view];
    const anchor = selector && body.querySelector(selector);
    if (current?.anchor === anchor && current?.view === view && anchor) {
      current.refresh();
      return;
    }
    cancel();
    if (!anchor) return;

    const state = {
      anchor, view, cleanups: [], timers: new Set(), animations: new Set(),
      seen: new WeakSet(), observed: new WeakSet(), disposed: false, frame: 0,
      opened: false, opening: false, progressValue: -1
    };
    current = state;

    function listen(target, event, handler, options) {
      target.addEventListener(event, handler, options);
      state.cleanups.push(() => target.removeEventListener(event, handler, options));
    }

    function later(handler, delay) {
      const timer = window.setTimeout(() => {
        state.timers.delete(timer);
        if (!state.disposed) handler();
      }, delay);
      state.timers.add(timer);
    }

    function updateProgress() {
      if (!state.progress || !state.opened || !dialog.open || state.disposed) return;
      const rootRect = dialog.getBoundingClientRect();
      const contentRect = state.content.getBoundingClientRect();
      if (!contentRect.height || !rootRect.height) return;
      const headerHeight = dialog.querySelector('.dialog-header')?.getBoundingClientRect().height || 0;
      state.progress.style.setProperty('--reading-header-height', `${Math.ceil(headerHeight) + 5}px`);
      // Count the visible end of the actual writing. Its position includes the
      // Back button, paper padding, and header; height alone cannot tell whether
      // the signature fits. The sticky header only covers content already passed.
      const visibleBottom = rootRect.top + dialog.clientTop + dialog.clientHeight;
      const complete = dialog.scrollHeight <= dialog.clientHeight + 1
        || contentRect.bottom <= visibleBottom + 1
        || dialog.scrollTop + dialog.clientHeight >= dialog.scrollHeight - 1;
      const ratio = Math.max(0, Math.min(1, (visibleBottom - contentRect.top) / contentRect.height));
      const value = complete ? 100 : Math.min(99, Math.floor(ratio * 100));
      if (value !== state.progressValue) {
        state.progressValue = value;
        state.progress.style.setProperty('--reading-progress', `${value}%`);
        state.progress.style.setProperty('--reading-bloom', (value / 100).toFixed(2));
        state.progress.setAttribute('aria-valuenow', String(value));
      }
    }

    function requestProgress() {
      if (state.frame || state.disposed) return;
      state.frame = window.requestAnimationFrame(() => {
        state.frame = 0;
        updateProgress();
      });
    }

    function reveal(element, delay = 0) {
      if (state.seen.has(element)) return;
      state.seen.add(element);
      state.observer?.unobserve(element);
      if (!motionAllowed() || !dialog.open || typeof element.animate !== 'function') return;
      const transform = window.getComputedStyle(element).transform;
      const resting = transform === 'none' ? '' : transform;
      const animation = element.animate([
        {opacity: 0.35, transform: `${resting} translateY(12px)`},
        {opacity: 1, transform: `${resting} translateY(0)`}
      ], {duration: 440, delay, easing: 'cubic-bezier(.2,.7,.2,1)'});
      state.animations.add(animation);
      const done = () => state.animations.delete(animation);
      animation.addEventListener('finish', done, {once: true});
      animation.addEventListener('cancel', done, {once: true});
    }

    if ('IntersectionObserver' in window) {
      state.observer = new IntersectionObserver(entries => {
        if (!dialog.open || state.disposed || state.opening) return;
        let index = 0;
        entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.closest('[hidden]')) {
            reveal(entry.target, Math.min(index++ * 45, 135));
          }
        });
      }, {root: dialog, rootMargin: '0px 0px -10px 0px', threshold: 0});
    }

    function refreshReveals(skipVisible = false) {
      if (state.disposed || !dialog.open || state.opening) return;
      const targets = body.querySelectorAll({
        letter: '.reading-letter-content > p', note: '.reading-letter-content > p',
        notes: '.note-envelope', nakhre: '.nakhra-card', cake: '.wish-card'
      }[view]);
      const rootRect = dialog.getBoundingClientRect();
      targets.forEach(target => {
        if (target.closest('[hidden]') || state.observed.has(target)) return;
        state.observed.add(target);
        const rect = target.getBoundingClientRect();
        if (!motionAllowed() || !state.observer || (skipVisible && rect.top < rootRect.bottom && rect.bottom > rootRect.top)) {
          state.seen.add(target);
        } else {
          state.observer.observe(target);
        }
      });
      requestProgress();
    }

    function focusOpenedWriting() {
      if (!state.cover?.contains(document.activeElement)) return;
      const heading = state.content.querySelector('h3') || state.content;
      const temporary = !heading.hasAttribute('tabindex');
      if (temporary) heading.setAttribute('tabindex', '-1');
      heading.focus({preventScroll: true});
      if (temporary) heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), {once: true});
    }

    function finishOpening() {
      if (!state.opened || state.disposed) return;
      state.opening = false;
      state.content.inert = false;
      focusOpenedWriting();
      state.cover.hidden = true;
      state.button.removeAttribute('aria-busy');
      state.unfold?.remove();
      state.light?.remove();
      state.paper.classList.remove('reading-envelope-sealed', 'reading-envelope-opening');
      refreshReveals(true);
      requestProgress();
    }

    if (view === 'letter' || view === 'note') {
      const paper = anchor;
      const content = document.createElement('div');
      content.className = 'reading-letter-content';
      content.id = `reading-letter-${++sequence}`;
      // The note's Back button stays outside the envelope and always remains usable.
      Array.from(paper.childNodes).forEach(node => {
        if (node.nodeType === 1 && node.matches('#note-back, .back-link')) return;
        content.append(node);
      });
      const cover = document.createElement('div');
      cover.className = 'reading-envelope-cover';
      cover.innerHTML = `<div class="reading-envelope-clip"><button class="reading-envelope-open" type="button" aria-expanded="false" aria-controls="${content.id}"><span class="reading-envelope-art" aria-hidden="true"><span class="reading-envelope-sheet"></span><span class="reading-envelope-pocket"></span><span class="reading-envelope-flap"></span><span class="reading-wax-seal"><span class="reading-wax-half wax-left">✿</span><span class="reading-wax-half wax-right">✿</span></span></span><span class="reading-envelope-prompt">Open your ${view === 'letter' ? 'letter' : 'note'}</span><span class="reading-envelope-hint">Tap the seal</span></button></div>`;
      const button = cover.querySelector('button');
      Object.assign(state, {paper, content, cover, button});
      function openEnvelope() {
        if (state.opened) return;
        state.opened = true;
        button.setAttribute('aria-expanded', 'true');
        content.hidden = false;
        if (motionAllowed()) {
          state.opening = true;
          content.inert = true;
          button.setAttribute('aria-busy', 'true');
          const unfold = document.createElement('div');
          unfold.className = `reading-paper-unfold ${view === 'letter' ? 'is-letter-fold' : 'is-note-fold'}`;
          unfold.setAttribute('aria-hidden', 'true'); unfold.inert = true;
          unfold.innerHTML = '<span class="paper-fold fold-top"></span><span class="paper-fold fold-middle"><span>✿</span></span><span class="paper-fold fold-bottom"></span>';
          paper.append(unfold); state.unfold = unfold;
          if(view === 'letter') {
            const light=document.createElement('span');light.className='reading-paper-light';light.setAttribute('aria-hidden','true');
            paper.append(light);state.light=light;
          }
          paper.classList.add('reading-envelope-opening');
          if (options.origin && paper.animate) {
            const from=options.origin, to=paper.getBoundingClientRect();
            const flight=paper.animate([
              {opacity:.5,transform:`translate(${from.left+from.width/2-to.left-to.width/2}px,${from.top+from.height/2-to.top-to.height/2}px) scale(${Math.min(.8,from.width/to.width)})`},
              {opacity:1,transform:'none'}
            ],{duration:380,easing:'cubic-bezier(.2,.75,.2,1)'});
            state.animations.add(flight);
          }
          later(finishOpening, view === 'letter' ? 2850 : 2200);
        } else {
          finishOpening();
        }
        requestProgress();
      }
      listen(button, 'click', openEnvelope);
      paper.append(cover, content);
      paper.classList.add('reading-envelope-sealed');
      // Hide only after the real open control is attached and listening.
      content.hidden = true;

      if (view === 'note') {
        const mood = paper.dataset.noteMood;
        const emblem = document.createElement('div');emblem.className='note-personality';emblem.setAttribute('aria-hidden','true');
        if (mood === 'low') {
          emblem.innerHTML='<svg class="note-bloom" viewBox="0 0 160 100" fill="none"><path d="M80 92V49M80 77Q55 81 54 63Q74 61 80 77M81 70Q104 73 108 56Q88 55 81 70" stroke="#8f9e7a" stroke-width="2" fill="#b6c3a1"/>'+Array.from({length:6},(_,i)=>`<g class="note-bloom-petal" style="--petal-angle:${i*60}deg;--petal-index:${i}"><ellipse cx="80" cy="33" rx="11" ry="21" fill="#e9c4cd" stroke="#c999ad"/></g>`).join('')+'<circle cx="80" cy="50" r="10" fill="#e7c783" stroke="#d3b26f"/></svg>';
        } else {
          emblem.innerHTML=`<svg class="note-paper-star" viewBox="0 0 100 100" fill="none"><path d="M50 7 61 35 91 38 68 58 75 88 50 72 25 88 32 58 9 38 39 35Z" fill="${mood==='win'?'#f2d28d':'#f4dfb2'}" stroke="#cfad6e" stroke-width="1.5"/><path d="M50 7V52L9 38M50 52 91 38M50 52 75 88M50 52 25 88" stroke="#d5b77f" stroke-width="1"/><path d="M50 7 50 52 61 35" fill="#fff4d5"/></svg>`;
          if(mood==='win') {
            const shower=document.createElement('div');shower.className='note-star-shower';
            for(let i=0;i<16;i++) {const star=document.createElement('i');star.textContent=i%3?'✧':'✦';star.style.cssText=`--star-x:${(i%2?1:-1)*(55+(i*31)%135)}px;--star-y:${35+(i*19)%100}px;--star-delay:${.75+(i%6)*.11}s;--star-turn:${i%2?140:-120}deg`;shower.append(star);}
            emblem.append(shower);
          }
        }
        paper.insertBefore(emblem,content);
        state.emblem=emblem;
      }

      if (view === 'letter') {
        const progress = document.createElement('div');
        progress.className = 'reading-progress';
        progress.setAttribute('role', 'progressbar');
        progress.setAttribute('aria-label', 'Letter reading progress');
        progress.setAttribute('aria-valuemin', '0');
        progress.setAttribute('aria-valuemax', '100');
        progress.setAttribute('aria-valuenow', '0');
        progress.innerHTML = '<span class="reading-progress-track" aria-hidden="true"><span class="reading-progress-fill"></span><span class="reading-progress-flower">✿</span></span>';
        content.prepend(progress);
        state.progress = progress;
      }
      if(options.autoOpen) { button.focus({preventScroll:true}); openEnvelope(); }
    }

    if(view === 'notes') {
      const cards=[...anchor.querySelectorAll('.note-envelope')];
      state.choose = (button, onChosen) => {
        if(state.choosing || state.disposed) return;
        state.choosing=true;
        if(!motionAllowed() || !button.animate) { onChosen(null); return; }
        const selected=cards.indexOf(button);
        button.style.zIndex='4';state.cleanups.push(()=>button.style.removeProperty('z-index'));
        cards.forEach((card,i)=>{
          const rest=getComputedStyle(card).transform;
          const end=i===selected ? `translateY(-20px) scale(1.08)` : `translateX(${i<selected?-50:50}px) translateY(10px) rotate(${i<selected?-7:7}deg) scale(.94)`;
          const animation=card.animate([{opacity:1,transform:rest},{opacity:i===selected?1:.25,transform:end}],{duration:340,easing:'cubic-bezier(.2,.75,.2,1)',fill:'forwards'});
          state.animations.add(animation);
        });
        later(()=>{if(dialog.open)onChosen(button.getBoundingClientRect().toJSON());},340);
      };
    }

    function syncMotion() {
      if (!motionAllowed()) {
        state.animations.forEach(animation => animation.cancel());
        if (state.opening) finishOpening();
      }
      refreshReveals();
    }

    state.refresh = () => { refreshReveals(); requestProgress(); };
    listen(dialog, 'scroll', requestProgress, {passive: true});
    listen(dialog, 'close', () => {
      // Portrait temporarily closes this same dialog; keep its sealed/open state
      // and reading position ready for the existing landscape resume path.
      if (dialog.returnValue === 'orientation') {
        syncMotion();
        return;
      }
      cancel();
    });
    listen(dialog, 'focusin', event => {
      // Keyboard users never wait for an entrance animation on the active card.
      const target = event.target.closest?.('.nakhra-card, .wish-card');
      if (target) {
        state.seen.add(target);
        state.observer?.unobserve(target);
        target.getAnimations?.().forEach(animation => animation.cancel());
      }
    });
    listen(window, 'resize', requestProgress, {passive: true});
    listen(document, 'visibilitychange', syncMotion);
    listen(reduced, 'change', syncMotion);
    listen(portrait, 'change', syncMotion);
    if ('ResizeObserver' in window) {
      state.resizeObserver = new ResizeObserver(requestProgress);
      state.resizeObserver.observe(dialog);
      if (state.content) state.resizeObserver.observe(state.content);
    }
    if ('MutationObserver' in window) {
      state.mutationObserver = new MutationObserver(records => {
        if (records.some(record => record.target === document.body)) syncMotion();
        state.refresh();
      });
      state.mutationObserver.observe(document.body, {attributes: true, attributeFilter: ['class']});
      state.mutationObserver.observe(dialog, {attributes: true, attributeFilter: ['open']});
      const wishes = body.querySelector('.wish-cards');
      if (wishes) state.mutationObserver.observe(wishes, {attributes: true, attributeFilter: ['hidden']});
    }
    // showModal may happen immediately after enhance; observing `open` handles it.
    state.refresh();
  }

  window.GardenReading = {enhance, cancel, chooseNote:(button,onChosen)=>current?.choose ? current.choose(button,onChosen) : onChosen(null)};
})();
