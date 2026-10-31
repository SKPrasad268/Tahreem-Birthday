// Re-encrypt the existing payload. Passwords enter through hidden stdin only.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {scriptForEnvelope,writeScriptBundle}=require('./private-album-bundle.cjs');
const iterations=600000;
const context=Buffer.from('tahreem-private-album:v1');

function decrypt(envelope,password) {
  if(envelope.version!==1||envelope.kdf!=='PBKDF2-SHA256'||envelope.iterations!==iterations||envelope.cipher!=='AES-256-GCM')throw Error('Invalid encrypted album.');
  const salt=Buffer.from(envelope.salt,'base64'),iv=Buffer.from(envelope.iv,'base64'),encrypted=Buffer.from(envelope.ciphertext,'base64');
  if(salt.length!==16||iv.length!==12||encrypted.length<16)throw Error('Invalid encrypted album.');
  const key=crypto.pbkdf2Sync(password,salt,iterations,32,'sha256');
  try {
    const decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);
    decipher.setAAD(context);decipher.setAuthTag(encrypted.subarray(-16));
    return Buffer.concat([decipher.update(encrypted.subarray(0,-16)),decipher.final()]);
  } finally {key.fill(0);}
}
function changePassword(envelope,currentPassword,newPassword) {
  if(typeof newPassword!=='string'||newPassword.length<8)throw Error('Use a new password with at least 8 characters.');
  if(currentPassword===newPassword)throw Error('The new password must be different.');
  let plaintext;
  try {plaintext=decrypt(envelope,currentPassword);}
  catch (_) {throw Error('The current password did not unlock the album. Files were left unchanged.');}
  try {
    const payload=JSON.parse(plaintext);
    if(!Array.isArray(payload.images)||!payload.images.length)throw Error('Invalid album payload.');
    const salt=crypto.randomBytes(16),iv=crypto.randomBytes(12);
    const key=crypto.pbkdf2Sync(newPassword,salt,iterations,32,'sha256');
    let encrypted;
    try {
      const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(context);
      encrypted=Buffer.concat([cipher.update(plaintext),cipher.final(),cipher.getAuthTag()]);
    } finally {key.fill(0);}
    const updated={version:1,kdf:'PBKDF2-SHA256',iterations,salt:salt.toString('base64'),cipher:'AES-256-GCM',iv:iv.toString('base64'),ciphertext:encrypted.toString('base64')};
    const verification=decrypt(updated,newPassword);
    try {if(!verification.equals(plaintext))throw Error('Re-encryption verification failed.');}
    finally {verification.fill(0);}
    let oldAccepted=false;
    try {const old=decrypt(updated,currentPassword);old.fill(0);oldAccepted=true;} catch (_) { /* Expected: the previous password must fail. */ }
    if(oldAccepted)throw Error('The previous password still unlocks the new bundle. Files were left unchanged.');
    return {envelope:updated,imageCount:payload.images.length};
  } finally {plaintext.fill(0);}
}
async function readPasswords() {
  if(process.stdin.isTTY)process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdout.write('Current album password (hidden):\n');
  const values=[];let input='',skipLF=false;
  for await(const chunk of process.stdin)for(const character of chunk) {
    if(character==='\u0003')throw Error('Cancelled.');
    if(skipLF&&character==='\n'){skipLF=false;continue;}
    skipLF=false;
    if(character==='\r'||character==='\n') {
      values.push(input);input='';skipLF=character==='\r';
      if(values.length===2){process.stdin.pause();return values;}
      process.stdout.write('New album password (hidden):\n');
    } else if(process.stdin.isTTY&&(character==='\u007f'||character==='\b'))input=[...input].slice(0,-1).join('');
    else input+=character;
    if(input.length>1024)throw Error('Password input is too long.');
  }
  throw Error('Both passwords are required.');
}
async function main() {
  let [currentPassword,newPassword]=await readPasswords();
  try {
    const folder=path.resolve(__dirname,'../assets/private-album'),file=path.join(folder,'album.encrypted.json');
    const previous=JSON.parse(fs.readFileSync(file,'utf8'));
    if(fs.readFileSync(path.join(folder,'album.encrypted.js'),'utf8')!==scriptForEnvelope(previous))throw Error('The encrypted transports do not match. Files were left unchanged.');
    const result=changePassword(previous,currentPassword,newPassword);
    fs.writeFileSync(file+'.tmp',JSON.stringify(result.envelope));
    fs.renameSync(file+'.tmp',file);
    writeScriptBundle(folder,result.envelope);
    console.log(`Password changed for ${result.imageCount} images. Both encrypted transports rebuilt; new password verified and old password rejected. No password was saved.`);
  } finally {currentPassword='';newPassword='';}
}
module.exports={changePassword,decrypt};
if(require.main===module)main().then(()=>process.exit(0)).catch(error=>{console.error(error.message);process.exit(1);});
