// Refresh the static media lists without changing the original assets or personal writing.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const contentPath = path.join(root, 'content.js');
const assetsPath = path.join(root, 'assets');
const original = fs.readFileSync(contentPath, 'utf8');
const context = {window: {}};
vm.runInNewContext(original, context, {timeout: 1000, contextCodeGeneration: {strings: false, wasm: false}});
const content = context.window.BIRTHDAY;
if (!content || typeof content !== 'object') throw new Error('content.js must define window.BIRTHDAY.');
const mediaTypes = new Map([
  ['.jpg','image'],['.jpeg','image'],['.png','image'],['.webp','image'],['.gif','image'],['.avif','image'],
  ['.mp4','video'],['.webm','video'],['.m4v','video'],['.mov','video'],['.ogv','video']
]);
const musicExtensions = new Set(['.mp3','.m4a','.aac','.wav','.ogg','.oga','.flac','.webm','.opus']);
const canonical = value => {
  let result = String(value || '').replace(/\\/g, '/');
  try { result = decodeURIComponent(result); } catch (_) { /* Literal percent signs are valid in filenames. */ }
  return process.platform === 'win32' ? result.toLowerCase() : result;
};
const relative = absolute => path.relative(root, absolute).split(path.sep).join('/');
const compareNames = (a,b) => a.localeCompare(b, 'en', {numeric:true,sensitivity:'base'}) || a.localeCompare(b,'en');
function serialAndTitle(file) {
  const stem = path.basename(file, path.extname(file));
  const match = /^\s*(\d+)\s*[.)_-]\s*(.+)$/.exec(stem);
  return {serial: match ? Number(match[1]) : null, title: match ? match[2] : stem};
}
function findDirectories(directory, predicate, result=[]) {
  if (!fs.existsSync(directory)) return result;
  for (const entry of fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>compareNames(a.name,b.name))) {
    if (!entry.isDirectory()) continue;
    const full = path.join(directory,entry.name);
    if (predicate(entry.name.toLowerCase())) result.push(full);
    else findDirectories(full,predicate,result);
  }
  return result;
}
function filesIn(directories, allowed) {
  const seen = new Set();
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>compareNames(a.name,b.name))) {
      const full = path.join(directory,entry.name);
      if (entry.isDirectory()) { visit(full); continue; }
      if (!entry.isFile() || !allowed.has(path.extname(entry.name).toLowerCase())) continue;
      const key = canonical(fs.realpathSync(full));
      if (seen.has(key)) continue;
      seen.add(key);files.push(full);
    }
  }
  directories.forEach(visit);
  return files.sort((a,b)=>{
    const left=serialAndTitle(a),right=serialAndTitle(b);
    return (left.serial ?? Number.MAX_SAFE_INTEGER)-(right.serial ?? Number.MAX_SAFE_INTEGER) || compareNames(path.basename(a),path.basename(b));
  });
}
const albumDirectories = findDirectories(assetsPath,name=>['photos and videos','photos','videos'].includes(name));
const musicDirectories = findDirectories(assetsPath,name=>['music','musics'].includes(name));
const albumFiles = filesIn(albumDirectories,new Set(mediaTypes.keys()));
// Keep duplicate downloads on disk, but play each byte-identical recording once.
const musicCandidates = filesIn(musicDirectories,musicExtensions);
const sizes = new Map();
musicCandidates.forEach(file => { const size=fs.statSync(file).size; sizes.set(size,(sizes.get(size)||0)+1); });
const recordings = new Set(), duplicateMusic=[];
const musicFiles = musicCandidates.sort((a,b)=>{
  const copyRank=file=>/\s\(\d+\)$/.test(path.basename(file,path.extname(file)))?1:0;
  return copyRank(a)-copyRank(b) || compareNames(path.basename(a),path.basename(b));
}).filter(file=>{
  const size=fs.statSync(file).size;
  if(sizes.get(size)===1)return true;
  const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(recordings.has(hash)){duplicateMusic.push(file);return false;}
  recordings.add(hash);return true;
}).sort((a,b)=>{
  const left=serialAndTitle(a),right=serialAndTitle(b);
  return (left.serial??Number.MAX_SAFE_INTEGER)-(right.serial??Number.MAX_SAFE_INTEGER) || compareNames(path.basename(a),path.basename(b));
});
const oldAlbum = new Map((Array.isArray(content.album)?content.album:[]).map(item=>[canonical(item.src),item]));
const oldSongs = new Map((Array.isArray(content.songs)?content.songs:[]).filter(item=>item.src).map(item=>[canonical(item.src),item]));
const album = albumFiles.map((file,index)=>{
  const src=relative(file),previous=oldAlbum.get(canonical(src))||{};
  const {serial,title}=serialAndTitle(file);
  return {...previous,order:serial??index+1,type:mediaTypes.get(path.extname(file).toLowerCase()),src,alt:previous.alt||title,caption:title,note:typeof previous.note==='string'?previous.note:''};
});

