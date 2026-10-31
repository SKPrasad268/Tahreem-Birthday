# Tahreem's Birthday Garden

A pink birthday garden for **Tahreem — 1 November 2026**, made as a static website for GitHub Pages. The large light oak table contains an **Album**, **Nakhre**, a central **three-tier chocolate birthday cake**, a **surprise gift box**, and a **birthday radio**. Tap the cake to make a birthday wish with its tiny cartoon helper.

## Personalise it

All personal writing and photo references live in [`content.js`](content.js). Edit that file before sharing the link.

- `name`, `birthday`, and `sender`: set the birthday details and your name.
- `age`: **16**, confirmed for her birthday on 1 November 2026.
- `favoriteFlower`: currently an empty string because her favourite flower has not been confirmed. Set it when she replies to display her favourite flower in the caption. The initial artwork uses decorative pink blossoms; changing this field does not redraw the illustration. The artwork can be updated once her favourite is known.
- `intro` and `letter`: the current letter is suggested birthday copy. Make it sound like you, and add what you appreciate about her.
- `album`: the supplied ten photos and two videos are listed in serial order 1–12. Each caption is the exact filename title without its serial number or file extension. Add a `note` only if you want an extra story beneath the title.
- `nakhrePages`: generated from the public screenshots directly inside `assets/Nakhre/`. Their filename titles are preserved. The old `nakhre` cards are retained as a fallback if the screenshot collection is empty.
- `wishes` and `openWhen`: edit the wishes and notes to make them more personal.
- `songs`: 38 distinct local tracks from the Music folders. Song titles and artists come from readable file metadata or their filenames; deliberate manual display edits are preserved on later updates. Optional `cover` and `description` fields personalise the record label and song details.

### Update from the assets

Whenever you ask for an **update**, the assets are checked and the website is synchronised. The standing instruction is saved in [`AGENTS.md`](AGENTS.md). To refresh the media lists yourself, run:

```sh
npm run update-assets
```

The same sync can run without npm using `node scripts/sync-assets.cjs`.

This scans Album folders (`assets/photos and videos/`, `photos/`, or `videos/`) and Music folders named `music`, `Music`, or `Musics`, including subfolders. It also scans the files directly inside `assets/Nakhre/`, without entering its subfolders. It updates the Album, Nakhre pages, and radio arrays in `content.js`, preserving personal writing, Kinder Joy messages, existing memory notes, and deliberate song display edits. Original media files and filenames are preserved. New images intended for a letter, a Kinder Joy message, or another feature can be connected to that feature separately.

### Album photos and videos

The current twelve originals are in `assets/photos and videos/`. Their names are preserved. `order` controls numeric ordering and `type` distinguishes images from videos. Videos are Album entries 2 and 7. Reaching a video page starts it automatically. While the radio is active, the video starts muted to preserve the soundtrack; otherwise the browser tries sound first and falls back to muted playback if needed. The video’s speaker control remains available for sound. Leaving the page stops the old video. Reference: [browser autoplay behaviour](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).

To add another item:

1. Put the image or video in `assets/photos and videos/`, named with a serial number and title, such as `13. Another lovely moment.jpeg`.
2. Run `npm run update-assets`.
3. Optionally add a personal `note` to the resulting `album` entry, for example:

```js
{
  order: 13,
  type: "image",
  src: "assets/photos and videos/13. Another lovely moment.jpeg",
  alt: "Another lovely moment",
  caption: "Another lovely moment",
  note: "Write the true story behind this photo in your own words."
}
```

Use **relative paths**, forward slashes, and matching filename capitalisation. GitHub Pages is case-sensitive. Keep photos reasonably compressed so the album opens quickly on a phone. Avoid uploading photos you do not want included in the shared website.

For a video, set `type: "video"` and point `src` to its MP4 file. The original media are displayed with `object-fit: contain` so the frame does not crop them.

### The birthday radio

Tap the radio on the table to open **Tahreem ki Radio** and start the selected song. The decorated record sits on the left, with the song title, artist, description, and playback controls on the right. The record spins while music is playing and stops when playback is paused. The radio plays the supplied MP3 files directly. Previous and next cycle through all 38 tracks, and a finished track advances to the next one. The sync keeps all 39 original audio files and lists the byte-identical “Shape of You” downloads once; it never deletes or renames originals.

