import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({stdin:{contents:"export * from '../_shared/history.ts';",resolveDir:import.meta.dirname},bundle:true,write:false,format:'esm',platform:'node'});
const {dailyPhysiology}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const sleep=(id,extra={})=>({id,nap:false,score_state:'SCORED',end:'2026-10-03T23:00:00Z',timezone_offset:'+10:00',score:{stage_summary:{total_light_sleep_time_milli:14400000,total_slow_wave_sleep_time_milli:7200000,total_rem_sleep_time_milli:3600000,total_awake_time_milli:3600000}},...extra});
test('sleep is actual stage duration on recovery date, otherwise local wake date; naps and unscored/incomplete records excluded',()=>{
  const rows=dailyPhysiology([{sleep_id:'main',cycle_id:1,score:{recovery_score:80}}],[{id:1,start:'2026-10-02T23:00:00Z',timezone_offset:'+10:00'}],[sleep('main'),sleep('standalone'),sleep('nap',{nap:true}),sleep('pending',{score_state:'PENDING_SCORE'}),sleep('missing',{score:{stage_summary:{total_light_sleep_time_milli:1}}})]);
  assert.deepEqual(rows.map(r=>[r.date,r.sleep]),[['2026-10-03',7],['2026-10-04',7]]);
  assert.equal(rows[0].sleepId,'main');assert.equal(rows[1].sleepId,'standalone');
});
test('official top-level cycle steps preserve zero/local dates, skip null and invalid values, and use the newest observation without summing',()=>{
  const cycle=(id,steps,extra={})=>({id,step_count:steps,start:'2026-10-02T23:00:00Z',timezone_offset:'+10:00',updated_at:'2026-10-03T10:00:00Z',...extra});
  const rows=dailyPhysiology([], [cycle(1,100),cycle(2,0,{updated_at:'2026-10-03T11:00:00Z'}),cycle(3,null),cycle(4,-1),cycle(5,1.5),cycle(6,undefined),cycle(7,'100')]);
  assert.equal(rows.length,1);assert.equal(rows[0].date,'2026-10-03');assert.equal(rows[0].steps,0);assert.equal(rows[0].stepsCycleId,2);
  assert.equal(rows[0].sources.steps,'WHOOP official API');
  assert.equal(dailyPhysiology([], [cycle(1,null)]).length,0);
});
