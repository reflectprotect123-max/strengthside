import test from 'node:test';
import assert from 'node:assert/strict';
import {loadStrength} from './test/strength-harness.mjs';
import {record} from './test/strength-record-fixture.mjs';
const {StrengthReplay:R,StrengthLearning:L,StrengthLoad:Load}=loadStrength(['strength-load','strength-context','strength-learning','strength-replay']);
const options={ownerId:'a',contextKey:record('a',1,50).payload.learning.contextKey};
const replay=rows=>R.replay(rows,options);
const clone=x=>JSON.parse(JSON.stringify(x));
const plain=x=>clone(x);
function later(r,index=1) {r.payload.row.targetId=`work-${index}`;r.payload.row.workingIndex=index;r.payload.row.ordinal=index;return r;}
function load(r,changes) {Object.assign(r.payload.normalizedLoad,Load.normalize({value:r.payload.row.kg,unit:r.payload.page.loadUnit,convention:r.payload.page.loadConvention,barKg:r.payload.page.barWeightKg,provenance:'explicit',...changes}));return r;}
test('revisions replace evidence; deletion and delivery order cannot double learn',()=>{
 const a=record('set-a',1,50),edit=record('set-a',2,55),b=record('set-b',1,60);
 assert.equal(JSON.stringify(replay([a,edit,b])),JSON.stringify(replay([b,edit,a])));
 assert.equal(replay([a,edit,b]).accepted,2);
 assert.equal(replay([a,{...edit,deleted:true},b]).accepted,1);
 assert.deepEqual(plain(replay([a,edit,b]).rows),plain(replay([edit,b]).rows));
});
test('imports and late older sessions replay in canonical session/date/id order',()=>{
 const rows=Array.from({length:12},(_,i)=>{const r=record(`s-${i}`,1,50+i);r.payload.sessionStartedAt=i%2?100:1;return r;});
 const expected=replay(rows);
 for(const order of [[...rows].reverse(),[...rows.slice(5),...rows.slice(0,5)],rows.flatMap(r=>[r,clone(r)])])assert.equal(JSON.stringify(replay(order)),JSON.stringify(expected));
 assert.equal(expected.rows[0].id,'s-0');assert.equal(expected.accepted,12);
});
test('raw edits rebuild weight reps effort context and outer identity despite stale observation',()=>{
 const r=record('actual-id',2,55);Object.assign(r.payload.learning.observation,{id:'wrong',revision:99,weight:999,reps:1,rir:1,contextKey:'wrong',sessionId:'wrong'});
 Object.assign(r.payload.row,{reps:8,effort:'hard'});
 const state=replay([r]);assert.equal(state.accepted,1);
 assert.deepEqual(plain(state.rows[0]),{id:'actual-id',revision:2,contextKey:options.contextKey,sessionId:r.sessionId,weight:55,reps:8,rir:1,purpose:'working',workingIndex:0,miss:false,completed:true});
 const bad=clone(r);bad.payload.row.kg=90;assert.equal(replay([bad]).accepted,0);
 const moved=clone(r);moved.payload.page.tempo='33X1';assert.equal(replay([moved]).accepted,0);
 moved.payload.learning.contextKey=options.contextKey;assert.equal(replay([moved]).accepted,0);
});
test('normalization validates all envelope fields and matches raw units/convention/bar',()=>{
 for(const [field,value] of [['rawValue',999],['rawUnit','lb'],['externalKg',999],['eligible',false],['barKg',15],['version',2],['provenance','known_legacy_version']]){
  const r=record('a',1,50);r.payload.normalizedLoad[field]=value;assert.equal(replay([r]).accepted,0,field);
 }
 for(const field of ['ownerId','normalizedLoad']){const r=record('a',1,50);delete r.payload[field];assert.equal(replay([r]).accepted,0,field);}
 const ambiguous=load(record('a',1,50),{provenance:'ambiguous_legacy'});assert.equal(replay([ambiguous]).accepted,0);
});
test('plates, pounds and per-hand facts derive physical load once',()=>{
 const plates=record('plates',1,0);Object.assign(plates.payload.page,{loadConvention:'barbell_plates'});load(plates,{});
 assert.equal(replay([plates]).rows[0].weight,20);
 const lb=record('lb',1,100);lb.payload.page.loadUnit='lb';load(lb,{});assert.equal(replay([lb]).rows[0].weight,45.359237);
 const db=record('db',1,20);Object.assign(db.payload.page,{equipmentId:'dumbbell',loadConvention:'per_hand',barWeightKg:null});load(db,{});
 const contextKey=JSON.stringify(['a','squat','dumbbell','per_hand','2-0-X-1']);assert.equal(R.replay([db],{...options,contextKey}).rows[0].weight,20);
});
test('only first authored ordinary work teaches; skipped deleted invalid or missing first never promote later',()=>{
 const first=record('first',1,50),second=later(record('second',1,60));second.sessionId=first.sessionId;
 assert.equal(replay([second,first]).accepted,1);assert.equal(replay([second,first]).rows[0].id,'first');
 assert.equal(replay([second]).accepted,0);
 for(const change of [r=>r.deleted=true,r=>r.payload.row.skipped=true,r=>r.payload.row.logged=false,r=>r.payload.row.kg=null,r=>r.payload.row.effort='']){
  const bad=clone(first);change(bad);assert.equal(replay([bad,second]).accepted,0);
 }
 const forged=clone(second);forged.payload.row.workingIndex=0;assert.equal(replay([forged]).accepted,0);
});
test('duplicate first set identity is ambiguous and cannot teach',()=>{
 const a=record('first',1,50),b=record('duplicate',1,60);b.sessionId=a.sessionId;
 const state=replay([a,b]);assert.equal(state.accepted,0);assert.ok(state.diagnostics.some(d=>d.reason==='duplicate_first_working'));
});
test('completion gates whole session; reopening and exclusion remove evidence',()=>{
 const a=record('a',1,50),open=record('a',2,50);open.payload.completed=false;
 assert.equal(replay([a,open]).accepted,0);
 assert.equal(R.replay([a],{...options,excludeSessionId:a.sessionId}).accepted,0);
 assert.equal(replay([a,{...a,localRevision:3,payload:{...a.payload,completed:true}}]).accepted,1);
 const second=later(record('b',1,60));second.sessionId=a.sessionId;second.payload.completed=false;
 assert.equal(replay([a,second]).accepted,0);
 const unknown=clone(a);delete unknown.payload.completed;assert.equal(replay([unknown]).accepted,0);
});
test('warmups AMRAP and duplicate summaries never teach or replace first actual',()=>{
 const first=record('first',1,50),warm=record('warm',1,20),amrap=record('amrap',1,70);
 warm.sessionId=amrap.sessionId=first.sessionId;Object.assign(warm.payload.row,{purpose:'ramp',targetId:'ramp-0',ordinal:0});
 amrap.payload.page.setTargets.push({id:'amrap-target',purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'},toFailure:true});
 Object.assign(amrap.payload.row,{purpose:'amrap',targetId:'amrap-target',workingIndex:3,ordinal:4});
 const summary={...clone(first),id:'summary',kind:'session_estimate'};
 assert.equal(replay([warm,amrap,first,summary,clone(summary)]).accepted,1);
 assert.equal(replay([warm,amrap,summary]).accepted,0);
});
test('account identity and tempo are taken from raw context; aliases share history',()=>{
 const a=record('a',1,50),b=record('b',1,50);b.payload.ownerId='b';assert.equal(replay([a,b]).accepted,1);
 const alias=record('alias',1,50);alias.payload.page.tempo='2-0-X-1';assert.equal(replay([alias]).accepted,1);
 for(const value of ['33X1',null]){alias.payload.page.tempo=value;assert.equal(replay([alias]).accepted,0);}
 const rawOnly=record('raw',1,50);delete rawOnly.payload.learning;assert.equal(replay([rawOnly]).accepted,1);
 for(const field of ['ownerId','athleteId','athlete_id'])for(const value of ['b',null]){const mismatch=record('mismatch',1,50);mismatch[field]=value;assert.equal(replay([mismatch]).accepted,0);assert.equal(replay([mismatch]).ledger.length,0);}
 const foreign=record('foreign',1,99);foreign.payload.ownerId='b';const otherTempo=record('other-tempo',1,77);otherTempo.payload.page.tempo='33X1';
 const scoped=replay([a,foreign,otherTempo]);assert.equal(scoped.ledger.length,1);assert.ok(!JSON.stringify(scoped).includes('foreign'));assert.ok(!JSON.stringify(scoped).includes('other-tempo'));
});
test('same-revision conflicts fail closed independent of delivery and preserve variants',()=>{
 const a=record('a',1,50),conflict=record('a',1,60),good=record('good',1,60);
 const state=replay([a,conflict,good]);assert.equal(state.accepted,0);assert.equal(state.conflicted,true);
 assert.ok(state.diagnostics.some(d=>d.reason==='conflicting_revision'));
 assert.equal(JSON.stringify(state),JSON.stringify(replay([good,conflict,a])));
 assert.equal(replay([a,conflict,record('a',2,55)]).accepted,1);
});
test('fingerprint changes on revision deletion completion raw edits and context but not property order',()=>{
 const r=record('a',1,50),fingerprint=replay([r]).evidenceFingerprint;
 for(const change of [x=>x.localRevision++,x=>x.deleted=true,x=>x.payload.completed=false,x=>x.payload.row.reps=8,x=>x.payload.page.tempo='33X1']){
  const x=clone(r);change(x);assert.notEqual(replay([x]).evidenceFingerprint,fingerprint);
 }
 const reordered=Object.fromEntries(Object.entries(r).reverse());assert.equal(replay([reordered]).evidenceFingerprint,fingerprint);
});
test('directional first evidence updates existing scale without teaching shape; Easy cold start remains null',()=>{
 const precise=record('precise',1,50),easy=record('easy',1,50);precise.payload.sessionStartedAt=1;easy.payload.sessionStartedAt=2;easy.payload.row.effort='easy';
 const base=replay([precise]),state=replay([precise,easy]);assert.equal(state.accepted,1);assert.ok(state.startingScale>base.startingScale);
 const cold=replay([easy]);assert.equal(cold.accepted,0);assert.equal(cold.startingScale,null);assert.equal(cold.evidence.length,1);assert.equal(cold.latestFirst.effort,'easy');assert.equal(cold.latestFirst.observation.weight,50);
 const missed=record('miss',1,50);missed.payload.sessionStartedAt=3;missed.payload.row.miss=true;missed.payload.row.effort=null;
 assert.ok(replay([precise,missed]).startingScale<base.startingScale);
 for(const reps of [0,20]){const directional=clone(missed);directional.payload.row.reps=reps;const preserved=replay([directional]);assert.equal(preserved.accepted,0);assert.equal(preserved.latestFirst.observation.reps,reps);assert.equal(preserved.latestFirst.observation.miss,true);}
});
test('unsupported movement and added-bodyweight models remain facts without teaching',()=>{
 for(const change of [r=>r.payload.page.title='Farmer Carry',r=>r.payload.page.columns=['reps','seconds'],r=>{r.payload.page.loadConvention='added_bodyweight';load(r,{});},r=>r.payload.modelEligible=false,r=>r.payload.model='unvalidated',r=>r.payload.row.modelEligible=false,r=>r.payload.page.model='unvalidated']){
  const r=record('a',1,50);change(r);const contextKey=JSON.stringify(['a','squat','barbell',r.payload.page.loadConvention,'2-0-X-1']);
  const state=R.replay([r],{...options,contextKey});assert.equal(state.accepted,0);assert.equal(state.startingScale,null);assert.equal(state.ledger.length,1);
 }
});
test('fit rows capped at 24 while ledger retains every latest fact and deletion',()=>{
 const rows=Array.from({length:40},(_,i)=>{const r=record(`set-${i}`,1,40+i);r.payload.sessionStartedAt=i;r.payload.row.reps=[3,7,10][i%3];return r;});
 rows.push({...record('deleted',2,50),deleted:true});const state=replay(rows);
 assert.equal(state.accepted,40);assert.equal(state.rows.length,24);assert.equal(state.ledger.length,41);assert.equal(state.evidence.length,40);
 const manual=rows.slice(0,40).reduce((s,r)=>L.observe(s,{...r.payload.learning.observation,reps:r.payload.row.reps}),L.initial());assert.equal(state.k,manual.k);assert.ok(state.updates>0);
});
test('derived summaries and their revisions do not affect the evidence fingerprint',()=>{
 const r=record('a',1,50),stale=clone(r);stale.payload.learning.observation.weight=999;
 assert.equal(JSON.stringify(replay([r])),JSON.stringify(replay([r,stale])));
 const summary={...clone(r),id:'summary',kind:'session_estimate',localRevision:99};
 assert.equal(JSON.stringify(replay([r,summary])),JSON.stringify(replay([r])));
});
test('inputs are deeply immutable and returned ledger/evidence are detached',()=>{
 const rows=[record('a',1,50)];const original=JSON.stringify(rows);
 const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};freeze(rows);
 const state=replay(rows);assert.equal(JSON.stringify(rows),original);state.ledger[0].payload.row.kg=999;state.evidence[0].observation.weight=999;
 assert.equal(JSON.stringify(rows),original);assert.equal(replay(rows).rows[0].weight,50);
});
test('malformed facts stay excluded without coercing null blank or invalid session metadata',()=>{
 for(const change of [r=>r.localRevision=0,r=>r.sessionId='',r=>r.deleted='false',r=>r.payload.sessionStartedAt=null,r=>r.payload.sessionStartedAt='bad',r=>r.payload.row.reps='',r=>r.payload.row.reps=null,r=>r.payload.row.ordinal=-1,r=>r.payload.row.miss=null,r=>r.payload.row.effort='mystery']){
  const r=record('a',1,50);change(r);assert.equal(replay([r]).accepted,0);
 }
 assert.equal(replay([null,{},false]).accepted,0);
});

test('preserved production total/minimumKg page replays from its verified plates envelope',()=>{
 const r=record('production',1,40);Object.assign(r.payload.page,{loadConvention:'total',minimumKg:20});delete r.payload.page.barWeightKg;
 r.payload.normalizedLoad=Load.normalize({value:40,unit:'kg',convention:'barbell_plates',barKg:20,provenance:'explicit'});
 const before=JSON.stringify(r),state=replay([r]);
 assert.equal(state.accepted,1);assert.equal(state.rows[0].weight,60);assert.equal(state.ledger.length,1);assert.equal(state.latestFirst.page.loadConvention,'total');assert.equal(state.latestFirst.page.minimumKg,20);
 assert.equal(JSON.stringify(r),before);assert.equal(r.payload.row.kg,40);
 const frozen=clone(r);Object.freeze(frozen.payload.page);Object.freeze(frozen.payload.normalizedLoad);Object.freeze(frozen.payload.row);Object.freeze(frozen.payload);Object.freeze(frozen);
 assert.equal(JSON.stringify(replay([frozen])),JSON.stringify(state));
});
test('canonical pages accept minimumKg fallback and keep total distinct from plates',()=>{
 for(const convention of ['barbell_total','barbell_plates']) {
  const r=record(convention,1,40);Object.assign(r.payload.page,{loadConvention:convention,minimumKg:20});delete r.payload.page.barWeightKg;
  r.payload.normalizedLoad=Load.normalize({value:40,unit:'kg',convention,barKg:20,provenance:'explicit'});
  const state=replay([r]);assert.equal(state.accepted,1);assert.equal(state.rows[0].weight,convention==='barbell_total'?40:60);
 }
 const r=record('generic',1,30);Object.assign(r.payload.page,{equipmentId:'machine',loadConvention:'total',minimumKg:0});delete r.payload.page.barWeightKg;
 r.payload.normalizedLoad=Load.normalize({value:30,unit:'kg',convention:'single',provenance:'explicit'});
 const contextKey=JSON.stringify(['a','squat','machine','single','2-0-X-1']);assert.equal(R.replay([r],{...options,contextKey}).rows[0].weight,30);
});
test('production aliases cannot infer historical trust and reject contradictory bar unit or convention',()=>{
 const base=record('production',1,40);Object.assign(base.payload.page,{loadConvention:'total',minimumKg:20});delete base.payload.page.barWeightKg;
 base.payload.normalizedLoad=Load.normalize({value:40,unit:'kg',convention:'barbell_plates',barKg:20,provenance:'explicit'});
 for(const change of [r=>delete r.payload.normalizedLoad,r=>r.payload.normalizedLoad=Load.normalize({value:40,unit:'kg',convention:'barbell_plates',barKg:20,provenance:'ambiguous_legacy'}),r=>r.payload.normalizedLoad=Load.normalize({value:40,unit:'kg',convention:'barbell_plates',barKg:15,provenance:'explicit'}),r=>r.payload.page.loadUnit='lb',r=>r.payload.page.loadConvention='barbell_total']){
  const r=clone(base);change(r);assert.equal(replay([r]).accepted,0);
 }
});
test('bodyweight total and belt-load aliases remain history without fitting a system load',()=>{
 for(const loadConvention of ['total','bodyweight','added_bodyweight']) {
  const r=record(`belt-${loadConvention}`,1,10);Object.assign(r.payload.page,{equipmentId:'bodyweight',loadConvention});delete r.payload.page.barWeightKg;
  r.payload.normalizedLoad=Load.normalize({value:10,unit:'kg',convention:'added_bodyweight',provenance:'explicit'});
  const contextKey=JSON.stringify(['a','squat','bodyweight','added_bodyweight','2-0-X-1']);
  const state=R.replay([r],{...options,contextKey});assert.equal(state.accepted,0);assert.equal(state.startingScale,null);assert.equal(state.ledger.length,1);assert.equal(state.ledger[0].payload.row.kg,10);
  assert.ok(state.diagnostics.some(d=>d.reason==='unsupported_model'));
 }
 const forged=record('forged-system',1,10);Object.assign(forged.payload.page,{equipmentId:'bodyweight',loadConvention:'total'});delete forged.payload.page.barWeightKg;
 forged.payload.normalizedLoad=Load.normalize({value:10,unit:'kg',convention:'single',provenance:'explicit'});
 const contextKey=JSON.stringify(['a','squat','bodyweight','single','2-0-X-1']);assert.equal(R.replay([forged],{...options,contextKey}).accepted,0);
});
test('bodyweight equipment cannot fit from an incorrectly declared single-load envelope',()=>{
 const r=record('dip',1,20);
 r.payload.page={...r.payload.page,title:'Weighted Dip',equipmentId:'bodyweight',loadConvention:'single',barWeightKg:null};
 r.payload.normalizedLoad={...r.payload.normalizedLoad,convention:'single',barKg:null};
 const contextKey=JSON.stringify(['a','squat','bodyweight','single','2-0-X-1']);
 assert.equal(R.replay([r],{ownerId:'a',contextKey}).accepted,0);
});

test('large unrelated histories validate only the requested exercise while retaining shared-session gates',()=>{
 const ctx=loadStrength(['strength-load','strength-context','strength-learning','strength-replay']);
 const rows=Array.from({length:10000},(_,i)=>{
  const r=record(`large-${i}`,1,50);r.payload.page.exerciseId=`exercise-${i%100}`;return r;
 });
 const contextKey=JSON.stringify(['a','exercise-0','barbell','barbell_total','2-0-X-1']);
 let validations=0;const normalize=ctx.StrengthContext.normalizeLoad;
 ctx.StrengthContext.normalizeLoad=(...args)=>{validations++;return normalize(...args);};
 const state=ctx.StrengthReplay.replay(rows,{ownerId:'a',contextKey});
 assert.equal(state.accepted,100);assert.ok(validations<=600,`unrelated load validation count ${validations}`);
 const other=record('open-other-exercise',1,50);other.payload.page.exerciseId='other';
 other.sessionId=rows[0].sessionId;other.payload.completed=false;
 const gated=ctx.StrengthReplay.replay([...rows,other],{ownerId:'a',contextKey});
 assert.equal(gated.accepted,99);assert.ok(gated.diagnostics.some(d=>d.id===rows[0].id&&d.reason==='incomplete_or_inconsistent_session'));
});