To add songs, put the audio files in `assets/music/` (or another supported Music folder) and run `npm run update-assets`. Numeric prefixes control ordering when present; otherwise filenames are sorted alphabetically. A generated entry looks like:

```js
songs: [
  {
    title: "Song title",
    artist: "Artist",
    src: "assets/music/song.mp3",
    cover: "",
    description: ""
  }
]
```

Use `description` for your own short dedication or note about a song. Set `cover` to a relative image path if you have song artwork. The sync helper can extract an embedded MP3 front-cover image into `assets/music-covers/`, and preserves a cover or description you have deliberately supplied. None of the current MP3s contains embedded cover art, so the player uses its decorative record label for those tracks. It does not download covers or infer personal messages.

Playback starts after a tap and continues when the radio controls close, including through automatic track changes, repeat, and shuffle. Opening the Album, Nakhre, or a surprise keeps the soundtrack running. Reopen the radio to pause it; closing and reopening an explicitly paused song leaves it paused. The tabletop radio shows the current title and playing/paused state even with its controls closed. While the radio is active, Album videos start muted and garden chimes stay quiet. Leaving or reloading the website stops playback. The radio does not use an embedded video player or an external playback service.

An empty playlist offers a **Choose songs** option for a temporary device preview; those chosen files are not uploaded or saved in the website. To keep songs in the shared website, include the actual files in the repository and refresh the asset lists.

Use `npm start` to preview the site and its audio files, or open the GitHub Pages link after uploading the updated files.

## What goes in the gift box

The bouquet's letter, notes, and cake icons grow into their corresponding views. Each of the seven Kinder Joys travels into its shell-opening scene before the existing reveal plays. **Back to your surprises** shrinks the selected object into its original menu position, restores the previous scroll position, and returns keyboard focus to that same button. Opening from a numbered egg or discovery flower returns to that exact control. The Back and Close buttons remain usable during motion.

`surprise-motion.js` and `surprise-motion.css` handle these journeys. Rapid navigation, Close, resizing, backgrounding, reduced motion, and Breeze off cleanly settle the destination; no animation is required to use the gift.

Opening **Your Surprise** reveals a large bouquet made of Kinder Joy eggs and pink and red roses, wrapped in blush paper and a ribbon. Beside the bouquet is a small collection she can revisit:

The seven visible Kinder Joys gently wiggle and can each be tapped open. The numbered egg buttons below the bouquet provide larger touch targets. Each opens an animated egg and its own message card. A placeholder is shown while its final content is empty.

The first five eggs now contain personalised surprises:

1. **Drama Queen Award** — an HTML certificate with a crown, paper border, rosette, and gentle birthday teasing. Its `nickname`, `text`, and `closing` remain editable in `content.js`.
2. **7 things that make Tahreem, Tahreem** — the seven supplied lines, preserved verbatim in `items` and displayed as a numbered list.
3. **Badi hoke bada aadmi banungi** — the original childhood photo at `assets/kinerjoy/Childhood pic.png`, followed by a **Reveal message** button for “Kya matlab khud choti reh gyi”. The punchline stays hidden until selected; the button can hide it again.
4. **Celebration bomb** — selecting the egg automatically bursts its shell, briefly shakes the garden and dialog, and sends flowers, paper ribbons, and firework rays across the screen. The **More birthday chaos** button replays it. Leaving the view, resizing, or backgrounding removes the effects. Breeze off and reduced motion show a still birthday celebration. `party-bomb.js` and `party-bomb.css` own the effect and preserve radio playback.
5. **Hai koi mujhse tej..?** — the second original childhood photo at `assets/kinerjoy/childhood pic 2.jpeg`.

Eggs 6–7 are reserved for the final additions or stickers. Add their images to `image` and descriptions to `imageAlt` when ready. The voice note and comic have been dropped. `kinder-keepsakes.css` styles these cards alongside the existing egg openings and connected transitions; include it and the party files with the other root files when uploading.

Add the later messages and pictures to `kinderSurprises` in `content.js`:

