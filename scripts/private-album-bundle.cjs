// The wrapper carries ciphertext only, so classic scripts can load it from file://.
const fs=require('node:fs');
const path=require('node:path');
function scriptForEnvelope(envelope) {
  return '// Encrypted album data only. No password, key, image titles, or original image bytes.\nwindow.BIRTHDAY_PRIVATE_ALBUM = '+JSON.stringify(envelope)+';\n';
}
function writeScriptBundle(folder,envelope) {
  const destination=path.join(folder,'album.encrypted.js');
  const pending=destination+'.tmp';
  fs.writeFileSync(pending,scriptForEnvelope(envelope));
  fs.renameSync(pending,destination);
}
module.exports={scriptForEnvelope,writeScriptBundle};
