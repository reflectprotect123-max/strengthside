import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({stdin:{contents:"export * from '../_shared/history.ts'; export * from '../_shared/whoop-steps.ts';",resolveDir:import.meta.dirname},bundle:true,write:false,format:'esm',platform:'node'});
const {dailyPhysiology,stepsFromTrend,fetchPersonalSteps}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const sleep=(id,extra={})=>({id,nap:false,score_state:'SCORED',end:'2026-10-03T23:00:00Z',timezone_offset:'+10:00',score:{stage_summary:{total_light_sleep_time_milli:14400000,total_slow_wave_sleep_time_milli:7200000,total_rem_sleep_time_milli:3600000,total_awake_time_milli:3600000}},...extra});
test('sleep is actual stage duration on recovery date, otherwise local wake date; naps and unscored/incomplete records excluded',()=>{
  const rows=dailyPhysiology([{sleep_id:'main',cycle_id:1,score:{recovery_score:80}}],[{id:1,start:'2026-10-02T23:00:00Z',timezone_offset:'+10:00'}],[sleep('main'),sleep('standalone'),sleep('nap',{nap:true}),sleep('pending',{score_state:'PENDING_SCORE'}),sleep('missing',{score:{stage_summary:{total_light_sleep_time_milli:1}}})]);
  assert.deepEqual(rows.map(r=>[r.date,r.sleep]),[['2026-10-03',7],['2026-10-04',7]]);
  assert.equal(rows[0].sleepId,'main');assert.equal(rows[1].sleepId,'standalone');
});
const point=(date,value)=>({data_scrubber_details:{primary_contextual_display:date,value_display:value}});
const trend=points=>({week_time_segment:{graph:{plots:[{plot:{segments:[{points}]}}]}}});
test('steps retain zero and commas; ignore ambiguous dates, future readings and aggregate windows',()=>{
  const input=trend([point('2026-10-01','1,644'),point('October 2, 2026','0'),point('Oct 3','99'),point('Today','42'),point('2026-10-05','999'),point('2026-10-03','—'),point('2026-99-99','4'),point('February 30, 2026','5')]);
  input.year_time_segment=trend([point('2026-10-03','200')]).week_time_segment;
  assert.deepEqual(stepsFromTrend(input,'2026-10-03').map(r=>[r.date,r.steps]),[['2026-10-01',1644],['2026-10-02',0]]);
  assert.throws(()=>stepsFromTrend(trend([point('2026-10-01','1'),point('2026-10-01','2')]),'2026-10-03'));
});
test('private feed checks app owner and WHOOP account identity; expired sessions never expose credentials',async()=>{
  globalThis.Deno={env:{get:k=>({WHOOP_STEPS_OWNER:'s:owner',WHOOP_PRIVATE_ACCESS_TOKEN:'synthetic-private-token'})[k]}};
  const original=globalThis.fetch;let calls=0,privateId=7,expired=false,trendCalls=0;
  try{
    globalThis.fetch=async(url,options)=>{
      calls++;const path=new URL(url).pathname;assert.equal(options.method,undefined);
      if(path.endsWith('/user/profile')){assert.equal(options.headers.authorization,'Bearer synthetic-public-token');return Response.json({user_id:7});}
      assert.equal(options.headers.authorization,'Bearer synthetic-private-token');
      if(path.endsWith('/bootstrap'))return expired?new Response('private upstream details',{status:401}):Response.json({user:{id:privateId}});
      assert.equal(path,'/progression-service/v3/trends/STEPS');trendCalls++;return Response.json(trend([point('2026-10-03','1234')]));
    };
    assert.equal((await fetchPersonalSteps('s:other','2026-10-03','synthetic-public-token')).status,'not_configured');assert.equal(calls,0);
    privateId=8;assert.equal((await fetchPersonalSteps('s:owner','2026-10-03','synthetic-public-token')).status,'account_mismatch');assert.equal(trendCalls,0);
    expired=true;assert.deepEqual(await fetchPersonalSteps('s:owner','2026-10-03','synthetic-public-token'),{rows:[],status:'reauth_required'});assert.equal(trendCalls,0);
    expired=false;privateId=7;assert.equal((await fetchPersonalSteps('s:owner','2026-10-03','synthetic-public-token')).rows[0].steps,1234);assert.equal(trendCalls,1);
  }finally{globalThis.fetch=original;}
});
