/* The Nakhre scrapbook, with a playful browser-local birthday ballot. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let current = null;
  let index = 0;
  function unmount() {
    if (!current) return;
    window.GardenPrivateAlbum?.stop();
    current.events.abort();
    window.GardenBallot?.unmount();
    current.lightbox?.close();
    current = null;
  }
  function mount(container,pages,config,privateConfig={}) {
    unmount();
    const state = {container,pages,events:new AbortController(),lightbox:null,privateActive:false};
    current = state;
    index = Math.max(0,Math.min(index,pages.length-1));
    const listen = (element,event,handler,options={}) => element?.addEventListener(event,handler,{...options,signal:state.events.signal});
    let touch = null;
    listen(container,'click',event => {
      if(event.target.closest('[data-open-private]') && window.GardenPrivateAlbum && privateConfig.src) {
        window.GardenBookMotion?.cancel();
        state.privateActive=true;
        window.GardenBallot?.unmount();
        window.GardenPrivateAlbum.open(container,privateConfig,()=>{state.privateActive=false;render();});
        return;
      }
      const step = event.target.closest('[data-nakhre-step]');
      if (step) { change(Number(step.dataset.nakhreStep)); return; }
      const zoom = event.target.closest('[data-nakhre-zoom]');
      if (zoom) showScreenshot(Number(zoom.dataset.nakhreZoom));
    });
    listen(container,'change',event => {
      if (event.target.matches('#nakhre-page-picker')) change(Number(event.target.value)-index);
    });
    listen(container,'keydown',event => {
      if(state.privateActive)return;
      if (!['ArrowLeft','ArrowRight'].includes(event.key) || event.target.closest('input,textarea,select,button[role="radio"]') || event.target.isContentEditable) return;
      event.preventDefault(); change(event.key === 'ArrowRight' ? 1 : -1);
    });
    listen(container,'touchstart',event => {
      if(state.privateActive)return;
      const point = event.changedTouches[0];
      touch = event.target.closest('.nakhre-frame') ? {x:point.clientX,y:point.clientY} : null;
    },{passive:true});
    listen(container,'touchend',event => {
      if(state.privateActive)return;
      if (!touch) return;
      const point = event.changedTouches[0], dx=point.clientX-touch.x,dy=point.clientY-touch.y;
      touch = null;
      if (Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)*1.5) change(dx<0?1:-1);
    },{passive:true});

    function figure(image,position,group=false) {
      return `<figure class="nakhre-frame${group?' nakhre-frame-small':''}" style="--tilt:${[-1.6,1.2,-.8][position%3]}deg"><button class="nakhre-photo-button" type="button" data-nakhre-zoom="${position}" aria-label="Enlarge ${escape(image.caption)}"><img src="${escape(encodeURI(image.src).replace(/#/g,'%23').replace(/\?/g,'%3F'))}" alt="${escape(image.alt || image.caption)}" decoding="async"><span class="nakhre-zoom-hint">↗ Tap to read</span></button><figcaption>${group?escape(image.caption):'A very Tahreem moment ✿'}</figcaption></figure>`;
    }
    function pollMarkup() { return window.GardenBallot.formMarkup(); }
    function resultsMarkup() { return window.GardenBallot.resultsMarkup(); }
    function render() {
      window.GardenBookMotion?.cancel();
      state.privateActive=false;
      window.GardenBallot?.unmount();
      const page = pages[index], grouped=page.kind==='together', voting=page.kind==='vote';
      container.innerHTML = `<section class="nakhre-album${grouped?' is-together':''}${voting?' is-ballot':''}" aria-label="Nakhre scrapbook"><div class="nakhre-issue-bar"><span class="nakhre-issue-seal" aria-hidden="true">✿</span><span>Birthday girl. Main character energy.</span>${privateConfig.src ? '<button class="nakhre-private-link" type="button" data-open-private><svg viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="M6 12V7a6 6 0 0 1 12 0v5" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="11" width="18" height="14" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 17v3" stroke="currentColor" stroke-width="2"/></svg>Private album 🤫</button>' : ''}<span class="nakhre-edition-tag">${grouped?'TAHREEM, TIMES THREE':voting?'ELECTION SPECIAL':index>=pages.length-2?'ONE LAST LITTLE NOTE':'FROM THE NAKHRE ARCHIVES'}</span></div><article class="nakhre-sheet"><div class="nakhre-page-meta"><span>EXHIBIT ${String(index+1).padStart(2,'0')}</span><span aria-hidden="true">✿ &nbsp; ✧ &nbsp; ✿</span><span>${grouped?'THREE SHOTS OF TAHREEM ENERGY':'THE TAHREEM EDITION'}</span></div>${grouped?`<header class="nakhre-group-heading"><h3>${escape(page.title)}</h3><p>Three screenshots. Full Tahreem energy.</p></header><div class="nakhre-together">${page.images.map((image,i)=>figure(image,i,true)).join('')}</div>`:`<div class="nakhre-spread">${figure(page.images[0],0)}<div class="nakhre-caption"><p class="nakhre-kicker">${voting?'A MANIFESTO, APPARENTLY':'ALL ABOUT THE BIRTHDAY GIRL'}</p><h3>${escape(page.title)}</h3>${voting?pollMarkup():`<div class="nakhre-caption-art" aria-hidden="true"><img src="assets/flower.svg" alt=""><span>All the personality.<br>All the birthday privileges.</span><span class="nakhre-doodle-star">✧</span></div>`}</div></div>`}${voting?resultsMarkup():''}${index<pages.length-1 ? '<button class="nakhre-page-curl" type="button" data-nakhre-step="1" aria-label="Turn the page corner to the next Nakhre page"><span aria-hidden="true">↗</span></button>' : ''}<div class="nakhre-sheet-footer"><span>Birthday edition · All about Tahreem</span><span aria-hidden="true">✿</span><span>${String(index+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}</span></div></article><nav class="nakhre-nav" aria-label="Nakhre pages"><button type="button" data-nakhre-step="-1" ${index===0?'disabled':''}>← Previous</button><label for="nakhre-page-picker"><span class="sr-only">Go to Nakhre page</span><select id="nakhre-page-picker">${pages.map((item,i)=>`<option value="${i}" ${i===index?'selected':''}>${i+1} / ${pages.length} · ${escape(item.title)}</option>`).join('')}</select></label><button type="button" data-nakhre-step="1" ${index===pages.length-1?'disabled':''}>Next →</button></nav></section>`;
      if (voting) window.GardenBallot.mount(container);
    }
    function change(delta) {
      const next = Math.max(0,Math.min(pages.length-1,index+delta));
      if (next===index) return;
      const focusedNav = document.activeElement?.closest('.nakhre-nav');
      const focusedCorner = document.activeElement?.matches('.nakhre-page-curl');
      index=next; render();
      window.GardenBookMotion?.page(container, delta<0?-1:1);
      const dialog = container.closest('dialog');
      if (dialog) dialog.scrollTop=0;
      if (focusedNav) (container.querySelector(`[data-nakhre-step="${delta<0?-1:1}"]:not(:disabled)`) || container.querySelector('#nakhre-page-picker')).focus({preventScroll:true});
      if (focusedCorner) (container.querySelector('.nakhre-page-curl') || container.querySelector('[data-nakhre-step="-1"]'))?.focus({preventScroll:true});
    }
    function showScreenshot(position) {
      window.GardenBookMotion?.cancel();
      const image=pages[index].images[position];
      if (!image) return;
      state.lightbox?.close();
      const viewer = document.createElement('dialog');
      viewer.className='nakhre-lightbox';
      viewer.setAttribute('aria-label',image.caption);
      viewer.innerHTML=`<div class="nakhre-lightbox-header"><p>${escape(image.caption)}</p><button type="button" aria-label="Close screenshot">×</button></div><img src="${escape(encodeURI(image.src).replace(/#/g,'%23').replace(/\?/g,'%3F'))}" alt="${escape(image.alt || image.caption)}"><p class="nakhre-lightbox-tip">Tap the screenshot to switch between fit and full size.</p>`;
      document.body.append(viewer); state.lightbox=viewer;
      viewer.querySelector('img').addEventListener('click',()=>viewer.classList.toggle('is-full-size'));
      viewer.addEventListener('close',()=>{viewer.remove();if(state.lightbox===viewer) state.lightbox=null;});
      viewer.showModal();
      const transition = window.GardenGiftMagic?.screenshot(viewer, container.querySelector(`[data-nakhre-zoom="${position}"] img`));
      const close = () => transition?.close ? transition.close() : viewer.close();
      viewer.querySelector('button').addEventListener('click',close);
      viewer.addEventListener('cancel',event=>{event.preventDefault();close();});
      viewer.addEventListener('click',event=>{
        const r=viewer.getBoundingClientRect();
        if(event.target===viewer && (event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))close();
      });
    }
    render();
  }
  window.addEventListener('pagehide',unmount);
  window.GardenNakhre={mount,unmount};
})();
