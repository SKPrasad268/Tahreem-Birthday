/* Password-derived encryption protects image data or the Drive file references until unlock. */
(() => {
  'use strict';
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const decode=value=>Uint8Array.from(atob(value),char=>char.charCodeAt(0));
  const types=new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif']);
  let localEnvelopePromise=null;
  function loadLocalEnvelope(config) {
    if(window.BIRTHDAY_PRIVATE_ALBUM)return Promise.resolve(window.BIRTHDAY_PRIVATE_ALBUM);
    if(localEnvelopePromise)return localEnvelopePromise;
    const url=new URL(config.script || config.src.replace(/\.json$/i,'.js'),location.href);
    if(url.protocol!=='file:')return Promise.reject(Error('ALBUM_UNAVAILABLE'));
    localEnvelopePromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      let timer;
      const cleanup=()=>{clearTimeout(timer);script.onload=null;script.onerror=null;script.remove();};
      script.onload=()=>{const data=window.BIRTHDAY_PRIVATE_ALBUM;cleanup();if(data)resolve(data);else reject(Error('ALBUM_UNAVAILABLE'));};
      script.onerror=()=>{cleanup();reject(Error('ALBUM_FILE_MISSING'));};
      timer=setTimeout(()=>{cleanup();reject(Error('ALBUM_FILE_MISSING'));},20000);
      // A normal classic script may load local ciphertext; fetch(file://) cannot.
      script.src=url.href;script.async=true;
      document.head.append(script);
    }).catch(error=>{localEnvelopePromise=null;throw error;});
    return localEnvelopePromise;
  }
  const lockArt='<svg viewBox="0 0 64 72" fill="none" aria-hidden="true"><path d="M18 30V20a14 14 0 0 1 28 0v10" stroke="currentColor" stroke-width="3"/><rect x="10" y="29" width="44" height="36" rx="7" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="44" r="4" fill="currentColor"/><path d="M32 47v7" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
  let current=null;
  function releaseImages(state) {
    state.images.forEach(image=>{if(image.ownedBlob)URL.revokeObjectURL(image.url);});
    state.images=[];
  }
  function stop() {
    if(!current)return;
    current.generation++;
    current.events.abort();current.request?.abort();
    releaseImages(current);
    if(current.container.querySelector('.private-album-panel'))current.container.replaceChildren();
    current=null;
  }
  function open(container,config,onBack) {
    stop();
    const state={container,config,onBack,events:new AbortController(),request:null,images:[],index:0,generation:0,busy:false};
    current=state;
    const listen=(target,event,callback,options={})=>target?.addEventListener(event,callback,{...options,signal:state.events.signal});
    const back=()=>{stop();onBack();};
    const resetScroll=()=>{const dialog=container.closest('dialog');if(dialog)dialog.scrollTop=0;};
    const active=()=>current===state && container.isConnected;
    function lock(message='') {
      state.generation++;state.busy=false;state.request?.abort();
      releaseImages(state);state.index=0;
      if(!active())return;
      container.innerHTML=`<section class="private-album-panel"><button class="private-back" type="button" data-private-back>← Back to Nakhre</button><div class="private-sealed"><span class="private-seal-art">${lockArt}</span><p class="private-eyebrow">THE TAHREEM EDITION · UNDER LOCK & KEY</p><h3>Private birthday album</h3><p class="private-intro">A few extra pages for the birthday girl.<br>Enter the album password to open them.</p><form id="private-unlock-form"><label for="private-password">Album password</label><div class="private-password-row"><input id="private-password" type="password" name="password" autocomplete="current-password" required placeholder="Enter the password"><button type="button" data-private-show aria-pressed="false">Show</button></div><button class="private-unlock" type="submit">Unlock album <span aria-hidden="true">✿</span></button></form><p id="private-status" class="private-status" role="status">${escape(message)}</p><p class="private-lock-note">The album locks again when you leave it.</p></div></section>`;
      resetScroll();
    }
    function renderImage() {
      if(!active()||!state.images.length)return;
      const image=state.images[state.index];
      container.innerHTML=`<section class="private-album-panel is-open"><div class="private-toolbar"><button class="private-back" type="button" data-private-back>← Back to Nakhre</button><span class="private-open-label">PRIVATE BIRTHDAY ALBUM</span><button type="button" data-private-lock>Lock album <span aria-hidden="true">⌑</span></button></div><article class="private-page"><p class="private-eyebrow">A LITTLE EXTRA FOR THE BIRTHDAY GIRL · ${state.index+1} / ${state.images.length}</p><div class="private-photo-layout"><figure><img class="private-photo" src="${escape(image.url)}" alt="${escape(image.title)}" decoding="async" referrerpolicy="no-referrer"><p class="private-image-error" role="status" hidden>This picture could not load. Try opening it in Drive below.</p><figcaption>THE TAHREEM EDITION ✿</figcaption></figure><div class="private-caption"><h3>${escape(image.title)}</h3><p>All about the birthday girl.</p><span aria-hidden="true">✿ &nbsp; ✧ &nbsp; ✿</span><button class="private-full-size" type="button" data-private-zoom>Read full screenshot ↗</button>${image.viewUrl ? `<a class="private-drive-open" href="${escape(image.viewUrl)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Open in Drive ↗</a>` : ''}</div></div></article><nav class="private-nav" aria-label="Private album pages"><button type="button" data-private-step="-1" ${state.index===0?'disabled':''}>← Previous</button><span aria-live="polite">${state.index+1} / ${state.images.length}</span><button type="button" data-private-step="1" ${state.index===state.images.length-1?'disabled':''}>Next →</button></nav></section>`;
      const photo=container.querySelector('.private-photo');
      listen(photo,'error',()=>{
        if(!photo.isConnected)return;
        photo.hidden=true;
        container.querySelector('.private-image-error').hidden=false;
      },{once:true});
      resetScroll();
    }
    function move(delta) {
      const next=Math.max(0,Math.min(state.images.length-1,state.index+delta));
      if(next===state.index)return;
      state.index=next;renderImage();
      (container.querySelector(`[data-private-step="${delta<0?-1:1}"]:not(:disabled)`)||container.querySelector('[data-private-lock]'))?.focus({preventScroll:true});
    }
    function status(message) {const node=container.querySelector('#private-status');if(node)node.textContent=message;}
    async function unlock(form) {
      if(state.busy||!form.reportValidity())return;
      if(!window.crypto?.subtle){status('Open the album on the HTTPS website or the local preview to unlock it.');return;}
      const attempt=++state.generation;state.busy=true;
      const input=form.querySelector('input');let password=input.value;input.value='';
      const button=form.querySelector('[type="submit"]');button.disabled=true;button.textContent='Unlocking…';
      let timer;
      try {
        status('Opening the encrypted album…');
        let envelope;
        if(location.protocol==='file:') {
          envelope=await loadLocalEnvelope(config);
        } else {
          const candidate=new URL(config.src,location.href);
          if(candidate.origin!==location.origin)throw Error('ALBUM_UNAVAILABLE');
          state.request=new AbortController();timer=setTimeout(()=>state.request.abort(),20000);
          const response=await fetch(candidate.href,{cache:'no-store',signal:state.request.signal});
          if(!response.ok)throw Error('ALBUM_FILE_MISSING');
          envelope=await response.json();
        }
        if(!active()||attempt!==state.generation)return;
        if(envelope.version!==1||envelope.kdf!=='PBKDF2-SHA256'||envelope.iterations!==600000||envelope.cipher!=='AES-256-GCM')throw Error('ALBUM_UNAVAILABLE');
        const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
        password='';
        const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',iterations:envelope.iterations,salt:decode(envelope.salt)},material,{name:'AES-GCM',length:256},false,['decrypt']);
        const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(envelope.iv),additionalData:new TextEncoder().encode('tahreem-private-album:v1'),tagLength:128},key,decode(envelope.ciphertext));
        if(!active()||attempt!==state.generation)return;
        const payload=JSON.parse(new TextDecoder().decode(bytes));new Uint8Array(bytes).fill(0);
        if(payload.version===2&&payload.source==='google-drive') {
          if(!window.GardenPrivateAlbumSources)throw Error('ALBUM_UNAVAILABLE');
          state.images=window.GardenPrivateAlbumSources.parseDrivePayload(payload);
        } else {
          if(payload.version!==1||!Array.isArray(payload.images)||!payload.images.length||payload.images.length>100)throw Error('ALBUM_UNAVAILABLE');
          for(const image of payload.images) {
            if(!types.has(image.type)||typeof image.title!=='string'||typeof image.data!=='string')throw Error('ALBUM_UNAVAILABLE');
            const data=decode(image.data);
            const url=URL.createObjectURL(new Blob([data],{type:image.type}));data.fill(0);image.data='';
            state.images.push({title:image.title,url,ownedBlob:true});
          }
        }
        state.index=0;renderImage();container.querySelector('[data-private-lock]')?.focus({preventScroll:true});
      } catch(error) {
        if(!active()||attempt!==state.generation)return;
        releaseImages(state);
        status(error.name==='OperationError'?'That password didn’t unlock the album. Please try again.':error.message==='ALBUM_FILE_MISSING'?'The encrypted album file is missing. Extract the complete website folder and try again.':'The album could not open. Check the connection and try again.');
        input.focus({preventScroll:true});
      } finally {
        password='';clearTimeout(timer);
        if(active()&&attempt===state.generation){state.busy=false;if(button.isConnected){button.disabled=false;button.innerHTML='Unlock album <span aria-hidden="true">✿</span>';}}
      }
    }
    listen(container,'submit',event=>{if(event.target.matches('#private-unlock-form')){event.preventDefault();void unlock(event.target);}});
    listen(container,'click',event=>{
      if(event.target.closest('[data-private-back]')){back();return;}
      if(event.target.closest('[data-private-lock]')){lock('Album locked.');return;}
      const show=event.target.closest('[data-private-show]');
      if(show){const input=container.querySelector('#private-password');const showing=input.type==='password';input.type=showing?'text':'password';show.textContent=showing?'Hide':'Show';show.setAttribute('aria-pressed',String(showing));return;}
      const step=event.target.closest('[data-private-step]');if(step){move(Number(step.dataset.privateStep));return;}
      if(event.target.closest('[data-private-zoom]')){container.querySelector('.private-page')?.classList.toggle('is-enlarged');}
    });
    listen(container,'keydown',event=>{
      if(!state.images.length||!['ArrowLeft','ArrowRight'].includes(event.key)||event.target.closest('input,textarea,select'))return;
      event.preventDefault();move(event.key==='ArrowRight'?1:-1);
    });
    let touch=null;
    listen(container,'touchstart',event=>{const point=event.changedTouches[0];touch=event.target.closest('.private-photo')?{x:point.clientX,y:point.clientY}:null;},{passive:true});
    listen(container,'touchend',event=>{if(!touch)return;const point=event.changedTouches[0],dx=point.clientX-touch.x,dy=point.clientY-touch.y;touch=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);},{passive:true});
    listen(document,'visibilitychange',()=>{if(document.hidden&&active())lock('Album locked while you were away.');});
    listen(container.closest('dialog'),'close',()=>{if(active())lock();});
    lock();
  }
  window.addEventListener('pagehide',stop);
  window.GardenPrivateAlbum={open,stop};
})();
