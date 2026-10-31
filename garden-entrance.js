/* A single, interruptible entrance. Every tabletop control remains available. */
(() => {
  'use strict';
  const garden=document.getElementById('garden');
  if(!garden)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const portrait=matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  const allowed=()=>typeof garden.animate==='function'&&!reduced.matches&&!portrait.matches&&!document.hidden&&!document.body.classList.contains('garden-motion-off');
  let played=false,curtains=null,trail=null,timer=null;
  const animations=new Set();
  const arrivals=[garden.querySelector('.garden-title'),...[...garden.querySelectorAll('.table-object')].sort((a,b)=>a.offsetLeft-b.offsetLeft)].filter(Boolean);
  const first=garden.querySelector('.album-object') || garden.querySelector('.table-object');
  const flower=(x,y,scale)=>`<g transform="translate(${x} ${y}) scale(${scale})"><g fill="#ecc0ce" stroke="#c896aa" stroke-width="1.1">${Array.from({length:7},(_,i)=>`<ellipse cx="0" cy="-23" rx="13" ry="24" transform="rotate(${i*360/7})"/>`).join('')}</g><circle r="13" fill="#e7cf94" stroke="#c5b578"/><circle cx="-3" cy="-3" r="5" fill="#f9e9b9" opacity=".7"/></g>`;
  function mount() {
    if(curtains || !allowed())return;
    curtains=document.createElement('div');curtains.className='garden-flower-curtains';curtains.setAttribute('aria-hidden','true');curtains.inert=true;
    const art=`<svg viewBox="0 0 280 700" fill="none" preserveAspectRatio="xMinYMax meet"><g stroke="#879771" stroke-width="5" stroke-linecap="round"><path d="M18 720C35 580 130 500 88 375S50 240 50 130M32 639C97 520 190 550 210 480M72 492C118 411 193 373 180 250M15 676 35 590"/></g><g fill="#a7b58e" stroke="#85946f" stroke-width="1.4"><path d="M50 610C-16 573-6 519 15 505c49 27 59 69 35 105Z"/><path d="M70 555c18-75 62-95 94-87-4 56-37 87-94 87Z"/><path d="M104 429c-75-17-101-63-87-94 61 3 90 39 87 94Z"/><path d="M93 368c17-61 54-82 88-73-1 48-36 77-88 73Z"/><path d="M46 246c-45-24-54-68-35-93 42 12 56 49 35 93Z"/><path d="M157 306c18-52 66-62 90-40-15 39-48 51-90 40Z"/><path d="M172 534c31-39 70-44 92-19-23 34-55 39-92 19Z"/></g><g stroke="#dce1c3" stroke-width="1.2" opacity=".8"><path d="M40 594 17 531M81 541 145 484M94 411 31 353M105 352 161 310M170 292l62-20"/></g>${flower(50,130,1.15)}${flower(180,250,.93)}${flower(88,375,1.15)}${flower(210,480,.82)}${flower(35,590,1.05)}</svg>`;
    for(const side of ['left','right']) {const panel=document.createElement('div');panel.className=`entrance-flowers entrance-flowers-${side}`;panel.innerHTML=art;curtains.append(panel);}
    garden.append(curtains);
  }
  function finish() {
    clearTimeout(timer);timer=null;animations.forEach(a=>a.cancel());animations.clear();
    curtains?.remove();curtains=null;trail?.remove();trail=null;
    garden.classList.remove('garden-is-entering');first?.classList.remove('entrance-guided-object');
    arrivals.forEach(node=>{node.classList.remove('ambient-arrival');node.style.removeProperty('--arrival-delay');});
    if(played)garden.style.setProperty('--garden-camera-scale','1.04');
  }
  function start() {
    if(played)return;
    played=true;
    if(!allowed()) {finish();return;}
    mount();garden.classList.add('garden-is-entering');
    arrivals.forEach((node,i)=>{node.style.setProperty('--arrival-delay',`${i?850+i*85:650}ms`);node.classList.add('ambient-arrival');});
    trail=document.createElement('div');trail.className='entrance-firefly-trail';trail.setAttribute('aria-hidden','true');trail.inert=true;garden.append(trail);
    const bounds=garden.getBoundingClientRect(), destination=(first?.querySelector('.object-art') || first)?.getBoundingClientRect();
    if(destination) {
      const end={x:destination.left-bounds.left+destination.width*.5,y:destination.top-bounds.top+destination.height*.45};
      const begin={x:bounds.width*.67,y:bounds.height*.31}, c1={x:bounds.width*.6,y:bounds.height*.51},c2={x:end.x+100,y:end.y-95};
      for(let i=0;i<12;i++) {
        const light=document.createElement('span');light.className='entrance-firefly';trail.append(light);
        const frames=Array.from({length:11},(_,n)=>{
          const t=n/10,u=1-t,x=u*u*u*begin.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*end.x,y=u*u*u*begin.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*end.y;
          return {transform:`translate(${x+(i%3-1)*6}px,${y+(i%2?5:-5)}px) scale(${n===0||n===10?.5:1})`,opacity:n===0||n===10?0:.85,offset:t};
        });
        const animation=light.animate(frames,{duration:1550,delay:850+i*42,easing:'linear',fill:'both'});animations.add(animation);animation.finished.catch(()=>{});
      }
      first.classList.add('entrance-guided-object');
    }
    timer=setTimeout(finish,3100);
  }
  const sync=()=>{if(!allowed())finish();};
  reduced.addEventListener('change',sync);portrait.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  garden.addEventListener('pointerdown',()=>{if(played)finish();},{passive:true});
  document.addEventListener('keydown',()=>{if(played)finish();});
  window.addEventListener('birthday-object-opened',finish);window.addEventListener('birthday-radio-opened',finish);
  window.addEventListener('resize',()=>{if(played)finish();},{passive:true});window.addEventListener('pagehide',finish);
  mount();
  window.GardenEntrance={start,finish};
})();
