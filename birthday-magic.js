/* Local artwork, separate paper/flower/ribbon layers, and one cancellable reveal. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  const allowed = () => !reduced.matches && !portrait.matches && !document.hidden
    && !document.body.classList.contains('garden-motion-off');
  let active = null;
  let serial = 0;

  function prepare(container, regions) {
    const canvas = container.querySelector('.bouquet-interactive');
    if (!canvas || canvas.classList.contains('has-bouquet-layers')) return;
    const id = `bouquet-${++serial}`;
    // Complementary masks partition the original artwork; no duplicate eggs remain underneath.
    const crown = 'M160 190 260 100 260 0H700L780 150 985 210 1024 610 960 760 820 790 700 840 500 865 300 800 130 720 40 550 0 350Z';
    const ribbon = 'M290 1020Q390 970 510 1030Q630 990 735 1060L750 1180 670 1230 770 1400 625 1430 510 1260 400 1420 275 1390 390 1200 270 1140Z';
    const eggs = regions.map(([x,y,w,h]) => `<ellipse cx="${x+w/2}" cy="${y+h/2}" rx="${w*.46}" ry="${h*.49}" fill="black"/>`).join('');
    const artwork = '<image href="assets/surprise-bouquet.webp" width="1024" height="1536"/>';
    canvas.insertAdjacentHTML('afterbegin', `<svg class="bouquet-layers" viewBox="0 0 1024 1536" aria-hidden="true" focusable="false"><defs>
      <mask id="${id}-flowers" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><path d="${crown}" fill="white"/>${eggs}</mask>
      <mask id="${id}-paper" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><path d="M0 0H1024V1536H0Z" fill="white"/><path d="${crown}" fill="black"/><path d="${ribbon}" fill="black"/></mask>
      <clipPath id="${id}-left"><path d="M0 0H512V1536H0Z"/></clipPath>
      <clipPath id="${id}-right"><path d="M512 0H1024V1536H512Z"/></clipPath>
      <clipPath id="${id}-ribbon"><path d="${ribbon}"/></clipPath>
    </defs><g class="bouquet-layer bouquet-paper-left"><g mask="url(#${id}-paper)" clip-path="url(#${id}-left)">${artwork}</g></g><g class="bouquet-layer bouquet-paper-right"><g mask="url(#${id}-paper)" clip-path="url(#${id}-right)">${artwork}</g></g><g class="bouquet-layer bouquet-flowers"><g mask="url(#${id}-flowers)">${artwork}</g></g><g class="bouquet-layer bouquet-ribbon"><g clip-path="url(#${id}-ribbon)">${artwork}</g></g></svg>`);
    canvas.classList.add('has-bouquet-layers');
    canvas.querySelectorAll('.kinder-tap').forEach((button, i) => button.style.setProperty('--egg-index', i));
    const replay = container.querySelector('[data-bouquet-replay]');
    replay?.addEventListener('click', () => reveal(container.closest('dialog')));
  }

  function cancel() {
    if (!active) return;
    clearTimeout(active.timer);
    active.section.classList.remove('gift-magic-running');
    active.section.querySelectorAll('[data-magic-decoration]').forEach(node => node.remove());
    active.section.querySelector('[data-bouquet-replay]')?.removeAttribute('aria-busy');
    const status = active.section.querySelector('[data-bouquet-status]');
    if (status) status.textContent = 'Your bouquet is ready. Pick a little surprise.';
    active = null;
  }

  function reveal(panel) {
    cancel();
    const section = panel?.querySelector('.bouquet-surprise');
    const figure = section?.querySelector('.bouquet-portrait');
    const present = document.querySelector('.gift-object .present');
    if (!section || !figure || !present) return;
    panel.scrollTop = 0;
    if (!allowed()) return;
    const box = document.createElement('div');
    box.className = 'magic-gift-box';
    box.dataset.magicDecoration = '';
    box.setAttribute('aria-hidden', 'true');
    box.inert = true;
    box.append(present.cloneNode(true));
    const particles = document.createElement('div');
    particles.className = 'bouquet-magic-particles';
    particles.dataset.magicDecoration = '';
    particles.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 24; i++) {
      const particle = document.createElement('i');
      particle.className = i < 12 ? 'magic-star' : 'magic-petal';
      particle.textContent = i < 12 ? '✧' : '';
      particle.style.cssText = `--x:${18+(i*29)%66}%;--dx:${(i%2?1:-1)*(20+(i*17)%65)}px;--delay:${i<12?.7+(i%6)*.12:2.1+(i%6)*.12}s;--turn:${i%2?180:-160}deg`;
      particles.append(particle);
    }
    figure.append(box, particles);
    // Force a fresh CSS timeline on replay, including a rapid second replay.
    void section.offsetWidth;
    section.classList.add('gift-magic-running');
    section.querySelector('[data-bouquet-replay]')?.setAttribute('aria-busy', 'true');
    const status = section.querySelector('[data-bouquet-status]');
    if (status) status.textContent = 'A little birthday magic, just for Tahreem…';
    active = {section, timer: setTimeout(cancel, 3900)};
  }

  // Expands from the tapped screenshot, while the scrapbook behind it softens.
  function screenshot(viewer, source) {
    const image = viewer.querySelector('img');
    const background = document.getElementById('experience-dialog');
    background?.classList.add('screenshot-is-open');
    let animation = null;
    let disposed = false;
    let closing = false;
    let flight = null;
    const originalOpacity = source?.style.opacity || '';
    function expand() {
      if (disposed || !viewer.open || !allowed() || !source?.isConnected || !image.animate) return;
      const from = source.getBoundingClientRect(), to = image.getBoundingClientRect();
      if (!from.width || !to.width || !to.height) return;
      animation = image.animate([
        {transform:`translate(${from.x+from.width/2-to.x-to.width/2}px,${from.y+from.height/2-to.y-to.height/2}px) scale(${from.width/to.width},${from.height/to.height})`, opacity:.55},
        {transform:'none', opacity:1}
      ], {duration:460, easing:'cubic-bezier(.2,.75,.2,1)'});
    }
    if (image.complete) expand(); else image.addEventListener('load', expand, {once:true});
    const restoreSource = () => { if(source) source.style.opacity = originalOpacity; };
    function close() {
      if (closing || disposed || !viewer.open) return;
      closing = true; animation?.cancel();
      if (!allowed() || !source?.isConnected || !image.animate) { viewer.close(); return; }
      const from=image.getBoundingClientRect(), to=source.getBoundingClientRect();
      if(!from.width || !to.width || !to.height) { viewer.close(); return; }
      flight=image.cloneNode(); flight.className='screenshot-flying-home'; flight.alt=''; flight.setAttribute('aria-hidden','true');
      Object.assign(flight.style,{left:`${from.left}px`,top:`${from.top}px`,width:`${from.width}px`,height:`${from.height}px`});
      viewer.append(flight); source.style.opacity='0'; viewer.classList.add('is-returning');
      background?.classList.remove('screenshot-is-open');
      animation=flight.animate([
        {transform:'none',opacity:1},
        {transform:`translate(${to.x+to.width/2-from.x-from.width/2}px,${to.y+to.height/2-from.y-from.height/2}px) scale(${to.width/from.width},${to.height/from.height})`,opacity:1}
      ],{duration:360,easing:'cubic-bezier(.25,.8,.25,1)',fill:'forwards'});
      animation.finished.catch(()=>{}).then(()=>{restoreSource();if(viewer.open)viewer.close();});
    }
    const motionChange = () => {
      if(allowed()) return;
      animation?.cancel();
      if((closing || portrait.matches) && viewer.open) { restoreSource(); viewer.close(); }
    };
    const observer = new MutationObserver(motionChange);
    observer.observe(document.body,{attributes:true,attributeFilter:['class']});
    reduced.addEventListener('change',motionChange);
    portrait.addEventListener('change',motionChange);
    document.addEventListener('visibilitychange',motionChange);
    const dispose = () => {
      disposed = true; animation?.cancel(); image.removeEventListener('load', expand);
      restoreSource();flight?.remove();observer.disconnect();
      reduced.removeEventListener('change',motionChange);document.removeEventListener('visibilitychange',motionChange);
      portrait.removeEventListener('change',motionChange);
      background?.classList.remove('screenshot-is-open');
    };
    viewer.addEventListener('close', dispose, {once:true});
    return {close,dispose};
  }

  function settle() { if (!allowed()) cancel(); }
  reduced.addEventListener('change', settle);
  portrait.addEventListener('change', settle);
  document.addEventListener('visibilitychange', settle);
  new MutationObserver(settle).observe(document.body, {attributes:true, attributeFilter:['class']});
  window.addEventListener('pagehide', cancel);
  window.GardenGiftMagic = {prepare, reveal, cancel, screenshot};
})();
