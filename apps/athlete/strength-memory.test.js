import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {webcrypto} from 'node:crypto';
function create(store=new Map()) {
 if(!store.has('strength-memory-v1'))store.set('strength-memory-v1',JSON.stringify({version:1,ownerId:'athlete',records:{},pending:{},revisions:{}}));
 const c=vm.createContext({crypto:webcrypto,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},setTimeout:()=>1,clearTimeout:()=>{},console,addEventListener:()=>{}});
 for(const f of ['training-core.js','strength-targets.js','strength-equipment.js','strength-rts.js','strength-policy.js','strength-load.js','strength-context.js','strength-learning.js','strength-replay.js','strength-brain-core.js','strength-brain.js','strength-memory.js','session.js'])vm.runInContext(readFileSync(new URL('./'+f,import.meta.url),'utf8'),c);
 return {M:c.StrengthMemory,store,ctx:c};
}
function session(){return {id:webcrypto.randomUUID(),phase:'summary',completedAt:'2026-10-16T00:00:00Z',startedAt:10,date:'2026-10-10',pages:[{id:'A',exerciseId:'squat',equipmentId:'machine',loadUnit:'kg',loadConvention:'total',minimumKg:0,equipmentStepKg:1,title:'Squat',kind:'lift',logMode:'kg',setCount:1,targetReps:6,targetRepMax:8,columns:['reps','weight_kg']}],logs:{A:{sets:[{kg:40,reps:8,effort:'hard',logged:true,miss:false,purpose:'working',context:{inputVersion:3,normalizedLoad:{version:3,rawValue:40,rawUnit:'kg',convention:'single',externalKg:40,barKg:null,provenance:'explicit',eligible:true}}}]}}};}
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

test('set evidence snapshots authored targets and selected rest context',()=>{
 const {M}=create(),s=session();
 s.pages[0].setTargets=[{id:'A:set:0',purpose:'working',reps:{min:6,max:8},loadRule:{kind:'adaptive'}}];
 s.logs.A.sets[0].targetId='A:set:0';s.logs.A.sets[0].context={requestedRestSec:120,elapsedRestSec:null};
 M.capture(s);const set=Object.values(M.records()).find(r=>r.kind==='set');
 s.pages[0].setTargets[0].reps.max=99;
 assert.equal(set.payload.contractVersion,3);assert.equal(set.payload.authoredTargets[0].reps.max,8);
 assert.equal(JSON.stringify(set.payload.row.context),JSON.stringify({requestedRestSec:120,elapsedRestSec:null}));
 assert.match(set.payload.prescriptionSignature,/^fnv1a32:/);
});

test('chronological replay learns one exposure per session and replaces edited evidence',()=>{
 const {M}=create(),a=session(),b=session();a.startedAt=10;b.startedAt=2;
 M.capture(a);M.capture(b);
 let state=M.replay('squat|machine|total|kg');
 assert.equal(state.exposures,2);assert.equal(state.confidence,'provisional');
 assert.equal(JSON.stringify(state.evidence.map(e=>e.sessionId)),JSON.stringify([b.id,a.id]));
 const prior=state.freshE1rm,signature=state.evidence[1].sourceSignature;
 a.logs.A.sets[0].kg=50;a.logs.A.sets[0].context.normalizedLoad.rawValue=50;a.logs.A.sets[0].context.normalizedLoad.externalKg=50;M.capture(a);state=M.replay('squat|machine|total|kg');
 assert.equal(state.exposures,2);assert.notEqual(state.freshE1rm,prior);assert.notEqual(state.evidence[1].sourceSignature,signature);
 M.removeSession(a.id);state=M.replay('squat|machine|total|kg');assert.equal(state.exposures,1);
 M.removeSession(b.id);state=M.replay('squat|machine|total|kg');assert.equal(state.exposures,0);assert.equal(state.freshE1rm,null);
});

