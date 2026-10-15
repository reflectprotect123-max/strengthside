import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadStrength} from './test/strength-harness.mjs';
const {StrengthContext:C,StrengthLoad:L}=loadStrength(['strength-load','strength-context']);
const base={athleteId:'a',exerciseId:'squat',equipmentId:'barbell',convention:'barbell_total'};
const load=(extra={})=>L.normalize({value:40,unit:'kg',convention:'barbell_plates',barKg:20,provenance:'explicit',...extra});

test('tempo notation aliases match but alternating tempos and athletes do not',()=>{
 assert.equal(C.key({...base,tempo:'33x1'}),C.key({...base,tempo:'3-3-X-1'}));
 assert.notEqual(C.key({...base,tempo:'33X1'}),C.key({...base,tempo:'20X1'}));
 assert.notEqual(C.key({...base,tempo:null}),C.key({...base,tempo:'20X1'}));
 assert.notEqual(C.key({...base,tempo:'33X1'}),C.key({...base,athleteId:'b',tempo:'33X1'}));
 assert.equal(C.classifyLegacy({}),'ambiguous_legacy');
});
test('tempo parses four phases, whole seconds, and concentric intent without assigning X a duration',()=>{
 for(const value of ['33x1','3-3-X-1',' 3 - 3 - x - 1 ','3/3/x/1','3,3,X,1','3 3 X 1'])assert.equal(C.tempo(value),'3-3-X-1');
 assert.equal(C.tempo('20X1'),'2-0-X-1');
 assert.equal(C.tempo('10-0-12-0'),'10-0-12-0');
 assert.equal(C.tempo('03-00-x-01'),'3-0-X-1');
 assert.equal(C.tempo('0000'),'0-0-0-0');
 assert.notEqual(C.tempo('33X1'),C.tempo('3331'));
});
test('invalid or absent tempo stays unknown',()=>{
 for(const value of [null,undefined,'',true,3301,{},'XXX1','X301','30XX','30X','33001','3--3-X-1','3-3-X-1-0','-1-0-X-1','3.5-0-X-1','3e1-0-X-1','Infinity-0-X-1','9007199254740992-0-X-1','3/0-X/1']){
  assert.equal(C.tempo(value),null,JSON.stringify(value));
  assert.equal(C.key({...base,tempo:value}),C.key({...base,tempo:null}));
 }
});
test('canonical tuple separates delimiters, dimensions and unknown tempo without title or unit',()=>{
 assert.deepEqual(JSON.parse(C.key({...base,tempo:'20X1'})),['a','squat','barbell','barbell_total','2-0-X-1']);
 assert.notEqual(C.key({...base,athleteId:'a|b',exerciseId:'c'}),C.key({...base,athleteId:'a',exerciseId:'b|c'}));
 for(const change of [{athleteId:'b'},{exerciseId:'front-squat'},{equipmentId:'rack-2'},{convention:'single'}])assert.notEqual(C.key({...base,tempo:'33X1'}),C.key({...base,...change,tempo:'33X1'}));
 assert.equal(C.key({...base,title:'Old title',unit:'lb'}),C.key({...base,title:'Renamed',unit:'kg'}));
});
test('key rejects missing IDs and raw or unknown conventions',()=>{
 for(const field of ['athleteId','exerciseId','equipmentId'])for(const value of [null,undefined,'',' ',4,true,{},' a '])assert.throws(()=>C.key({...base,[field]:value}),/invalid/i);
 for(const convention of [undefined,'','total','barbell_plates','mystery'])assert.throws(()=>C.key({...base,convention}),/invalid/i);
});
test('explicit validated load metadata wins without treating unknown producer versions as a mapping',()=>{
 const normalizedLoad=load();
 assert.equal(C.classifyLegacy({contractVersion:999,normalizedLoad}),'known_legacy_version');
 assert.equal(normalizedLoad.provenance,'explicit');
 for(const payload of [{contractVersion:2},{contractVersion:1},{contractVersion:999},{producerVersion:'c4792bd4'},{provenance:'explicit'},null,[],{normalizedLoad:{...normalizedLoad,version:99}},{normalizedLoad:{...normalizedLoad,externalKg:999}},{normalizedLoad:{...normalizedLoad,eligible:false}},{normalizedLoad:load({provenance:'ambiguous_legacy'})},{normalizedLoad:load({provenance:'known_legacy_version'})}])assert.equal(C.classifyLegacy(payload),'ambiguous_legacy');
});
test('v2 before and after c4792bd4 remains ambiguous regardless of title, magnitude, or date',()=>{
 // 5de771e7 and c4792bd4 both emit contractVersion:2, despite different bar semantics.
 for(const payload of [
  {contractVersion:2,page:{title:'Back Squat',equipmentId:'barbell',loadConvention:'total'},row:{kg:60},date:'2026-10-11'},
  {contractVersion:2,page:{title:'Back Squat',equipmentId:'barbell',loadConvention:'total'},row:{kg:0},date:'2026-10-15'},
  {contractVersion:2,page:{title:'Renamed',equipmentId:'barbell',loadConvention:'total'},row:{kg:5000},date:'2099-01-01'}
 ])assert.equal(C.classifyLegacy(payload),'ambiguous_legacy');
});
test('validated normalized loads retain immutable explicit total and per-hand values',()=>{
 for(const normalized of [load(),load({value:60,convention:'barbell_total'}),load({value:20,convention:'per_hand'}),load({value:0,convention:'added_bodyweight'})]){
  const original=JSON.stringify(normalized);assert.deepEqual(JSON.parse(JSON.stringify(C.normalizeLoad(Object.freeze(normalized)))),JSON.parse(original));assert.equal(JSON.stringify(normalized),original);
 }
 for(const corrupted of [null,{}, {...load(),rawValue:'40'}, {...load(),barKg:'20'}, {...load(),externalKg:Infinity}, {...load(),externalKg:40}, {...load(),version:2}])assert.equal(C.normalizeLoad(corrupted),null);
});
test('audit CLI is aggregate-only, read-only, classifies unknown metadata and rejects mutation flags',()=>{
 const dir=mkdtempSync(join(tmpdir(),'strength-audit-'));
 try {
  const file=join(dir,'records.json');
  const fact={kind:'set',payload:{page:{kind:'lift',title:'Back Squat',logMode:'kg',columns:['reps','weight_kg']},row:{kg:40,reps:6},normalizedLoad:load()}};
  const legacy=kg=>({...fact,payload:{...fact.payload,contractVersion:2,page:{...fact.payload.page,loadConvention:'total'},row:{kg,reps:6},normalizedLoad:undefined}});
  const records=[fact,legacy(60),legacy(0),
   {...fact,payload:{...fact.payload,normalizedLoad:{...load(),version:99}}},
   {...fact,payload:{...fact.payload,normalizedLoad:load({convention:'added_bodyweight'})}},
   {...fact,kind:'session_estimate'},{...fact,deleted:true},
   {...fact,payload:{...fact.payload,row:{kg:null}}},
   {...fact,payload:{...fact.payload,page:{...fact.payload.page,title:'Farmer Carry'}}},
   {...fact,payload:{...fact.payload,page:{...fact.payload.page,columns:{}}}},
   {...fact,payload:{...fact.payload,normalizedLoad:load({value:50})}},null,
   {...fact,payload:{...fact.payload,page:{...fact.payload.page,loadUnit:'lb'},row:{kg:100,reps:6},normalizedLoad:load({value:100,unit:'lb',convention:'barbell_total'})}}
  ];
  const raw=JSON.stringify({records});writeFileSync(file,raw);
  const run=(...args)=>spawnSync(process.execPath,['scripts/audit-strength-evidence.mjs',file,...args],{cwd:new URL('../../',import.meta.url),encoding:'utf8'});
  const result=run();assert.equal(result.status,0,result.stderr);
  assert.deepEqual(JSON.parse(result.stdout),{total:13,known:2,ambiguous:3,unsupported:8});
  assert.equal(readFileSync(file,'utf8'),raw);assert.ok(!result.stdout.includes('Back Squat'));
  assert.notEqual(run('--backfill').status,0);
  for(const shape of [[fact],{records:{one:fact}}]){
   writeFileSync(file,JSON.stringify(shape));const result=run();assert.equal(result.status,0,result.stderr);
   assert.deepEqual(JSON.parse(result.stdout),{total:1,known:1,ambiguous:0,unsupported:0});
  }
  writeFileSync(file,'{}');assert.notEqual(run().status,0);
  writeFileSync(file,'bad json');assert.notEqual(run().status,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
