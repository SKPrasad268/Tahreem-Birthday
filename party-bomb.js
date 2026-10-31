/* One bounded, cancellable birthday blast. Audio playback remains untouched. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  let current = null;
  const allowed = () => !!Element.prototype.animate && !reduced.matches && !portrait.matches
    && !document.hidden && !document.body.classList.contains('garden-motion-off');

  function stop(state) {
    state.timers.forEach(clearTimeout); state.timers.clear();
    state.animations.forEach(animation => animation.cancel()); state.animations.clear();
    if (state.layer) {
      if (typeof state.layer.hidePopover === 'function' && state.layer.matches(':popover-open')) state.layer.hidePopover();
      state.layer.remove(); state.layer = null;
    }
    document.documentElement.classList.remove('birthday-blast-active');
    if (state.button) {
      state.button.disabled = false;
      state.button.removeAttribute('aria-busy');
    }
  }
  function cancel() {
    if (!current) return;
    const state = current; current = null;
    stop(state);
    state.button?.removeEventListener('click', state.fire);
    if (state.fire) state.egg.removeEventListener('click', state.fire);
  }
  function later(state, callback, delay) {
    const timer = setTimeout(() => {
      state.timers.delete(timer);
      if (current === state && state.panel.open && state.egg.isConnected) callback();
    }, delay);
    state.timers.add(timer);
  }
  function play(state, element, frames, options) {
    const speed = state.inline ? state.duration / 4100 : 1;
    const animation = element.animate(frames, {fill:'both', ...options, duration:options.duration * speed, delay:(options.delay || 0) * speed});
    state.animations.add(animation);
    animation.finished.catch(() => {});
  }
  function burst(state) {
    if (current !== state || !state.panel.open || !state.egg.isConnected || state.button?.disabled) return;
    stop(state);
    state.egg.classList.remove('party-has-burst');
    void state.egg.offsetWidth;
    state.egg.classList.add('party-has-burst');
    state.panel.querySelector('.kinder-reveal--party')?.classList.add('party-has-celebrated');
    const name = typeof window.BIRTHDAY?.name === 'string' ? window.BIRTHDAY.name : 'Tahreem';
    if (state.status) state.status.textContent = `Surprise! Happy birthday, ${name}! ✿`;
    if (!allowed()) return;

    if (state.button) {
      state.button.disabled = true;
      state.button.setAttribute('aria-busy','true');
    }
    const box = state.egg.getBoundingClientRect();
    const width = innerWidth, height = innerHeight, cx = box.left+box.width/2, cy = box.top+box.height/2;
    const layer = document.createElement('div');
    layer.className = 'birthday-blast-layer'; layer.setAttribute('aria-hidden','true'); layer.inert = true;
    // A non-interactive top-layer popover lets flowers cross the dialog's edges.
    const topLayer = typeof layer.showPopover === 'function';
    if (topLayer) { layer.setAttribute('popover','manual'); document.body.append(layer); layer.showPopover(); }
    else state.panel.append(layer);
    state.layer = layer;
    document.documentElement.classList.add('birthday-blast-active');

    const ring = document.createElement('span'); ring.className='party-shockwave';
    Object.assign(ring.style,{left:`${cx-40}px`,top:`${cy-40}px`}); layer.append(ring);
    play(state,ring,[{opacity:.5,transform:'scale(.1)'},{opacity:0,transform:`scale(${Math.max(width,height)/65})`}],{duration:950,easing:'ease-out'});

    const count = height < 500 ? 44 : 66;
    const colors = ['#d89ab4','#e6bd72','#b5c59b','#f2c7a9','#cba1c0'];
    for (let i=0;i<count;i++) {
      const flower = i%3 !== 0;
      const particle = document.createElement('span');
      particle.className = flower ? 'party-flower' : 'party-ribbon';
      if (flower) particle.textContent = i%2 ? '✿' : '❀';
      const angle = i * 2.399963, reach = Math.max(width,height)*(.32+(i%7)*.055);
      const dx = Math.cos(angle)*reach, dy = Math.sin(angle)*reach*.58-70;
      const turn = (i%2 ? -1 : 1)*(180+i*9);
      Object.assign(particle.style,{left:`${cx}px`,top:`${cy}px`,color:colors[i%colors.length],background:flower?'none':colors[i%colors.length],fontSize:`${21+(i%5)*6}px`});
      layer.append(particle);
      play(state,particle,[
        {opacity:0,transform:'translate(-50%,-50%) scale(.3) rotate(0deg)'},
        {opacity:1,offset:.08},
        {opacity:1,transform:`translate(${dx*.8}px,${dy}px) scale(1) rotate(${turn*.45}deg)`,offset:.37},
        {opacity:.9,transform:`translate(${dx}px,${dy+height*.28}px) rotate(${turn*.8}deg)`,offset:.7},
        {opacity:0,transform:`translate(${dx*1.08}px,${height-cy+70}px) rotate(${turn}deg)`}
      ],{duration:2600+(i%6)*190,delay:(i%7)*28,easing:'cubic-bezier(.1,.6,.3,1)'});
    }
    for (let burstIndex=0;burstIndex<5;burstIndex++) {
      const x = width*[.2,.78,.52,.88,.3][burstIndex], y = height*[.25,.22,.58,.68,.72][burstIndex];
      for (let ray=0;ray<12;ray++) {
        const spark = document.createElement('span'); spark.className='party-firework-ray';
        Object.assign(spark.style,{left:`${x}px`,top:`${y}px`,color:colors[burstIndex]}); layer.append(spark);
        const rotate = `rotate(${ray*30}deg)`;
        play(state,spark,[{opacity:0,transform:`${rotate} translateY(-4px) scaleY(.2)`},{opacity:1,transform:`${rotate} translateY(-45px) scaleY(1)`,offset:.25},{opacity:0,transform:`${rotate} translateY(-112px) scaleY(.4)`}],{duration:1050,delay:230+burstIndex*260,easing:'ease-out'});
      }
    }
    const frames = [[0,0],[-7,3],[7,-3],[-6,2],[5,-2],[-3,1],[2,-1],[0,0]].map(([x,y])=>({transform:`translate(${x}px,${y}px)`}));
    play(state,document.getElementById('garden'),frames,{duration:660,easing:'linear'});
    // The fallback keeps the overlay fixed by shaking the dialog's contents instead.
    const targets = topLayer ? [state.panel] : [...state.panel.children].filter(node=>node!==layer);
    targets.forEach(node=>play(state,node,frames,{duration:660,easing:'linear'}));
    later(state,()=>stop(state),state.duration || 4100);
  }
  function mount(panel, auto = true) {
    cancel();
    const button = panel.querySelector('.kinder-party-replay'), egg = panel.querySelector('.kinder-opening');
    if (!button || !egg) return;
    const state = {panel,button,egg,status:panel.querySelector('.party-status'),timers:new Set(),animations:new Set(),layer:null,fire:null};
    current = state;
    state.fire = () => burst(state);
    button.addEventListener('click',state.fire); egg.addEventListener('click',state.fire);
    if (auto) later(state,state.fire,720); // After the bouquet-to-egg journey, pop automatically.
  }
  const settle = () => { if (current) stop(current); };
  reduced.addEventListener('change',settle); portrait.addEventListener('change',settle);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
  window.addEventListener('resize',settle); window.addEventListener('pagehide',cancel);
  new MutationObserver(()=>{if(!allowed())settle();}).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.getElementById('experience-dialog')?.addEventListener('close',cancel);
  // The last egg can set off the same celebration at egg 4 without leaving the bouquet.
  function burstAt(panel, egg, duration = 1150) {
    cancel();
    if (!panel?.open || !egg?.isConnected) return;
    current = {panel,egg,button:null,status:null,fire:null,inline:true,duration,
      timers:new Set(),animations:new Set(),layer:null};
    burst(current);
  }
  window.GardenPartyBomb = {mount,cancel,burstAt};
})();