// Nakhre is intentionally a top-level-only scan: the Pvt album stays separate.
const nakhreDirectory = path.join(assetsPath, 'Nakhre');
const nakhreImages = fs.existsSync(nakhreDirectory) ? fs.readdirSync(nakhreDirectory, {withFileTypes:true})
  .filter(entry => entry.isFile() && mediaTypes.get(path.extname(entry.name).toLowerCase()) === 'image')
  .map(entry => ({src:relative(path.join(nakhreDirectory,entry.name)), caption:path.basename(entry.name,path.extname(entry.name)), alt:path.basename(entry.name,path.extname(entry.name))})) : [];
const together = nakhreImages.filter(image => /bind\s*(?:in\s*one|together)/i.test(image.caption)).sort((a,b)=>compareNames(a.caption,b.caption));
const ending = nakhreImages.filter(image => /\blast[.\s_-]*[12]\b/i.test(image.caption)).sort((a,b)=>Number(a.caption.match(/\blast[.\s_-]*([12])\b/i)[1])-Number(b.caption.match(/\blast[.\s_-]*([12])\b/i)[1]));
const reserved = new Set([...together,...ending].map(image=>image.src));
const imagePage = image => ({id:crypto.createHash('sha256').update(image.src).digest('hex').slice(0,16),kind:/Tumhe Prime Minister Banne ke liye mai vote dunga/i.test(image.caption)?'vote':'memory',title:image.caption,images:[image]});
const shuffled = nakhreImages.filter(image=>!reserved.has(image.src)).map(imagePage);
if(together.length) shuffled.push({id:'bound-together',kind:'together',title:'Tahreem being Tahreem',images:together});
// A chosen shuffle stays stable across refreshes and repeat synchronisations.
const shuffleKey = page => crypto.createHash('sha256').update('tahreem-nakhre-2026:'+page.id).digest('hex');
shuffled.sort((a,b)=>shuffleKey(a).localeCompare(shuffleKey(b)));
// Keep the humour screenshots in their intended first-part / second-part order.
const humourFirst = shuffled.find(page=>/^our\s+humou?r\b/i.test(page.title));
const humourSequel = shuffled.find(page=>/^humou?r\s+glimpse\s+2[.,]0\b/i.test(page.title));
if(humourFirst && humourSequel) {
  shuffled.splice(shuffled.indexOf(humourSequel),1);
  shuffled.splice(shuffled.indexOf(humourFirst)+1,0,humourSequel);
}
const nakhrePages = [...shuffled,...ending.map(imagePage)];

