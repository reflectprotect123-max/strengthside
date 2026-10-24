import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const fixture=JSON.parse(readFileSync(new URL('../../checks/fixtures/coach-published.json',import.meta.url))).row;
const copy=x=>JSON.parse(JSON.stringify(x));
function runtime(){
  const c={console};c.globalThis=c;vm.createContext(c);
  for(const file of ['training-core','strength-targets','library','strength-only','coach-assignments'])vm.runInContext(readFileSync(new URL('./'+file+'.js',import.meta.url),'utf8'),c);
  c.S={accountId:fixture.athlete_id,library:c.HybridLibrary.emptyState(),sessions:{},session:null};
  return c;
}
test('actual Coach producer payload compiles variable reps, first-set AMRAP and tempo without rewriting identity',()=>{
  const c=runtime(),before=JSON.stringify(fixture),r=c.CoachAssignments.apply(c.S,[fixture],fixture.athlete_id);
  const plan=c.HybridLibrary.planForDate(r.state.library,fixture.scheduled_date),p=plan.blocks.find(b=>b.kind==='lift');
  assert.deepEqual(copy(p.setTargets.map(t=>t.reps?.min??'AMRAP')),[10,8,6,'AMRAP']);
  assert.equal(p.setTargets.at(-1).loadRule.kind,'first_working_set');assert.equal(p.tempo,'20X1');
  assert.equal(p.exerciseId,fixture.resolved_snapshot.htmlSession.blocks[0].exercises[0].exerciseId);
  assert.equal(p.equipmentId,'barbell');assert.equal(p.loadConvention,'barbell_total');
  assert.equal(JSON.stringify(fixture),before);
  assert.equal(c.CoachAssignments.apply(r.state,[fixture],fixture.athlete_id).changed,false);
});
test('unpublish removes future schedule while retaining active workout and completed history',()=>{
  const c=runtime();c.S=c.CoachAssignments.apply(c.S,[fixture],fixture.athlete_id).state;
  c.S.session={id:'active',logs:{a:{sets:[{kg:80,reps:5,logged:true}]}}};c.S.sessions[fixture.scheduled_date]=copy(c.S.session);
  const before=JSON.stringify([c.S.session,c.S.sessions]);
  const r=c.CoachAssignments.apply(c.S,[],fixture.athlete_id);
  assert.equal(r.state.library.assignments[fixture.scheduled_date],undefined);assert.equal(r.state.library.templates.length,0);
  assert.equal(JSON.stringify([r.state.session,r.state.sessions]),before);
});
test('reschedule clears old date and multiple Coach workouts on a day retain all blocks',()=>{
  const c=runtime();c.S=c.CoachAssignments.apply(c.S,[fixture],fixture.athlete_id).state;
  const moved={...copy(fixture),scheduled_date:'2026-10-19'},other={...copy(moved),id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'};
  const r=c.CoachAssignments.apply(c.S,[other,moved],fixture.athlete_id);
  assert.equal(r.state.library.assignments['2026-10-18'],undefined);
  assert.equal(r.state.library.templates[0].blocks.length,2);
  assert.equal(c.CoachAssignments.apply(r.state,[moved,other],fixture.athlete_id).changed,false);
});
test('a local assignment is preserved rather than replaced silently',()=>{
  const c=runtime();c.S.library.templates=[{id:'own',title:'Own',blocks:[]}];c.S.library.assignments[fixture.scheduled_date]='own';
  const r=c.CoachAssignments.apply(c.S,[fixture],fixture.athlete_id);
  assert.equal(r.state.library.assignments[fixture.scheduled_date],'own');assert.deepEqual(copy(r.conflicts),[fixture.scheduled_date]);
});
test('timed prep, range and all selected metrics survive without fabricated actuals',()=>{
  const c=runtime(),r=copy(fixture),ex=r.resolved_snapshot.htmlSession.blocks[0].exercises[0];
  Object.assign(ex,{sets:2,reps:'6-8',logColumns:[{kind:'reps_range',values:['6-8','8-10']},{kind:'weight_kg',values:['80','85']}]});
  const b=r.resolved_snapshot.htmlSession.blocks;
  b.unshift({id:'prep',role:'warmup',category:'Warm-Up',exercises:[{id:'hold',name:'Plank',sets:2,reps:'30',metric:'Seconds',logColumns:[{kind:'time_sec',values:['30','45']}]}]});
  b.push({id:'carry',type:'strength',exercises:[{id:'carry',name:'Farmer Carry',sets:2,logColumns:[{kind:'distance_m',values:['40','45']},{kind:'weight_kg',values:['20','20']}]}]});
  const out=c.CoachAssignments.apply(c.S,[r],fixture.athlete_id).state.library.templates[0].blocks;
  assert.deepEqual(copy(out[0].columns),['seconds']);assert.equal(out[0].prescribed,'30 / 45');
  assert.deepEqual(copy(out[1].columns),['reps_range','weight_kg']);assert.deepEqual(copy(out[1].setTargets[1].reps),{min:8,max:10});
  assert.deepEqual(copy(out[2].columns),['meters','weight_kg']);assert.equal(out[2].rows,undefined);
});
test('bad snapshot, wrong owner and invalid prescription reject the entire import',()=>{
  const c=runtime(),before=JSON.stringify(c.S);
  for(const patch of [{athlete_id:'other'},{resolved_snapshot:{}},{scheduled_date:'2026-02-30'}])assert.throws(()=>c.CoachAssignments.apply(c.S,[{...fixture,...patch}],fixture.athlete_id));
  const bad=copy(fixture);bad.resolved_snapshot.htmlSession.blocks[0].exercises[0].reps='bad';
  assert.throws(()=>c.CoachAssignments.apply(c.S,[bad],fixture.athlete_id));assert.equal(JSON.stringify(c.S),before);
});
test('network failure preserves cached plans; a successful pull persists once and repeat is a no-op',async()=>{
  const c=runtime();let saves=0;c.save=()=>saves++;
  const io={userId:async()=>fixture.athlete_id,pull:async()=>[fixture]};
  assert.equal((await c.CoachAssignments.sync({io})).ok,true);assert.equal(saves,1);
  await c.CoachAssignments.sync({io});assert.equal(saves,1);const before=JSON.stringify(c.S);
  assert.equal((await c.CoachAssignments.sync({io:{...io,pull:async()=>{throw Error('offline');}}})).ok,false);
  assert.equal(JSON.stringify(c.S),before);
});
test('late response after logout or account switching cannot import another athlete plan',async()=>{
  const c=runtime();let resolve;const pending=new Promise(r=>resolve=r);
  const work=c.CoachAssignments.sync({io:{userId:async()=>fixture.athlete_id,pull:()=>pending}});
  await new Promise(r=>setImmediate(r));c.CoachAssignments.invalidate();c.S={accountId:'other',library:c.HybridLibrary.emptyState()};
  resolve([fixture]);assert.equal((await work).reason,'account_changed');assert.equal(c.S.library.templates.length,0);
});
test('failed local persistence rolls back the imported library',async()=>{
  const c=runtime(),before=JSON.stringify(c.S.library);c.save=()=>{throw Error('Quota exceeded');};
  const r=await c.CoachAssignments.sync({io:{userId:async()=>fixture.athlete_id,pull:async()=>[fixture]}});
  assert.equal(r.ok,false);assert.equal(r.reason,'Quota exceeded');assert.equal(JSON.stringify(c.S.library),before);
});
test('conditioning is excluded and unsupported metrics are rejected rather than changed',()=>{
  const c=runtime(),r=copy(fixture);
  r.resolved_snapshot.htmlSession.blocks.push({id:'engine',type:'conditioning',exercises:[{name:'Run'}]});
  assert.equal(c.CoachAssignments.apply(c.S,[r],fixture.athlete_id).state.library.templates[0].blocks.length,1);
  r.resolved_snapshot.htmlSession.blocks[0].exercises[0].metric='unknown metric';
  assert.throws(()=>c.CoachAssignments.apply(c.S,[r],fixture.athlete_id));
});
test('foreground refresh follows auth and plan sync, including Capacitor becoming available late',async()=>{
  const c=runtime(),calls=[],listeners={};
  c.document={visibilityState:'visible',addEventListener:(name,cb)=>{assert.equal(listeners[name],undefined);listeners[name]=cb;}};
  c.Whoop={hydrateAuth:async()=>calls.push('auth'),syncAll:async()=>calls.push('whoop')};
  c.PlanSync={syncNow:async()=>calls.push('plan')};c.CoachAssignments.sync=async()=>calls.push('coach');
  vm.runInContext(readFileSync(new URL('./hybrid-integrations.js',import.meta.url),'utf8'),c);
  c.HybridIntegrations.bindForegroundSync();c.HybridIntegrations.bindForegroundSync();
  c.Capacitor={Plugins:{App:{addListener:(name,cb)=>{assert.equal(listeners[name],undefined);listeners[name]=cb;}}}};
  c.HybridIntegrations.bindForegroundSync();c.HybridIntegrations.bindForegroundSync();
  await c.HybridIntegrations.bootSync();assert.deepEqual(calls,['auth','plan','coach','whoop']);
  calls.length=0;listeners.appStateChange({isActive:true});await new Promise(r=>setImmediate(r));
  assert.deepEqual(calls,['auth','plan','coach','whoop']);
  calls.length=0;listeners.visibilitychange();await new Promise(r=>setImmediate(r));
  assert.deepEqual(calls,['auth','plan','coach','whoop']);
});
test('Supabase transport scopes published rows to owner and paginates deterministically',async()=>{
  const c=runtime();const queries=[];let calls=0;
  c.Whoop={client:()=>({auth:{getSession:async()=>({data:{session:{user:{id:fixture.athlete_id}}}})},from(table){
    const query={table,filters:[]};queries.push(query);
    const chain={select(cols){query.cols=cols;return chain;},eq(k,v){query.filters.push([k,v]);return chain;},order(k){query.order=k;return chain;},async range(a,b){query.range=[a,b];calls++;return {data:calls===1?Array.from({length:500},(_,i)=>({...copy(fixture),id:'row-'+i})):[],error:null};}};return chain;
  }})};
  assert.equal((await c.CoachAssignments.sync()).ok,true);assert.equal(calls,2);
  assert.deepEqual(queries[0].filters,[['athlete_id',fixture.athlete_id],['state','published']]);assert.equal(queries[0].order,'id');assert.deepEqual(queries[1].range,[500,999]);
});

test('UI-produced weight prescription retains blank kg, block notes, tempo, per-side and assignment provenance',()=>{
 const c=runtime(),row=copy(fixture),b=row.resolved_snapshot.htmlSession.blocks[0],ex=b.exercises[0];
 b.notes='Controlled movement';Object.assign(ex,{metric:'Weight',perSide:'Yes',logColumns:[{kind:'reps',values:['10','8','6','AMRAP']}]});
 const state=c.CoachAssignments.apply(c.S,[row],fixture.athlete_id).state;
 const plan=c.HybridLibrary.planForDate(state.library,fixture.scheduled_date),p=plan.blocks.find(b=>b.kind==='lift');
 assert.deepEqual(copy(p.columns),['reps','weight_kg']);assert.equal(p.coachAssignmentId,row.id);assert.equal(p.coachExerciseId,ex.id);
 assert.ok(p.notes.includes('Controlled movement'));assert.ok(p.notes.some(n=>n.includes('each side')));
 assert.equal(p.tempo,'20X1');assert.deepEqual(copy(plan.coachAssignedIds),[row.id]);
 ex.metric='Reps';const reps=c.CoachAssignments.convert(row).blocks[0];assert.deepEqual(copy(reps.columns),['reps']);
});

test('AC20 athlete compile keeps coach rest, rampCount, seconds, superset and catalogue metadata',()=>{
 const c=runtime();
 for(const file of ['strength-notes','strength-equipment','session'])vm.runInContext(readFileSync(new URL('./'+file+'.js',import.meta.url),'utf8'),c);
 const row=copy(fixture),b=row.resolved_snapshot.htmlSession.blocks[0];
 b.groupId='ss-ibex';
 b.exercises.push({id:'rdl',name:'DB RDL',sets:3,reps:'8',metric:'Weight',equipmentId:'dumbbell',loadConvention:'per_hand',minimumKg:1,logColumns:[{kind:'reps',values:['8','8','8']}]});
 row.resolved_snapshot.htmlSession.blocks.push({id:'plank',type:'strength',exercises:[{id:'plank',name:'Foam Roller Plank Rollout',sets:3,reps:'45',metric:'Seconds',logColumns:[{kind:'time_sec',values:['45']}]}]});
 const plan=c.HybridLibrary.planForDate(c.CoachAssignments.apply(c.S,[row],fixture.athlete_id).state.library,fixture.scheduled_date);
 const squat=plan.blocks.find(p=>p.title==='Back Squat');
 const rdl=plan.blocks.find(p=>p.title==='DB RDL');
 const plank=plan.blocks.find(p=>p.title==='Foam Roller Plank Rollout');
 assert.equal(squat.restSec,90);
 assert.equal(squat.rampCount,0);
 assert.equal(squat.equipmentId,'barbell');
 assert.equal(squat.loadConvention,'barbell_total');
 assert.equal(squat.groupId,rdl.groupId);
 assert.ok(plank.columns.includes('seconds'));
 const session=c.HybridSession.startSession({date:fixture.scheduled_date,plan});
 const pair=session.pages.find(p=>p.logMode==='superset');
 assert.ok(pair);assert.equal(pair.restSec,0);
 const plankPage=session.pages.find(p=>p.title==='Foam Roller Plank Rollout');
 assert.match(String(plankPage.prescribed),/^45/);
 assert.ok(!plankPage.columns.includes('weight_kg'));
});
