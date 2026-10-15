import test from 'node:test';
import assert from 'node:assert/strict';
import {loadStrength} from './test/strength-harness.mjs';
const {StrengthLearning:L}=loadStrength(['strength-learning']);
const row=(i,extra={})=>({id:`r${i}`,revision:1,contextKey:'c',sessionId:`s${i}`,weight:50,reps:4+i%3*3,rir:3,purpose:'working',workingIndex:0,miss:false,completed:true,...extra});
const feed=(rows)=>rows.reduce((state,r)=>L.observe(state,r),L.initial());
test('default projection preserves Epley ratios and invalid feedback cannot teach it',()=>{
 const state=L.initial();
 const kg=L.project({weight:50,fromReps:10,fromRir:3,toReps:6,targetRir:3,k:state.k});
 assert.ok(Math.abs(kg-50*(1+.0333*13)/(1+.0333*9))<1e-10);
 const next=L.observe(state,row(0,{rir:6}));
 assert.equal(next.k,state.k);assert.equal(next.accepted,0);assert.equal(state.rows.length,0);
});
test('7 vs 8 rows and diversity thresholds are independent',()=>{
 const rows=Array.from({length:8},(_,i)=>row(i));
 assert.equal(feed(rows.slice(0,7)).updates,0);assert.equal(feed(rows).updates,1);
 assert.equal(feed(rows.map(r=>({...r,reps:6}))).updates,0);
 assert.equal(feed(rows.map((r,i)=>({...r,reps:5+i%3}))).updates,0);
});
test('clean shape recovers the specified shrinkage target',()=>{
 const truth=.065,rows=Array.from({length:24},(_,i)=>row(i,{weight:100*L.fraction(7+i%3*3,truth)}));
 const state=feed(rows),k0=L.initial().k;
 assert.ok(Math.abs(state.k-(k0*.4+truth*.6))<1e-6);
 assert.equal(state.accepted,24);assert.equal(state.updates,17);
});
test('ineligible sessions, effort and model metadata never teach',()=>{
 const invalid=[{purpose:'warmup'},{purpose:'amrap'},{workingIndex:1},{miss:true},{completed:false},{completed:undefined},{rir:0},{rir:5},{rir:null},{reps:0},{reps:13},{reps:1.5},{weight:0},{weight:NaN},{weight:Infinity},{convention:'added_bodyweight'},{model:'unknown'},{modelEligible:false},{normalizedLoad:{convention:'added_bodyweight'}},{revision:0},{id:''}];
 for(const extra of invalid){const s=L.observe(L.initial(),row(0,extra));assert.equal(s.accepted,0,JSON.stringify(extra));}
});
test('immutable observations and state, bounded window, contradictory noise for 1000 updates',()=>{
 let s=L.initial();
 for(let i=0;i<1000;i++){
  const r=Object.freeze(row(i,{weight:i%2?1:10000})),before=JSON.stringify(s);Object.freeze(s.rows);Object.freeze(s);
  const next=L.observe(s,r);assert.equal(JSON.stringify(s),before);assert.notEqual(next.rows,s.rows);
  assert.ok(next.k>=.01&&next.k<=.08);assert.ok(Math.abs(next.k-s.k)<=.002+1e-15);assert.ok(next.rows.length<=24);
  s=next;
 }
 assert.equal(s.accepted,1000);assert.equal(s.rows.length,24);
});
test('fractions and projections reject unsupported domains and overflow',()=>{
 for(const k of [.01,L.initial().k,.08]){
  assert.equal(L.fraction(1,k),1);
  for(let n=2;n<=15;n++)assert.ok(L.fraction(n,k)<L.fraction(n-1,k));
  for(const fromReps of [1,6,12])for(const toReps of [1,6,12])for(const fromRir of [0,1,3]){
   const result=L.project({weight:50,fromReps,fromRir,toReps,targetRir:3,k});assert.ok(result>0&&Number.isFinite(result));
   if(k===L.initial().k)assert.ok(Math.abs(result-50*(1+.0333*(fromReps+fromRir))/(1+.0333*(toReps+3)))<1e-10);
  }
 }
 for(const n of [0,16,NaN,Infinity,'3'])assert.equal(L.fraction(n,.03),null);
 for(const k of [0,.009,.081,NaN,Infinity,'0.03'])assert.equal(L.fraction(3,k),null);
 const p={weight:50,fromReps:6,fromRir:3,toReps:3,targetRir:3,k:.03};
 for(const extra of [{weight:-1},{weight:Infinity},{fromReps:13},{fromRir:null},{fromRir:5},{toReps:0},{targetRir:NaN},{k:null},{weight:Number.MAX_VALUE,fromReps:12,toReps:1}])assert.equal(L.project({...p,...extra}),null);
});
test('corrupt state resets conservatively and huge eligible weights cannot overflow fitting',()=>{
 for(const bad of [null,{}, {...L.initial(),k:NaN},{...L.initial(),accepted:-1},{...L.initial(),rows:[row(0,{weight:NaN})]}])assert.equal(L.observe(bad,row(0)).accepted,0);
 const s=feed(Array.from({length:24},(_,i)=>row(i,{weight:Number.MAX_VALUE})));
 assert.ok(Number.isFinite(s.k));assert.ok(s.k>=.01&&s.k<=.08);
});
test('stored rows are independent of later caller edits and reject mixed contexts',()=>{
 const input=row(0),s=L.observe(L.initial(),input);input.weight=999;
 assert.equal(s.rows[0].weight,50);
 const next=L.observe(s,row(1,{contextKey:'another'}));assert.equal(next.accepted,1);
 next.rows[0].weight=123;assert.equal(s.rows[0].weight,50);
});
test('fast scale initialization and Easy-only cold start stay separate',()=>{
 const r=row(0),pct=L.fraction(r.reps+3,L.initial().k);
 assert.equal(L.updateStart(null,r,2.5),50/pct);
 assert.equal(L.updateStart(null,{...r,rir:5},2.5),null);
 assert.equal(L.updateStart(null,{...r,miss:true,rir:null},2.5),null);
});
test('fast calibration follows precise, directional, miss precedence and bounds',()=>{
 const r=row(0),scale=100,oneStep=2.5/L.fraction(r.reps+3,L.initial().k);
 assert.equal(L.updateStart(scale,{...r,rir:5},2.5),scale+oneStep);
 assert.equal(L.updateStart(scale,{...r,rir:null,miss:true},2.5),Math.max(90,scale-2*oneStep));
 assert.equal(L.updateStart(scale,{...r,rir:6,miss:true},2.5),Math.max(90,scale-2*oneStep));
 assert.equal(L.updateStart(scale,{...r,rir:null},2.5),scale);
 assert.equal(L.updateStart(scale,r,2.5),90);
 assert.equal(L.updateStart(scale,{...r,weight:500},2.5),scale+oneStep);
 for(const extra of [{completed:false},{workingIndex:1},{purpose:'warmup'},{weight:NaN},{reps:13}])assert.equal(L.updateStart(scale,{...r,...extra},2.5),scale);
 for(const step of [0,-1,NaN,Infinity])assert.equal(L.updateStart(scale,r,step),scale);
 for(const bad of [NaN,Infinity,-1,0])assert.equal(L.updateStart(bad,r,2.5),null);
 assert.equal(L.updateStart(Number.MAX_VALUE,{...r,rir:5},Number.MAX_VALUE),Number.MAX_VALUE);
});
test('precise starting calibration moves exactly halfway when no clamp binds',()=>{
 const k=L.initial().k,observation=row(0,{reps:5,weight:104*L.fraction(8,k)});
 assert.ok(Math.abs(L.updateStart(100,observation,10)-102)<1e-10);
});
