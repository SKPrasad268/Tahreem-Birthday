/* Tahreem ki Radio plays the audio files included with this website. */
(() => {
  'use strict';

  function startRadio() {
    const byId = id => document.getElementById(id);
    const radio = byId('radio-toggle');
    const panel = byId('radio-player');
    const audio = byId('radio-audio');
    if (!radio || !panel || !audio) return;
    const title = byId('radio-title');
    const artist = byId('radio-artist');
    const status = byId('radio-status');
    const play = byId('radio-play');
    const previous = byId('radio-prev');
    const next = byId('radio-next');
    const progress = byId('radio-progress');
    const elapsed = byId('radio-time');
    const duration = byId('radio-duration');
    const pickFiles = byId('radio-pick-files');
    const files = byId('radio-files');
    const importArea = byId('radio-import-area');
    const miniTitle = byId('radio-mini-title');
    const miniStatus = byId('radio-mini-status');
    const description = byId('radio-description');
    const stateLabel = byId('radio-state-label');
    const cover = byId('radio-cover');
    const coverFallback = byId('radio-cover-fallback');
    const discTitle = byId('radio-disc-title');
    const discArtist = byId('radio-disc-artist');
    const trackIndex = byId('radio-track-index');
    const volume = byId('radio-volume');
    const volumeValue = byId('radio-volume-value');
    const mute = byId('radio-mute');
    const shuffle = byId('radio-shuffle');
    const repeat = byId('radio-repeat');
    const playlist = byId('radio-playlist');
    const playlistToggle = byId('radio-playlist-toggle');
    const portrait = window.matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
    const text = value => typeof value === 'string' ? value.trim() : '';
    let selected = 0;
    let sourceVersion = 0;
    let activeSource = '';
    let wantsPlayback = false;
    let state = 'empty';
    let localURLs = [];
    let coverVersion = 0;
    let shuffleOn = false;
    let repeatMode = 'all';
    let shuffleBag = [];
    let history = [0];
    let historyPosition = 0;
    let previousVolume = .75;

    function safeSource(value) {
      const candidate = text(value);
      if (!candidate || candidate.startsWith('//') || candidate.includes('\\') || /[\u0000-\u001f]/.test(candidate)) return '';
      // Published tracks are relative files; device previews use temporary blob URLs.
      if (/^[a-z][a-z\d+.-]*:/i.test(candidate)) return candidate.startsWith('blob:') ? candidate : '';
      return candidate;
    }
    function fileTitle(value) {
      let name = text(value).split('/').pop() || '';
      try { name = decodeURIComponent(name); } catch (_) { /* Literal percent signs can be filename characters. */ }
      return name.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/_/g, ' ').trim() || 'A little soundtrack';
    }
    const configured = Array.isArray(window.BIRTHDAY?.songs) ? window.BIRTHDAY.songs : [];
    let tracks = configured.filter(track => track && typeof track === 'object').map(track => ({
      src: safeSource(track.src), title: text(track.title) || fileTitle(track.src), artist: text(track.artist),
      cover: safeSource(track.cover), description: text(track.description)
    })).filter(track => track.src);
    const current = () => tracks[selected];
    const isCurrentSource = () => !!activeSource && audio.currentSrc === activeSource;
    const setStatus = message => { if (status) status.textContent = message; };
    audio.autoplay = false;
    audio.preload = 'metadata';
    audio.volume = .75;
    radio.setAttribute('aria-controls', 'radio-player');
    radio.setAttribute('aria-expanded', String(!panel.hidden));
    if (importArea) importArea.hidden = tracks.length > 0;
    if (progress) {
      progress.min = '0'; progress.max = '1000'; progress.step = '1'; progress.value = '0';
      progress.setAttribute('aria-label', 'Seek through the current song');
    }

    function timeText(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
      const whole = Math.floor(seconds);
      return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
    }
    function syncProgress() {
      const loaded = isCurrentSource();
      const length = loaded ? audio.duration : 0;
      const time = loaded ? audio.currentTime : 0;
      const canSeek = Number.isFinite(length) && length > 0;
      if (elapsed) elapsed.textContent = timeText(time);
      if (duration) duration.textContent = timeText(length);
      if (progress) {
        progress.disabled = !canSeek;
        progress.value = canSeek ? String(Math.round(time / length * 1000)) : '0';
        progress.setAttribute('aria-valuetext', `${timeText(time)} of ${timeText(length)}`);
      }
    }
    function syncControls() {
      const hasTrack = tracks.length > 0;
      const active = hasTrack && wantsPlayback && !audio.ended && !audio.error;
      const playing = active && state === 'playing' && !audio.paused && audio.readyState >= 2;
      if (play) {
        play.disabled = !hasTrack;
        play.setAttribute('aria-pressed', String(active));
        play.setAttribute('aria-label', active ? 'Pause song' : state === 'error' ? 'Retry song' : 'Play song');
        const symbol = play.querySelector('[data-radio-play-symbol]');
        if (symbol) symbol.textContent = active ? 'Ⅱ' : '▶';
      }
      if (previous) previous.disabled = !hasTrack;
      if (next) next.disabled = !hasTrack;
      radio.classList.toggle('is-playing', playing);
      panel.classList.toggle('is-playing', playing);
      panel.classList.toggle('is-loading', state === 'loading');
      panel.dataset.state = state;
      radio.setAttribute('aria-label', hasTrack ? `Open the radio: ${current().title}${playing ? ', playing' : state === 'paused' ? ', paused' : ''}` : 'Open the radio and choose songs');
      if (miniStatus) miniStatus.textContent = playing ? 'NOW PLAYING' : state === 'loading' ? 'TUNING IN…' : state === 'paused' ? 'PAUSED' : hasTrack ? 'TAP TO PLAY' : 'A LITTLE SOUNDTRACK';
      if (stateLabel) stateLabel.textContent = playing ? 'Now playing' : state === 'loading' ? 'Tuning in…' : state === 'paused' ? 'Paused' : state === 'error' ? 'Try another song' : state === 'ended' ? 'Playlist finished' : hasTrack ? 'Ready to play' : 'Your soundtrack';
      syncPlaylist(playing);
      syncOptions();
      window.GardenTurntable?.sync({playing,wantsPlayback,state,hidden:panel.hidden});
    }
    function syncVolume() {
      const muted=audio.muted || audio.volume===0;
      const percent=muted ? 0 : Math.round(audio.volume*100);
      if(volume)volume.value=String(percent);
      if(volumeValue)volumeValue.textContent=`${percent}%`;
      if(mute){
        mute.setAttribute('aria-pressed',String(muted));
        mute.setAttribute('aria-label',muted?'Unmute music':'Mute music');
        const symbol=mute.querySelector('[data-volume-symbol]');
        if(symbol)symbol.textContent=muted?'🔇':'🔊';
      }
    }
    function syncOptions() {
      if(shuffle){
        shuffle.disabled=tracks.length<2;
        shuffle.setAttribute('aria-pressed',String(shuffleOn));
        shuffle.setAttribute('aria-label',shuffleOn?'Turn shuffle off':'Turn shuffle on');
      }
      if(repeat){
        repeat.disabled=!tracks.length;
        repeat.setAttribute('aria-pressed',String(repeatMode!=='off'));
        repeat.setAttribute('aria-label',repeatMode==='one'?'Repeat current song; switch repeat off':repeatMode==='all'?'Repeat playlist; switch to repeat one':'Repeat off; switch to repeat playlist');
        repeat.dataset.repeat=repeatMode;
        const label=repeat.querySelector('[data-repeat-label]');
        if(label)label.textContent=`Repeat ${repeatMode}`;
      }
    }
    function syncPlaylist(playing) {
      playlist?.querySelectorAll('[data-track-index]').forEach(button=>{
        const isSelected=Number(button.dataset.trackIndex)===selected;
        button.classList.toggle('is-current',isSelected);
        if(isSelected)button.setAttribute('aria-current','true');
        else button.removeAttribute('aria-current');
        const mark=button.querySelector('.radio-playlist-playing');
        if(mark)mark.hidden=!(isSelected&&playing);
      });
    }
    function showCover(track) {
      const version=++coverVersion;
      if(cover){cover.hidden=true;cover.removeAttribute('src');cover.alt=track?`${track.title}${track.artist?` — ${track.artist}`:''} cover`:'';}
      if(coverFallback)coverFallback.hidden=false;
      if(!cover||!track?.cover)return;
      const candidate=new Image();
      candidate.onload=()=>{
        if(version!==coverVersion)return;
        cover.src=track.cover;cover.hidden=false;
        if(coverFallback)coverFallback.hidden=true;
      };
      candidate.onerror=()=>{/* Keep the floral label when a cover cannot load. */};
      candidate.src=track.cover;
    }
    function rememberSelection(index) {
      if(history[historyPosition]===index)return;
      history=history.slice(0,historyPosition+1);history.push(index);
      if(history.length>200)history.shift();
      historyPosition=history.length-1;
    }
    function refillShuffle() {shuffleBag=tracks.map((_,index)=>index).filter(index=>index!==selected);}
    function chooseNext(allowWrap=true) {
      if(shuffleOn&&tracks.length>1){
        if(!shuffleBag.length){if(!allowWrap)return null;refillShuffle();}
        return shuffleBag.splice(Math.floor(Math.random()*shuffleBag.length),1)[0];
      }
      if(!allowWrap&&selected===tracks.length-1)return null;
      return(selected+1)%tracks.length;
    }
    function nextTrack() {
      if(!tracks.length)return;
      if(historyPosition<history.length-1)loadTrack(history[++historyPosition],true,false);
      else loadTrack(chooseNext(),true);
    }
    function previousTrack() {
      if(!tracks.length)return;
      if(historyPosition>0)loadTrack(history[--historyPosition],true,false);
      else loadTrack(selected-1,true);
    }
    function renderPlaylist() {
      if(!playlist)return;
      const fragment=document.createDocumentFragment();
      tracks.forEach((track,index)=>{
        const row=document.createElement('li');row.className='radio-playlist-item';
        const button=document.createElement('button');button.className='radio-playlist-track';button.type='button';button.dataset.trackIndex=String(index);
        button.setAttribute('aria-label',`Play ${track.title}${track.artist?` by ${track.artist}`:''}`);
        const number=document.createElement('span');number.className='radio-playlist-number';number.textContent=String(index+1).padStart(2,'0');
        const copy=document.createElement('span');copy.className='radio-playlist-copy';
        const name=document.createElement('span');name.className='radio-playlist-title';name.textContent=track.title;
        const performer=document.createElement('span');performer.className='radio-playlist-artist';performer.textContent=track.artist||'From your birthday playlist';
        copy.append(name,performer);
        const mark=document.createElement('span');mark.className='radio-playlist-playing';mark.textContent='♪';mark.setAttribute('aria-hidden','true');mark.hidden=true;
        button.append(number,copy,mark);row.append(button);fragment.append(row);
        button.addEventListener('click',()=>{showPlayer();loadTrack(index,true);});
      });
      playlist.replaceChildren(fragment);
      if(playlistToggle){
        playlistToggle.disabled=!tracks.length;
        playlistToggle.setAttribute('aria-expanded',String(!playlist.hidden));
        playlistToggle.setAttribute('aria-label',`${playlist.hidden?'Show':'Hide'} playlist, ${tracks.length} songs`);
        const count=playlistToggle.querySelector('[data-playlist-count]');
        if(count)count.textContent=String(tracks.length);
      }
    }
    function showTrack() {
      const track = current();
      if (title) title.textContent = track ? track.title : 'Your favourite songs';
      if (artist) artist.textContent = track ? track.artist || 'A soundtrack for your garden' : 'A few songs, just for you.';
      if (miniTitle) miniTitle.textContent = track ? track.title : 'Songs coming soon';
      if (description) description.textContent = track?.description || 'A little soundtrack for your birthday garden.';
      if (discTitle) discTitle.textContent = track ? track.title : 'A little soundtrack';
      if (discArtist) discArtist.textContent = track?.artist || 'Tahreem ki Radio';
      if (trackIndex) trackIndex.textContent = tracks.length ? `${String(selected+1).padStart(2,'0')} / ${String(tracks.length).padStart(2,'0')}` : '00 / 00';
      showCover(track);
      window.GardenTurntable?.metadata(track);
      syncControls(); syncProgress();
    }
    function showPlayer() {
      panel.hidden = false;
      radio.setAttribute('aria-expanded', 'true');
      syncControls();
      window.dispatchEvent(new Event('birthday-radio-opened'));
    }
    function pauseTrack() {
      sourceVersion += 1;
      wantsPlayback = false;
      audio.pause();
      if (state !== 'error') state = tracks.length ? 'paused' : 'empty';
      syncControls();
      if (state !== 'error') setStatus(tracks.length ? 'Paused. Stay a little longer.' : 'Choose her favourite songs to start the soundtrack.');
    }
    async function playTrack() {
      if (!tracks.length) { setStatus('Choose her favourite songs to start the soundtrack.'); return; }
      if (audio.error || audio.src !== activeSource || !audio.getAttribute('src')) {
        audio.src = current().src; activeSource = audio.src; audio.load();
      }
      const attempt = ++sourceVersion;
      wantsPlayback = true; state = 'loading';
      setStatus('Tuning in…'); syncControls();
      try {
        // A hidden player advances directly; decorative record motion never gates background music.
        const preparation=panel.hidden ? null : window.GardenTurntable?.prepare();
        if(preparation) await preparation;
        if(attempt!==sourceVersion || !wantsPlayback)return;
        await audio.play();
      }
      catch (error) {
        if (attempt !== sourceVersion || error?.name === 'AbortError') return;
        wantsPlayback = false;
        state = error?.name === 'NotAllowedError' ? 'paused' : 'error';
        setStatus(error?.name === 'NotAllowedError' ? 'Tap play to start the music.' : 'This song could not play. Try the next song or choose another audio file.');
        syncControls();
      }
    }
    function loadTrack(index, shouldPlay = false, remember = true) {
      if (!tracks.length) return;
      const nextIndex = ((index % tracks.length) + tracks.length) % tracks.length;
      window.GardenTurntable?.change(tracks[nextIndex].src);
      sourceVersion += 1; wantsPlayback = false; state = 'ready'; audio.pause();
      selected = nextIndex;
      if (remember) rememberSelection(selected);
      shuffleBag = shuffleBag.filter(value => value !== selected);
      audio.src = current().src; activeSource = audio.src; audio.load();
      showTrack(); setStatus(`Ready to play · ${selected + 1} / ${tracks.length}`);
      if (shouldPlay) void playTrack();
    }
    function hidePlayer(restoreFocus = false) {
      panel.hidden = true; radio.setAttribute('aria-expanded', 'false');
      window.GardenTurntable?.hide();
      syncControls();
      if (restoreFocus) radio.focus({preventScroll: true});
    }

    radio.addEventListener('click', () => {
      showPlayer();
      if (tracks.length && !wantsPlayback && state === 'ready') void playTrack();
      else if (!tracks.length) { setStatus('Choose her favourite songs to start the soundtrack.'); pickFiles?.focus({preventScroll: true}); }
    });
    play?.addEventListener('click', () => { if (wantsPlayback) pauseTrack(); else void playTrack(); });
    previous?.addEventListener('click', previousTrack);
    next?.addEventListener('click', nextTrack);
    byId('radio-close')?.addEventListener('click', () => hidePlayer(true));
    panel.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); hidePlayer(true); }
    });
    volume?.addEventListener('input',()=>{
      const value=Number(volume.value);if(!Number.isFinite(value))return;
      audio.volume=Math.max(0,Math.min(1,value/100));audio.muted=false;
      if(audio.volume>0)previousVolume=audio.volume;
      syncVolume();
    });
    mute?.addEventListener('click',()=>{
      if(audio.muted||audio.volume===0){if(audio.volume===0)audio.volume=previousVolume||.75;audio.muted=false;}
      else{previousVolume=audio.volume;audio.muted=true;}
      syncVolume();
    });
    shuffle?.addEventListener('click',()=>{shuffleOn=!shuffleOn;if(shuffleOn)refillShuffle();syncOptions();});
    repeat?.addEventListener('click',()=>{const modes=['off','all','one'];repeatMode=modes[(modes.indexOf(repeatMode)+1)%modes.length];syncOptions();});
    playlistToggle?.addEventListener('click',()=>{
      if(!playlist)return;
      playlist.hidden=!playlist.hidden;
      playlistToggle.setAttribute('aria-expanded',String(!playlist.hidden));
      playlistToggle.setAttribute('aria-label',`${playlist.hidden?'Show':'Hide'} playlist, ${tracks.length} songs`);
    });

    audio.addEventListener('playing', () => {
      if (!isCurrentSource() || audio.paused || audio.readyState < 2) return;
      if (!wantsPlayback) { audio.pause(); return; }
      state = 'playing'; setStatus(`Now playing · ${selected + 1} / ${tracks.length}`); syncControls();
      window.dispatchEvent(new Event('birthday-radio-playing'));
    });
    audio.addEventListener('waiting', () => {
      if (!isCurrentSource() || audio.paused || !wantsPlayback) return;
      state = 'loading'; setStatus('Tuning in…'); syncControls();
    });
    audio.addEventListener('pause', () => {
      if (!isCurrentSource() || !audio.paused || audio.error || audio.ended || state === 'ready') return;
      if (wantsPlayback && state === 'loading') return;
      wantsPlayback = false; state = tracks.length ? 'paused' : 'empty';
      setStatus(tracks.length ? 'Paused. Stay a little longer.' : 'Choose her favourite songs to start the soundtrack.'); syncControls();
    });
    audio.addEventListener('ended', () => {
      if (!isCurrentSource() || !audio.ended || !wantsPlayback) return;
      if (repeatMode === 'one') { audio.currentTime=0; void playTrack(); return; }
      const index = chooseNext(repeatMode === 'all');
      if (index === null) { wantsPlayback=false; state='ended'; setStatus('Your birthday playlist, all played.'); syncControls(); return; }
      loadTrack(index,true);
    });
    audio.addEventListener('error', () => {
      if (!isCurrentSource() || !audio.error || !tracks.length) return;
      wantsPlayback = false; state = 'error'; audio.pause();
      setStatus('This song could not play. Try the next song or choose another audio file.'); syncControls();
    });
    ['loadedmetadata', 'durationchange', 'timeupdate', 'emptied'].forEach(event => audio.addEventListener(event, syncProgress));
    audio.addEventListener('volumechange', syncVolume);
    progress?.addEventListener('input', () => {
      if (!isCurrentSource() || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const fraction = Number(progress.value) / 1000;
      if (!Number.isFinite(fraction)) return;
      try { audio.currentTime = Math.max(0, Math.min(audio.duration, fraction * audio.duration)); }
      catch (_) { /* A track may not expose a seekable range yet. */ }
      syncProgress();
    });

    pickFiles?.addEventListener('click', () => files?.click());
    files?.addEventListener('change', () => {
      const chosen = [...(files.files || [])].filter(file => file.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|oga|flac|webm|opus)$/i.test(file.name));
      if (!chosen.length) { if (files.files?.length) setStatus('Choose an audio file to add a song.'); return; }
      pauseTrack(); audio.removeAttribute('src'); activeSource = ''; audio.load();
      localURLs.forEach(url => URL.revokeObjectURL(url)); localURLs = [];
      tracks = chosen.map(file => {
        const src = URL.createObjectURL(file); localURLs.push(src);
        return {src, title: fileTitle(file.name), artist: 'From your device', cover:'', description:''};
      });
      selected=0; history=[0]; historyPosition=0; shuffleBag=[];
      if (shuffleOn) refillShuffle();
      if (importArea) importArea.hidden = false;
      if (pickFiles) pickFiles.textContent = 'Choose different songs';
      files.value = ''; renderPlaylist(); showPlayer(); loadTrack(0, true); play?.focus({preventScroll: true});
    });
    portrait.addEventListener('change', () => { if (portrait.matches) hidePlayer(); });
    window.addEventListener('birthday-object-opened', () => hidePlayer());
    window.addEventListener('pagehide', event => {
      pauseTrack();
      if (!event.persisted) { localURLs.forEach(url => URL.revokeObjectURL(url)); localURLs = []; }
    });
    renderPlaylist(); syncVolume();
    if (tracks.length) loadTrack(0);
    else { showTrack(); setStatus('Choose her favourite songs to start the soundtrack.'); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startRadio, {once: true});
  else startRadio();
})();
