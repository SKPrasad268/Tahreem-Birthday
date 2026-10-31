// Create a fresh upload folder containing only public site files and encrypted private data.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {scriptForEnvelope}=require('./private-album-bundle.cjs');
const root=path.resolve(__dirname,'..');
const outputArgument=process.argv.indexOf('--out');
if(outputArgument<0 || !process.argv[outputArgument+1]) throw Error('Supply --out followed by a new absolute upload-folder path.');
const destination=path.resolve(process.argv[outputArgument+1]);
if(destination===root || destination.startsWith(root+path.sep)) throw Error('The upload folder must be outside the source project.');
if(fs.existsSync(destination)) throw Error('Choose a new upload-folder path; existing folders are not overwritten.');
const originals=path.join(root,'assets','Nakhre','Pvt album');
const privateHashes=new Set((fs.existsSync(originals)?fs.readdirSync(originals,{withFileTypes:true}):[]).filter(entry=>entry.isFile()).map(entry=>crypto.createHash('sha256').update(fs.readFileSync(path.join(originals,entry.name))).digest('hex')));
const encrypted=path.join(root,'assets','private-album','album.encrypted.json');
if(!fs.existsSync(encrypted)) throw Error('Encrypt the private album before preparing an upload.');
const envelope=JSON.parse(fs.readFileSync(encrypted,'utf8'));
if(envelope.version!==1 || !envelope.ciphertext) throw Error('The encrypted album is invalid.');
const localScript=path.join(root,'assets','private-album','album.encrypted.js');
if(!fs.existsSync(localScript)||fs.readFileSync(localScript,'utf8')!==scriptForEnvelope(envelope)) throw Error('The encrypted local-file bundle is missing or out of date. Rebuild both encrypted transports before publishing.');
const publicFiles=[];
const rootExtensions=new Set(['.html','.css','.js','.svg','.ico']);
for(const entry of fs.readdirSync(root,{withFileTypes:true})) {
  if(entry.isFile() && (rootExtensions.has(path.extname(entry.name).toLowerCase()) || entry.name==='.nojekyll')) publicFiles.push(entry.name);
}
function collect(relativeDirectory) {
  for(const entry of fs.readdirSync(path.join(root,relativeDirectory),{withFileTypes:true})) {
    const relative=path.join(relativeDirectory,entry.name);
    if(relative.replace(/\\/g,'/').toLowerCase()==='assets/nakhre/pvt album') continue;
    if(entry.isSymbolicLink()) throw Error('A symbolic link cannot be included in the public upload.');
    if(entry.isDirectory()) collect(relative);
    else if(entry.isFile() && !/\.(?:tmp|sqlite|env)$/i.test(entry.name)) publicFiles.push(relative);
  }
}
collect('assets');
// The local manifest stays private, and its identifiers must not leak into public source.
const manifestPath=path.join(originals,'drive-manifest.json');
const privateDriveIds=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')).images.map(image=>image.id):[];
// Stop rather than publish an accidental duplicate of a private original under another name.
for(const relative of publicFiles) {
  const bytes=fs.readFileSync(path.join(root,relative));
  const hash=crypto.createHash('sha256').update(bytes).digest('hex');
  if(privateHashes.has(hash)) throw Error('A private original also exists among the public assets. Resolve that duplicate before publishing.');
  if(privateDriveIds.some(id=>bytes.includes(Buffer.from(id))))throw Error('An unencrypted private Drive identifier exists in public files. Remove it before publishing.');
}
fs.mkdirSync(destination,{recursive:true});
for(const relative of publicFiles) {
  const output=path.join(destination,relative);
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.copyFileSync(path.join(root,relative),output);
}
console.log(`Prepared ${publicFiles.length} files in ${destination}`);
console.log('Upload only the CONTENTS of that folder. Private originals, the plaintext Drive manifest, and server data are excluded. Both encrypted transports match; no private Drive identifier was found in public files.');
