/* A birthday-sized landslide, plus one real vote kept in this browser. */
(() => {
  'use strict';
  const storageKey = 'tahreem-birthday:local-ballot:2026:v1';
  const base = {yes:1400000000, no:1};
  const choices = {yes:'Yes, Tahreem should be PM 🗳️😎', no:'No, Mai gadha hu 🫏😭'};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
  const number = value => value.toLocaleString('en-US');
  let memoryVote = null;
  let current = null;
  const cleanName = value => String(value || '').normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim();
  const valid = vote => vote && typeof vote.name === 'string' && cleanName(vote.name).length >= 2
    && cleanName(vote.name).length <= 60 && Object.hasOwn(choices, vote.choice);

  function readVote() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || 'null');
      memoryVote = data?.version === 1 && valid(data.vote) ? {name:cleanName(data.vote.name),choice:data.vote.choice} : null;
    } catch (_) { /* Storage can be unavailable; voting still works during this visit. */ }
    return memoryVote;
  }
  function saveVote(vote) {
    memoryVote = vote;
    try { localStorage.setItem(storageKey, JSON.stringify({version:1,vote})); }
    catch (_) { /* Keep the receipt and totals working in memory. */ }
  }

  function formMarkup() {
    return `<section class="pm-ballot" aria-labelledby="pm-ballot-title"><span class="pm-ballot-stamp" aria-hidden="true">✓</span>
      <p class="nakhre-kicker">THE VERY OFFICIAL BIRTHDAY BALLOT</p><h4 id="pm-ballot-title">Tahreem for PM? 🗳️👑</h4>
      <p class="pm-ballot-intro">A very important decision. The birthday committee is watching. 👀</p>
      <div id="pm-receipt" class="pm-receipt" hidden></div>
      <form id="pm-ballot-form"><label class="pm-name-label" for="pm-voter-name">Your name</label>
        <input id="pm-voter-name" name="name" autocomplete="name" placeholder="Who's casting this historic vote?" minlength="2" maxlength="60" required>
        <fieldset><legend>Your vote</legend>${Object.entries(choices).map(([value,label])=>`<label class="pm-choice"><input type="radio" name="choice" value="${value}" required><span>${label}</span><span class="pm-choice-check" aria-hidden="true">✓</span></label>`).join('')}</fieldset>
        <button class="pm-submit" type="submit">Cast my vote <span aria-hidden="true">🗳️</span></button>
        <button class="pm-edit-cancel" type="button" data-ballot-cancel hidden>Keep my original vote</button>
      </form><p id="pm-status" role="status" class="pm-status">The ballot is open. Choose wisely. 😌</p>
    </section>`;
  }
  function resultsMarkup() {
    return `<section class="pm-results" aria-labelledby="pm-results-title"><div class="pm-results-heading"><div><p class="nakhre-kicker">A COMPLETELY NORMAL BIRTHDAY LANDSLIDE</p><h4 id="pm-results-title">The vote book 📋🧐</h4></div><span id="pm-total" class="pm-total">${number(base.yes+base.no)} votes</span></div>
      <p class="pm-birthday-maths">1.4 billion fans. One confused voter. Very scientific birthday maths. 🤭</p>
      <div class="pm-tallies">${Object.entries(choices).map(([key,label])=>`<div class="pm-tally"><div><span>${label}</span><strong data-vote-count="${key}">${number(base[key])}</strong></div><div class="pm-bar"><span data-vote-bar="${key}"></span></div></div>`).join('')}</div>
      <div id="pm-voters" class="pm-voters" aria-label="Your birthday ballot"><p class="pm-empty">Your name belongs in this very important book. ✍️</p></div>
    </section>`;
  }

  function stopReaction(state = current) {
    if (!state) return;
    clearTimeout(state.timer);
    state.animations.forEach(animation => animation.cancel());
    state.animations.clear();
    if (typeof state.layer?.hidePopover === 'function' && state.layer.matches(':popover-open')) state.layer.hidePopover();
    state.layer?.remove(); state.layer = null;
  }
  function unmount() {
    if (!current) return;
    stopReaction();
    current.events.abort();
    current = null;
  }
  const still = () => reduced.matches || document.body.classList.contains('garden-motion-off');
  const live = state => current === state && state.root.isConnected && state.panel?.open;

  function react(state, choice) {
    stopReaction(state);
    if (!live(state) || still() || document.hidden || portrait.matches) return;
    const layer = document.createElement('div');
    layer.className = `ballot-reaction ballot-reaction--${choice}`;
    layer.setAttribute('aria-hidden','true'); layer.inert = true;
    if (typeof layer.showPopover === 'function') {
      layer.setAttribute('popover','manual'); document.body.append(layer); layer.showPopover();
    } else state.panel.append(layer);
    state.layer = layer;
    const play = (node,frames,options) => {
      const animation = node.animate(frames,{fill:'both',...options});
      state.animations.add(animation); animation.finished.catch(()=>{});
    };
    const label = document.createElement('div'); label.className = 'ballot-reaction-label';
    label.textContent = choice === 'yes' ? 'Excellent taste. Flowers for you! 🌸' : 'OPPOSITION DETECTED. BOOOM! 💣';
    layer.append(label);
    play(label,[{opacity:0,transform:'translate(-50%,12px) scale(.8)'},{opacity:1,transform:'translate(-50%,0) scale(1)',offset:.18},{opacity:1,offset:.8},{opacity:0,transform:'translate(-50%,-15px) scale(1)'}],{duration:2600});
    const box = state.receipt.getBoundingClientRect();
    const cx = Math.max(70,Math.min(innerWidth-70,box.left+box.width/2));
    const cy = Math.max(90,Math.min(innerHeight-60,box.top+box.height/2));
    if (choice === 'yes') {
      const count = innerHeight < 500 ? 26 : 42;
      for (let i=0;i<count;i++) {
        const flower = document.createElement('span'); flower.className = 'ballot-flower';
        flower.textContent = ['🌸','🌼','🌷','✿','✨'][i%5];
        const x = (i*71+13)%100, dx = ((i*29)%110)-55;
        Object.assign(flower.style,{left:`${x}%`,top:'-45px',fontSize:`${18+(i%4)*7}px`,color:['#c17c9b','#e4b463','#98a879'][i%3]});
        layer.append(flower);
        play(flower,[{opacity:0,transform:'translate(0,-20px) rotate(-20deg)'},{opacity:1,offset:.12},{opacity:.95,offset:.78},{opacity:0,transform:`translate(${dx}px,${innerHeight+90}px) rotate(${i%2?240:-220}deg)`}],{duration:2100+(i%5)*160,delay:(i%7)*65,easing:'cubic-bezier(.25,.4,.5,1)'});
      }
    } else {
      const ring = document.createElement('span'); ring.className = 'ballot-boom-ring';
      Object.assign(ring.style,{left:`${cx}px`,top:`${cy}px`});layer.append(ring);
      play(ring,[{opacity:.7,transform:'translate(-50%,-50%) scale(.1)'},{opacity:0,transform:'translate(-50%,-50%) scale(14)'}],{duration:850,easing:'ease-out'});
      for (let i=0;i<30;i++) {
        const piece = document.createElement('span'); piece.className = 'ballot-boom-piece';
        piece.textContent = ['✦','💥','✧','⭐'][i%4];
        const angle = i*2.399963, reach = 90+(i%7)*43;
        const dx = Math.cos(angle)*reach, dy = Math.sin(angle)*reach*.7;
        Object.assign(piece.style,{left:`${cx}px`,top:`${cy}px`,fontSize:`${14+(i%4)*6}px`});layer.append(piece);
        play(piece,[{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{opacity:1,offset:.1},{opacity:0,transform:`translate(${dx}px,${dy+110}px) rotate(${i*29}deg) scale(.6)`}],{duration:1000+(i%5)*160,easing:'ease-out'});
      }
      const frames = [[0,0],[-5,2],[5,-2],[-4,1],[3,-1],[0,0]].map(([x,y])=>({transform:`translate(${x}px,${y}px)`}));
      // Shake the card, keeping the page controls and radio available.
      play(state.root,frames,{duration:420,easing:'linear'});
    }
    state.timer = setTimeout(()=>stopReaction(state),3600);
  }

  function mount(container) {
    unmount();
    const root = container.querySelector('.pm-ballot');
    if (!root) return;
    const state = {container,root,panel:container.closest('dialog'),events:new AbortController(),
      saved:readVote(),editing:false,layer:null,timer:0,animations:new Set(),
      form:root.querySelector('#pm-ballot-form'),receipt:root.querySelector('#pm-receipt'),status:root.querySelector('#pm-status')};
    current = state;
    const nameInput = state.form.querySelector('[name="name"]');
    const button = state.form.querySelector('.pm-submit');
    const cancelEdit = state.form.querySelector('[data-ballot-cancel]');
    const status = message => {state.status.textContent=message;};
    const update = () => {
      const vote = state.saved;
      const counts = {yes:base.yes+(vote?.choice==='yes'?1:0),no:base.no+(vote?.choice==='no'?1:0)};
      const total = counts.yes+counts.no;
      container.querySelector('#pm-total').textContent = `${number(total)} votes`;
      for (const key of Object.keys(choices)) {
        container.querySelector(`[data-vote-count="${key}"]`).textContent = number(counts[key]);
        const bar=container.querySelector(`[data-vote-bar="${key}"]`);
        bar.style.width=`${counts[key]/total*100}%`;
        bar.style.minWidth='4px';
      }
      state.form.hidden=!!vote&&!state.editing;
      state.receipt.hidden=!vote||state.editing;
      cancelEdit.hidden=!vote;
      button.innerHTML=`${vote?'Save my new vote':'Cast my vote'} <span aria-hidden="true">🗳️</span>`;
      const voters=container.querySelector('#pm-voters');
      voters.replaceChildren();
      if (vote) {
        const title=document.createElement('strong'),copy=document.createElement('span'),actions=document.createElement('div');
        title.textContent=`Your vote is in, ${vote.name}! ${vote.choice==='yes'?'🌸':'💥'}`;
        copy.textContent=vote.choice==='yes'?'Excellent choice. The birthday committee approves. 👑':'A brave choice. Birthday security would like a word. 💣😂';
        actions.className='pm-receipt-actions';
        const change=document.createElement('button');change.type='button';change.dataset.ballotEdit='';change.textContent='Change my vote';
        const replay=document.createElement('button');replay.type='button';replay.dataset.ballotReplay='';replay.textContent=vote.choice==='yes'?'More flowers 🌸':'Another BOOOM 💥';
        actions.append(change,replay);state.receipt.replaceChildren(title,copy,actions);
        const list=document.createElement('ol'),row=document.createElement('li'),name=document.createElement('strong'),choice=document.createElement('span');
        list.className='pm-voter-list';name.textContent=vote.name;choice.textContent=choices[vote.choice];
        row.append(name,choice);list.append(row);voters.append(list);
      } else {
        const empty=document.createElement('p');empty.className='pm-empty';empty.textContent='Your name belongs in this very important book. ✍️';voters.append(empty);
      }
    };
    const options={signal:state.events.signal};
    state.form.addEventListener('submit',event=>{
      event.preventDefault();
      if (!live(state) || (state.saved&&!state.editing) || !state.form.reportValidity()) return;
      const name=cleanName(nameInput.value);
      if (name.length<2 || name.length>60) {
        nameInput.setCustomValidity('A name between 2 and 60 characters, please.');nameInput.reportValidity();return;
      }
      const choice=state.form.querySelector('[name="choice"]:checked')?.value;
      if (!Object.hasOwn(choices,choice)) return;
      saveVote({name,choice});state.saved=memoryVote;state.editing=false;update();
      status(choice==='yes'?'Vote recorded. Democracy looks good in pink. 🌸':'Vote recorded. The birthday committee is dramatically offended. 💥😂');
      react(state,choice);
    },options);
    nameInput.addEventListener('input',()=>nameInput.setCustomValidity(''),options);
    root.addEventListener('click',event=>{
      if (event.target.closest('[data-ballot-edit]')) {
        stopReaction(state);state.editing=true;update();nameInput.value=state.saved.name;
        state.form.querySelector(`[name="choice"][value="${state.saved.choice}"]`).checked=true;
        status('A plot twist? Your new choice replaces your previous vote. 👀');nameInput.focus({preventScroll:true});
      } else if (event.target.closest('[data-ballot-cancel]')) {
        state.editing=false;update();status('Original vote kept. No plot twist today. 😌');
      } else if (event.target.closest('[data-ballot-replay]') && state.saved) react(state,state.saved.choice);
    },options);
    window.addEventListener('storage',event=>{
      if (event.key!==storageKey&&event.key!==null) return;
      state.saved=readVote();if(!state.saved)state.editing=false;update();
    },options);
    state.panel?.addEventListener('close',()=>stopReaction(state),options);
    update();
    if(state.saved)status('Your very important vote is safely in the birthday book. 😌');
  }
  window.addEventListener('pagehide',unmount);
  window.addEventListener('resize',()=>stopReaction());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopReaction();});
  reduced.addEventListener('change',()=>stopReaction());
  portrait.addEventListener('change',()=>stopReaction());
  new MutationObserver(()=>{if(still())stopReaction();}).observe(document.body,{attributes:true,attributeFilter:['class']});
  window.GardenBallot={formMarkup,resultsMarkup,mount,unmount};
})();
