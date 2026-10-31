const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');
const {createVotingApi}=require('../voting-api.cjs');
async function serve(databasePath) {
  const api=createVotingApi({databasePath});
  const server=http.createServer((req,res)=>void api.handle(req,res));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const endpoint=`http://127.0.0.1:${server.address().port}/api/nakhre-pm`;
  return {endpoint,close:async()=>{await new Promise(resolve=>server.close(resolve));api.close();}};
}
async function ballot(endpoint,id,name,choice='yes') {
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Voter-Id':id},body:JSON.stringify({name,choice})});
  return {status:response.status,body:await response.json()};
}
test('Ballots persist, share counts, and reject repeat names and browsers atomically',async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'nakhre-vote-test-'));
  const databasePath=path.join(directory,'votes.sqlite');
  let host=await serve(databasePath);
  try {
    const voter=randomUUID();
    const first=await ballot(host.endpoint,voter,'  Sample   Voter  ');
    assert.equal(first.status,201);assert.equal(first.body.total,1);assert.equal(first.body.yourVote.name,'Sample Voter');
    assert.equal((await ballot(host.endpoint,voter,'Another Name','no')).status,409);
    assert.equal((await ballot(host.endpoint,randomUUID(),'sample voter','no')).status,409);
    const simultaneous=await Promise.all([ballot(host.endpoint,randomUUID(),'Same Name'),ballot(host.endpoint,randomUUID(),'SAME NAME','no')]);
    assert.deepEqual(simultaneous.map(item=>item.status).sort(),[201,409]);
    assert.equal((await ballot(host.endpoint,randomUUID(),'Bad Choice','other')).status,400);
    assert.equal((await ballot(host.endpoint,'invalid','Bad Id')).status,400);
    const second=await ballot(host.endpoint,randomUUID(),'दूसरा वोटर','no');
    assert.equal(second.status,201);
    await host.close();host=await serve(databasePath);
    const result=await (await fetch(host.endpoint,{headers:{'X-Voter-Id':voter}})).json();
    assert.equal(result.total,3);assert.equal(result.counts.yes+result.counts.no,3);
    assert.equal(result.yourVote.name,'Sample Voter');assert.equal(result.votes.length,3);
    assert(result.votes.every(vote=>Object.keys(vote).sort().join(',')==='choice,name'));
    assert.equal((await ballot(host.endpoint,voter,'Sample Voter')).status,409);
    const forbidden=await fetch(host.endpoint,{headers:{Origin:'https://unrelated.example'}});
    assert.equal(forbidden.status,403);
    const malformed=await fetch(host.endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Voter-Id':randomUUID()},body:'null'});
    assert.equal(malformed.status,400);
  } finally {
    await host.close();
    assert(path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep));
    assert(path.basename(directory).startsWith('nakhre-vote-test-'));
    fs.rmSync(directory,{recursive:true,force:true});
  }
});
test('Nakhre includes every public screenshot once, groups the trilogy, and ends Last 1 then Last 2',()=>{
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','content.js'),'utf8'),context);
  const pages=context.window.BIRTHDAY.nakhrePages;
  const images=pages.flatMap(page=>page.images);
  const originals=fs.readdirSync(path.join(__dirname,'..','assets','Nakhre'),{withFileTypes:true}).filter(entry=>entry.isFile()&&/\.(jpe?g|png|webp)$/i.test(entry.name));
  assert.equal(images.length,originals.length);assert.equal(new Set(images.map(image=>image.src)).size,images.length);
  assert(images.every(image=>!image.src.includes('Pvt album')));
  assert.equal(pages.find(page=>page.kind==='together').images.length,3);
  assert.match(pages.at(-2).title,/Last\.1/);assert.match(pages.at(-1).title,/Last 2/);
  assert.equal(pages.filter(page=>page.kind==='vote').length,1);
});
