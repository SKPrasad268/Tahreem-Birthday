/* The visual deck follows the real local audio player; no second playback system. */
(() => {
  'use strict';
  const panel=document.getElementById('radio-player'), record=document.getElementById('radio-record');
  const deck=panel?.querySelector('.record-sleeve');
  if(!panel || !record || !deck) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const portrait=matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  const allowed=()=>typeof record.animate==='function'&&!reduced.matches&&!portrait.matches&&!document.hidden&&!document.body.classList.contains('garden-motion-off');
  const carrier=document.createElement('div');carrier.className='record-carrier';
  record.before(carrier);carrier.append(record);
  const jacket=document.createElement('div');jacket.className='record-paper-jacket';jacket.setAttribute('aria-hidden','true');
  jacket.innerHTML='<span class="record-jacket-edition">THE BIRTHDAY COLLECTION</span><img src="assets/flower.svg" alt=""><span class="record-jacket-title">Tahreem’s mix</span><span class="record-jacket-mark">✧ &nbsp; 33⅓ RPM &nbsp; ✧</span>';
  deck.append(jacket);
  const platter=document.createElement('span');platter.className='record-platter';platter.setAttribute('aria-hidden','true');deck.prepend(platter);
  let index=null,seated=false,cue=null,ghost=null,spin=null,coast=null,motor=false,lastState=null;
  const cues=new Set(),labels=new Set();
  function angle() {
    const matrix=getComputedStyle(record).transform;
    if(matrix==='none')return 0;
    try {const m=new DOMMatrixReadOnly(matrix);return Math.atan2(m.b,m.a)*180/Math.PI;} catch(_){return 0;}
  }
  function stop(coasting=false) {
    const from=angle(), wasMoving=motor || !!coast;
    spin?.cancel();spin=null;coast?.cancel();coast=null;motor=false;
    record.style.transform=`rotate(${from}deg)`;
    panel.classList.remove('record-is-coasting');
    if(!coasting || !wasMoving || !allowed() || panel.hidden)return;
    panel.classList.add('record-is-coasting');
    const current=record.animate([{transform:`rotate(${from}deg)`},{transform:`rotate(${from+32}deg)`}],{duration:1250,easing:'cubic-bezier(.08,.62,.2,1)',fill:'forwards'});
    coast=current;
    current.finished.then(()=>{
      if(coast!==current)return;
      record.style.transform=`rotate(${from+32}deg)`;current.cancel();coast=null;panel.classList.remove('record-is-coasting');
    },()=>{});
  }
  function start() {
    if(motor || !allowed() || panel.hidden || !seated)return;
    const from=angle();stop(false);
    spin=record.animate([{transform:`rotate(${from}deg)`},{transform:`rotate(${from+360}deg)`}],{duration:13000,iterations:Infinity,easing:'linear'});
    motor=true;
  }
  function needle(down) {panel.dataset.needle=down?'down':'up';}
  function clearCue(complete=false) {
    if(!cue)return;
    const old=cue;cue=null;
    old.timers.forEach(clearTimeout);cues.forEach(a=>a.cancel());cues.clear();ghost?.remove();ghost=null;
    panel.classList.remove('record-is-cueing');
    if(complete) {seated=true;needle(true);}
    panel.dataset.recordPhase=seated?'seated':'ready';
    old.resolve();
  }
  function change(next) {
    if(index===next)return;
    clearCue();ghost?.remove();ghost=null;
    if(seated && !panel.hidden && allowed()) {
      ghost=record.cloneNode(true);ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
      ghost.classList.add('record-leaving');ghost.setAttribute('aria-hidden','true');ghost.inert=true;
      ghost.style.transform=getComputedStyle(record).transform;
      deck.append(ghost);
    }
    stop(false);record.style.transform='rotate(0deg)';needle(false);index=next;seated=false;panel.dataset.recordPhase='ready';
  }
  function metadata(track) {
    jacket.querySelector('.record-jacket-title').textContent=track?.title || 'Tahreem’s mix';
    labels.forEach(a=>a.cancel());labels.clear();
    if(panel.hidden || !allowed())return;
    panel.querySelectorAll('#radio-title,#radio-artist,#radio-description').forEach((node,i)=>{
      const a=node.animate([{opacity:.45,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:380,delay:i*35,easing:'cubic-bezier(.2,.75,.25,1)'});
      labels.add(a);a.finished.then(()=>labels.delete(a),()=>labels.delete(a));
    });
  }
  function prepare() {
    if(cue)return cue.promise;
    // A seated record resumes synchronously, preserving the browser's tap permission.
    if(seated) {needle(true);return null;}
    if(!allowed()) {seated=true;needle(true);ghost?.remove();ghost=null;panel.dataset.recordPhase='seated';return null;}
    void carrier.offsetWidth;
    panel.classList.add('record-is-cueing');panel.dataset.recordPhase='cueing';needle(false);
    const state={timers:new Set(),resolve:null,promise:null};
    state.promise=new Promise(resolve=>state.resolve=resolve);cue=state;
    const at=(delay,fn)=>{const timer=setTimeout(()=>{state.timers.delete(timer);if(cue===state)fn();},delay);state.timers.add(timer);};
    if(ghost) {
      const from=ghost.style.transform;
      const a=ghost.animate([{opacity:1,transform:`translateY(0) ${from}`},{opacity:0,transform:`translate(-60px,-35px) rotate(-12deg) scale(.72) ${from}`}],{duration:340,easing:'ease-in',fill:'forwards'});
      cues.add(a);
      a.finished.catch(()=>{});
    }
    at(830,()=>{panel.dataset.recordPhase='lowering';needle(true);});
    at(1130,()=>{clearCue(true);start();});
    return state.promise;
  }
  function sync(state) {
    lastState=state;
    // Audio may have advanced to a new track while the deck was closed.
    if(state.playing && !cue) {seated=true;panel.dataset.recordPhase='seated';}
    if(state.hidden) {clearCue();stop(false);needle(false);labels.forEach(a=>a.cancel());labels.clear();return;}
    if(cue && state.wantsPlayback)return;
    if(!state.wantsPlayback)clearCue();
    const running=state.playing || (state.wantsPlayback&&state.state==='loading'&&seated);
    needle(running);
    if(running)start();else if(motor)stop(true);
  }
  function hide(){clearCue();stop(false);needle(false);ghost?.remove();ghost=null;}
  function settle() {
    if(!allowed()) {
      clearCue(true);stop(false);labels.forEach(a=>a.cancel());labels.clear();
    } else if(lastState)sync(lastState);
  }
  reduced.addEventListener('change',settle);portrait.addEventListener('change',settle);document.addEventListener('visibilitychange',settle);
  new MutationObserver(settle).observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('pagehide',hide);
  window.GardenTurntable={change,metadata,prepare,sync,hide};
})();