test('derived estimate carries traceable model and source metadata without trusting old estimates',()=>{
 const {M}=create(),s=session();M.capture(s);
 const estimate=Object.values(M.records()).find(r=>r.kind==='session_estimate');
 assert.equal(estimate.payload.exposures,1);assert.equal(estimate.payload.confidence,'provisional');
 assert.equal(estimate.payload.modelVersion,'strength-v3-conservative');assert.match(estimate.payload.sourceSignature,/^source-v3:/);
 assert.equal(JSON.stringify(estimate.payload.sourceSetIds),JSON.stringify([s.logs.A.sets[0].id]));
});
test('completion and reopening gate durable learning without losing raw actuals',()=>{
 const {M}=create(),s=session();s.completedAt=null;M.capture(s);
 const id=s.logs.A.sets[0].id;assert.equal(M.records()[id].payload.completed,false);
 s.completedAt='2026-10-16T00:00:00Z';M.capture(s);assert.equal(M.records()[id].payload.completed,true);
 s.completedAt=null;M.capture(s);assert.equal(M.records()[id].payload.completed,false);
 assert.equal(M.records()[id].payload.row.kg,40);
});
test('recapturing an old ambiguous logged row does not promote it to explicit normalized evidence',()=>{
 const {M}=create(),s=session();delete s.logs.A.sets[0].context;M.capture(s);
 assert.equal(Object.values(M.records()).find(r=>r.kind==='set').payload.normalizedLoad,null);
});

test('real logger facts survive two ramps, finish, reload, edit and next-session seeding',()=>{
 const {M,store,ctx}=create(),HS=ctx.HybridSession;
 const plan={blocks:[{kind:'lift',letter:'A',title:'Squat',exerciseId:'squat',equipmentId:'machine',loadUnit:'kg',loadConvention:'total',minimumKg:0,equipmentStepKg:1,columns:['reps','weight_kg'],setCount:3,targetReps:6,targetRepMax:8,setTargets:[0,1,2].map(i=>({id:'A:set:'+i,purpose:'working',reps:{min:6,max:8},loadRule:{kind:'adaptive'},toFailure:false}))}]};
 let s=ctx.StrengthBrain.seed(HS.startSession({date:'2026-10-16',plan}),M.records());
 s=HS.ackCoach(HS.ackQuote(s));
 assert.equal(s.logs.A.sets.length,5);
 for(let i=0;i<5;i++)s=HS.logSet(s,i,{reps:6,kg:i<2?10:40,effort:i<2?'easy':'average'});
 M.capture(s);assert.equal(M.replay('squat|machine|total|kg').exposures,0);
 s=HS.finishToSummary(s);M.capture(s);
 assert.equal(M.replay('squat|machine|total|kg').exposures,1);
 const restored=create(store),next=()=>restored.ctx.StrengthBrain.seed(HS.startSession({date:'2026-10-17',plan}),restored.M.records());
 assert.equal(next().pages[0].workingKg,40); // Bottom of 6–8 is a hold, not an earned increase.
 const ids=s.logs.A.sets.map(r=>r.id);
 s=HS.goToLetter(s,'A');s=HS.logSet(s,2,{kg:42});s=HS.finishToSummary(s);restored.M.capture(s);
 assert.equal(next().pages[0].workingKg,42);
 assert.equal(JSON.stringify(s.logs.A.sets.map(r=>r.id)),JSON.stringify(ids));
});
test('a removed secondary row receives finish lifecycle and does not block the first set',()=>{
 const {M}=create(),s=session();s.phase='training';s.completedAt=null;
 s.logs.A.sets.push({...s.logs.A.sets[0],id:webcrypto.randomUUID(),purpose:'ramp'});M.capture(s);
 const removed=s.logs.A.sets.pop().id;s.phase='summary';s.completedAt='2026-10-16T01:00:00Z';M.capture(s);
 assert.equal(M.records()[removed].deleted,true);assert.equal(M.records()[removed].payload.completed,true);
 assert.equal(M.replay('squat|machine|total|kg').exposures,1);
});
test('successive reps/effort edits or an unlog do not certify an ambiguous legacy weight',()=>{
 for(const unlog of [false,true]){
  const {M,ctx}=create();let s=session();delete s.logs.A.sets[0].context;s.phase='block';s.blockIndex=0;s.completedAt=null;
  if(unlog)s=ctx.HybridSession.toggleLogged(s,0);
  else s=ctx.HybridSession.logSet(s,0,{reps:6},undefined,{commit:false});
  s=ctx.HybridSession.logSet(s,0,{effort:'average'});M.capture(s);
  assert.equal(Object.values(M.records()).find(r=>r.kind==='set').payload.normalizedLoad,null);
 }
});
