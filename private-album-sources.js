/* Shared validation only. Private file IDs and titles live inside ciphertext. */
(() => {
  'use strict';
  function parseDrivePayload(payload) {
    if (payload?.version !== 2 || payload.source !== 'google-drive' || !Array.isArray(payload.images)
      || !payload.images.length || payload.images.length > 100) throw Error('ALBUM_UNAVAILABLE');
    const seen = new Set();
    return payload.images.map(image => {
      if (typeof image?.id !== 'string' || !/^[A-Za-z0-9_-]{10,200}$/.test(image.id)
        || typeof image.title !== 'string' || !image.title.trim() || image.title.length > 2000
        || seen.has(image.id)) throw Error('ALBUM_UNAVAILABLE');
      seen.add(image.id);
      const id = encodeURIComponent(image.id);
      return {title:image.title, url:`https://drive.google.com/thumbnail?id=${id}&sz=w1600`,
        viewUrl:`https://drive.google.com/file/d/${id}/view`, ownedBlob:false};
    });
  }
  function createDrivePayload(manifest) {
    if (manifest?.version !== 1 || !Array.isArray(manifest.images)) throw Error('Invalid private Drive manifest.');
    const payload = {version:2, source:'google-drive', images:manifest.images.map(image=>({id:image.id,title:image.title}))};
    parseDrivePayload(payload);
    return payload;
  }
  const api = {parseDrivePayload,createDrivePayload};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else window.GardenPrivateAlbumSources = api;
})();
