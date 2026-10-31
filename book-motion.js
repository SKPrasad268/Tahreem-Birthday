/* Keepsake book reveals and direct-manipulation Album pages. No media clones play audio. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  const allowed = () => !reduced.matches && !portrait.matches && !document.hidden && !document.body.classList.contains('garden-motion-off');
  const animations = new Set();
  let intro = null, drag = null, binding = null;
  const restyle = photo => {
    photo.style.removeProperty('transform'); photo.style.removeProperty('transform-origin');
    photo.style.removeProperty('--page-curl'); photo.classList.remove('is-page-dragging');
    delete photo.dataset.pageRest;
  };
  function animate(node, frames, options = {}) {
    if (!node?.animate || !allowed()) return;
    const animation = node.animate(frames, {duration:450, easing:'cubic-bezier(.2,.75,.2,1)', ...options});
    animations.add(animation);
    const done = () => { animations.delete(animation); animation.cancel(); };
    animation.finished.then(done, () => animations.delete(animation));
    return animation;
  }
  function cancel() {
    if (intro) {
      clearTimeout(intro.timer); intro.surface.classList.remove('keepsake-is-opening', 'book-reveal-running');
      intro.stage.remove(); intro = null;
    }
    if (drag) { const old = drag; drag = null; restyle(old.photo); }
    animations.forEach(animation => animation.cancel()); animations.clear();
  }
  function prepare(panel, kind) {
    cancel();
    if (!allowed() || !['album','nakhre'].includes(kind)) return;
    const surface = panel.querySelector(kind === 'album' ? '.album-spread' : '.nakhre-sheet');
    const target = surface?.querySelector(kind === 'album' ? '.album-photo' : '.nakhre-frame');
    const original = document.querySelector(kind === 'album' ? '.album-object .album-book' : '.nakhre-object .nakhre-book');
    if (!surface || !target || !original) return;
    const stage = document.createElement('div'); stage.className = `keepsake-book-stage is-${kind}`;
    stage.setAttribute('aria-hidden','true'); stage.inert = true;
    const cover = original.cloneNode(true); cover.classList.add('keepsake-book-cover');
    cover.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    const papers = document.createElement('div'); papers.className = 'keepsake-paper-fan';
    const images = kind === 'nakhre' ? [...surface.querySelectorAll('.nakhre-frame img'), ...document.querySelectorAll('.nakhre-peeking-cards img')] : [];
    for (let i=0; i<3; i++) {
      const paper = document.createElement('span'); paper.className = 'keepsake-fan-page'; paper.style.setProperty('--fan-index',i);
      if (images.length) { const image = document.createElement('img'); image.src = images[i % images.length].src; image.alt = ''; paper.append(image); }
      papers.append(paper);
    }
    stage.append(papers, cover); surface.append(stage);
    const area = surface.getBoundingClientRect(), photo = target.getBoundingClientRect();
    const width = Math.min(190, Math.max(95, photo.width*.64));
    Object.assign(stage.style, {width:`${width}px`, height:`${width*1.32}px`, left:`${photo.left-area.left+photo.width/2-width/2}px`, top:`${Math.max(12, photo.top-area.top+photo.height/2-width*.66)}px`});
    surface.classList.add('keepsake-is-opening');
    intro = {surface,stage,timer:null};
  }
  function open(panel) {
    if (!intro || !panel.contains(intro.surface)) return;
    if (!allowed()) { cancel(); return; }
    intro.surface.classList.add('book-reveal-running');
    intro.timer = setTimeout(cancel, 2100);
  }
  function page(container, direction) {
    cancel();
    const sheet = container.querySelector('.nakhre-sheet');
    animate(sheet, [{opacity:.55,transform:`perspective(1000px) translateX(${direction*16}px) rotateY(${direction*3}deg)`},{opacity:1,transform:'none'}], {duration:420});
    sheet?.querySelectorAll('.nakhre-frame').forEach((frame,i) => {
      const rest = getComputedStyle(frame).transform;
      animate(frame,[{opacity:.5,transform:`translateY(9px) rotate(${direction*2}deg) ${rest}`},{opacity:1,transform:rest}],{duration:460,delay:i*65});
    });
  }
  const pageTransform = (base, direction, progress) => `perspective(1000px) rotateY(${-direction*progress*100}deg) translateX(${-direction*progress*35}px) ${base}`;
  function bindAlbum(container, {canStep, onTurn}) {
    binding?.abort(); binding = new AbortController();
    const photo = container.querySelector('.album-photo');
    if (!photo || photo.querySelector('video')) return;
    const listen = (event, fn, options={}) => photo.addEventListener(event,fn,{...options,signal:binding.signal});
    const crease = document.createElement('span'); crease.className='album-drag-crease'; crease.setAttribute('aria-hidden','true'); photo.append(crease);
    photo.insertAdjacentHTML('beforeend','<span class="album-page-curl" aria-hidden="true"></span>');
    listen('dragstart', event => event.preventDefault());
    listen('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || event.target.closest('button,a,input,video')) return;
      cancel();
      const base=getComputedStyle(photo).transform;
      drag={photo,id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastTime:event.timeStamp,velocity:0,dx:0,horizontal:false,base:base==='none'?'':base};
      photo.dataset.pageRest=drag.base;
    });
    listen('pointermove', event => {
      if (!drag || event.pointerId!==drag.id) return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if (!drag.horizontal) {
        if (Math.abs(dy)>9 && Math.abs(dy)>Math.abs(dx)) { restyle(photo); drag=null; return; }
        if (Math.abs(dx)<8) return;
        drag.horizontal=true; photo.setPointerCapture(event.pointerId); photo.classList.add('is-page-dragging');
      }
      const dt=event.timeStamp-drag.lastTime;
      if(dt>0) drag.velocity=(event.clientX-drag.lastX)/dt;
      drag.lastX=event.clientX;drag.lastTime=event.timeStamp;drag.dx=dx;
      const direction=dx<0?1:-1;
      const progress=Math.min(.82,Math.abs(dx)/Math.max(1,photo.clientWidth))*(canStep(direction)?1:.16);
      if (allowed()) {
        photo.style.transformOrigin=direction>0?'0% 50%':'100% 50%';
        photo.style.transform=pageTransform(drag.base,direction,progress);
        photo.style.setProperty('--page-curl',progress);
      }
    });
    const release = (event, cancelled=false) => {
      if (!drag || drag.id!==event.pointerId) return;
      const state=drag; drag=null;
      const direction=state.dx<0?1:-1, distance=Math.abs(state.dx), width=Math.max(1,photo.clientWidth);
      const threshold=Math.max(42,Math.min(90,width*.23));
      const recent=event.timeStamp-state.lastTime<110;
      const commit=!cancelled && state.horizontal && canStep(direction) && (distance>threshold || (distance>22 && recent && Math.abs(state.velocity)>.5 && state.velocity*state.dx>0));
      if (commit) {
        // Commit in the pointer-up gesture, retaining video autoplay with sound when permitted.
        onTurn(direction, allowed()?Math.min(.82,distance/width):0);
      } else {
        const from=photo.style.transform || state.base;
        restyle(photo);
        if(state.horizontal) animate(photo,[{transform:from},{transform:state.base}],{duration:330,easing:'cubic-bezier(.2,.85,.25,1.12)'});
      }
      if(photo.hasPointerCapture(event.pointerId)) photo.releasePointerCapture(event.pointerId);
    };
    listen('pointerup',event=>release(event));
    listen('pointercancel',event=>release(event,true));
    listen('lostpointercapture',event=>release(event,true));
  }
  function peek() {
    const object=document.querySelector('.nakhre-object');
    const images=(window.BIRTHDAY?.nakhrePages || []).flatMap(page=>page.images || []).slice(0,3);
    if (!object || !images.length || object.querySelector('.nakhre-peeking-cards')) return;
    const cards=document.createElement('span');cards.className='nakhre-peeking-cards';cards.setAttribute('aria-hidden','true');cards.inert=true;
    images.forEach((item,i)=>{const card=document.createElement('span'),image=document.createElement('img');card.style.setProperty('--peek-index',i);image.src=item.src;image.alt='';image.loading='lazy';card.append(image);cards.append(card);});
    object.prepend(cards);
  }
  const settle = () => {if(!allowed())cancel();};
  reduced.addEventListener('change',settle);portrait.addEventListener('change',settle);
  document.addEventListener('visibilitychange',settle);window.addEventListener('resize',cancel);window.addEventListener('pagehide',cancel);
  new MutationObserver(settle).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('DOMContentLoaded',peek,{once:true});
  window.GardenBookMotion={prepare,open,page,bindAlbum,cancel,pageTransform};
})();
