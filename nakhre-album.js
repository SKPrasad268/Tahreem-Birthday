/* A little scrapbook, with an optional shared ballot API. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const choices = {yes:'Yes, Tahreem should be PM', no:'No, Mai gadha hu'};
  let current = null;
  let index = 0;
  let sessionId;
  function clientId() {
    if (sessionId) return sessionId;
    try { sessionId = localStorage.getItem('tahreem-pm:voter'); } catch (_) { /* Use this tab if storage is unavailable. */ }
    if (!/^[a-f\d-]{36}$/i.test(sessionId || '')) {
      sessionId = crypto.randomUUID();
      try { localStorage.setItem('tahreem-pm:voter',sessionId); } catch (_) { /* Server also checks the name. */ }
    }
    return sessionId;
  }
  function endpoint(config) {
    const configured = typeof config.apiBase === 'string' ? config.apiBase.trim() : '';
    if (configured) {
      try {
        const url = new URL(configured,location.href);
        if (url.protocol === 'https:' || (url.origin === location.origin && url.protocol === 'http:')) return url.href.replace(/\/$/,'');
      } catch (_) { /* Invalid configuration leaves voting unavailable. */ }
      return '';
    }
    return ['127.0.0.1','localhost','[::1]'].includes(location.hostname) ? `${location.origin}/api/nakhre-pm` : '';
  }
  function unmount() {
    if (!current) return;
    window.GardenPrivateAlbum?.stop();
    current.events.abort();
    current.request?.abort();
    clearInterval(current.poll);
    current.lightbox?.close();
    current = null;
  }
  function mount(container,pages,config,privateConfig={}) {
    unmount();
    const state = {container,pages,api:endpoint(config),events:new AbortController(),request:null,poll:null,lightbox:null,revision:0};
    current = state;
    index = Math.max(0,Math.min(index,pages.length-1));
    const listen = (element,event,handler,options={}) => element?.addEventListener(event,handler,{...options,signal:state.events.signal});
    let touch = null;
    listen(container,'click',event => {
      if(event.target.closest('[data-open-private]') && window.GardenPrivateAlbum && privateConfig.src) {
        window.GardenBookMotion?.cancel();
        state.privateActive=true;
        state.request?.abort();clearInterval(state.poll);state.revision++;
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
    listen(container,'submit',event => {
      if (!event.target.matches('#pm-ballot-form')) return;
      event.preventDefault(); void vote(event.target);
    });

    function figure(image,position,group=false) {
      return `<figure class="nakhre-frame${group?' nakhre-frame-small':''}" style="--tilt:${[-1.6,1.2,-.8][position%3]}deg"><button class="nakhre-photo-button" type="button" data-nakhre-zoom="${position}" aria-label="Enlarge ${escape(image.caption)}"><img src="${escape(encodeURI(image.src).replace(/#/g,'%23').replace(/\?/g,'%3F'))}" alt="${escape(image.alt || image.caption)}" decoding="async"><span class="nakhre-zoom-hint">↗ Tap to read</span></button><figcaption>${group?escape(image.caption):'A very Tahreem moment ✿'}</figcaption></figure>`;
    }
    function pollMarkup() {
      return `<section class="pm-ballot" aria-labelledby="pm-ballot-title"><span class="pm-ballot-stamp" aria-hidden="true">✓</span><p class="nakhre-kicker">THE VERY OFFICIAL BIRTHDAY BALLOT</p><h4 id="pm-ballot-title">Tahreem for PM?</h4><p class="pm-ballot-intro">A very important decision. Choose wisely.</p><div id="pm-receipt" class="pm-receipt" hidden></div><form id="pm-ballot-form"><label class="pm-name-label" for="pm-voter-name">Your name</label><input id="pm-voter-name" name="name" autocomplete="name" placeholder="Who's casting this historic vote?" minlength="2" maxlength="60" required><fieldset><legend>Your vote</legend>${Object.entries(choices).map(([value,label])=>`<label class="pm-choice"><input type="radio" name="choice" value="${value}" required><span>${escape(label)}</span><span class="pm-choice-check" aria-hidden="true">✓</span></label>`).join('')}</fieldset><button class="pm-submit" type="submit" disabled>Cast my vote <span aria-hidden="true">✿</span></button><p class="pm-disclosure">Your name and choice will appear in the results. One vote per name and browser.</p></form><p id="pm-status" role="status" class="pm-status">${state.api?'Opening the ballot…':'Shared voting will open here once the ballot server is connected.'}</p><button id="pm-retry" class="pm-retry" type="button" hidden>Try connecting again ↻</button></section>`;
    }
    function resultsMarkup() {
      return `<section class="pm-results" aria-labelledby="pm-results-title"><div class="pm-results-heading"><div><p class="nakhre-kicker">THE PEOPLE HAVE SPOKEN</p><h4 id="pm-results-title">The vote book</h4></div><span id="pm-total" class="pm-total">— votes</span></div><div id="pm-tallies" class="pm-tallies">${Object.entries(choices).map(([key,label])=>`<div class="pm-tally"><div><span>${escape(label)}</span><strong data-vote-count="${key}">—</strong></div><div class="pm-bar"><span data-vote-bar="${key}"></span></div></div>`).join('')}</div><div id="pm-voters" class="pm-voters" aria-label="Voters and their choices"><p class="pm-empty">${state.api?'The vote book is loading…':'The vote book will appear when shared voting is connected.'}</p></div></section>`;
    }
    function render() {
      window.GardenBookMotion?.cancel();
      state.privateActive=false;
      state.request?.abort(); clearInterval(state.poll);
      state.revision++; state.busy=false; state.refreshing=false;
      const page = pages[index], grouped=page.kind==='together', voting=page.kind==='vote';
      container.innerHTML = `<section class="nakhre-album${grouped?' is-together':''}${voting?' is-ballot':''}" aria-label="Nakhre scrapbook"><div class="nakhre-issue-bar"><span class="nakhre-issue-seal" aria-hidden="true">✿</span><span>Birthday girl. Main character energy.</span>${privateConfig.src ? '<button class="nakhre-private-link" type="button" data-open-private><svg viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="M6 12V7a6 6 0 0 1 12 0v5" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="11" width="18" height="14" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 17v3" stroke="currentColor" stroke-width="2"/></svg>Private album</button>' : ''}<span class="nakhre-edition-tag">${grouped?'TAHREEM, TIMES THREE':voting?'ELECTION SPECIAL':index>=pages.length-2?'ONE LAST LITTLE NOTE':'FROM THE NAKHRE ARCHIVES'}</span></div><article class="nakhre-sheet"><div class="nakhre-page-meta"><span>EXHIBIT ${String(index+1).padStart(2,'0')}</span><span aria-hidden="true">✿ &nbsp; ✧ &nbsp; ✿</span><span>${grouped?'THREE SHOTS OF TAHREEM ENERGY':'THE TAHREEM EDITION'}</span></div>${grouped?`<header class="nakhre-group-heading"><h3>${escape(page.title)}</h3><p>Three screenshots. Full Tahreem energy.</p></header><div class="nakhre-together">${page.images.map((image,i)=>figure(image,i,true)).join('')}</div>`:`<div class="nakhre-spread">${figure(page.images[0],0)}<div class="nakhre-caption"><p class="nakhre-kicker">${voting?'A MANIFESTO, APPARENTLY':'ALL ABOUT THE BIRTHDAY GIRL'}</p><h3>${escape(page.title)}</h3>${voting?pollMarkup():`<div class="nakhre-caption-art" aria-hidden="true"><img src="assets/flower.svg" alt=""><span>All the personality.<br>All the birthday privileges.</span><span class="nakhre-doodle-star">✧</span></div>`}</div></div>`}${voting?resultsMarkup():''}${index<pages.length-1 ? '<button class="nakhre-page-curl" type="button" data-nakhre-step="1" aria-label="Turn the page corner to the next Nakhre page"><span aria-hidden="true">↗</span></button>' : ''}<div class="nakhre-sheet-footer"><span>Birthday edition · All about Tahreem</span><span aria-hidden="true">✿</span><span>${String(index+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}</span></div></article><nav class="nakhre-nav" aria-label="Nakhre pages"><button type="button" data-nakhre-step="-1" ${index===0?'disabled':''}>← Previous</button><label for="nakhre-page-picker"><span class="sr-only">Go to Nakhre page</span><select id="nakhre-page-picker">${pages.map((item,i)=>`<option value="${i}" ${i===index?'selected':''}>${i+1} / ${pages.length} · ${escape(item.title)}</option>`).join('')}</select></label><button type="button" data-nakhre-step="1" ${index===pages.length-1?'disabled':''}>Next →</button></nav></section>`;
      if (voting && state.api) {
        container.querySelector('#pm-retry').addEventListener('click',()=>void refresh());
        void refresh();
        state.poll = setInterval(()=>{if(!document.hidden && container.closest('dialog')?.open && !state.busy) void refresh();},12000);
      }
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
    const isCurrent = () => current===state && !state.privateActive && pages[index].kind==='vote' && !!container.querySelector('#pm-status');
    function status(message,error=false) {
      if (!isCurrent()) return;
      const target=container.querySelector('#pm-status');
      target.textContent=message; target.classList.toggle('is-error',error);
    }
    async function request(method='GET',body) {
      const controller = new AbortController(); state.request=controller;
      const timeout=setTimeout(()=>controller.abort(),10000);
      try {
        const response=await fetch(state.api,{method,headers:{'X-Voter-Id':clientId(),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:'no-store',credentials:'omit'});
        let result;
        try { result=await response.json(); } catch (_) { throw new Error('The ballot server is unavailable. Please try again.'); }
        if (!response.ok) { const error=new Error(result.error || 'Your vote could not be saved.');error.result=result;throw error; }
        return result;
      } finally {clearTimeout(timeout);}
    }
    function updateResults(result) {
      if (!isCurrent()) return;
      container.querySelector('#pm-total').textContent=`${result.total} ${result.total===1?'vote':'votes'}`;
      for (const key of Object.keys(choices)) {
        container.querySelector(`[data-vote-count="${key}"]`).textContent=String(result.counts[key]);
        container.querySelector(`[data-vote-bar="${key}"]`).style.width=`${result.total?result.counts[key]/result.total*100:0}%`;
      }
      const voters=container.querySelector('#pm-voters');
      const list=document.createElement('ol'); list.className='pm-voter-list';
      result.votes.forEach(entry=>{
        const li=document.createElement('li'),name=document.createElement('strong'),choice=document.createElement('span');
        name.textContent=entry.name;choice.textContent=choices[entry.choice];li.append(name,choice);list.append(li);
      });
      if(result.votes.length) voters.replaceChildren(list);
      else {const empty=document.createElement('p');empty.className='pm-empty';empty.textContent='The first page is yours. Be the first to vote.';voters.replaceChildren(empty);}
      const form=container.querySelector('#pm-ballot-form'),receipt=container.querySelector('#pm-receipt');
      form.hidden=!!result.yourVote;receipt.hidden=!result.yourVote;
      if(result.yourVote) {
        const title=document.createElement('strong'),copy=document.createElement('span');
        title.textContent=`Your vote is in, ${result.yourVote.name}. ✿`;copy.textContent=choices[result.yourVote.choice];receipt.replaceChildren(title,copy);
      }
      form.querySelector('button[type="submit"]').disabled=!!result.yourVote || !!state.busy;
      container.querySelector('#pm-retry').hidden=true;
    }
    async function refresh() {
      if (state.busy || state.refreshing) return;
      const revision=state.revision;
      state.refreshing=true;
      try {const result=await request();if(revision!==state.revision)return;updateResults(result);status(result.yourVote?'One very important vote, safely in the book.':'The ballot is open. Pick your side.');}
      catch(error) {if(isCurrent() && revision===state.revision){status('Could not reach the shared ballot. The vote book is temporarily unavailable.',true);container.querySelector('#pm-retry').hidden=false;container.querySelector('.pm-submit').disabled=true;}}
      finally {if(revision===state.revision)state.refreshing=false;}
    }
    async function vote(form) {
      if(state.busy || !state.api || !form.reportValidity()) return;
      const revision=state.revision;
      state.busy=true;
      const button=form.querySelector('.pm-submit');button.disabled=true;
      status('Putting your vote in the book…');
      try {
        const fields=new FormData(form);
        const result=await request('POST',{name:fields.get('name'),choice:fields.get('choice')});
        if(revision!==state.revision)return;
        updateResults(result);status('Vote recorded. Democracy looks good in pink.');
      } catch(error) {
        if(isCurrent() && revision===state.revision) {
          if(error.result?.counts) updateResults(error.result);
          status(error.name==='AbortError'?'Connection interrupted. Check the results before trying again.':error.message,true);
        }
      } finally {if(revision===state.revision){state.busy=false;if(isCurrent() && !form.hidden) button.disabled=false;}}
    }
    render();
  }
  window.addEventListener('pagehide',unmount);
  window.GardenNakhre={mount,unmount};
})();
