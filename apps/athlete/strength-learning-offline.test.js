import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
function boot({store=new Map(),native=null}={}) {
 let reject=false;
 const ctx=vm.createContext({crypto:webcrypto,console,setTimeout:()=>1,clearTimeout(){},addEventListener(){},Capacitor:native,
 localStorage:{getItem:k=>store.get(k)||null,setItem(k,v){if(reject)throw Error('QuotaExceededError');store.set(k,v);}}});
 for(const n of ['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-load','strength-context','strength-learning','strength-replay','strength-brain-core','strength-notes','strength-percent','strength-weights','strength-brain','strength-memory'])vm.runInContext(readFileSync(new URL('./'+n+'.js',import.meta.url),'utf8'),ctx);
 return {M:ctx.StrengthMemory,ctx,store,quota:v=>reject=v};
}
function workout(){return {id:webcrypto.randomUUID(),phase:'summary',startedAt:1,completedAt:'2026-10-16T00:00:00Z',pages:[{id:'A',kind:'lift',title:'Squat',exerciseId:'squat',equipmentId:'machine',loadConvention:'total',loadUnit:'kg',logMode:'kg',columns:['reps','weight_kg'],minimumKg:0,equipmentStepKg:1,setCount:1,targetReps:6}],logs:{A:{sets:[{kg:40,reps:6,effort:'average',logged:true,miss:false,purpose:'working',context:{normalizedLoad:{version:3,rawValue:40,rawUnit:'kg',convention:'single',externalKg:40,barKg:null,provenance:'explicit',eligible:true}}}]}}};}
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
for(const phase of ['userId','pull','push'])test('account switch during '+phase+' cannot contaminate the next owner',async()=>{
 const {M}=boot();await M.bind('a');M.capture(workout());const wait=deferred(),entered=deferred();
 const io={userId:async()=> 'a',pull:async()=>[],push:async()=>({ok:true})};const original=io[phase];
 io[phase]=async(...args)=>{entered.resolve();await wait.promise;return original(...args);};
 const syncing=M.sync(io);await entered.promise;await M.bind('b');wait.resolve();const result=await syncing;
 assert.equal(result.reason,'account_changed');assert.equal(M.ownerId(),'b');assert.equal(Object.keys(M.records()).length,0);
 await M.bind('a');assert.ok(M.getStatus().pending>0);
});
test('quota rejection rolls back in-memory evidence and keeps the last durable snapshot',async()=>{
 const b=boot(),s=workout();await b.M.bind('a');b.M.capture(s);const before=JSON.stringify(b.M.records());
 s.logs.A.sets[0].reps=5;b.quota(true);assert.throws(()=>b.M.capture(s),/Quota/);
 assert.equal(JSON.stringify(b.M.records()),before);assert.equal(JSON.stringify(boot({store:b.store}).M.records()),before);
});
test('delayed acknowledgement preserves a newer local edit and remote revision is separate',async()=>{
 const {M}=boot(),s=workout();await M.bind('a');M.capture(s);const id=s.logs.A.sets[0].id;
 await M.sync({userId:async()=> 'a',pull:async()=>[],push:async()=>{s.logs.A.sets[0].reps=5;M.capture(s);return {ok:true};}});
 assert.equal(M.records()[id].payload.row.reps,5);assert.ok(M.getStatus().pending>0);
});
test('different cloud facts are retained and quarantine personalization until reconciled',async()=>{
 const {M,store}=boot(),s=workout();await M.bind('a');M.capture(s);const local=Object.values(M.records()).find(r=>r.kind==='set');
 const remote={record_id:local.id,session_id:local.sessionId,exercise_key:local.exerciseKey,kind:'set',revision:2,deleted:false,payload:structuredClone(local.payload)};remote.payload.row.reps=5;
 const result=await M.sync({userId:async()=> 'a',pull:async()=>[remote],push:async()=>{throw Error('must not upload conflict');}});
 assert.equal(result.reason,'conflict');assert.equal(M.replay(local.exerciseKey).conflicted,true);
 const restored=boot({store}).M;assert.equal(restored.replay(local.exerciseKey).conflicted,true);
 assert.equal(restored.records()[local.id].payload.row.reps,6);assert.ok(restored.getStatus().pending>0);
});
test('an unknown cache version preserves raw facts and cannot break boot',()=>{
 const raw={version:999,ownerId:'a',records:{keep:{id:'keep',kind:'set',payload:{row:{kg:18}}}},pending:{keep:1},revisions:{},learning:{version:'future',k:999}};
 const b=boot({store:new Map([['strength-memory-v1',JSON.stringify(raw)]])});
 assert.equal(b.M.records().keep.payload.row.kg,18);assert.equal(b.M.replay('anything').k,b.ctx.StrengthLearning.initial().k);
});
test('malformed local JSON is retained for recovery rather than silently overwritten',async()=>{
 const raw='{truncated',store=new Map([['strength-memory-v1',raw]]),b=boot({store});await b.M.bind('a');
 assert.ok([...store.entries()].some(([k,v])=>k!=='strength-memory-v1'&&v===raw));
});
test('native backup restores durable facts before first local write',async()=>{
 const a=boot();await a.M.bind('a');a.M.capture(workout());
 const saved=a.store.get('strength-memory-v1'),store=new Map();
 const b=boot({store,native:{isNativePlatform:()=>true,Plugins:{Filesystem:{readFile:async()=>({data:saved}),writeFile:async()=>{}}}}});
 await b.M.restore();assert.equal(Object.values(b.M.records()).filter(r=>r.kind==='set').length,1);
 assert.equal(b.M.ownerId(),'a');
});

test('a late native restore cannot overwrite facts captured while the backup was loading',async()=>{
 const d=deferred(),b=boot({native:{isNativePlatform:()=>true,Plugins:{Filesystem:{readFile:()=>d.promise,writeFile:async()=>{}}}}});
 await b.M.bind('b');const s=workout();b.M.capture(s);
 d.resolve({data:JSON.stringify({version:1,ownerId:'a',records:{},pending:{},revisions:{}})});await b.M.restore();
 assert.equal(b.M.ownerId(),'b');assert.equal(Object.values(b.M.records()).filter(r=>r.kind==='set').length,1);
});
test('remote revisions do not regress local revisions after multiple offline edits',async()=>{
 const {M}=boot(),s=workout();await M.bind('a');M.capture(s);const id=s.logs.A.sets[0].id;
 for(const reps of [5,4,3]){s.logs.A.sets[0].reps=reps;M.capture(s);}
 await M.sync({userId:async()=> 'a',pull:async()=>[],push:async()=>({ok:true})});
 const local=M.records()[id],remote={record_id:id,session_id:local.sessionId,exercise_key:local.exerciseKey,kind:'set',revision:1,deleted:false,payload:structuredClone(local.payload)};
 await M.sync({userId:async()=> 'a',pull:async()=>[remote],push:async()=>({ok:true})});
 assert.equal(M.records()[id].localRevision,4);
 remote.revision=2;remote.payload.row.reps=2;
 await M.sync({userId:async()=> 'a',pull:async()=>[remote],push:async()=>({ok:true})});
 assert.equal(M.records()[id].localRevision,5);
});
test('logout then login restores the archived owner rather than adopting an empty device ledger',async()=>{
 const {M}=boot();await M.bind('a');M.capture(workout());const before=JSON.stringify(M.records());
 await M.bind(null);assert.equal(Object.keys(M.records()).length,0);
 await M.bind('a');assert.equal(JSON.stringify(M.records()),before);
});
