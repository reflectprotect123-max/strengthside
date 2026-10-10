import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {webcrypto} from 'node:crypto';
function create(store=new Map()) {
 const c=vm.createContext({crypto:webcrypto,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},setTimeout:()=>1,clearTimeout:()=>{},console,addEventListener:()=>{}});
 for(const f of ['training-core.js','strength-brain.js','strength-memory.js'])vm.runInContext(readFileSync(new URL('./'+f,import.meta.url),'utf8'),c);
 return {M:c.StrengthMemory,store};
}
function session(){return {id:webcrypto.randomUUID(),startedAt:10,date:'2026-10-10',pages:[{id:'A',title:'Squat',kind:'lift',logMode:'kg',setCount:1,targetReps:6,targetRepMax:8,columns:['reps','weight_kg']}],logs:{A:{sets:[{kg:40,reps:8,effort:'hard',logged:true,purpose:'working'}]}}};}
test('offline records survive restart; duplicate capture does not enqueue duplicate evidence',()=>{
 const {M,store}=create(),s=session();M.capture(s);const id=s.logs.A.sets[0].id;
 M.capture(s);assert.equal(M.records()[id].localRevision,1);assert.equal(M.getStatus().pending,2);
 const restored=create(store).M;assert.equal(restored.records()[id].payload.row.kg,40);
});
test('failed sync retains outbox; successful retry acknowledges each record once',async()=>{
 const {M}=create(),s=session();M.capture(s);
 await M.sync({userId:async()=> 'athlete',pull:async()=>[],push:async()=>{throw Error('offline')}});
 assert.equal(M.getStatus().pending,2);
 let writes=0;const io={userId:async()=> 'athlete',pull:async()=>[],push:async rows=>{writes+=rows.length;return {ok:true}}};
 assert.equal((await M.sync(io)).ok,true);assert.equal(M.getStatus().pending,0);
 await M.sync(io);assert.equal(writes,2);
});
test('editing and deleting replace evidence and invalidate session estimate',()=>{
 const {M}=create(),s=session();M.capture(s);const id=s.logs.A.sets[0].id;
 s.logs.A.sets[0].reps=6;M.capture(s);assert.equal(M.records()[id].payload.row.reps,6);
 s.logs.A.sets=[];M.capture(s);assert.equal(M.records()[id].deleted,true);
 assert.equal(Object.values(M.records()).find(r=>r.kind==='session_estimate').deleted,true);
});
test('concurrent cloud edit cannot silently overwrite pending local results',async()=>{
 const {M}=create(),s=session();M.capture(s);const id=s.logs.A.sets[0].id;let wrote=false;
 const result=await M.sync({userId:async()=> 'athlete',pull:async()=>[{record_id:id,revision:2}],push:async()=>{wrote=true;return {ok:true}}});
 assert.equal(result.reason,'conflict');assert.equal(wrote,false);assert.equal(M.getStatus().pending,2);
});
test('switching accounts archives each account and prevents cross-account uploads',async()=>{
 const {M}=create(),s=session();await M.bind('a');M.capture(s);await M.bind('b');assert.equal(M.getStatus().pending,0);await M.bind('a');assert.equal(M.getStatus().pending,2);
});

test('a lost response is acknowledged from identical cloud evidence without duplicate write',async()=>{
 const {M}=create(),s=session();M.capture(s);const local=Object.values(M.records());let writes=0;
 const remote=local.map(r=>({record_id:r.id,session_id:r.sessionId,exercise_key:r.exerciseKey,kind:r.kind,deleted:r.deleted,payload:r.payload,revision:1}));
 const result=await M.sync({userId:async()=> 'athlete',pull:async()=>remote,push:async()=>{writes++;return {ok:true}}});
 assert.equal(result.ok,true);assert.equal(writes,0);assert.equal(M.getStatus().pending,0);
});

test('explicit session removal tombstones its sets and estimates without touching other sessions',()=>{
 const {M}=create(),a=session(),b=session();b.id=webcrypto.randomUUID();
 M.capture(a);M.capture(b);M.removeSession(a.id);
 assert.ok(Object.values(M.records()).filter(r=>r.sessionId===a.id).every(r=>r.deleted));
 assert.ok(Object.values(M.records()).filter(r=>r.sessionId===b.id).every(r=>!r.deleted));
});
