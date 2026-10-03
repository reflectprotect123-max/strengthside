import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const window={};
vm.runInNewContext(readFileSync(new URL('./home-data.js',import.meta.url),'utf8'),{window});
const select=window.EngineHome.selection;
test('latest actual WHOOP data is dated, preserves zero recovery and supersedes a manual entry on Home',()=>{
  const yesterday={date:'2026-10-02',source:'WHOOP account',recovery:0,hrv:48.123,rhr:54};
  const result=select([yesterday,{date:'2026-10-03',source:'Manual WHOOP entry',recovery:90}],'2026-10-03','2026-10-03');
  assert.equal(result.row,yesterday);assert.equal(result.date,'2026-10-02');assert.equal(result.stale,true);
  assert.equal(result.row.recovery,0);assert.equal(result.row.hrv,48.123);
});
test('today’s WHOOP observation displays without a stale label',()=>{
  const row={date:'2026-10-03',source:'WHOOP account',recovery:80};
  const result=select([row],'2026-10-03','2026-10-03');assert.equal(result.row,row);assert.equal(result.stale,false);
});
test('historical date selection stays on the chosen day',()=>{
  const old={date:'2026-10-01',source:'WHOOP account',hrv:40},recent={date:'2026-10-03',source:'WHOOP account',hrv:50};
  assert.equal(select([old,recent],'2026-10-01','2026-10-03').row,old);
});
test('future or empty WHOOP readings cannot fill the Home cards',()=>{
  const result=select([{date:'2026-10-04',source:'WHOOP account',recovery:90},{date:'2026-10-02',source:'WHOOP account',hrv:null}],'2026-10-03','2026-10-03');
  assert.equal(result.row.recovery,undefined);assert.equal(result.row.hrv,undefined);
});
test('each Home metric keeps its own observation date when steps refresh before physiology',()=>{
  const result=select([{date:'2026-10-02',source:'WHOOP account',hrv:48,sleep:7.25},{date:'2026-10-03',source:'WHOOP account',steps:0,sources:{steps:'WHOOP private feed'}}],'2026-10-03','2026-10-03');
  assert.deepEqual(JSON.parse(JSON.stringify(result.metrics.hrv)),{value:48,date:'2026-10-02',source:'WHOOP account'});
  assert.equal(result.metrics.steps.value,0);assert.equal(result.metrics.steps.date,'2026-10-03');assert.equal(result.metrics.steps.source,'WHOOP private feed');
  assert.equal(result.metrics.sleep.value,7.25);
});