function synchsafe(buffer, offset) {
  return (buffer[offset]&127)*2097152+(buffer[offset+1]&127)*16384+(buffer[offset+2]&127)*128+(buffer[offset+3]&127);
}
function decodeText(bytes) {
  if(!bytes.length)return '';
  const encoding=bytes[0];let data=bytes.subarray(1),value='';
  if(encoding===0)value=data.toString('latin1');
  else if(encoding===3)value=data.toString('utf8');
  else {
    let bigEndian=encoding===2;
    if(data.length>=2&&data[0]===0xff&&data[1]===0xfe)data=data.subarray(2);
    else if(data.length>=2&&data[0]===0xfe&&data[1]===0xff){bigEndian=true;data=data.subarray(2);}
    data=Buffer.from(data.subarray(0,data.length-data.length%2));
    if(bigEndian)data.swap16();value=data.toString('utf16le');
  }
  return value.replace(/^\uFEFF/,'').split('\0').map(part=>part.trim()).filter(Boolean).join(', ').trim();
}
function decodePicture(bytes) {
  if(bytes.length<6)return null;
  const encoding=bytes[0],mimeEnd=bytes.indexOf(0,1);
  if(mimeEnd<0||mimeEnd+2>=bytes.length)return null;
  const pictureType=bytes[mimeEnd+1];
  let start=mimeEnd+2;
  if(encoding===0||encoding===3) {
    const end=bytes.indexOf(0,start);if(end<0)return null;start=end+1;
  } else {
    let end=-1;
    for(let i=start;i+1<bytes.length;i+=2)if(bytes[i]===0&&bytes[i+1]===0){end=i;break;}
    if(end<0)return null;start=end+2;
  }
  const data=bytes.subarray(start);
  let extension='';
  if(data.length>3&&data[0]===255&&data[1]===216&&data[2]===255)extension='jpg';
  else if(data.length>8&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))extension='png';
  else if(data.length>12&&data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP')extension='webp';
  return extension?{data,extension,pictureType}:null;
}
function readID3(file) {
  const result={};
  if(path.extname(file).toLowerCase()!=='.mp3')return result;
  const descriptor=fs.openSync(file,'r');
  try {
    const stat=fs.fstatSync(descriptor),header=Buffer.alloc(10);
    fs.readSync(descriptor,header,0,10,0);
    if(header.toString('ascii',0,3)==='ID3'&&[3,4].includes(header[3])) {
      const version=header[3],size=Math.min(synchsafe(header,6),5*1024*1024,Math.max(0,stat.size-10));
      const tag=Buffer.alloc(size);fs.readSync(descriptor,tag,0,size,10);
      let offset=0;
      if(header[5]&0x40&&size>=4)offset=version===4?synchsafe(tag,0):tag.readUInt32BE(0)+4;
      while(offset+10<=tag.length) {
        const id=tag.toString('ascii',offset,offset+4);
        if(!/^[A-Z0-9]{4}$/.test(id))break;
        const length=version===4?synchsafe(tag,offset+4):tag.readUInt32BE(offset+4);
        if(length<=0||offset+10+length>tag.length)break;
        if((id==='TIT2'||id==='TPE1'||id==='APIC')&&!(tag[offset+9]&(version===4?0x0d:0xc0))) {
          let bytes=tag.subarray(offset+10,offset+10+length);
          if((header[5]&0x80)||(version===4&&(tag[offset+9]&0x02)))bytes=Buffer.from([...bytes].filter((byte,index,array)=>!(byte===0&&index>0&&array[index-1]===255)));
          if(id==='APIC') {
            const picture=decodePicture(bytes);
            if(picture&&(!result.picture||picture.pictureType===3))result.picture=picture;
          } else {
            const value=decodeText(bytes);if(value)result[id==='TIT2'?'title':'artist']=value;
          }
        }
        offset+=10+length;
      }
    }
    if((!result.title||!result.artist)&&stat.size>=128) {
      const tail=Buffer.alloc(128);fs.readSync(descriptor,tail,0,128,stat.size-128);
      if(tail.toString('ascii',0,3)==='TAG') {
        const trim=bytes=>bytes.toString('latin1').replace(/\0/g,'').trim();
        result.title ||= trim(tail.subarray(3,33));result.artist ||= trim(tail.subarray(33,63));
      }
    }
  } finally {fs.closeSync(descriptor);}
  return result;
}
function cleanSongTitle(value) {
  return String(value||'').replace(/\s*[([]\s*(?:official|lyric(?:al|s)?|music video)[^\])]*[)\]]/ig,'')
    .replace(/\s+Official(?:\s+Lyrical)?\s+(?:Music\s+)?Video\b.*$/i,'').replace(/\s+/g,' ').trim();
}
function filenameSong(file) {
  const {title}=serialAndTitle(file);
  // These supplied names put the song before film/cast or performance details.
  // Use only names actually present in the filename; unknown artists stay blank.
  const namedFiles=[
    [/^Chanakya\s*-\s*(Rishab Rikhiram Sharma)\b/i,'Chanakya',1],
    [/^Coke Studio Season \d+\s+(Tajdar-e-Haram)\s+(Atif Aslam)\b/i,1,2],
    [/^(Luka Chuppi)\s*-\s*Lyrical Song\b/i,1,''],
    [/^(Uyi Amma)\s*-\s*Azaad\b/i,1,''],
    [/^(Piya Ghar Aavenge)\s+Lyrical Video\s+(Kailash Kher)\b/i,1,2],
    [/^(Sahiba)\s+\(Official Music Video\)\s+(Aditya Rikhari)\b/i,1,2],
    [/^(Shaky)\s+\(Official Video\)\s+(Sanju Rathod)\b/i,1,2],
    [/^(Ye Tune Kya Kiya)\s+Song\b/i,1,''],
    [/^(Aye Meri Zohrajabeen)\s+Phir Hera Pheri\b/i,1,''],
    [/^(Blue Eyes)\s+Full Video Song\s+(Yo Yo Honey Singh)\b/i,1,2],
    [/^(Bom Diggy Diggy)\s+\(VIDEO\)\s+Zack Knight Jasmin Walia\b/i,1,'Zack Knight, Jasmin Walia'],
    [/^(Chaar Botal Vodka)\s+Full Song Feat\.\s+(Yo Yo Honey Singh)\b/i,1,2],
    [/^(Chalre Chalre Waal \(Extended\) Female Version)\b/i,1,''],
    [/^(Chinta Ta Ta Chita Chita)\s+Full Video\b/i,1,''],
    [/^El Kraken Baila (La Macarena)\s+Hotel Transilvania\b/i,1,''],
    [/^(Kajra Re)\s+Full Song\b/i,1,''],
    [/^(Kudi Nu Nachne De)\s+Angrezi Medium\b/i,1,''],
    [/^(Nachange Saari Raat)\s+Full Video Song\b/i,1,''],
    [/^(One Two Three Four)\s+Chennai Express\b/i,1,''],
    [/^(Patakha Guddi)\s+Highway\b/i,1,''],
    [/^Ra One (Chammak Challo)\s+8K Video Song\b/i,1,''],
    [/^(Senorita)\s+Zindagi Na Milegi Dobara\b/i,1,''],
    [/^(PSY)\s*-\s*(GANGNAM STYLE\(강남스타일\))\s+M V$/i,2,1],
    [/^(Natasha Bedingfield)\s*-\s*(Unwritten)\s+\(Official Video\)/i,2,1]
  ];
  for(const [pattern,name,performer] of namedFiles) {
    const match=pattern.exec(title);
    if(match)return {title:typeof name==='number'?match[name]:name,artist:typeof performer==='number'?match[performer]:performer};
  }
  const artistTitle=/^(.+?)\s[-–—]\s(.+)$/.exec(title);
  if(artistTitle)return {artist:artistTitle[1].trim(),title:cleanSongTitle(artistTitle[2])};
  // This supplied filename contains the film and cast after its song title.
  if(/^Maula Mere Maula Anwar \(2007\)/i.test(title))return {title:'Maula Mere Maula',artist:''};
  return {title:cleanSongTitle(title),artist:''};
}
function coverFor(file,picture) {
  if(!picture)return '';
  const stem=path.basename(file,path.extname(file)).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'song';
  const hash=crypto.createHash('sha256').update(picture.data).digest('hex').slice(0,12);
  const folder=path.join(assetsPath,'music-covers');
  const destination=path.join(folder,`${stem}-${hash}.${picture.extension}`);
  fs.mkdirSync(folder,{recursive:true});
  if(!fs.existsSync(destination))fs.writeFileSync(destination,picture.data);
  return relative(destination);
}
const songs = musicFiles.map(file=>{
  const src=relative(file),previous=oldSongs.get(canonical(src))||{},tag=readID3(file),fallback=filenameSong(file);
  const {youtubeId,kind,...preserved}=previous;
  return {...preserved,title:previous.title||cleanSongTitle(tag.title)||fallback.title,artist:previous.artist||tag.artist||fallback.artist||'',src,
    cover:previous.cover||coverFor(file,tag.picture),description:typeof previous.description==='string'?previous.description:''};
});
function replaceArray(source,key,value) {
  const found=new RegExp(`^([ \\t]*)${key}:\\s*\\[`,'m').exec(source);
  if(!found)throw Error(`Cannot locate ${key} array in content.js`);
  const start=found.index+found[0].length-1;
  let depth=0,quote=null,escaped=false,lineComment=false,blockComment=false,end=-1;
  for(let i=start;i<source.length;i++) {
    const char=source[i],next=source[i+1];
    if(lineComment){if(char==='\n')lineComment=false;continue;}
    if(blockComment){if(char==='*'&&next==='/'){blockComment=false;i++;}continue;}
    if(quote){if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char===quote)quote=null;continue;}
    if(char==='/'&&next==='/'){lineComment=true;i++;continue;}
    if(char==='/'&&next==='*'){blockComment=true;i++;continue;}
    if(char==='"'||char==="'"||char==='`'){quote=char;continue;}
    if(char==='[')depth++;
    if(char===']'&&--depth===0){end=i+1;break;}
  }
  if(end<0)throw Error(`Cannot find the end of ${key} array`);
  const indent=found[1];
  const rendered=JSON.stringify(value,null,2).split('\n').map((line,index)=>index?indent+line:line).join('\n');
  return source.slice(0,start)+rendered+source.slice(end);
}
let updated=replaceArray(original,'songs',songs);
updated=replaceArray(updated,'album',album);
if(!/^\s*nakhrePages:\s*\[/m.test(updated)) updated=updated.replace(/^(\s*)nakhre:\s*\[/m,'$1nakhrePages: [],\n$1nakhre: [');
updated=replaceArray(updated,'nakhrePages',nakhrePages);
updated=updated.replace('// Add more YouTube video IDs or audio files here to grow the radio playlist.','// Local audio files are synchronised from the Music folders by npm run update-assets.');
if(original.includes('\r\n'))updated=updated.replace(/\r?\n/g,'\r\n');
if(updated!==original)fs.writeFileSync(contentPath,updated,'utf8');
console.log(`Synced ${album.filter(item=>item.type==='image').length} photos, ${album.filter(item=>item.type==='video').length} videos, and ${songs.length} local songs${updated===original?' (already current)':''}.`);
console.log(`Song covers: ${songs.filter(song=>song.cover).length} available; songs without embedded artwork use the radio's decorative record.`);
if(duplicateMusic.length)console.log(`Skipped ${duplicateMusic.length} byte-identical music duplicate${duplicateMusic.length===1?'':'s'} in the playlist; all original files preserved.`);
console.log(`Nakhre: ${nakhreImages.length} screenshots on ${nakhrePages.length} pages; private subfolders excluded.`);
for(const song of songs)console.log(`Song: ${song.title}${song.artist?' — '+song.artist:''}`);
