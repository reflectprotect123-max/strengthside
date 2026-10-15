import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import os from 'node:os';
import {runtime} from './strength-learning-simulator.mjs';
const {ctx,store}=runtime(),records={};
let page;
for(let i=0;i<10000;i++){
 const reps=[3,6,10][Math.floor(i/100)%3];
 const p={id:'A',exerciseId:'exercise-'+(i%100),title:'Press',equipmentId:'machine',loadConvention:'total',loadUnit:'kg',equipmentStepKg:1,minimumKg:0,kind:'lift',logMode:'kg',columns:['reps','weight_kg'],setCount:1,setTargets:[{id:'A:set:0',purpose:'working',reps:{min:reps,max:reps},loadRule:{kind:'adaptive'},toFailure:false}]};
 if(i===0)page=p;
 const kg=40+(i%7),id='row-'+i;
 records[id]={id,localRevision:1,sessionId:'session-'+i,exerciseKey:ctx.StrengthBrain.key(p),kind:'set',deleted:false,payload:{contractVersion:3,ownerId:'sim-athlete',completed:true,page:p,row:{id,targetId:'A:set:0',ordinal:0,workingIndex:0,purpose:'working',kg,reps,effort:'average',miss:false,logged:true},normalizedLoad:ctx.StrengthLoad.fromPage({page:p,value:kg,provenance:'explicit'}),sessionStartedAt:i+1}};
}
store.set('strength-memory-v1',JSON.stringify({version:1,ownerId:'sim-athlete',records,pending:{},revisions:{}}));
vm.runInContext(readFileSync(new URL('../apps/athlete/strength-memory.js',import.meta.url),'utf8'),ctx);
let replayCalls=0,observations=0;const originalReplay=ctx.StrengthReplay.replay,originalObserve=ctx.StrengthLearning.observe;
ctx.StrengthReplay.replay=(...a)=>{replayCalls++;return originalReplay(...a);};
ctx.StrengthLearning.observe=(...a)=>{observations++;const result=originalObserve(...a);assert.ok(result.rows.length<=24);return result;};
const start=performance.now(),snapshot=ctx.StrengthMemory.records(),snapshotMs=performance.now()-start;
const cold=performance.now(),state=ctx.StrengthBrain.history(snapshot,page),coldReplayMs=performance.now()-cold;
assert.equal(state.accepted,100);assert.equal(observations,100);
const lookup=[],next=[];
for(let i=0;i<1000;i++){
 let t=performance.now();assert.equal(ctx.StrengthBrain.history(ctx.StrengthMemory.records(),page),state);lookup.push(performance.now()-t);
 t=performance.now();ctx.StrengthBrain.next({page,row:state.latest.row,nextRow:{targetId:'A:set:0',kg:40},index:0,state:{records:snapshot,rows:[state.latest.row]}});next.push(performance.now()-t);
}
assert.equal(replayCalls,1,'cached render/next-set must not replay/refit history');
const p95=a=>a.sort((x,y)=>x-y)[Math.floor(a.length*.95)];
const report={host:{cpu:os.cpus()[0].model,node:process.version,platform:os.platform(),hardware:'shared cloud host, not an Android device'},records:10000,contexts:100,scopedObservations:observations,replayCalls,snapshotMs,coldReplayMs,cachedLookupP95Ms:p95(lookup),nextSetP95Ms:p95(next),operationGate:'PASS',referenceLatencyGate:coldReplayMs<=250?'PASS':'FAIL',deviceLatencyGate:'UNRUN - physical staging device unavailable'};
if(process.argv.includes('--report'))writeFileSync(new URL('../docs/research/strength-online-learning/performance-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
