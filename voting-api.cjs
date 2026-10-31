// Local shared ballot. No credentials, names, or votes are stored in static assets.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {DatabaseSync} = require('node:sqlite');

function createVotingApi({databasePath=process.env.VOTES_DB_PATH || path.join(__dirname,'server-data','nakhre-votes.sqlite')}={}) {
  if(databasePath!==':memory:') fs.mkdirSync(path.dirname(databasePath),{recursive:true});
  const db = new DatabaseSync(databasePath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS pm_votes (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL UNIQUE,
      voter_hash TEXT NOT NULL UNIQUE,
      choice TEXT NOT NULL CHECK(choice IN ('yes','no')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
  const insert=db.prepare('INSERT INTO pm_votes (name,name_key,voter_hash,choice) VALUES (?,?,?,?)');
  const all=db.prepare('SELECT name,choice FROM pm_votes ORDER BY id DESC');
  const own=db.prepare('SELECT name,choice FROM pm_votes WHERE voter_hash=?');
  const configuredOrigins=(process.env.VOTING_ALLOWED_ORIGINS || '').split(',').map(value=>value.trim()).filter(Boolean);
  const attempts=new Map();
  function identity(req) {
    const value=req.headers['x-voter-id'];
    return typeof value==='string' && /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(value)
      ? crypto.createHash('sha256').update(value.toLowerCase()).digest('hex') : null;
  }
  function results(hash) {
    const votes=all.all(), counts={yes:0,no:0};
    for(const vote of votes) counts[vote.choice]++;
    return {total:votes.length,counts,votes,yourVote:hash?own.get(hash)||null:null};
  }
  function json(res,status,body) {
    res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(JSON.stringify(body));
  }
  async function handle(req,res) {
    const origin=req.headers.origin;
    const localOrigin=origin && ['http://'+req.headers.host,'https://'+req.headers.host].includes(origin);
    if(origin && !localOrigin && !configuredOrigins.includes(origin)) {json(res,403,{error:'This website is not allowed to use the ballot.'});return;}
    if(origin) {res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
    res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Voter-Id');
    if(req.method==='OPTIONS') {res.writeHead(204);res.end();return;}
    const hash=identity(req);
    try {
      if(req.method==='GET') {json(res,200,results(hash));return;}
      if(req.method!=='POST') {res.setHeader('Allow','GET, POST, OPTIONS');json(res,405,{error:'Method not allowed.'});return;}
      if(!hash) {json(res,400,{error:'A valid browser voting ID is required.'});return;}
      if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {json(res,415,{error:'Please send a JSON ballot.'});return;}
      const now=Date.now(),ip=req.socket.remoteAddress;
      for(const [key,entry] of attempts) if(now-entry.since>60000) attempts.delete(key);
      const entry=attempts.get(ip)||{since:now,count:0};entry.count++;attempts.set(ip,entry);
      if(entry.count>40) {json(res,429,{error:'Too many attempts. Please wait a minute.'});return;}
      const chunks=[];let size=0;
      for await (const chunk of req) {
        size+=chunk.length;
        if(size>4096) {json(res,413,{error:'That ballot is too large.'});return;}
        chunks.push(chunk);
      }
      let ballot;
      try {ballot=JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch (_) {json(res,400,{error:'The ballot could not be read.'});return;}
      if(!ballot || typeof ballot.name!=='string' || !['yes','no'].includes(ballot.choice)) {json(res,400,{error:'Enter your name and choose one of the two options.'});return;}
      const name=ballot.name.normalize('NFC').trim().replace(/\s+/gu,' ');
      if([...name].length<2 || [...name].length>60 || /[\p{Cc}\p{Cf}]/u.test(name) || !/\p{L}/u.test(name)) {json(res,400,{error:'Please enter a name between 2 and 60 characters.'});return;}
      const nameKey=name.normalize('NFKC').toLowerCase();
      try {insert.run(name,nameKey,hash,ballot.choice);}
      catch(error) {
        if(error.code==='ERR_SQLITE_ERROR' && /UNIQUE constraint failed/.test(error.message)) {
          json(res,409,{error:'A vote is already recorded for this name or browser.',...results(hash)});return;
        }
        throw error;
      }
      json(res,201,results(hash));
    } catch(error) {
      // Keep request details and database contents out of responses and logs.
      console.error('Ballot request failed:',error.code || error.name);
      if(!res.headersSent) json(res,500,{error:'The ballot could not be saved. Please try again.'});
      else res.end();
    }
  }
  return {handle,close:()=>db.close()};
}
module.exports={createVotingApi};
