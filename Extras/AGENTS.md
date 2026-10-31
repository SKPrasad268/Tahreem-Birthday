# Working on Tahreem’s Birthday Garden

- Whenever the user says **update**, inspect the complete `assets/` tree for new or changed files and update the website accordingly. This is the user’s standing preference.
- Run `npm run update-assets` to synchronise the Album and radio playlist from the current files, then inspect the result. If npm is unavailable, run the equivalent `node scripts/sync-assets.cjs`. Integrate other new asset types into their relevant website features when their purpose is clear.
- Album media belongs in `assets/photos and videos/` (also supported: `photos/` or `videos/`). Sort by the leading serial number and use the filename’s remaining title as the caption, preserving its spelling, punctuation, and emoji.
- The radio plays local audio files directly from the Music folders. Keep YouTube, embeds, and external playback mediators out of the radio.
- Preserve original media files and filenames. Preserve personal writing, existing memory notes, Kinder Joy messages, and deliberate song title/artist edits when syncing.
- Keep authored website copy focused on Tahreem and her birthday, using friendly language and floral or star accents. Avoid romantic wording, couple-style shared memories, and added heart decorations. Preserve original media titles unless the user asks to rename them.
- In Nakhre, keep “Our Humour” immediately before “Humor glimpse 2.0”, the three tagged images on one page, and Last 1 then Last 2 as the final pages.
- Private originals in `assets/Nakhre/Pvt album/` must never be published or copied into the upload folder. Publish only their encrypted bundle. Never put the private-album password or a decryption key in source files, logs, or the public upload. Rebuild encryption after changing private images; do not replace encryption with a password-only visibility check.
- Preserve direct-file opening of `index.html`: `file://` previews load the matching encrypted classic-script wrapper, while HTTP/HTTPS previews load encrypted JSON. Rebuild and include both transports in public exports; never require disabling browser security to preview the album.
- Keep phone landscape behaviour, automatic Album video playback with a muted fallback, and the seven interactive Kinder Joys working. Verify relevant changes in a local browser.
- This is a buildless static website for GitHub Pages. The user will upload it to GitHub; do not publish elsewhere or send files/messages to other services unless asked.