```js
{
  id: "kinder-1",
  title: "Surprise 1",
  text: "",
  image: "",
  imageAlt: ""
}
```

Set `text`, `image`, or both. Image paths can point to a folder such as `assets/surprises/`; `imageAlt` describes the picture. Keep each `id` stable so it stays attached to the same egg. Empty slots do not contain invented personal messages. Reduced-motion settings keep the eggs still, with the tap hint and numbered buttons available.

1. **A personal birthday letter** — a few specific things you appreciate about her, followed by your wishes for the year ahead.
2. **Three “open when…” notes** — for a low day, a needed smile, and a small win.
3. **Birthday wishes and a cake** — a tiny cartoon helper blows out the candles, revealing a few wishes for the year ahead.

Optional personal additions later: a playlist link, a real plan for a birthday treat, or a photo that deserves its own reveal. Only promise a real gift or outing if you intend to follow through.

## Preview locally

With Node.js installed, run this from the project folder:

```sh
npm start
```

Open the local URL printed in the terminal. There is no installation step or production build for this static site.

## Put it on GitHub Pages

1. Create a GitHub repository for the birthday website.
2. Upload the website files and the complete `assets/` folder to the repository root. Keep `index.html` at the root.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your branch, usually `main`, and the **`/ (root)`** folder, then save.
6. Wait for GitHub's Pages deployment to finish. Open the website link shown in the Pages settings.

Keep the paths relative so the site also works at a project address such as `https://your-name.github.io/tahreem-birthday/`.

