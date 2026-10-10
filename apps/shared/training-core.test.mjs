import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const root={};vm.runInNewContext(readFileSync(new URL('./training-core.js',import.meta.url),'utf8'),{window:root});const C=root.TrainingCore;
test('every coach metric resolves to one athlete definition',()=>{for(const k of C.coachKinds)assert.ok(C.metric(k.key));assert.equal(C.canonical('distance_m'),'meters');assert.equal(C.canonical('time_sec'),'seconds');});
test('numeric entry replaces seed, keeps decimals, restricts ranges and formats time',()=>{
 let p=C.numberEntry(40,{key:'weight_kg'});for(const k of ['3','2','.','5'])p=C.numberKey(p,k);assert.equal(p.buffer,'32.5');
 p=C.numberEntry(8,{key:'reps'});p=C.numberKey(p,'–');assert.equal(p.buffer,'8');
 p=C.numberEntry(null,{key:'reps',range:true});for(const k of ['6','–','8'])p=C.numberKey(p,k);assert.equal(p.buffer,'6-8');
 p=C.numberEntry(null,{key:'time_mmss'});for(const k of ['1',':','3','0'])p=C.numberKey(p,k);assert.equal(C.parse(p.buffer,p.key),90);assert.equal(C.format(90,p.key),'1:30');assert.equal(C.parse('1:75',p.key),null);
});
test('required metrics and actual effort determine completion without invented repetitions',()=>{
 assert.equal(C.validateRow({cells:{seconds:30},effort:'hard'},{columns:['seconds']}).ok,true);
 assert.equal(C.validateRow({cells:{meters:40},kg:20,effort:'average'},{columns:['meters','weight_kg']}).ok,true);
 assert.equal(C.validateRow({reps:10,cells:{weight_lb:40},effort:'hard'},{columns:['reps','weight_lb']}).ok,true);
 assert.equal(C.validateRow({reps:10,kg:40,effort:'hard'},{columns:['reps','weight_lb']}).ok,false);
 assert.equal(C.validateRow({reps:8,kg:40},{logMode:'kg'}).ok,false);
 assert.equal(C.validateRow({reps:8.5,kg:40,effort:'hard'},{logMode:'kg'}).ok,false);
 assert.equal(C.validateRow({cells:{seconds:-1},effort:'hard'},{columns:['seconds']}).ok,false);
 assert.equal(C.validateRow({miss:true},{columns:['seconds']}).ok,true);
});
test('all numeric metrics support valid actual values and reject blanks',()=>{for(const m of C.definitions.filter(x=>x.input!=='completion')){assert.notEqual(C.parse('10',m.key),null,m.key);assert.equal(C.parse('',m.key),null,m.key);}assert.equal(C.parse('-2.5','lwp'),-2.5);assert.equal(C.parse('-2.5','weight_kg'),null);});

test('older pound/percentage values survive migration without changing completed flags or converting units',()=>{
 const s={pages:[{id:'A',columns:['reps','weight_lb']}],logs:{A:{sets:[{reps:10,kg:40,cells:{},logged:false}]}}};
 C.migrateSession(s);const row=s.logs.A.sets[0];assert.equal(row.cells.weight_lb,40);assert.equal(row.kg,null);assert.equal(row.logged,false);assert.equal(s.pages[0].loadUnit,'lb');
 C.migrateSession(s);assert.equal(row.cells.weight_lb,40);
 const ambiguous={pages:[{id:'A',columns:['weight_kg','weight_lb']}],logs:{A:{sets:[{kg:40,cells:{},logged:true}]}}};C.migrateSession(ambiguous);assert.equal(ambiguous.logs.A.sets[0].kg,40);assert.equal(ambiguous.logs.A.sets[0].cells.weight_lb,undefined);
});
