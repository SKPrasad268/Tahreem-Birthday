// Static preview plus the shared local ballot. GitHub Pages needs this API hosted separately.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {createVotingApi} = require('./voting-api.cjs');
const ballot = createVotingApi();
const root = __dirname;
const port = Number(process.env.PORT) || 4173;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.m4a':'audio/mp4','.mp4':'video/mp4','.ico':'image/x-icon'};
http.createServer((req,res)=>{
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }
  if(pathname==='/api/nakhre-pm' || pathname==='/api/nakhre-pm/') {void ballot.handle(req,res);return;}
  if(process.env.VOTING_ONLY==='1') {res.writeHead(404).end('Not found');return;}
  if(!['GET','HEAD'].includes(req.method)) {res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
  if(/^\/(?:server-data|scripts)(?:\/|$)/i.test(pathname) || /(?:^|\/)\.[^/]+/.test(pathname) || /\.(?:cjs|sqlite(?:-wal|-shm)?|env)$/i.test(pathname)) {res.writeHead(404).end('Not found');return;}
  const file = path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
  if (!file.startsWith(root+path.sep)) {res.writeHead(403).end('Forbidden');return;}
  const privateOriginals=path.join(root,'assets','Nakhre','Pvt album').toLowerCase();
  if(file.toLowerCase()===privateOriginals || file.toLowerCase().startsWith(privateOriginals+path.sep)) {res.writeHead(404).end('Not found');return;}
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404).end('Not found');return;}
    const headers={'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    let start=0,end=stat.size-1,status=200;
    if(req.headers.range){
      const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!range||(!range[1]&&!range[2])){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
      if(!range[1])start=Math.max(0,stat.size-Number(range[2]));
      else{start=Number(range[1]);if(range[2])end=Math.min(end,Number(range[2]));}
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=stat.size||end<start){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length']=stat.size===0?0:end-start+1;
    res.writeHead(status,headers);
    if(req.method==='HEAD'||stat.size===0){res.end();return;}
    const stream=fs.createReadStream(file,{start,end});
    stream.on('error',()=>res.destroy());
    stream.pipe(res);
  });
}).listen(port,process.env.HOST || '127.0.0.1',()=>console.log(`Birthday garden preview: http://127.0.0.1:${port}`));