Reference: [GitHub’s Pages publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Phone landscape behaviour

The experience is designed for landscape. A phone held vertically shows a rotate prompt. A landscape/fullscreen control attempts to switch orientation where the browser supports it. Some phone browsers, particularly iPhone Safari, require her to turn the phone herself; a website cannot guarantee an automatic device-orientation change. Landscape pages and their reading views are sized to remain usable on short phone screens.

Reference: [browser support and fullscreen requirements for orientation locking](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock).

## A little garden breeze

The foliage sways gently, pink petals and a few leaves drift past the table, and warm fireflies glow around the garden borders. Use **Breeze on/off** in the top corner to pause or resume it. The preference is remembered in the browser. On narrow landscape phones, the leaf-shaped button is the breeze control.

Ambient movement pauses when the tab is hidden or the phone is on its portrait rotate screen. Devices requesting reduced motion get a still garden. The particle count stays fixed and is smaller on short landscape screens.

## Storybook interactions

The greeting and five tabletop objects arrive in a short sequence after entering the garden. On a desktop mouse, the garden layers shift slightly to add depth while the table and controls stay still. Opening the Album, Nakhre, or a surprise grows its reading panel from that object's position; closing returns it toward the same spot.

Album navigation turns a paper page, including with the existing swipe and arrow keys. Videos still start on the destination page, with a muted fallback when needed. The gift ribbon releases, the lid lifts, and the bouquet rises through a brief petal shower. Opening another view or closing the panel cancels the remaining effects.

Letters and individual “Open when…” notes open from a wax-sealed envelope. The letter's small flower fills as the writing is read. Paragraphs, Nakhre cards, and birthday wish cards gently appear when reached in their reading panel. All writing and controls remain available with reduced motion or **Breeze off**.

Seven numbered flower buttons beneath the bouquet form a discovery vine. Opening a Kinder Joy blooms its flower; progress is remembered in that browser. The flowers also provide larger touch and keyboard targets for the original seven surprises. The bouquet uses a smaller size on short landscape screens to make room for these controls.

The added files are `story-effects.js` / `.css`, `ambient-effects.js` / `.css`, `reading-effects.js` / `.css`, and `discovery-trail.js` / `.css`. Upload them alongside the existing root files for GitHub Pages.

The Album has a garden scrapbook style in `album-scrapbook.css`: blush and sage paper, gingham tape, pressed flowers, ruled caption paper, and small keepsake doodles. Original photos and videos remain uncropped, and filename captions and personal notes are preserved. Include this stylesheet with the other root files when uploading.

## Garden artwork

### Record player and garden entrance

The radio now places each new record on its turntable before starting the local audio. The paper sleeve slides away, the record settles, and the needle lowers. Changing songs lifts the needle and removes the old record; title and artist changes have a short, readable fade. Pausing stops the audio immediately while the record coasts gently to a halt. Resuming a seated record preserves its rotation and uses the direct tap-to-play path. If a phone browser blocks delayed playback, the existing **Tap play** message provides a fresh tap after the record is ready. Previous/Next, playlist selection, shuffle, repeat, seeking, volume, and local file playback remain available.

After **Step into your garden**, foreground flowers part, the garden makes a small camera approach, and a short firefly trail leads toward the Album. The table controls stay in place. Opening an object, using the keyboard, or resizing finishes the entrance immediately; its decorative flowers and fireflies are removed after the sequence. The entrance runs once per page load.

Include `turntable-motion.js` / `.css` and `garden-entrance.js` / `.css` with the other root files; the public packager includes them automatically. Both features respect Breeze off and reduced-motion settings. Closing the player or opening another experience settles only the decorative record motion; the chosen audio continues. Reopening a playing track restores the seated, spinning record without restarting the song. Pausing still cancels a pending record reveal and prevents it from starting music later.

### Album and Nakhre book movement

The Album opens with a lifting cover, a small fan of paper pages, and a photo that slides into its scrapbook frame before the caption settles. Drag an image horizontally to bend the page with your finger or mouse. A short drag springs back; a longer drag or quick flick completes the turn from the released angle. Vertical scrolling remains available. Previous/Next and arrow keys also turn pages. Video pages retain their native playback controls, automatic playback, and muted fallback; decorative turning sheets never create a second video player.

The closed Nakhre book has three public screenshot corners peeking out. Opening it reveals a fan of screenshots before the current scrapbook page settles. The folded bottom-right page corner is a keyboard-accessible Next control. Closing an enlarged screenshot, including from full-size reading, sends it back to the original scrapbook position and restores focus. The page picker, grouped trio, humour-page adjacency, and final Last 1 / Last 2 order remain intact.

Include `book-motion.js` and `book-motion.css` with the other root website files; the public packager includes them automatically. Motion cancels cleanly when navigating or resizing. Breeze off and reduced-motion settings show the reading views immediately, with page navigation still available.

### Letter and note stationery

The birthday letter now opens in a short sequence: the wax seal separates, the envelope flap lifts, and the folded sheet rises out. Two paper folds open in turn, followed by a soft light sweep and the original writing. The reading-progress flower and signature remain part of the same letter. The heading receives keyboard focus when unfolding finishes, and both Back and Close remain available during the reveal.

The three **Open when…** notes form a small stationery collection in sage, blush, and butter-yellow. Selecting an envelope brings it forward while the others slide aside, then opens its note automatically. The low-day note has a soft glow and a blooming flower; the smile note has one bouncing paper star; the small-win note has a brief golden-star shower. **All your notes** returns to the collection and restores focus to the selected envelope. The messages still come from `content.js`.

Include `stationery.css` alongside the other stylesheets. `reading-effects.js` owns the reveals and cancels their timers when leaving the view. Breeze off and reduced-motion preferences skip the animation and make opened writing immediately available. Decorative paper and light layers are removed after unfolding; the reading text is not duplicated.

### Birthday magic visual pass

Opening the gift now starts a four-second reveal: the box wiggles and glows, the ribbon releases, the lid lifts, and the bouquet rises through small golden stars. Its paper, flowers, ribbon, and seven eggs use separate layers of the existing artwork, settling back into the original composition. Petals fall, a “For you, Tahreem” paper tag appears, and the eggs shimmer in sequence. **Replay the magic** restarts it from the top of the reading view.

Each Kinder Joy opens with its own flower or star, accent colour, a small burst of decorations, and an unfolding numbered paper card. Existing messages and images still come from `content.js`; empty slots remain placeholders. The table has soft pools of light and a highlight for the chosen object. The cake has warm candlelight and longer, staggered smoke trails. Nakhre screenshots expand from their scrapbook position into a reading viewer, with the surroundings softened; tap the screenshot for full size.

These additions are in `birthday-magic.js` and `birthday-magic.css`, both included by `index.html` and automatically included by the public packager. Reveals cancel when leaving the view, switching away, or turning the phone upright. **Breeze off** and reduced-motion preferences show the final bouquet and readable cards immediately. The original media and private-album encryption are unchanged.

The original background was created using the built-in image generation tool. The web asset is `assets/garden.webp`; the original is `assets/garden.png`. The exact generation prompt is saved in [`assets/garden-prompt.txt`](assets/garden-prompt.txt).

The Kinder Joy and rose bouquet also uses the built-in image generation tool. Its transparent web asset is `assets/surprise-bouquet.webp`; the original is `assets/surprise-bouquet.png`. The exact prompt is saved in [`assets/surprise-bouquet-prompt.txt`](assets/surprise-bouquet-prompt.txt).

## Before sharing

- Run `npm run update-assets`, check the twelve Album captions, and add any optional memory notes.
- Personalise the letter and Nakhre cards.
- Replace “Your friend” with your name.
- Her age is set to 16; add her favourite flower once confirmed.
- Open the deployed GitHub Pages link on your phone, turn it sideways, and try the Album, Nakhre, gift notes, and candles.

The birthday pages work as static files on GitHub Pages. Shared Nakhre voting uses the optional separate backend described below. Editing the repository files updates the page content after GitHub deploys the change.

## Nakhre scrapbook and birthday ballot

The 26 public screenshots in `assets/Nakhre/` form 24 pages in a chosen, stable shuffled order. “Our Humour” appears immediately before “Humor glimpse 2.0”. The added scrapbook wording focuses on Tahreem and her birthday. The three files tagged “Bind in one” stay together on one page, and “Last.1” and “Last 2” are the final two public pages in that order. A separate **Private album** button inside Nakhre opens the password-protected collection described below.

### Encrypted private album

The private album now loads its eight pictures from the shared Google Drive folder after password unlock. File IDs and filename titles are encrypted together; no actual Drive folder link or file identifier is placed in public HTML, JavaScript, or `content.js`. The original local images are no longer a runtime dependency.

Local backup images and the plaintext `drive-manifest.json` remain in `assets/Nakhre/Pvt album/`. That directory is excluded from Git, the public upload packager, and direct local-server requests. **Do not upload the original project folder manually to GitHub.** A browser upload does not obey `.gitignore`.

Only encrypted data is published: `assets/private-album/album.encrypted.json` and its matching `album.encrypted.js` wrapper. Both carry the same ciphertext. In the current Drive mode the ciphertext contains references and titles, rather than image bytes. The wrapper lets a classic script load the encrypted data when `index.html` is opened directly with a `file://` address; HTTP/HTTPS pages load the JSON instead. The original local-file failure was caused by browsers blocking `fetch(file://...)`.

The bundle uses AES-256-GCM, a fresh random salt and IV, and a password-derived key using PBKDF2-SHA256 with 600,000 iterations. The password and key are not embedded in either transport or saved in the upload. The browser decrypts the collection in memory after password entry, then loads the Drive thumbnails. An **Open in Drive** link is available on each unlocked page. Switching away from the page locks it; a normal reload requires the password again. The earlier self-contained encrypted-image format remains supported, including revocation of its temporary Blob URLs when locked.

The website password protects discovery of the Drive identifiers before unlock. It does not encrypt the originals stored on Drive or conceal their network requests after unlock. Anyone with a copied Drive link can open a file shared with “Anyone with the link”. Restrict Drive sharing to specific Google accounts if access must be limited by identity.

Password strength still matters: anyone can download the encrypted bundle and attempt guesses offline. A long, unique passphrase gives better protection. A person who knows the password can save or screenshot the unlocked pictures; this feature cannot prevent that.

After editing the private Drive manifest, rebuild both encrypted transports. The Drive command verifies the existing album password before writing, so a typo leaves the current bundle unchanged. It accepts the password on stdin and never uses a password command-line argument or password file:

```sh
node scripts/protect-private-album.cjs --stdin --drive
```

Type the password at the prompt and press Enter. Interactive input is not echoed. The private manifest has `version: 1` and an `images` array of `{id, title}` entries. Preserve their original titles. To return to a self-contained encrypted copy of the local image bytes, omit `--drive`; keep local originals available for that mode.

To change the album password while preserving the existing encrypted collection, run `node scripts/change-private-password.cjs`. Enter the current and new passwords at its hidden prompts. It verifies the new password, rejects the previous one against the new bundle, and rebuilds both encrypted transports. Refresh both encrypted files in the upload folder afterwards. Passwords are never command arguments or source-file settings.

Prepare a fresh upload directory **outside** the source project:

```sh
node scripts/package-public-site.cjs --out "C:/path/to/a/new/PUBLIC_SITE"
```

The helper refuses to overwrite an existing folder, verifies both encrypted transports match, and checks public files for accidental copies of private originals and unencrypted Drive identifiers. Upload only the **contents** of the generated folder. It includes the site and encrypted bundle, while excluding private originals, the plaintext Drive manifest, Node backend files, local databases, and development scripts. Both HTTPS and direct-file encrypted transports remain included. Drive pictures require an internet connection and their existing sharing permissions. Keep the full `assets/` folder beside `index.html` when extracting or copying the website. Share its password privately with the intended viewer.

Every screenshot keeps its filename as its title. Previous/Next, the page picker, arrow keys, and swipes on the screenshots navigate the scrapbook. Tap a screenshot to read it in an enlarged viewer; tap it again to switch to full size. `nakhre-album.js` and `nakhre-album.css` contain this feature and must accompany the other root files when uploaded.

The “Tumhe Prime Minister Banne ke liye mai vote dunga” page includes the two requested choices, named results, vote counts, and a receipt after voting. Names and selected choices are displayed publicly in the vote book. The API enforces unique normalized names and browser IDs with database constraints, including concurrent submissions. Names are not verified identities: someone who changes both their name and browser identity could vote again, and two people with the same normalized name cannot both vote under that name.

### Run the prepared voting backend locally

Use Node.js **22.16 or newer**. No package installation is needed:

```sh
node server.cjs
```

Open the printed local URL. The browser connects automatically to `/api/nakhre-pm`. The server saves votes in `server-data/nakhre-votes.sqlite`; restarting it preserves totals and names. This directory and SQLite files are ignored by Git and are blocked from the local static server. Use a persistent disk if hosting the backend later.

Set `PORT` to use another port, `HOST=0.0.0.0` when a hosting provider needs an external listener, and `VOTES_DB_PATH` to choose a durable database file. Tests use temporary databases and never add demo votes to the real vote book:

```sh
node --test scripts/test-nakhre.cjs
```

### Connect shared voting after choosing a host

The backend is prepared locally and has not been deployed. GitHub Pages cannot run `server.cjs` or save shared votes. For public shared voting:

1. Run `server.cjs` on a Node host with persistent storage, setting `VOTING_ONLY=1` to serve only the ballot API.
2. Set `VOTING_ALLOWED_ORIGINS` to the exact birthday website origin, for example `https://your-name.github.io` (no repository path or trailing slash). Multiple origins may be comma-separated.
3. Set `voting.apiBase` in `content.js` to the full HTTPS API URL, ending in `/api/nakhre-pm`.
4. Upload the updated static website to GitHub Pages.

Until a hosted endpoint is configured, the public website clearly marks voting as unavailable and shows no invented totals. Voting works immediately in the local preview. Every visitor connected to the same backend sees the same saved results; an open vote page refreshes them periodically.

The seven improvement ideas are saved in [Aims.md](Aims.md).

## The chocolate birthday cake

A glossy three-tier chocolate and berry cake with pink-and-gold number-16 candles now sits in the centre of the table, with the gift box immediately to its right. Tap the cake or choose **Make a wish** inside the gift box to open it.

Press **Blow candels** to send the tiny cartoon girl onto the top tier. She blows wind across both number candles, jumps back down, and lands in a playful tumble with dizzy eyes and little stars. Her height is one quarter of the cake stack's height. **Watch her again** replays the cartoon. With reduced motion or **Breeze off**, the wish completes immediately with a still final pose.

Closing the view or opening another surprise cancels the cartoon cleanly. Cancelling before the blow leaves the candles lit and the button ready. The artwork and animation are in `cake-art.js` / `.css`, `cake-character.js` / `.css`, and `cake-performance.js` / `.css`; include these files with the other website files on GitHub Pages.
