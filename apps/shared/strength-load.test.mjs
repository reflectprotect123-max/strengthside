import test from 'node:test';
import assert from 'node:assert/strict';
import {loadStrength} from './test/strength-harness.mjs';

const {StrengthLoad:L}=loadStrength(['strength-load']);
const plain=value=>JSON.parse(JSON.stringify(value));
const input=(value,convention='single',extra={})=>({value,unit:'kg',convention,provenance:'explicit',...extra});

test('empty bar and historical total have different raw values but honest physical loads',()=>{
  const empty=L.normalize(input(0,'barbell_plates',{barKg:20}));
  const old=L.normalize(input(60,'barbell_total',{barKg:20,provenance:'known_legacy_version'}));
  assert.equal(empty.externalKg,20);assert.equal(old.externalKg,60);
  assert.equal(L.displayKg(old,'barbell_plates',20),40);
  assert.equal(L.normalize(input(null)),null);
});

test('15 and 20 kg bars keep display plates and physical mass reversible',()=>{
  for(const barKg of [15,20])for(const value of [0,2.5,20,60,1000]) {
    const normalized=L.normalize(input(value,'barbell_plates',{barKg}));
    assert.equal(normalized.externalKg,value+barKg);
    assert.equal(L.displayKg(normalized,'barbell_plates',barKg),value);
    assert.equal(L.displayKg(normalized,'barbell_total'),value+barKg);
    const otherBar=barKg===15?20:15,otherPlates=value+barKg-otherBar;
    assert.equal(L.displayKg(normalized,'barbell_plates',otherBar),otherPlates<0?null:otherPlates);
  }
});

test('lb converts once with the exact factor and keeps raw units',()=>{
  const normalized=L.normalize(input('100','barbell_total',{unit:'lb'}));
  assert.deepEqual(plain(normalized),{version:3,rawValue:100,rawUnit:'lb',convention:'barbell_total',externalKg:100*0.45359237,barKg:null,provenance:'explicit',eligible:true});
  const plates=L.normalize(input(10,'barbell_plates',{unit:'lb',barKg:20}));
  assert.equal(plates.externalKg,10*0.45359237+20);
  assert.ok(Math.abs(L.displayKg(plates,'barbell_plates',20)-10*0.45359237)<1e-12);
});

test('per-hand dumbbells, single loads and zero added dip retain their load meaning',()=>{
  for(const convention of ['per_hand','single','added_bodyweight']) {
    const normalized=L.normalize(input(20,convention));
    assert.equal(normalized.externalKg,20);assert.equal(normalized.barKg,null);
    assert.equal(L.displayKg(normalized,convention),20);
  }
  const dip=L.normalize(input(0,'added_bodyweight'));
  assert.equal(dip.rawValue,0);assert.equal(dip.externalKg,0);
  assert.equal(L.displayKg(dip,'added_bodyweight'),0);
  assert.equal(L.displayKg(dip,'barbell_total'),null);
});

test('missing, nonnumeric, infinite and negative values never become zero actuals',()=>{
  for(const value of [null,undefined,'',' \t\n ',true,false,NaN,Infinity,-Infinity,-1,'-1','bad',[],{},[0]]) {
    assert.equal(L.normalize(input(value)),null,`invalid ${String(value)}`);
  }
  assert.equal(L.normalize(),null);assert.equal(L.normalize(null),null);
  assert.equal(L.normalize(input('0')).externalKg,0);
});

test('corrupt or absent metadata cannot invent a load convention or bar mass',()=>{
  for(const unit of [undefined,null,'','lbs','KG',true])assert.equal(L.normalize(input(20,'single',{unit})),null);
  for(const convention of [undefined,null,'','total','assistance','Barbell_Plates'])assert.equal(L.normalize({...input(20),convention}),null);
  for(const provenance of [undefined,null,'','legacy','Explicit',true])assert.equal(L.normalize(input(20,'single',{provenance})),null);
  for(const barKg of [undefined,null,'',true,false,NaN,Infinity,-20,0]) {
    assert.equal(L.normalize(input(0,'barbell_plates',{barKg})),null);
  }
  assert.equal(L.normalize(input(60,'barbell_total',{barKg:-20})),null);
  assert.equal(L.normalize(input(Number.MAX_VALUE,'barbell_plates',{barKg:Number.MAX_VALUE})),null);
  assert.equal(L.normalize({...input(60),convention:undefined,title:'Barbell Bench Press',equipmentId:'barbell'}),null);
});

test('ambiguous legacy remains readable but excluded; only declared provenance is eligible',()=>{
  const legacy=L.normalize(input(60,'barbell_total',{provenance:'ambiguous_legacy'}));
  assert.equal(legacy.rawValue,60);assert.equal(legacy.externalKg,60);assert.equal(legacy.eligible,false);
  assert.equal(L.displayKg(legacy,'barbell_plates',20),40);
  assert.equal(L.normalize(input(60,'barbell_total',{provenance:'known_legacy_version'})).eligible,true);
});

test('normalization and display preserve frozen raw actuals and metadata',()=>{
  const raw=Object.freeze(input('40','barbell_plates',{barKg:20,id:'set-1',revision:4}));
  const before=JSON.stringify(raw),normalized=Object.freeze(L.normalize(raw));
  assert.equal(L.displayKg(normalized,'barbell_plates',15),45);
  assert.equal(JSON.stringify(raw),before);assert.equal(normalized.rawValue,40);
  assert.deepEqual(plain(raw),{value:'40',unit:'kg',convention:'barbell_plates',barKg:20,provenance:'explicit',id:'set-1',revision:4});
});

test('display rejects corrupt envelopes, invalid bars and incompatible load meanings',()=>{
  const normalized=L.normalize(input(60,'barbell_total',{barKg:20}));
  for(const value of [null,undefined,{}, {...normalized,version:2},{...normalized,externalKg:NaN},{...normalized,externalKg:-1},{...normalized,externalKg:'60'},{...normalized,convention:'total'},{...normalized,rawUnit:'bad'},{...normalized,provenance:'bad'},{...normalized,eligible:false},{...normalized,barKg:'20'}]) {
    assert.equal(L.displayKg(value,'barbell_total'),null);
  }
  for(const barKg of [null,undefined,0,-20,NaN,Infinity,'',true])assert.equal(L.displayKg(normalized,'barbell_plates',barKg),null);
  assert.equal(L.displayKg(normalized,'barbell_plates',70),null);
  assert.equal(L.displayKg(normalized,'total'),null);
  assert.equal(L.displayKg(normalized,'per_hand'),null);
  assert.equal(L.displayKg(L.normalize(input(20,'per_hand')),'single'),null);
});

test('shared harness loads dependencies once and never silently skips missing extras',()=>{
  const root=loadStrength(['strength-load','strength-load']);
  for(const name of ['TrainingCore','StrengthTargets','StrengthEquipment','StrengthRTS','StrengthPolicy','StrengthLoad','StrengthBrainCore'])assert.ok(root[name],name);
  assert.throws(()=>loadStrength(['missing-strength-module']),/ENOENT/);
});
