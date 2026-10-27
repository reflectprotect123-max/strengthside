import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root={};
vm.runInNewContext(readFileSync(new URL('./strength-notes.js',import.meta.url),'utf8'),{window:root});
const N=root.StrengthNotes;

test('parse rest, timed sets, RPE bands, superset and 1RM from notes',()=>{
 const p=N.parse(['3 x 45 sec','Rest 60s','RPE 6/7/8/8-9','Superset with DB RDL','70% of 1RM 100kg']);
 assert.equal(p.restSec,60);
 assert.equal(p.setCount,3);
 assert.equal(p.seconds,45);
 assert.equal(p.efforts.join(','),'easy,average,hard,hard');
 assert.equal(p.supersetWith,'DB RDL');
 assert.equal(p.oneRm,100);
 assert.equal(p.percent,70);
});

test('a lift tempo like 20X1 is not a 20 x 1 set scheme',()=>{
 const p=N.parse('10 / 8 / 6 / AMRAP · 20X1');
 assert.equal(p.schemeReps,null);
 assert.equal(p.setCount,null);
 assert.equal(N.parse('3 x 5 · 33X1').schemeReps,5);
 assert.equal(N.parse('3 x 5 · 33X1').setCount,3);
});

test('decode common UTF-8 em dash mojibake',()=>{
 assert.equal(N.decode('Ibex â€” Sat 24 Oct'),'Ibex — Sat 24 Oct');
});

test('decode leftover mojibake does not become a straight quote',()=>{
 const leftover=N.decode('keep â€ leftover');
 assert.ok(!leftover.includes('"'),leftover);
 assert.equal(N.decode('Ibex â€” Sat 24 Oct'),'Ibex — Sat 24 Oct');
});

test('parse rest after the duration and Rest: N',()=>{
 assert.equal(N.parse('90 seconds rest').restSec,90);
 assert.equal(N.parse('Rest: 60').restSec,60);
 assert.equal(N.parse('Rest 90s').restSec,90);
});

test('parse ibex percentage patterns into structured ranges',()=>{
 const straight=N.parse('4 x 8 @ 63-68% (RPE 6)');
 assert.equal(straight.pctLow,63);assert.equal(straight.pctHigh,68);assert.equal(straight.percentMode,'straight');
 assert.equal(straight.percentSets.length,4);assert.equal(straight.rpe,6);
 const build=N.parse('start at 78% and build over the 4 sets');
 assert.equal(build.percentMode,'build');assert.equal(build.startPct,78);
 const wave=N.parse('Set 1 3 @ 55-60%\nSet 5 heavy 3 @ 85-90%');
 assert.equal(wave.percentMode,'build');assert.equal(wave.percentSets[0].pctLow,55);assert.equal(wave.percentSets.at(-1).pctLow,85);
 const back=N.parse('4x2 @ 90-92% + 1 x 8 at 65% of the top set');
 assert.equal(back.percentSets.length,5);assert.equal(back.percentSets[4].pctLow,65);assert.equal(back.percentSets[4].percentBasis,'top_set');
 const other=N.parse('30-40% of your back squat 1RM');
 assert.equal(other.pctLow,30);assert.equal(other.pctHigh,40);assert.equal(other.percentBasis,'other_lift');assert.match(other.basisLift,/back squat/i);
 const drop=N.parse('80% of your 6-rep weight');
 assert.equal(drop.percentBasis,'rep_weight');assert.equal(drop.basisReps,6);
});

test('Rest 60s does not become a seconds target',()=>{
 const p=N.parse('Rest 60s');
 assert.equal(p.restSec,60);assert.equal(p.seconds,null);
});

test('unnamed drop set after 2 x 2 @ 90-92% appends a drop',()=>{
 const p=N.parse('2 x 2 @ 90-92% + drop set');
 assert.equal(p.percentSets.length,3);
 assert.equal(p.percentSets.filter(s=>s.setRole==='drop').length,1);
 assert.equal(p.percentSets.filter(s=>!s.setRole).length,2);
});
