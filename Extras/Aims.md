# Aims for Tahreem’s Birthday Garden

These are the seven recommendations to guide future improvements. They are ideas to work through, not a claim that every item is complete.

1. **Personalise the Album.** Add 6–10 photos with short, specific captions. Use a favourite photo on the cover, and finish with “More memories to come.”

2. **Give Nakhre her actual personality.** Replace the sample cards with her favourite phrases, funny habits, and your inside jokes. Include sincere “Things I appreciate about you” cards among the playful ones.

3. **Make the bouquet reveal more magical.** Let the ribbon untie, the box lid lift, and the bouquet rise into view with a brief shower of petals. A small tag could read “Picked a little differently, just for you.”

4. **Personalise the Kinder Joys.** All seven eggs now contain the Drama Queen certificate, seven traits, first childhood-photo reveal, celebration bomb, second childhood photo, Tahreem-Mon meme, and seven-second moonwalking stickman finale. The voice note and comic have been dropped.

5. **Use her favourite flower throughout.** Once confirmed, repeat it in the garden, Album decorations, and letter stationery. Her confirmed age could appear on the birthday cake.

6. **Create a keepsake she can save.** Add a downloadable birthday card with her photo, your message, and the date, so she can keep it after exploring the website.

7. **Build a small personal playlist.** Add a few songs she loves. Each could include a one-line dedication explaining why it was chosen.

## Kinder Joy contents — 31 October 2026

- Egg 1: a playful Drama Queen Award with Bauni/bachi teasing and encouragement.
- Egg 2: the seven supplied things that make Tahreem, Tahreem, preserved verbatim.
- Egg 3: the first childhood photo and “Kya matlab khud choti reh gyi” behind a reveal button.
- Egg 4: a screen-filling floral celebration bomb with a replay button.
- Egg 5: the second childhood photo, titled “Hai koi mujhse tej..?”.
- Egg 6 (added 1 November): the Tahreem-Mon silhouette and two-clip audio reveal.
- Egg 7 (added 1 November): a seven-second moonwalk with boot sparks, flips around the bouquet, and an egg-4 explosion that throws the dancer off-screen. Tap again to replay. The voice note and comic have been dropped.

## Earlier asset snapshot — 30 October 2026

- Ten photos and two videos are supplied in `assets/photos and videos/`. The Album follows serial numbers 1 through 12 and uses the exact filename title for each caption.
- The radio playlist now uses seventeen local MP3 files from `assets/music/` directly, with optional descriptions and cover art ready for personalisation.
- Whenever the user says “update”, inspect the assets and synchronise the website. The repeatable command is `npm run update-assets`; the standing preference is also recorded in `AGENTS.md`.
- Videos now start automatically when their Album page is reached, without a separate tap to play. They try sound first and use muted playback if the browser blocks sound.
- Each of the seven Kinder Joys in the bouquet now wiggles gently and opens its own surprise card when tapped. Larger numbered buttons are also available on touch devices.
- Kinder Joy surprise slots are prepared in `content.js` under `kinderSurprises`. Their final messages and images will be supplied later; the empty slots contain no invented personal messages.
- The favourite flower, age, voice message, personal notes, and remaining improvements above still need their appropriate content or implementation.
