import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const window={};vm.runInNewContext(readFileSync(new URL('./zones.js',import.meta.url),'utf8'),{window});
const zones=window.EngineZones;
test('Karvonen uses heart-rate reserve, not a percentage of max HR',()=>{
  const result=zones.karvonen(190,50);
  assert.equal(result.blue,120);assert.equal(result.green,148);assert.equal(result.red,169);
  assert.equal(result.reserve,140);assert.equal(result.estimated,true);
  assert.equal(result.evidenceLabel,'STRENGTHSIDE-DESIGNED');
});
test('missing/invalid physiology does not invent a baseline',()=>{
  for(const pair of [[190,null],[190,0],[190,190],[NaN,50],[190.5,50],[301,50],[55,50]])assert.equal(zones.karvonen(...pair),null);
  assert.equal(zones.settings(190,null,{settings:{},whoopHistory:[]},'2026-10-03'),null);
});
test('rounded boundaries remain strictly ordered across supported profiles',()=>{
  for(let max=80;max<=250;max++)for(let rest=30;rest<=Math.min(110,max-10);rest++){
    const z=zones.karvonen(max,rest);assert.ok(z.blue<z.green&&z.green<z.red&&z.red<z.max);
  }
});
test('WHOOP average includes 28 days, excludes future/old/invalid data and counts a day once',()=>{
  const state={settings:{},whoopHistory:[{date:'2026-09-05',rhr:99,source:'WHOOP account'},
    {date:'2026-09-06',rhr:50,source:'WHOOP export'},{date:'2026-10-03',rhr:60,source:'WHOOP account'},
    {date:'2026-10-04',rhr:100,source:'WHOOP account'},{date:'2026-10-02',rhr:0,source:'WHOOP account'},
    {date:'2026-10-01',rhr:100,source:'Other sensor'}],checkin:{'2026-10-03':{restingHr:60,whoopSyncedAt:'yes'}}};
  const baseline=zones.restingBaseline(state,'2026-10-03');assert.equal(baseline.resting,55);assert.equal(baseline.samples.length,2);
  state.settings.liveZones=zones.settings(190,null,state,'2026-10-03');
  const z=zones.profile(state,'2026-10-03');assert.equal(z.resting,55);assert.equal(z.baseline_inputs.length,2);
  state.whoopHistory.push({date:'2026-10-02',rhr:70,source:'WHOOP account'});
  assert.equal(zones.profile(state,'2026-10-03').resting,60);
});
test('explicit resting-HR override is retained and old custom zones are not silently replaced',()=>{
  const state={settings:{liveZones:{blue:96,green:149,red:166,max:192}},whoopHistory:[{date:'2026-10-03',rhr:60,source:'WHOOP account'}]};
  assert.equal(zones.profile(state,'2026-10-03').green,149);
  state.settings.liveZones=zones.settings(190,50,state,'2026-10-03');
  const z=zones.profile(state,'2026-10-03');assert.equal(z.green,148);assert.equal(z.restingSource,'Manual resting HR');
  assert.equal(z.baseline_window,null);
});
