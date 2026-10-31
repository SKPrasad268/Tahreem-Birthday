/* One seven-second performance, measured against the real bouquet and stationery. */
(() => {
  'use strict';
  const DURATION = 7000, BLAST = 5850;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  const ns = 'http://www.w3.org/2000/svg';
  let current = null;
  let soundContext = null;
  const still = () => reduced.matches || document.body.classList.contains('garden-motion-off');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const at = (a, b, t, height = 0) => ({x:mix(a.x,b.x,t), y:mix(a.y,b.y,t)-Math.sin(t*Math.PI)*height});
  function svg(tag, attrs, parent) {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key,value]) => node.setAttribute(key, value));
    parent?.append(node);
    return node;
  }

  function cancel(message) {
    const state = current;
    if (!state) return;
    current = null;
    cancelAnimationFrame(state.frame);
    clearTimeout(state.endTimer);
    state.events.abort();
    state.sounds.forEach(source => { try { source.stop(); } catch (_) {} });
    if (state.blast) window.GardenPartyBomb?.cancel();
    if (typeof state.layer?.hidePopover === 'function' && state.layer.matches(':popover-open')) state.layer.hidePopover();
    state.layer?.remove();
    state.note?.remove();
    state.section.classList.remove('moonwalk-running');
    state.bomb.classList.remove('moonwalk-bomb-target', 'party-has-burst');
    state.opener.removeAttribute('aria-busy');
    if (state.status) state.status.textContent = typeof message === 'string' ? message : 'Pick another surprise, or tap egg 7 to replay the dance.';
  }

  function actor(stage) {
    const root = svg('g', {class:'moonwalk-actor'}, stage);
    const body = svg('g', {class:'moonwalk-body'}, root);
    const torso = svg('path', {d:'M50 37 48 77'}, body);
    const leftArm = svg('path', {}, body), rightArm = svg('path', {}, body);
    const leftLeg = svg('path', {}, body), rightLeg = svg('path', {}, body);
    const head = svg('g', {}, root);
    svg('circle', {cx:52,cy:23,r:11,fill:'#fff6df',stroke:'#292332','stroke-width':4}, head);
    svg('path', {d:'M53 22h10m-5 0v3',stroke:'#292332','stroke-width':3,fill:'none'}, head);
    svg('path', {d:'m35 14 4-14 22 2 5 14Z',fill:'#292332'}, head);
    svg('path', {d:'m37 11 26 2',stroke:'#b5788d','stroke-width':3}, head);
    svg('path', {d:'m30 15 44 3',stroke:'#292332','stroke-width':5,'stroke-linecap':'round'}, head);
    const glove = svg('circle', {class:'moonwalk-glove',r:4.5}, root);
    const boots = [0,1].map(() => {
      const boot = svg('g', {}, root);
      svg('path', {class:'moonwalk-sock',d:'M0 -8V0'}, boot);
      svg('path', {class:'moonwalk-boot',d:'M-4 -2H4L8 2 18 3Q21 7 17 8H-5Z'}, boot);
      svg('path', {d:'M-4 7h22',stroke:'#deb45f','stroke-width':1.8}, boot);
      return boot;
    });
    return {root,torso,leftArm,rightArm,leftLeg,rightLeg,head,glove,boots};
  }

  function pose(state, mode, beat, reach = 0) {
    const a = state.actor;
    let hip=[48,77], kneeL=[35,101], footL=[27,121], kneeR=[61,99], footR=[68,121];
    let elbowL=[32,53], handL=[39,24], elbowR=[66,59], handR=[76,53];
    if (mode === 'moonwalk') {
      // The planted flat boot slides backwards as the other boot rises onto its toe.
      const cycle = (beat % 1 + 1) % 1;
      const stride = Math.cos(cycle*Math.PI*2);
      hip=[48,76+Math.sin(cycle*Math.PI*4)*1.7];
      footL=[46+stride*22,121]; footR=[46-stride*22,121];
      kneeL=[mix(hip[0],footL[0],.48)+5,99-Math.max(0,-stride)*8];
      kneeR=[mix(hip[0],footR[0],.48)+5,99-Math.max(0,stride)*8];
      handR=[77,55+stride*7];
    } else if (mode === 'flip') {
      hip=[48,73]; kneeL=[28,78]; footL=[36,101]; kneeR=[72,79]; footR=[65,103];
      elbowL=[29,51]; handL=[33,72]; elbowR=[69,51]; handR=[67,73];
    } else if (mode === 'jump') {
      kneeL=[28,93]; footL=[12,108]; kneeR=[68,90]; footR=[79,112];
      elbowL=[29,31]; handL=[22,12]; elbowR=[71,27]; handR=[77,9];
    } else if (mode === 'tap') {
      elbowL=[34,61]; handL=[39,78];
      elbowR=[mix(66,78,reach),mix(59,58,reach)]; handR=[mix(76,107,reach),mix(53,78,reach)];
    } else if (mode === 'fly') {
      kneeL=[23,89]; footL=[9,108]; kneeR=[76,88]; footR=[90,108];
      elbowL=[25,24]; handL=[10,12]; elbowR=[79,24]; handR=[95,9];
    }
    const limb = (node, points) => node.setAttribute('d', points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '));
    limb(a.torso,[[50,37],hip]);
    limb(a.leftArm,[[50,42],elbowL,handL]); limb(a.rightArm,[[50,42],elbowR,handR]);
    limb(a.leftLeg,[hip,kneeL,footL]); limb(a.rightLeg,[hip,kneeR,footR]);
    a.glove.setAttribute('cx',handR[0]); a.glove.setAttribute('cy',handR[1]);
    [footL,footR].forEach((foot,i)=>{
      const toe = mode==='moonwalk' ? Math.max(0,(i?1:-1)*Math.cos(beat*Math.PI*2))*-27 : 0;
      a.boots[i].setAttribute('transform',`translate(${foot}) rotate(${toe} 16 6)`);
    });
    return [footL,footR];
  }

  function sparks(state, point, elapsed, count = 3) {
    for (let i=0;i<count;i++) {
      const index=state.sparkIndex++;
      const spark=state.sparks[index%state.sparks.length];
      spark.born=elapsed; spark.x=point.x; spark.y=point.y;
      spark.vx=25+(index*31)%110; spark.vy=-25-(index*43)%110;
      spark.life=260+(index%4)*65;
    }
  }

  function boomSound(state) {
    const context=soundContext;
    if (!context || context.state!=='running') return;
    const time=context.currentTime;
    const gain=context.createGain(); gain.connect(context.destination);
    gain.gain.setValueAtTime(.13,time); gain.gain.exponentialRampToValueAtTime(.001,time+.48);
    const bass=context.createOscillator(); bass.type='triangle';
    bass.frequency.setValueAtTime(145,time); bass.frequency.exponentialRampToValueAtTime(32,time+.45);
    bass.connect(gain); bass.start(time); bass.stop(time+.5); state.sounds.push(bass);
    const buffer=context.createBuffer(1,context.sampleRate*.28,context.sampleRate);
    const samples=buffer.getChannelData(0);
    for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(1-i/samples.length)*.6;
    const noise=context.createBufferSource(); noise.buffer=buffer; noise.connect(gain);
    noise.start(time); state.sounds.push(noise);
    noise.onended=()=>noise.disconnect(); bass.onended=()=>{bass.disconnect();gain.disconnect();};
  }

  function play(panel, opener) {
    cancel();
    const section=panel?.querySelector('.bouquet-surprise');
    const bouquet=section?.querySelector('.bouquet-interactive');
    const bomb=bouquet?.querySelector('[data-kinder="kinder-4"]');
    const launch=bouquet?.querySelector('[data-kinder="kinder-7"]');
    const card=section?.querySelector('[data-gift="letter"]');
    if (!panel?.open || !bouquet || !bomb || !launch || !card || document.hidden || portrait.matches) return;
    // Scroll the whole stage into view before measuring; no smooth-scroll drift under his feet.
    panel.scrollTop=0;
    const state={panel,section,bomb,opener,status:section.querySelector('[data-bouquet-status]'),
      events:new AbortController(),frame:0,endTimer:0,layer:null,note:null,blast:false,sounds:[],sparkIndex:0,lastSpark:-100};
    current=state;
    opener.setAttribute('aria-busy','true');
    if (still()) {
      const note=document.createElement('div'); note.className='moonwalk-still-note';
      note.textContent='Moonwalk ✦ backflip ✦ BOOOM! Tap 7 to replay with Breeze on.';
      bouquet.append(note); state.note=note;
      if(state.status)state.status.textContent='The dancer moonwalks, flips onto the bouquet, taps egg 4 and gets blown away.';
      state.endTimer=setTimeout(()=>cancel('Dance complete. Tap egg 7 to replay.'),DURATION);
      return;
    }
    section.classList.add('moonwalk-running');
    if(state.status)state.status.textContent='A tiny dancer is loose in your bouquet…';
    // Sound is optional; the seven-second visual never waits for an audio permission.
    try {
      const AudioContext=window.AudioContext||window.webkitAudioContext;
      if(AudioContext) { soundContext ||= new AudioContext(); void soundContext.resume().catch(()=>{}); }
    } catch (_) { /* Silent performance still works. */ }
    const box=bouquet.getBoundingClientRect(), cardBox=card.getBoundingClientRect();
    const eggBox=bomb.getBoundingClientRect(), startBox=launch.getBoundingClientRect();
    const crown=bouquet.querySelector('[data-kinder="kinder-1"]').getBoundingClientRect();
    const middle=bouquet.querySelector('[data-kinder="kinder-3"]').getBoundingClientRect();
    const size=clamp(box.height*.23,58,102), scale=size/128;
    const target={x:eggBox.left+eggBox.width*.5,y:eggBox.top+eggBox.height*.4};
    const points={
      start:{x:startBox.left+startBox.width*.5,y:startBox.top+startBox.height*.55},
      moonStart:{x:box.left+box.width*.73,y:box.top+box.height*.73},
      moonEnd:{x:box.left+box.width*.26,y:box.top+box.height*.73},
      card:{x:cardBox.left+cardBox.width*.40,y:cardBox.top-4},
      crown:{x:crown.left+crown.width*.5,y:crown.top+6},
      middle:{x:middle.left+middle.width*.5,y:middle.top+7},
      tap:{x:target.x-57*scale,y:target.y+50*scale}
    };
    const layer=document.createElement('div'); layer.className='moonwalk-layer';
    layer.setAttribute('aria-hidden','true'); layer.inert=true;
    if(typeof layer.showPopover==='function'){
      layer.setAttribute('popover','manual'); document.body.append(layer); layer.showPopover();
    } else panel.append(layer);
    state.layer=layer;
    const stage=svg('svg',{class:'moonwalk-stage',viewBox:`0 0 ${innerWidth} ${innerHeight}`},layer);
    const shadow=svg('ellipse',{fill:'#53404d',opacity:'.16',rx:size*.24,ry:size*.045},stage);
    state.sparks=Array.from({length:48},(_,i)=>({born:-10000,node:svg('path',{class:'moonwalk-spark',stroke:['#ffc64d','#fff7c0','#e99431'][i%3],'stroke-width':i%3?2:3,opacity:0},stage)}));
    state.actor=actor(stage);
    const boom=svg('text',{class:'moonwalk-boom',x:clamp(target.x+45,110,innerWidth-130),y:target.y-24,opacity:0},stage); boom.textContent='BOOOM!';
    const start=performance.now();
    const live=()=>current===state && panel.open && section.isConnected;
    const tick=now=>{
      if(!live())return;
      const t=now-start;
      if(t>=DURATION){cancel('BOOOM! He’s gone! Tap egg 7 to watch it again.');return;}
      let p,mode='jump',rotation=0,shrink=1,reach=0,height=0;
      if(t<450){p=at(points.start,points.moonStart,ease(t/450),size*.4);shrink=mix(.2,1,t/450);}
      else if(t<2200){p=at(points.moonStart,points.moonEnd,(t-450)/1750);mode='moonwalk';}
      else if(t<3250){const u=(t-2200)/1050;p=at(points.moonEnd,points.card,u,size*1.05);rotation=-360*ease(u);mode='flip';height=Math.sin(u*Math.PI);}
      else if(t<3470){p={...points.card};p.y+=Math.sin((t-3250)/220*Math.PI)*size*.09;mode='moonwalk';}
      else if(t<4470){const u=(t-3470)/1000;p=at(points.card,points.crown,u,size*.85);rotation=360*ease(u);mode='flip';height=Math.sin(u*Math.PI);}
      else if(t<5060){const u=(t-4470)/590;p=at(points.crown,points.middle,u,size*.65);height=Math.sin(u*Math.PI);}
      else if(t<5500){const u=(t-5060)/440;p=at(points.middle,points.tap,u,size*.4);height=Math.sin(u*Math.PI);}
      else if(t<BLAST){p=points.tap;mode='tap';reach=ease(clamp((t-5500)/300,0,1));bomb.classList.add('moonwalk-bomb-target');}
      else {
        if(!state.blast){
          state.blast=true;
          window.GardenPartyBomb?.burstAt(panel,bomb,DURATION-t);
          // Keep the little performer and comic lettering above the flower explosion.
          if(typeof layer.showPopover==='function' && layer.matches(':popover-open')){layer.hidePopover();layer.showPopover();}
          boomSound(state);
          if(state.status)state.status.textContent='BOOOM! The dancer set off egg 4!';
        }
        const u=(t-BLAST)/(DURATION-BLAST);
        p=at(points.tap,{x:innerWidth+size*2,y:-size*2},u,size*.8);
        rotation=1080*u;shrink=1-u*.65;mode='fly';height=1;
        boom.setAttribute('opacity',String(clamp(1-(u-.5)*2,0,1)));
      }
      const feet=pose(state,mode,(t-450)/570,reach);
      state.actor.root.setAttribute('transform',`translate(${p.x} ${p.y}) scale(${scale*shrink}) translate(-50 -128) rotate(${rotation} 50 73)`);
      shadow.setAttribute('cx',p.x); shadow.setAttribute('cy',p.y+3);
      shadow.setAttribute('opacity',t>=BLAST?'0':String(.18*(1-height*.8)));
      if(mode==='moonwalk' && t-state.lastSpark>42){
        state.lastSpark=t;
        feet.forEach(foot=>sparks(state,{x:p.x+(foot[0]-50+15)*scale,y:p.y+(foot[1]-128+8)*scale},t));
      }
      state.sparks.forEach(spark=>{
        const age=t-spark.born,u=age/spark.life;
        if(u<0||u>1||!Number.isFinite(u)){spark.node.setAttribute('opacity','0');return;}
        const seconds=age/1000,x=spark.x+spark.vx*seconds,y=spark.y+spark.vy*seconds+150*seconds*seconds;
        spark.node.setAttribute('d',`M${x} ${y}l${-spark.vx*.025} ${-spark.vy*.018}`);
        spark.node.setAttribute('opacity',String(1-u));
      });
      state.frame=requestAnimationFrame(tick);
    };
    // Hard deadline as well as RAF: no trailing particles extend the requested seven seconds.
    state.endTimer=setTimeout(()=>{if(live())cancel('BOOOM! He’s gone! Tap egg 7 to watch it again.');},DURATION);
    const options={signal:state.events.signal};
    const stageScroll=panel.scrollTop;
    panel.addEventListener('scroll',()=>{if(panel.scrollTop!==stageScroll)cancel();},options);
    section.querySelector('[data-bouquet-replay]')?.addEventListener('click',()=>cancel(),options);
    state.frame=requestAnimationFrame(tick);
  }
  window.addEventListener('resize',()=>cancel());
  window.addEventListener('birthday-object-opened',()=>cancel());
  window.addEventListener('pagehide',()=>cancel());
  document.getElementById('experience-dialog')?.addEventListener('close',()=>cancel());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  reduced.addEventListener('change',()=>cancel());
  portrait.addEventListener('change',()=>cancel());
  new MutationObserver(()=>{if(still())cancel();}).observe(document.body,{attributes:true,attributeFilter:['class']});
  window.GardenMoonwalk={play,cancel};
})();
