// Encrypt the local originals. Supply the password through stdin, never a command argument.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {writeScriptBundle}=require('./private-album-bundle.cjs');
const {createDrivePayload}=require('../private-album-sources.js');
const root=path.resolve(__dirname,'..');
const originalFolder=path.join(root,'assets','Nakhre','Pvt album');
const outputFolder=path.join(root,'assets','private-album');
const types={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.avif':'image/avif'};
const iterations=600000;
const context=Buffer.from('tahreem-private-album:v1');

async function passwordFromStdin() {
  process.stdout.write('Waiting for the album password on stdin (it will not be printed).\n');
  if(process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  let input='';
  for await(const chunk of process.stdin) {
    for(const character of chunk) {
      if(character==='\u0003')throw Error('Cancelled.');
      if(character==='\r'||character==='\n'){process.stdin.pause();return input;}
      if(process.stdin.isTTY&&(character==='\u007f'||character==='\b'))input=[...input].slice(0,-1).join('');
      else input+=character;
      if(input.length>1024)throw Error('Password input is too long.');
    }
  }
  return input.replace(/\r?\n$/,'');
}
async function main() {
  let password=await passwordFromStdin();
  if(password.length<8) throw Error('Use an album password with at least 8 characters; a long unique passphrase is preferable.');
  const driveMode=process.argv.includes('--drive');
  let payload;
  if(driveMode) {
    // Preserve the existing password: verify it before replacing either transport.
    const old=JSON.parse(fs.readFileSync(path.join(outputFolder,'album.encrypted.json'),'utf8'));
    if(old.version!==1||old.iterations!==iterations||old.cipher!=='AES-256-GCM'||old.kdf!=='PBKDF2-SHA256')throw Error('The existing encrypted album is invalid.');
    const oldKey=crypto.pbkdf2Sync(password,Buffer.from(old.salt,'base64'),iterations,32,'sha256');
    let oldPlaintext;
    try {
      const encrypted=Buffer.from(old.ciphertext,'base64');
      const decipher=crypto.createDecipheriv('aes-256-gcm',oldKey,Buffer.from(old.iv,'base64'));
      decipher.setAAD(context);decipher.setAuthTag(encrypted.subarray(-16));
      oldPlaintext=Buffer.concat([decipher.update(encrypted.subarray(0,-16)),decipher.final()]);
    } catch (_) {throw Error('The existing album password did not match. Encrypted files were left unchanged.');}
    finally {oldKey.fill(0);oldPlaintext?.fill(0);}
    payload=createDrivePayload(JSON.parse(fs.readFileSync(path.join(originalFolder,'drive-manifest.json'),'utf8')));
  } else {
    const files=fs.readdirSync(originalFolder,{withFileTypes:true})
      .filter(entry=>entry.isFile()&&types[path.extname(entry.name).toLowerCase()])
      .sort((a,b)=>a.name.localeCompare(b.name,'en',{numeric:true}));
    if(!files.length) throw Error('There are no private images to encrypt.');
    payload={version:1,images:files.map(entry=>({title:path.basename(entry.name,path.extname(entry.name)),type:types[path.extname(entry.name).toLowerCase()],data:fs.readFileSync(path.join(originalFolder,entry.name)).toString('base64')}))};
  }
  const plaintext=Buffer.from(JSON.stringify(payload));
  const salt=crypto.randomBytes(16),iv=crypto.randomBytes(12);
  const key=crypto.pbkdf2Sync(password,salt,iterations,32,'sha256');
  password='';
  const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
  cipher.setAAD(context);
  const ciphertext=Buffer.concat([cipher.update(plaintext),cipher.final(),cipher.getAuthTag()]);
  key.fill(0);plaintext.fill(0);
  const envelope={version:1,kdf:'PBKDF2-SHA256',iterations,salt:salt.toString('base64'),cipher:'AES-256-GCM',iv:iv.toString('base64'),ciphertext:ciphertext.toString('base64')};
  fs.mkdirSync(outputFolder,{recursive:true});
  const destination=path.join(outputFolder,'album.encrypted.json');
  const pending=destination+'.tmp';
  fs.writeFileSync(pending,JSON.stringify(envelope));
  fs.renameSync(pending,destination);
  writeScriptBundle(outputFolder,envelope);
  console.log(driveMode?`Encrypted ${payload.images.length} Drive references and titles. Original image bytes are not packaged. No password was saved.`:`Encrypted ${payload.images.length} private images and their titles. Original files are unchanged. No password was saved.`);
}
main().then(()=>process.exit(0)).catch(error=>{console.error(error.message);process.exit(1);});
