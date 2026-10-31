const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const vm=require('node:vm');
const {createDrivePayload,parseDrivePayload}=require('../private-album-sources.js');
const {scriptForEnvelope}=require('./private-album-bundle.cjs');
const {changePassword,decrypt}=require('./change-private-password.cjs');
const image={id:'test_file_0123456789',title:'A filename with punctuation 🤨'};

test('Drive manifest preserves titles and produces only fixed HTTPS Drive endpoints',()=>{
  const payload=createDrivePayload({version:1,images:[image]});
  const [result]=parseDrivePayload(payload);
  assert.equal(result.title,image.title);
  assert.equal(result.url,`https://drive.google.com/thumbnail?id=${image.id}&sz=w1600`);
  assert.equal(result.viewUrl,`https://drive.google.com/file/d/${image.id}/view`);
  assert.equal(result.ownedBlob,false);
  assert.deepEqual(Object.keys(payload.images[0]).sort(),['id','title']);
});
test('Drive data rejects injected URLs, duplicates, empty collections, and invalid versions',()=>{
  for(const id of ['https://example.com/photo','abc&other=1','short','../private','x'.repeat(201)]) {
    assert.throws(()=>createDrivePayload({version:1,images:[{...image,id}]}));
  }
  assert.throws(()=>createDrivePayload({version:1,images:[]}));
  assert.throws(()=>createDrivePayload({version:1,images:[image,image]}));
  assert.throws(()=>parseDrivePayload({version:1,source:'google-drive',images:[image]}));
  assert.throws(()=>parseDrivePayload({version:2,source:'other',images:[image]}));
  assert.throws(()=>createDrivePayload({version:1,images:Array.from({length:101},(_,i)=>({...image,id:`unique_file_${i}`}))}));
});
test('Both encrypted transports carry the same ciphertext and disclose no Drive identifier or title',()=>{
  const payload=createDrivePayload({version:1,images:[image]});
  const passphrase=crypto.randomBytes(32),salt=crypto.randomBytes(16),iv=crypto.randomBytes(12);
  const key=crypto.pbkdf2Sync(passphrase,salt,600000,32,'sha256');
  const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
  cipher.setAAD(Buffer.from('tahreem-private-album:v1'));
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(payload)),cipher.final(),cipher.getAuthTag()]);
  const envelope={version:1,kdf:'PBKDF2-SHA256',iterations:600000,cipher:'AES-256-GCM',salt:salt.toString('base64'),iv:iv.toString('base64'),ciphertext:encrypted.toString('base64')};
  const wrapper=scriptForEnvelope(envelope),json=JSON.stringify(envelope),sandbox={window:{}};
  vm.runInNewContext(wrapper,sandbox);
  assert.equal(JSON.stringify(sandbox.window.BIRTHDAY_PRIVATE_ALBUM),json);
  for(const publicText of [wrapper,json]) {assert(!publicText.includes(image.id));assert(!publicText.includes(image.title));}
  const decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);
  decipher.setAAD(Buffer.from('tahreem-private-album:v1'));decipher.setAuthTag(encrypted.subarray(-16));
  const restored=JSON.parse(Buffer.concat([decipher.update(encrypted.subarray(0,-16)),decipher.final()]));
  assert.deepEqual(restored,payload);
  const replacement=crypto.randomBytes(32).toString('hex');
  const rotated=changePassword(envelope,passphrase,replacement);
  assert.equal(rotated.imageCount,1);
  assert.notEqual(rotated.envelope.salt,envelope.salt);
  assert.notEqual(rotated.envelope.iv,envelope.iv);
  const rotatedPlaintext=decrypt(rotated.envelope,replacement);
  assert.deepEqual(JSON.parse(rotatedPlaintext),payload);rotatedPlaintext.fill(0);
  assert.throws(()=>decrypt(rotated.envelope,passphrase));
  assert.throws(()=>changePassword(envelope,'not-the-current-password',replacement),/Files were left unchanged/);
  assert.throws(()=>changePassword(envelope,passphrase,'short'));
  key.fill(0);passphrase.fill(0);
});
