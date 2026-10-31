/* The garden runs entirely in the browser, including on GitHub Pages. */
(() => {
  'use strict';

  function startGarden() {
    const source = window.BIRTHDAY || {};
    const text = (value, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
    const list = value => Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
    const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
    const data = {
      name: text(source.name, 'Tahreem'),
      sender: text(source.sender, 'Your friend'),
      favoriteFlower: text(source.favoriteFlower),
      intro: text(source.intro, 'A little corner of the world, made just for you.'),
      letter: source.letter && typeof source.letter === 'object' ? source.letter : {},
      album: list(source.album).map((item, index) => ({
        ...item,
        order: Number.isFinite(Number(item.order)) && Number(item.order) > 0 ? Number(item.order) : index + 1,
        type: text(item.type).toLowerCase() === 'video' || /\.(mp4|webm|m4v|mov|ogv)(?:[?#]|$)/i.test(text(item.src)) ? 'video' : 'image',
        sourceIndex: index
      })).sort((left, right) => left.order - right.order || left.sourceIndex - right.sourceIndex),
      nakhre: list(source.nakhre),
      wishes: list(source.wishes),
      openWhen: list(source.openWhen)
    };
    if (!data.album.length) data.album.push({src: '', alt: 'A favourite photo', caption: 'The birthday girl', note: 'A birthday photo will go here.'});
    const welcome = document.getElementById('welcome-dialog');
    const experience = document.getElementById('experience-dialog');
    const dialogBody = document.getElementById('dialog-body');
    const dialogTitle = document.getElementById('dialog-title');
    const dialogSubtitle = document.getElementById('dialog-subtitle');
    const closeButton = document.getElementById('close-dialog');
    const gardenStatus = document.getElementById('garden-status');
    const petals = document.getElementById('petals');
    const triggers = [...document.querySelectorAll('[data-open]')];
    const portrait = window.matchMedia('(max-width: 900px) and (orientation: portrait) and (pointer: coarse)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const validObjects = ['album', 'nakhre', 'gift'];
    const storageKey = 'tahreem-birthday-garden:2026:visited';
    let visited = new Set();
    let activeObject = null;
    let activeGift = null;
    let albumIndex = 0;
    let lastOpener = null;
    let entered = false;
    let suspended = null;
    let skipExperienceClose = 0;
    let skipWelcomeClose = 0;
    let candleOut = false;
    let albumPlaybackVersion = 0;
    let albumVideoWatchdog = null;
    let closeVersion = 0;
    let experienceClosing = false;
    const flippedCards = new Set();
    const cakeArt = document.getElementById('table-cake-art');
    if (cakeArt && window.GardenCakeArt) cakeArt.innerHTML = window.GardenCakeArt.cakeSvg().replace('viewBox="0 0 560 380"', 'viewBox="130 0 360 375"');

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved)) visited = new Set(saved.filter(item => validObjects.includes(item)));
    } catch (_) { /* Private browsing can disable storage; exploration still works. */ }

    function setText(id, value) {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    }
    setText('welcome-name', data.name);
    setText('garden-name', data.name);
    setText('welcome-intro', data.intro);
    setText('flower-caption', data.favoriteFlower ? `Your favourite flower: ${data.favoriteFlower}` : 'A garden made just for you');
    const parsedBirthday = /^\d{4}-\d{2}-\d{2}$/.test(source.birthday || '') ? new Date(`${source.birthday}T12:00:00`) : null;
    const birthdayLabel = parsedBirthday && !Number.isNaN(parsedBirthday.getTime())
      ? parsedBirthday.toLocaleDateString('en-US', {month: 'long', day: 'numeric'}) : 'November 1';
    const confirmedAge = Number.isInteger(source.age) && source.age > 0 ? source.age : null;
    setText('birthday-date', `${birthdayLabel}${confirmedAge ? ` · Turning ${confirmedAge}` : ''}`);

    function updateVisited() {
      triggers.forEach(button => {
        const seen = visited.has(button.dataset.open);
        button.dataset.seen = String(seen);
        const label = button.dataset.originalLabel || button.getAttribute('aria-label') || button.textContent.trim();
        button.dataset.originalLabel = label;
        button.setAttribute('aria-label', `${label}${seen ? ', already explored' : ''}`);
      });
      document.body.classList.toggle('garden-complete', visited.size === validObjects.length);
      if (gardenStatus) gardenStatus.textContent = visited.size === validObjects.length
        ? `A garden full of little surprises. Happy birthday, ${data.name}.`
        : 'Pick a little something from the table.';
      try { localStorage.setItem(storageKey, JSON.stringify([...visited])); } catch (_) { /* Optional state. */ }
    }

    function photoSource(value) {
      const candidate = text(value);
      if (!candidate || candidate.startsWith('//') || candidate.includes('\\') || /[\u0000-\u001f]/.test(candidate)) return '';
      if (/^[a-z][a-z\d+.-]*:/i.test(candidate)) {
        try { return new URL(candidate).protocol === 'https:' ? candidate : ''; } catch (_) { return ''; }
      }
      return candidate;
    }

    function photoPlaceholder() {
      return '<div class="photo-placeholder"><span class="placeholder-flower" aria-hidden="true">✿</span><span>A birthday photo belongs here</span></div>';
    }

    function setAlbumVideoStatus(message) {
      const status = dialogBody.querySelector('#album-video-status');
      if (!status) return;
      status.textContent = message;
      status.hidden = !message;
    }

    function stopAlbumVideo(unload = false) {
      albumPlaybackVersion += 1;
      window.clearTimeout(albumVideoWatchdog);
      albumVideoWatchdog = null;
      const video = dialogBody.querySelector('#album-video');
      if (!video) return;
      video.pause();
      if (unload) {
        video.removeAttribute('src');
        video.load();
      }
    }

    function albumVideoCanPlay(video) {
      return video?.isConnected && video === dialogBody.querySelector('#album-video')
        && activeObject === 'album' && experience?.open && !portrait.matches && !document.hidden;
    }

    function radioIsActive() {
      return document.getElementById('radio-play')?.getAttribute('aria-pressed') === 'true';
    }

    function resumeAlbumVideo() {
      const video = dialogBody.querySelector('#album-video');
      if (!albumVideoCanPlay(video)) return;
      const version = ++albumPlaybackVersion;
      window.clearTimeout(albumVideoWatchdog);
      const isCurrent = () => version === albumPlaybackVersion && albumVideoCanPlay(video);
      if (video.readyState < 3) setAlbumVideoStatus('Loading this video…');
      albumVideoWatchdog = window.setTimeout(() => {
        if (isCurrent() && video.paused && !video.error) setAlbumVideoStatus('This video is still loading…');
      }, 12000);
      // Keep her chosen soundtrack running. Video sound remains available on its speaker control.
      if (radioIsActive()) video.muted = true;
      // Otherwise try sound first, with muted inline playback as the browser fallback.
      void (async () => {
        try {
          await video.play();
        } catch (error) {
          if (!isCurrent() || error?.name === 'AbortError') return;
          if (error?.name === 'NotAllowedError' && !video.muted) {
            video.muted = true;
            video.defaultMuted = true;
            video.setAttribute('muted', '');
            try { await video.play(); }
            catch (mutedError) {
              if (!isCurrent() || mutedError?.name === 'AbortError') return;
              setAlbumVideoStatus('Your browser paused this video. Use its play control to continue.');
            }
          } else {
            setAlbumVideoStatus('This video could not play. Please try opening this page again.');
          }
        }
      })();
    }

    function cancelClosing() {
      if (!experienceClosing) return;
      experienceClosing = false;
      closeVersion += 1;
      window.GardenStory?.cancel();
    }

    function renderAlbum() {
      cancelClosing();
      window.GardenCakePerformance?.cancel();
      window.GardenStory?.cancel();
      window.GardenReading?.cancel();
      stopAlbumVideo(true);
      const item = data.album[albumIndex];
      const src = photoSource(item.src);
      const isVideo = item.type === 'video';
      const caption = text(item.caption, text(item.alt, 'The birthday girl'));
      const media = !src ? photoPlaceholder() : isVideo
        ? `<video id="album-video" src="${escape(src)}" aria-label="${escape(caption)}" playsinline autoplay controls preload="auto">Your browser does not support this video.</video>`
        : `<img src="${escape(src)}" alt="${escape(text(item.alt, caption))}" decoding="async">`;
      dialogTitle.textContent = 'The Album 📸✨';
      dialogSubtitle.textContent = 'The birthday girl, in every frame.';
      dialogBody.innerHTML = `
        <div class="album-spread${isVideo ? ' album-spread-video' : ''}">
          <div class="album-photo">${media}<span class="album-memory-label">${isVideo ? 'Tahreem in motion' : 'The Tahreem edition'}</span></div>
          <div class="album-caption">
            <div class="album-pressed-sprig" aria-hidden="true"><svg viewBox="0 0 140 130" fill="none" focusable="false"><path d="M29 117C54 89 72 62 110 18M55 85 35 53M77 59l31 5" stroke="#89966c" stroke-width="2" stroke-linecap="round"/><path d="M44 72C22 74 22 54 29 45c15 3 23 13 15 27ZM70 69C61 47 74 33 84 34c5 14 1 27-14 35ZM86 49c7-21 26-20 33-12-5 13-16 19-33 12ZM57 87c2 17-10 25-21 21-1-14 5-22 21-21Z" fill="#a9b38b"/><g fill="#d9a1b6" stroke="#bc809c" stroke-width=".8"><ellipse cx="106" cy="17" rx="8" ry="14" transform="rotate(-24 106 17)"/><ellipse cx="117" cy="23" rx="8" ry="14" transform="rotate(50 117 23)"/><ellipse cx="116" cy="34" rx="8" ry="14" transform="rotate(118 116 34)"/><ellipse cx="103" cy="36" rx="8" ry="14" transform="rotate(-28 103 36)"/><ellipse cx="97" cy="25" rx="8" ry="14" transform="rotate(55 97 25)"/></g><circle cx="108" cy="27" r="6" fill="#e6c78b"/><path d="M49 104c9-6 14-4 18 2m-22-6c1 9 7 13 14 10" stroke="#c58b9b" stroke-width="3" stroke-linecap="round"/></svg></div>
            <p class="eyebrow album-memory-chip">Spotlight ${String(item.order || albumIndex + 1).padStart(2, '0')}</p>
            <h3>${escape(caption)}</h3>
            ${text(item.note) ? `<p class="album-personal-note">${escape(text(item.note))}</p>` : ''}
            ${isVideo ? '<p id="album-video-status" class="album-video-status" aria-live="polite">Loading this video…</p>' : ''}
            <div class="album-keepsake-mark" aria-hidden="true"><span class="album-flower">✿</span><span>Birthday girl.<br>Main character energy.</span><svg class="album-star-doodle" viewBox="0 0 78 60" fill="none" focusable="false"><path d="M29 5 34 20 50 21 37 31 42 47 29 37 15 47 20 31 7 21 24 20 29 5M47 49c8 5 15 2 19-4m-7-2 9 1-3 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          </div>
        </div>
        <nav class="album-nav" aria-label="Album pages"><button id="album-prev" type="button" ${albumIndex === 0 ? 'disabled' : ''}>← Previous</button><span class="page-count" aria-live="polite">${albumIndex + 1} / ${data.album.length}</span><button id="album-next" type="button" ${albumIndex === data.album.length - 1 ? 'disabled' : ''}>Next →</button></nav>`;
      const imageElement = dialogBody.querySelector('.album-photo img');
      if (imageElement) imageElement.addEventListener('error', () => {
        const parent = imageElement.parentElement;
        if (!parent) return;
        imageElement.remove();
        parent.insertAdjacentHTML('afterbegin', photoPlaceholder());
      }, {once: true});
      const video = dialogBody.querySelector('#album-video');
      if (video) {
        video.addEventListener('playing', () => {
          if (!albumVideoCanPlay(video)) { video.pause(); return; }
          window.clearTimeout(albumVideoWatchdog);
          setAlbumVideoStatus(video.muted ? 'Video is playing muted. Tap the speaker for sound.' : '');
          window.dispatchEvent(new Event('birthday-album-video-playing'));
        });
        video.addEventListener('volumechange', () => {
          if (albumVideoCanPlay(video) && !video.paused) setAlbumVideoStatus(video.muted ? 'Video is playing muted. Tap the speaker for sound.' : '');
        });
        video.addEventListener('error', () => {
          if (video !== dialogBody.querySelector('#album-video') || !video.getAttribute('src')) return;
          window.clearTimeout(albumVideoWatchdog);
          video.classList.add('album-video-error');
          setAlbumVideoStatus('This video could not load. Please try opening this page again.');
        });
      }
      dialogBody.querySelector('#album-prev').addEventListener('click', () => changeAlbum(-1, 'album-prev'));
      dialogBody.querySelector('#album-next').addEventListener('click', () => changeAlbum(1, 'album-next'));
      resumeAlbumVideo();
      window.GardenBookMotion?.bindAlbum(dialogBody, {
        canStep: direction => albumIndex + direction >= 0 && albumIndex + direction < data.album.length,
        onTurn: (direction, progress) => changeAlbum(direction, null, progress)
      });
    }

    function changeAlbum(direction, focusId, progress = 0) {
      const next = Math.max(0, Math.min(data.album.length - 1, albumIndex + direction));
      if (next === albumIndex) return;
      window.GardenBookMotion?.cancel();
      const turningPage = window.GardenStory?.snapshot(dialogBody.querySelector('.album-spread'));
      albumIndex = next;
      renderAlbum();
      window.GardenStory?.turn(turningPage, direction, progress);
      const preferred = focusId ? dialogBody.querySelector(`#${focusId}:not(:disabled)`) : null;
      (preferred || dialogBody.querySelector('.album-nav button:not(:disabled)') || closeButton)?.focus({preventScroll: true});
    }

    function renderNakhre() {
      cancelClosing();
      window.GardenCakePerformance?.cancel();
      window.GardenStory?.cancel();
      window.GardenReading?.cancel();
      if (window.GardenNakhre && Array.isArray(source.nakhrePages) && source.nakhrePages.length) {
        dialogTitle.textContent = 'Nakhre 💅😌';
        dialogSubtitle.textContent = 'THE TAHREEM ARCHIVES · BIRTHDAY EDITION';
        window.GardenNakhre.mount(dialogBody, source.nakhrePages, source.voting || {}, source.privateAlbum || {});
        return;
      }
      dialogTitle.textContent = 'Nakhre 💅😌';
      dialogSubtitle.textContent = 'The very special Tahreem edition.';
      const cards = data.nakhre.length ? data.nakhre : [{title: 'A little sparkle', subtitle: 'A few words, just for you', body: 'Your personality deserves its own birthday edition.'}];
      dialogBody.innerHTML = `<div class="nakhre-intro"><span class="issue-stamp">THE ${escape(data.name.toUpperCase())} EDITION</span><p>Little quirks. Big personality. Tap a card for a little note.</p></div><div class="nakhre-grid">${cards.map((card, index) => {
        const flipped = flippedCards.has(index);
        const label = `${text(card.title, `Little note ${index + 1}`)}. ${flipped ? text(card.body, 'A little note goes here.') : text(card.subtitle, 'Tap to peek inside')}`;
        return `<button class="nakhra-card${flipped ? ' is-flipped' : ''}" type="button" data-card="${index}" aria-pressed="${flipped}" aria-label="${escape(label)}"><span class="nakhra-front" aria-hidden="${flipped}"><span class="nakhra-number">${String(index + 1).padStart(2, '0')}</span><span class="nakhra-title">${escape(text(card.title, 'A little something'))}</span><span class="nakhra-subtitle">${escape(text(card.subtitle, 'Tap to peek inside'))}</span><span aria-hidden="true">✧</span></span><span class="nakhra-back" aria-hidden="${!flipped}"><span class="nakhra-title">${escape(text(card.title, 'A little something'))}</span><span class="nakhra-copy">${escape(text(card.body, 'A little note goes here.'))}</span><span class="nakhra-subtitle">Tap to turn back</span></span></button>`;
      }).join('')}</div>`;
      dialogBody.querySelectorAll('[data-card]').forEach(button => button.addEventListener('click', () => {
        const index = Number(button.dataset.card);
        flippedCards.has(index) ? flippedCards.delete(index) : flippedCards.add(index);
        const flipped = flippedCards.has(index);
        button.classList.toggle('is-flipped', flipped);
        button.setAttribute('aria-pressed', String(flipped));
        button.setAttribute('aria-label', `${text(cards[index].title, 'A little something')}. ${flipped ? text(cards[index].body, 'A little note goes here.') : text(cards[index].subtitle, 'Tap to peek inside')}`);
        button.querySelector('.nakhra-front').setAttribute('aria-hidden', String(flipped));
        button.querySelector('.nakhra-back').setAttribute('aria-hidden', String(!flipped));
      }));
      window.GardenReading?.enhance('nakhre');
    }

    function giftBack() {
      return '<button id="gift-back" class="back-link" type="button">← Back to your surprises</button>';
    }

    const kinderRegions = [
      [498,119,140,202], [230,264,140,203], [554,283,133,207],
      [749,306,139,198], [229,434,145,201], [524,517,148,209], [653,459,150,199]
    ];
    const openedKinder = new Set();
    let lastKinder = null;
    let kinderObserver = null;
    let giftOrigin = null;

    function travelToGift(next, button) {
      window.GardenMoonwalk?.cancel();
      if (next === 'kinder-7' && source.kinderSurprises?.some(item => item.id === next && item.kind === 'moonwalk') && window.GardenMoonwalk) {
        window.GardenStory?.cancel();
        window.GardenGiftMagic?.cancel();
        window.GardenSurpriseMotion?.cancel();
        window.GardenMoonwalk.play(experience, button);
        return;
      }
      const fromTrail = button.classList.contains('discovery-bloom');
      const selector = button.dataset.kinder
        ? `${fromTrail ? '.discovery-bloom' : button.classList.contains('kinder-tap') ? '.kinder-tap' : '.kinder-picker button'}[data-kinder="${next}"]`
        : `[data-gift="${next}"]`;
      giftOrigin = {kind:next, selector, scroll:experience.scrollTop};
      const render = () => {
        activeGift = next;
        renderGift();
        dialogBody.querySelector('#gift-back')?.focus({preventScroll:true});
      };
      if (window.GardenSurpriseMotion) window.GardenSurpriseMotion.navigate({kind:next, opener:button, render});
      else render();
    }

    function kinderButtons() {
      return kinderRegions.map(([x,y,width,height],index) => `<button class="kinder-tap" type="button" data-kinder="kinder-${index+1}" style="left:${x/1024*100}%;top:${y/1536*100}%;width:${width/1024*100}%;height:${height/1536*100}%;--kinder-delay:${index*-.43}s" aria-label="Open Kinder Joy surprise ${index+1}"><span class="kinder-egg-piece" aria-hidden="true"></span><span class="kinder-opened-dot" aria-hidden="true"${(openedKinder.has(`kinder-${index+1}`) || window.GardenDiscovery?.has(`kinder-${index+1}`)) ? '' : ' hidden'}>✓</span></button>`).join('');
    }

    function attachKinder() {
      kinderObserver?.disconnect();
      window.GardenDiscovery?.attach(dialogBody);
      const canvas = dialogBody.querySelector('.bouquet-interactive');
      if (!canvas) return;
      const alignPieces = () => {
        const scaleX = canvas.clientWidth / 1024;
        const scaleY = canvas.clientHeight / 1536;
        canvas.querySelectorAll('.kinder-tap').forEach((button,index) => {
          const [x,y] = kinderRegions[index];
          const piece = button.querySelector('.kinder-egg-piece');
          piece.style.backgroundSize = `${canvas.clientWidth}px ${canvas.clientHeight}px`;
          piece.style.backgroundPosition = `${-x*scaleX}px ${-y*scaleY}px`;
        });
      };
      alignPieces();
      kinderObserver = new ResizeObserver(alignPieces);
      kinderObserver.observe(canvas);
      dialogBody.querySelectorAll('[data-kinder]').forEach(button => {
        if (button.dataset.kinderBound === 'true') return;
        button.dataset.kinderBound = 'true';
        button.addEventListener('click', () => {
          lastKinder = button.dataset.kinder;
          openedKinder.add(lastKinder);
          window.GardenDiscovery?.opened(lastKinder);
          travelToGift(lastKinder, button);
        });
      });
    }

    function kinderCard(surprise, index) {
      const heading = `<p class="eyebrow">A LITTLE SURPRISE · ${String(index+1).padStart(2,'0')}</p><h3>${escape(text(surprise.title,`Surprise ${index+1}`))}</h3>`;
      if (surprise.kind === 'award') {
        const date = parsedBirthday && !Number.isNaN(parsedBirthday.getTime())
          ? parsedBirthday.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}) : birthdayLabel;
        return `<div class="kinder-award"><span class="award-corner corner-top" aria-hidden="true">✧</span><span class="award-corner corner-bottom" aria-hidden="true">✧</span><p class="award-kicker">THE BIRTHDAY HONOURS</p><svg class="award-crown" viewBox="0 0 100 65" fill="none" aria-hidden="true" focusable="false"><path d="m12 22 20 15L50 9l18 28 20-15-8 32H20Z" fill="#e9ce92" stroke="#b59154" stroke-width="2" stroke-linejoin="round"/><path d="M21 47h58M25 59h50" stroke="#b59154" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="18" r="4" fill="#d59cb0"/><circle cx="50" cy="6" r="4" fill="#d59cb0"/><circle cx="88" cy="18" r="4" fill="#d59cb0"/><path d="m50 30 4 6-4 6-4-6Z" fill="#c1849d"/></svg><h3>${escape(text(surprise.title,'Drama Queen Award'))}</h3><p class="award-presented">PROUDLY PRESENTED TO</p><p class="award-name">${escape(data.name)}</p><p class="award-nickname">${escape(text(surprise.nickname))}</p><p class="award-citation">${escape(text(surprise.text))}</p><p class="award-closing">${escape(text(surprise.closing))}</p><div class="award-footer"><div><span class="award-signature">Birthday Garden Committee</span><span class="award-date">${escape(date)} · Birthday privileges included</span></div><div class="award-rosette"><span>100%<br>ICONIC</span></div></div></div>`;
      }
      if (surprise.kind === 'traits') {
        const items = Array.isArray(surprise.items) ? surprise.items.filter(item => typeof item === 'string' && item.trim()) : [];
        return `${heading}<ol class="kinder-traits">${items.map((item, number) => `<li><span class="kinder-trait-number" aria-hidden="true">${String(number+1).padStart(2,'0')}</span><span class="kinder-trait-text">${escape(item)}</span></li>`).join('')}</ol><span class="kinder-traits-flower" aria-hidden="true">✿</span>`;
      }
      if (surprise.kind === 'party') {
        return `${heading}<p class="kinder-message-text">${escape(text(surprise.text))}</p><div class="party-static-flowers" aria-hidden="true">✿ ✧ ❀ ✧ ✿</div><p class="party-status" role="status">A little birthday surprise is about to pop…</p><button class="kinder-party-replay" type="button">More birthday chaos <span aria-hidden="true">✧</span></button>`;
      }
      const image = photoSource(surprise.image);
      const photo = image ? `<img class="kinder-message-image" src="${escape(image)}" alt="${escape(text(surprise.imageAlt,'A picture inside your Kinder Joy surprise'))}" decoding="async">` : '';
      if (surprise.kind === 'childhood') {
        const punchline = text(surprise.revealText);
        return `${heading}<figure class="kinder-childhood-photo">${photo}<figcaption>Little ${escape(data.name)} <span aria-hidden="true">✿</span></figcaption></figure>${punchline ? `<button class="kinder-reveal-button" type="button" aria-expanded="false" aria-controls="kinder-punchline-${index+1}">Reveal message <span aria-hidden="true">✧</span></button><p class="kinder-punchline" id="kinder-punchline-${index+1}" hidden>${escape(punchline)}</p>` : ''}`;
      }
      const message = text(surprise.text);
      return `${heading}${photo}${message ? `<p class="kinder-message-text">${escape(message)}</p>` : ''}${!image&&!message ? `<div class="kinder-message-pending"><span aria-hidden="true">✿</span><p>${surprise.kind === 'sticker' ? 'A little sticker surprise is on its way.' : 'Your special message will be added here soon.'}</p></div>` : ''}`;
    }

    function renderKinder(id) {
      const index = Math.max(0,kinderRegions.findIndex((_,i)=>`kinder-${i+1}`===id));
      const surprise = list(source.kinderSurprises).find(item=>item.id===id) || {};
      if (surprise.kind === 'pokemon' && window.GardenPokemon) {
        dialogTitle.textContent = text(surprise.title, 'Ye konsa Pokemon hai...');
        dialogSubtitle.textContent = 'A mystery inside Kinder Joy 6.';
        dialogBody.innerHTML = `${giftBack()}${window.GardenPokemon.markup({
          ...surprise, image:photoSource(surprise.image), backdrop:photoSource(surprise.backdrop),
          questionAudio:photoSource(surprise.questionAudio), revealAudio:photoSource(surprise.revealAudio)
        })}`;
        window.GardenPokemon.mount(experience, surprise);
        experience.scrollTop = 0;
        attachGiftBack();
        return;
      }
      const kind = ['award', 'traits', 'childhood', 'sticker', 'party'].includes(surprise.kind) ? surprise.kind : 'message';
      const keepsake = ['award', 'traits', 'childhood'].includes(kind);
      dialogTitle.textContent = text(surprise.title,`Surprise ${index+1}`);
      dialogSubtitle.textContent = 'A little joy, opened just for you.';
      dialogBody.innerHTML = `${giftBack()}<section class="kinder-reveal${keepsake ? ' kinder-reveal--keepsake' : ''}" style="--surprise-hue:${[0,22,-18,45,-32,12,-10][index]}deg;--surprise-turn:${index%2 ? 12 : -12}deg" aria-label="Opened Kinder Joy surprise ${index+1}"><div class="kinder-opening" aria-hidden="true"><span class="kinder-half kinder-half-left"><span class="kinder-shell-label">Kinder<br><strong>JOY</strong></span></span><span class="kinder-opening-flower">${["✿","✧","❀","✦","✿","✧","❀"][index]}</span><span class="kinder-burst" aria-hidden="true"><i>✧</i><i>✿</i><i>✦</i><i>✧</i><i>❀</i></span><span class="kinder-half kinder-half-right"><span class="kinder-inside">✳</span></span></div><article class="kinder-message kinder-message--${kind}" aria-live="polite"><span class="kinder-card-seal" aria-hidden="true">${index+1}</span>${kinderCard(surprise, index)}</article></section>`;
      if (kind === 'party') {
        dialogBody.querySelector('.kinder-reveal').classList.add('kinder-reveal--party');
        window.GardenPartyBomb?.mount(experience);
      }
      dialogBody.querySelector('.kinder-reveal-button')?.addEventListener('click', event => {
        const button = event.currentTarget;
        const message = dialogBody.querySelector('.kinder-punchline');
        if (!message) return;
        const open = message.hidden;
        message.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
        button.innerHTML = `${open ? 'Hide message' : 'Reveal message'} <span aria-hidden="true">${open ? '✿' : '✧'}</span>`;
        if (open) message.scrollIntoView({block:'nearest', behavior:reducedMotion.matches || document.body.classList.contains('garden-motion-off') ? 'auto' : 'smooth'});
      });
      dialogBody.querySelector('.kinder-message-image')?.addEventListener('error',event=>{
        const fallback = document.createElement('p');
        fallback.className = 'kinder-image-error';
        fallback.textContent = 'This little picture could not load. Please try again.';
        event.currentTarget.replaceWith(fallback);
      },{once:true});
      if(experience)experience.scrollTop=0;
      attachGiftBack();
    }

    experience?.addEventListener('close',()=>kinderObserver?.disconnect());

    function attachGiftBack() {
      dialogBody.querySelector('#gift-back')?.addEventListener('click', () => {
        window.GardenPokemon?.cancel();
        const origin = giftOrigin;
        const destination = () => dialogBody.querySelector(origin?.selector || '[data-gift]');
        const render = () => {
          activeGift = null;
          renderGift();
          experience.scrollTop = origin?.scroll || 0;
          destination()?.focus({preventScroll:true});
        };
        if (window.GardenSurpriseMotion && origin) window.GardenSurpriseMotion.navigate({kind:origin.kind, returning:true, render, destination});
        else render();
        giftOrigin = null;
        lastKinder = null;
      });
    }

    function renderGift() {
      cancelClosing();
      window.GardenMoonwalk?.cancel();
      window.GardenPokemon?.cancel();
      window.GardenPartyBomb?.cancel();
      window.GardenCakePerformance?.cancel();
      window.GardenStory?.cancel();
      window.GardenReading?.cancel();
      kinderObserver?.disconnect();
      dialogTitle.textContent = 'Your Surprise 🎁✨';
      dialogSubtitle.textContent = 'A bouquet of flowers & a little sweetness.';
      if (activeGift === 'letter') return renderLetter();
      if (activeGift === 'notes') return renderNotes();
      if (activeGift === 'cake') return renderCake();
      if (/^kinder-[1-7]$/.test(activeGift || '')) return renderKinder(activeGift);
      dialogBody.innerHTML = `<section class="bouquet-surprise" aria-label="Your Kinder Joy and rose bouquet">
        <figure class="bouquet-portrait"><div class="bouquet-halo" aria-hidden="true"></div><div class="bouquet-interactive"><img class="surprise-bouquet" src="assets/surprise-bouquet.webp" width="1024" height="1536" alt="A large bouquet of Kinder Joy eggs nestled among pink and red roses, wrapped in blush pink paper and tied with a satin ribbon." decoding="async">${kinderButtons()}<span class="bouquet-paper-tag">For you,<br><em>${escape(data.name)}</em><span aria-hidden="true"> ✿</span></span></div><figcaption>Tap a wiggling Kinder Joy — there’s a little surprise inside.</figcaption><div class="kinder-picker" role="group" aria-label="Choose a Kinder Joy surprise">${kinderRegions.map((_,index)=>`<button type="button" data-kinder="kinder-${index+1}" aria-label="Open Kinder Joy surprise ${index+1}"><span aria-hidden="true">${index+1}</span></button>`).join('')}</div></figure>
        <div class="bouquet-copy"><p class="eyebrow">A little something, just for you</p><h3>For you,<br> <em>${escape(data.name)}.</em> 💐</h3><p class="bouquet-message">A little sweetness, a lot of flowers, and a whole bouquet of birthday wishes.</p><button class="bouquet-replay" type="button" data-bouquet-replay><span aria-hidden="true">↻</span> Replay the magic</button><p class="sr-only" role="status" data-bouquet-status>Your bouquet is ready. Pick a little surprise.</p><div class="gift-menu bouquet-gifts">
        <button class="gift-option" type="button" data-gift="letter"><span class="gift-option-icon" aria-hidden="true">✉</span><span class="gift-option-copy"><span class="gift-option-title">A letter for you ✉️</span><span>Birthday wishes for the year ahead.</span></span><span aria-hidden="true">↗</span></button>
        <button class="gift-option" type="button" data-gift="notes"><span class="gift-option-icon" aria-hidden="true">✿</span><span class="gift-option-copy"><span class="gift-option-title">Open when… 🌷</span><span>Little notes for another day.</span></span><span aria-hidden="true">↗</span></button>
        <button class="gift-option" type="button" data-gift="cake"><span class="gift-option-icon" aria-hidden="true">✧</span><span class="gift-option-copy"><span class="gift-option-title">Make a wish 🌠</span><span>A sweet sixteen wish awaits.</span></span><span aria-hidden="true">↗</span></button>
      </div></div></section>`;
      dialogBody.querySelector('.kinder-picker')?.insertAdjacentHTML('afterend', window.GardenDiscovery?.markup() || '');
      if (experience) experience.scrollTop = 0;
      attachKinder();
      window.GardenGiftMagic?.prepare(dialogBody, kinderRegions);
      window.GardenSurpriseMotion?.decorate(dialogBody);
      window.GardenPokemon?.prepare(source.kinderSurprises);
      dialogBody.querySelectorAll('[data-gift]').forEach(button => button.addEventListener('click', () => {
        travelToGift(button.dataset.gift, button);
      }));
    }

    function renderLetter() {
      dialogTitle.textContent = 'A letter for you ✉️🌷';
      dialogSubtitle.textContent = 'Something you can always come back to.';
      const paragraphs = Array.isArray(data.letter.paragraphs) ? data.letter.paragraphs.filter(item => typeof item === 'string' && item.trim()) : [];
      dialogBody.innerHTML = `${giftBack()}<article class="letter-paper"><p class="eyebrow">FOR ${escape(data.name.toUpperCase())}</p><h3>${escape(text(data.letter.title, `Happy birthday, ${data.name}.`))}</h3>${(paragraphs.length ? paragraphs : ['Wishing you a birthday full of little joys, lovely company, and a year with plenty to look forward to.']).map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}<p class="letter-signature">With lots of birthday wishes,<br>${escape(data.sender)}</p></article>`;
      attachGiftBack();
      if (experience) experience.scrollTop = 0;
      window.GardenReading?.enhance('letter');
    }

    function renderNotes(index = null, origin = null) {
      cancelClosing();
      window.GardenReading?.cancel();
      dialogTitle.textContent = 'Open when… 🌷✨';
      dialogSubtitle.textContent = 'A little encouragement, whenever you need it.';
      const notes = data.openWhen.length ? data.openWhen : [{title: 'You need a little smile', body: 'Here is a little reminder: you deserve kindness, rest, and lovely days ahead.'}];
      const moods = ['low', 'smile', 'win'];
      if (index !== null && notes[index]) {
        dialogBody.innerHTML = `${giftBack()}<article class="note-paper" data-note-mood="${moods[index] || 'smile'}"><button id="note-back" class="back-link" type="button">← All your notes</button><span class="note-label">OPEN WHEN…</span><h3 class="note-heading">${escape(text(notes[index].title, 'A little note for you'))}</h3><p>${escape(text(notes[index].body, 'A little birthday wish, just for you.'))}</p><span aria-hidden="true">✿</span></article>`;
        dialogBody.querySelector('#note-back').addEventListener('click', () => {
          renderNotes();
          dialogBody.querySelector(`[data-note="${index}"]`)?.focus({preventScroll: true});
        });
      } else {
        dialogBody.innerHTML = `${giftBack()}<div class="openwhen-grid">${notes.map((note, noteIndex) => `<button class="note-envelope" type="button" data-note="${noteIndex}" data-note-mood="${moods[noteIndex] || 'smile'}" style="--stationery-tilt:${[-4,2,-2][noteIndex%3]}deg;--stationery-index:${noteIndex}"><span class="note-stationery-art" aria-hidden="true"><span class="note-stationery-insert">${['✿','✧','✦'][noteIndex%3]}</span><span class="note-stationery-flap"></span><span class="note-stationery-seal">${['✿','✧','✦'][noteIndex%3]}</span></span><span class="note-label">OPEN WHEN…</span><span class="note-heading">${escape(text(note.title, 'You need a little kindness'))}</span><span class="note-seal" aria-hidden="true">✿</span></button>`).join('')}</div>`;
        dialogBody.querySelectorAll('[data-note]').forEach(button => button.addEventListener('click', () => {
          const chosen = origin => renderNotes(Number(button.dataset.note), origin);
          if (window.GardenReading?.chooseNote) window.GardenReading.chooseNote(button, chosen);
          else chosen(null);
        }));
      }
      attachGiftBack();
      if (experience) experience.scrollTop = 0;
      window.GardenReading?.enhance(index !== null ? 'note' : 'notes', {autoOpen:index !== null, origin});
    }

    function renderCake() {
      dialogTitle.textContent = 'Sweet sixteen 🎂🥳';
      dialogSubtitle.textContent = 'Chocolate, berries & a sweet sixteen wish.';
      dialogBody.innerHTML = `${giftBack()}<div class="cake-scene"><div class="cake-layout"><div class="cake-theatre${candleOut ? ' is-out' : ''}" data-cake-phase="ready" role="img" aria-label="Glossy three-tier chocolate and berry cake with ${candleOut ? 'unlit' : 'lit'} number-16 candles and a tiny birthday helper.">${window.GardenCakeArt?.cakeSvg() || ''}${window.GardenCakeCharacter?.markup() || ''}</div><div class="cake-invitation"><p class="eyebrow">SWEET SIXTEEN · IT’S YOUR DAY</p><h3 class="cake-message">${candleOut ? `Happy 16th birthday, ${escape(data.name)}! 🎂🥳` : 'Sweet sixteen. 🎂<br>Make a wish. 🌠'}</h3><p class="cake-flavour-note">Glossy ganache, berry cream<br>& a little birthday magic.</p><button id="blow-candles" type="button"${candleOut ? ' disabled' : ''}>${candleOut ? 'Your wish is on its way ✿' : 'Blow candels'}</button><p class="wish-result" aria-live="polite">${candleOut ? 'Here’s to your next year of wins.' : 'Make your wish, then let the tiny helper take it from here.'}</p><button class="cake-replay" id="cake-replay" type="button"${candleOut ? '' : ' hidden'}>Watch her again ↻</button></div></div></div><div class="wish-cards"${candleOut ? '' : ' hidden'}>${data.wishes.map(wish => `<article class="wish-card"><h3>${escape(text(wish.title, 'A birthday wish'))}</h3><p>${escape(text(wish.body))}</p></article>`).join('')}</div>`;
      attachGiftBack();
      const scene = dialogBody.querySelector('.cake-theatre');
      const button = dialogBody.querySelector('#blow-candles');
      const replay = dialogBody.querySelector('#cake-replay');
      const result = dialogBody.querySelector('.wish-result');
      const current = () => scene.isConnected && dialogBody.querySelector('.cake-theatre') === scene
        && activeObject === 'gift' && activeGift === 'cake';
      const perform = () => {
        if (!current() || button.dataset.busy === 'true') return;
        cancelClosing();
        window.GardenStory?.cancel();
        const firstWish = !candleOut;
        button.dataset.busy = 'true';
        button.disabled = true;
        replay.hidden = true;
        button.textContent = 'A little birthday magic…';
        result.textContent = 'Up she goes… a tiny helper for a very big wish.';
        const onBlown = () => {
          if (!current()) return;
          candleOut = true;
          cakeArt?.classList.add('is-out');
          scene.setAttribute('aria-label', 'Sweet sixteen chocolate cake. The tiny helper has blown out both number-16 candles.');
          dialogBody.querySelector('.cake-message').textContent = `Happy 16th birthday, ${data.name}! 🎂🥳`;
          dialogBody.querySelector('.wish-cards').hidden = false;
          result.textContent = 'Whooosh! Your wish is on its way…';
          window.GardenReading?.enhance('cake');
          if (firstWish) celebrate();
          if (soundEnabled) playChime();
        };
        const onFinished = ({blown, cancelled}) => {
          if (!current()) return;
          button.dataset.busy = 'false';
          button.disabled = candleOut;
          button.textContent = candleOut ? 'Your wish is on its way ✿' : 'Blow candels';
          replay.hidden = !candleOut;
          result.textContent = blown ? 'Wish delivered. Tiny helper: down for a birthday nap. ✿'
            : candleOut ? 'Your wish is already on its way. Watch her again whenever you like.'
              : 'Make your wish, then let the tiny helper take it from here.';
          if (blown && !cancelled) scene.setAttribute('aria-label', 'Candles blown out. The tiny girl landed, toppled over, and lies with cartoon dizzy eyes and little stars.');
        };
        if (!window.GardenCakePerformance?.run(scene, {onBlown, onFinished})) {
          scene.classList.add('is-out');
          onBlown();
          onFinished({blown: true, cancelled: false});
        }
      };
      button.addEventListener('click', perform);
      replay.addEventListener('click', perform);
      if (experience) experience.scrollTop = 0;
      window.GardenReading?.enhance('cake');
    }

    function celebrate() {
      if (reducedMotion.matches || document.body.classList.contains('garden-motion-off')) return;
      const layer = document.createElement('div');
      layer.className = 'celebration-layer';
      layer.setAttribute('aria-hidden', 'true');
      const destination = experience?.open ? experience : petals;
      if (!destination) return;
      destination.append(layer);
      for (let index = 0; index < 24; index += 1) {
        const petal = document.createElement('span');
        petal.className = 'celebration-petal';
        petal.style.setProperty('--x', `${Math.random() * 100}%`);
        petal.style.setProperty('--delay', `${Math.random() * 0.5}s`);
        petal.style.setProperty('--drift', `${Math.round(Math.random() * 140 - 70)}px`);
        petal.style.setProperty('--rotation', `${Math.round(Math.random() * 360)}deg`);
        petal.style.setProperty('--petal-color', ['#e599b5', '#f5c4d4', '#c7d1ae', '#edd3a4'][index % 4]);
        layer.append(petal);
      }
      window.setTimeout(() => layer.remove(), 4500);
    }

    function openObject(object, button) {
      if (!validObjects.includes(object) || !experience || !dialogBody || portrait.matches) return;
      window.GardenPartyBomb?.cancel();
      window.GardenNakhre?.unmount();
      closeVersion += 1;
      experienceClosing = false;
      stopAlbumVideo(true);
      activeObject = object;
      activeGift = button?.dataset.giftStart === 'cake' ? 'cake' : null;
      giftOrigin = activeGift === 'cake' ? {kind:'cake', selector:'[data-gift="cake"]', scroll:0} : null;
      lastOpener = button;
      triggers.forEach(trigger => trigger.classList.toggle('is-selected', trigger === button));
      window.dispatchEvent(new Event('birthday-object-opened'));
      document.body.dataset.openObject = object;
      if (object === 'album') renderAlbum();
      if (object === 'nakhre') renderNakhre();
      if (object === 'gift') renderGift();
      const justCompleted = !visited.has(object) && visited.size === 2;
      visited.add(object);
      updateVisited();
      experience.returnValue = '';
      if (!experience.open) experience.showModal();
      experience.scrollTop = 0;
      void window.GardenStory?.open(experience, button, object === 'gift' && !activeGift);
      if (object === 'album') resumeAlbumVideo();
      closeButton?.focus({preventScroll: true});
      if (soundEnabled) playChime();
      if (justCompleted) celebrate();
    }

    triggers.forEach(button => button.addEventListener('click', () => openObject(button.dataset.open, button)));
    function closeExperience() {
      if (!experience?.open || experienceClosing) return;
      experienceClosing = true;
      window.GardenMoonwalk?.cancel();
      window.GardenPokemon?.cancel();
      window.GardenPartyBomb?.cancel();
      window.GardenSurpriseMotion?.cancel();
      window.GardenReading?.cancel();
      window.GardenCakePerformance?.cancel();
      const version = ++closeVersion;
      stopAlbumVideo();
      const finish = () => { if (version === closeVersion && experience.open) experience.close(); };
      if (window.GardenStory) void window.GardenStory.close(experience, lastOpener).then(finish);
      else finish();
    }
    closeButton?.addEventListener('click', closeExperience);
    experience?.addEventListener('cancel', event => { event.preventDefault(); closeExperience(); });
    experience?.addEventListener('close', () => {
      closeVersion += 1;
      experienceClosing = false;
      window.GardenStory?.cancel();
      window.GardenCakePerformance?.cancel();
      stopAlbumVideo();
      if (skipExperienceClose > 0) { skipExperienceClose -= 1; return; }
      window.GardenNakhre?.unmount();
      window.GardenReading?.cancel();
      stopAlbumVideo(true);
      activeObject = null;
      activeGift = null;
      lastKinder = null;
      delete document.body.dataset.openObject;
      lastOpener?.focus({preventScroll: true});
    });
    experience?.addEventListener('click', event => {
      const rectangle = experience.getBoundingClientRect();
      if (event.target === experience && (event.clientX < rectangle.left || event.clientX > rectangle.right || event.clientY < rectangle.top || event.clientY > rectangle.bottom)) closeExperience();
    });
    experience?.addEventListener('keydown', event => {
      if (activeObject !== 'album' || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      if (/^(INPUT|TEXTAREA|SELECT|VIDEO|AUDIO)$/.test(event.target.tagName)) return;
      event.preventDefault();
      changeAlbum(event.key === 'ArrowRight' ? 1 : -1);
    });
    function showWelcome() {
      if (entered || portrait.matches || !welcome || welcome.open) return;
      welcome.returnValue = '';
      welcome.showModal();
    }
    document.getElementById('enter-garden')?.addEventListener('click', () => {
      entered = true;
      welcome?.close();
    });
    welcome?.addEventListener('close', () => {
      if (skipWelcomeClose > 0) { skipWelcomeClose -= 1; return; }
      entered = true;
      triggers[0]?.focus({preventScroll: true});
      window.dispatchEvent(new Event('birthday-entered'));
    });
    function handleOrientationChange() {
      if (portrait.matches) {
        closeVersion += 1;
        window.GardenCakePerformance?.cancel();
        window.GardenStory?.cancel();
        stopAlbumVideo();
        if (experience?.open) {
          suspended = 'experience';
          skipExperienceClose += 1;
          experience.close('orientation');
        } else if (welcome?.open) {
          suspended = 'welcome';
          skipWelcomeClose += 1;
          welcome.close('orientation');
        }
      } else {
        if (suspended === 'experience' && activeObject && experience && !experience.open) {
          experience.returnValue = '';
          experience.showModal();
          if (activeObject === 'album') resumeAlbumVideo();
          if (experience.querySelector('.kinder-reveal--party')) window.GardenPartyBomb?.mount(experience, false);
          closeButton?.focus({preventScroll: true});
        } else if (!entered) showWelcome();
        suspended = null;
      }
    }
    portrait.addEventListener('change', handleOrientationChange);
    portrait.addEventListener('change', () => {
      if (!portrait.matches && activeObject === 'gift' && !activeGift) attachKinder();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAlbumVideo();
      else if (activeObject === 'album') resumeAlbumVideo();
    });
    window.addEventListener('pagehide', () => stopAlbumVideo());

    async function tryLandscape(toggle = false) {
      const status = document.getElementById('orientation-status');
      if (toggle && document.fullscreenElement) {
        try { screen.orientation?.unlock?.(); } catch (_) { /* Optional browser support. */ }
        try { await document.exitFullscreen(); } catch (_) { /* Keep the landscape prompt available. */ }
        return;
      }
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen({navigationUI: 'hide'});
        }
      } catch (_) { /* Some mobile browsers use only physical orientation. */ }
      try {
        if (typeof screen.orientation?.lock === 'function') {
          await screen.orientation.lock('landscape');
          if (status) status.textContent = 'Landscape is ready. Enjoy your little garden.';
        } else if (status) status.textContent = 'Turn your phone sideways to enter the garden.';
      } catch (_) {
        if (status) status.textContent = 'Turn your phone sideways to enter the garden.';
      }
    }
    document.getElementById('try-landscape')?.addEventListener('click', () => tryLandscape());
    document.getElementById('fullscreen-toggle')?.addEventListener('click', () => tryLandscape(true));
    document.addEventListener('fullscreenchange', () => {
      const toggle = document.getElementById('fullscreen-toggle');
      toggle?.setAttribute('aria-pressed', String(!!document.fullscreenElement));
      toggle?.setAttribute('aria-label', document.fullscreenElement ? 'Exit full screen' : 'Enter full screen');
    });

    let soundEnabled = false;
    let audioContext = null;
    let chimeInterval = null;
    function playChime() {
      if (!audioContext || audioContext.state !== 'running' || radioIsActive()) return;
      const time = audioContext.currentTime;
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, time + index * 0.14);
        gain.gain.linearRampToValueAtTime(0.025, time + index * 0.14 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + index * 0.14 + 1.5);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(time + index * 0.14);
        oscillator.stop(time + index * 0.14 + 1.6);
      });
    }
    function stopSound() {
      soundEnabled = false;
      if (chimeInterval) window.clearInterval(chimeInterval);
      chimeInterval = null;
      audioContext?.suspend().catch(() => {});
      const toggle = document.getElementById('sound-toggle');
      toggle?.setAttribute('aria-pressed', 'false');
      toggle?.setAttribute('aria-label', 'Turn on gentle garden chimes');
      const label = toggle?.querySelector('[data-sound-label]');
      if (label) label.textContent = 'Sound off';
    }
    document.getElementById('sound-toggle')?.addEventListener('click', async () => {
      if (soundEnabled) { stopSound(); return; }
      const Audio = window.AudioContext || window.webkitAudioContext;
      const toggle = document.getElementById('sound-toggle');
      if (!Audio) {
        toggle.disabled = true;
        toggle.setAttribute('aria-label', 'Garden chimes are unavailable in this browser');
        return;
      }
      try {
        if (!audioContext) audioContext = new Audio();
        await audioContext.resume();
        window.dispatchEvent(new Event('birthday-chimes-playing'));
        soundEnabled = true;
        toggle.setAttribute('aria-pressed', 'true');
        toggle.setAttribute('aria-label', 'Turn off gentle garden chimes');
        const label = toggle.querySelector('[data-sound-label]');
        if (label) label.textContent = 'Sound on';
        playChime();
        chimeInterval = window.setInterval(playChime, 14000);
      } catch (_) { stopSound(); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopSound(); });
    window.addEventListener('birthday-radio-playing', stopSound);
    window.addEventListener('birthday-album-video-playing', stopSound);
    window.addEventListener('pagehide', stopSound);

    updateVisited();
    showWelcome();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startGarden, {once: true});
  else startGarden();
})();
