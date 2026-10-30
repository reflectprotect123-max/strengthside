import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root={};
vm.runInNewContext(readFileSync(new URL('./strength-equipment.js',import.meta.url),'utf8'),{window:root});
const E=root.StrengthEquipment;
const db={equipmentId:'dumbbell',loadConvention:'per_hand',loadUnit:'kg'};
const plain=value=>JSON.parse(JSON.stringify(value));

test('per-hand dumbbell ladder advances by 1 then 2.5 without an arbitrary ceiling',()=>{
 for(let kg=1;kg<10;kg++)assert.equal(E.next(kg,db),kg+1);
 assert.equal(E.next(10,db),12.5);assert.equal(E.next(12.5,db),15);assert.equal(E.next(15,db),17.5);
 assert.equal(E.next(1000,db),1002.5);assert.equal(E.floor(1001,db),1000);
 assert.equal(E.next(1e12,db),1e12+2.5);assert.equal(E.floor(1e12+1,db),1e12);
 assert.equal(E.round(1e12+2.5,1e12,db,{upCap:.15,downCap:.15}),1e12+2.5);
 assert.ok(E.profile(db).loads.length<=14);
 assert.equal(E.floor(.5,db),null);assert.equal(E.floor(18,db),17.5);
});
test('manual actual overrides hold without manufacturing a custom rack',()=>{
 assert.equal(E.round(18,18,db,{upCap:.15,downCap:.15}),18);
 assert.equal(E.next(18,db),20);assert.equal(E.floor(19,db),17.5);
 assert.equal(E.round(18.1,18,db,{upCap:.05,downCap:.15}),18);
 assert.equal(E.round(18,18,{equipmentId:'unknown'}),18);
});
test('explicit rack supersedes inferred loads and filters invalid entries without mutation',()=>{
 const page={...db,availableLoads:Object.freeze([18,6,NaN,-1,Infinity,6,null,'',true,'12'])};Object.freeze(page);
 assert.deepEqual(plain(E.profile(page).loads),[6,12,18]);
 assert.equal(E.next(6,page),12);assert.equal(E.floor(10,page),6);assert.equal(E.next(18,page),null);
 assert.equal(E.next(10,{...db,availableLoads:[]}),12.5);
 assert.equal(E.next(10,{...db,availableLoads:[NaN,-1,null]}),12.5);
});
test('upward caps hold and coarse downward reductions stop at known minimum',()=>{
 assert.equal(E.round(12.5,10,db,{upCap:.15,downCap:.15}),10);
 assert.equal(E.round(12.5,10,db,{upCap:.25,downCap:.15}),12.5);
 const page={...db,availableLoads:[5,10,20]};
 assert.equal(E.round(18,20,page,{upCap:.15,downCap:.05}),10);
 assert.equal(E.round(1,5,page,{upCap:.15,downCap:.05}),5);
 assert.equal(E.round(14,20,page,{upCap:.15,downCap:.05}),10);
});
test('declared bar minima and offsets are respected',()=>{
 const bar={equipmentId:'barbell',loadConvention:'total',loadUnit:'kg',minimumKg:20,equipmentStepKg:2.5,title:'Bench Press'};
 assert.equal(E.starter(bar).kg,0);assert.equal(E.label(bar,0),'empty bar');assert.equal(E.label(bar,20),'20');
 assert.equal(E.floor(0,bar),0);assert.equal(E.next(0,bar),2.5);assert.equal(E.floor(19,bar),17.5);assert.equal(E.next(20,bar),22.5);
 assert.equal(E.next(1000,bar),1002.5);assert.equal(E.round(1,20,bar,{downCap:.1}),17.5);
 assert.equal(E.next(15,{...bar,minimumKg:15}),17.5);
 assert.equal(E.starter({...bar,minimumKg:undefined}).kg,null);
 assert.equal(E.starter({...bar,minimumKg:undefined,barWeightKg:15}).kg,0);
 assert.equal(E.starter({...bar,minimumKg:20,barWeightKg:15}).kg,0);
 assert.equal(E.label({...bar,minimumKg:15},0),'empty bar');
 assert.equal(E.floor(17,{...bar,minimumKg:15,equipmentStepKg:4}),16);
 assert.equal(E.next(0,{...bar,minimumKg:15,equipmentStepKg:4}),4);
});
test('versioned provisional exercise starters use exact conventions and defaults',()=>{
 for(const [title,kg] of [['Lateral Raise',2],['Dumbbell Curl',4],['Dumbbell Bench Press',5],['DB Overhead Press',4],['DB Row',6]]) {
  const result=E.starter({...db,title});assert.equal(result.kg,kg);assert.equal(result.confidence,'provisional');assert.ok(result.reason);
 }
 assert.equal(E.starter({...db,loadConvention:'single',title:'Goblet Squat'}).kg,6);
 assert.equal(E.starter({...db,equipmentId:undefined,title:'DB Bench Press'}).kg,5);
 assert.equal(E.starter({...db,equipmentId:'machine',title:'DB Bench Press'}).kg,null);
 assert.equal(E.starter({...db,equipmentId:' Dumbbell ',title:'DB Bench Press'}).kg,5);
 assert.equal(E.next(10,{...db,equipmentId:' Dumbbell '}),12.5);
 assert.equal(E.starter({...db,title:'Bench Press',availableLoads:[2,4,6]}).kg,4);
 assert.equal(E.starter({...db,title:'Farmer Carry'}).kg,8);
 assert.equal(E.starter({...db,loadConvention:'single',title:'Suitcase Carry'}).kg,8);
 assert.equal(E.starter({equipmentId:'kettlebell',loadConvention:'single',loadUnit:'kg',title:'Kettlebell Swing'}).kg,8);
 assert.equal(E.starter({equipmentId:'kettlebell',loadConvention:'single',loadUnit:'kg',title:'Kettlebell Goblet Squat'}).kg,6);
 // Kettlebells come in real bell sizes; 4 kg is the lightest.
 assert.equal(E.floor(5,{equipmentId:'kettlebell',loadConvention:'per_hand',loadUnit:'kg'}),4);
});
test('unknown equipment, units, conventions and unrelated exercises do not start or convert',()=>{
 for(const page of [{equipmentId:'machine',title:'Press'},{...db,loadUnit:'lb',title:'DB Bench Press'},{...db,loadConvention:'total',title:'DB Bench Press'},{...db,loadConvention:'assistance',title:'DB Row'},{...db,loadConvention:undefined,title:'DB Curl'},{...db,title:'DB Deadlift'},{...db,loadConvention:'single',title:'DB Curl'}]) {
  const result=E.starter(page);assert.equal(result.kg,null);assert.equal(result.confidence,'unknown');
 }
 assert.equal(E.next(10,{...db,loadConvention:'total'}),null);
 assert.equal(E.profile({...db,loadUnit:'lb'}).unit,'lb');assert.equal(E.profile({...db,loadConvention:'total'}).convention,'total');
});
test('dumbbell and kettlebell ramps sit near half and three quarters of the work weight',()=>{
 const kb={equipmentId:'kettlebell',loadConvention:'single',loadUnit:'kg'};
 assert.deepEqual(plain(E.ramps(5,db)),[3,4]);
 assert.deepEqual(plain(E.ramps(6,kb)),[4,null]);
 assert.deepEqual(plain(E.ramps(16,kb)),[8,12]);
 assert.deepEqual(plain(E.ramps(2,db)),[1,null]);
 assert.deepEqual(plain(E.ramps(1,db)),[null,null]);
 assert.deepEqual(plain(E.ramps(5,{...db,minimumKg:4})),[4,null]);
 assert.deepEqual(plain(E.ramps(10,{...db,availableLoads:[8,12]})),[8,null]);
 assert.deepEqual(plain(E.ramps(20,{...db,availableLoads:[5,10,15,20]})),[10,15]);
 assert.deepEqual(plain(E.ramps(0,db)),[null,null]);
 assert.deepEqual(plain(E.ramps(null,db)),[null,null]);
});
test('invalid numeric values never become automatic loads',()=>{
 for(const value of [NaN,Infinity,-1,null,undefined,'',true]){
  assert.equal(E.floor(value,db),null);assert.equal(E.next(value,db),null);assert.equal(E.round(value,10,db),null);assert.equal(E.round(10,value,db),null);
 }
});

test('legacy unspecified rack uses declared generic steps without inventing a starter',()=>{
 const page={equipmentStepKg:2.5,minimumKg:0,loadUnit:'kg',loadConvention:'total',availableLoads:[],title:'Squat'};
 assert.equal(E.next(40,page),42.5);assert.equal(E.round(42.5,40,page,{upCap:.1}),42.5);
 assert.equal(E.starter(page).kg,null);
 const offset={...page,minimumKg:3,equipmentStepKg:4};
 assert.equal(E.floor(10,offset),7);assert.equal(E.next(7,offset),11);
 assert.equal(E.floor(2,offset),null);assert.equal(E.round(1,3,offset,{downCap:.1}),3);
 assert.equal(E.next(1e12+3,offset),1e12+7);
});

test('explicit canonical bar conventions keep their grids in the displayed units',()=>{
 for(const barWeightKg of [15,20]) {
  const page={equipmentId:'barbell',loadConvention:'barbell_plates',loadUnit:'kg',barWeightKg,equipmentStepKg:2.5,title:'Bench Press'};
  assert.equal(E.floor(0,page),0);assert.equal(E.next(0,page),2.5);
  assert.equal(E.starter(page).kg,0);assert.equal(E.label(page,0),'empty bar');
  const total={...page,loadConvention:'barbell_total'};
  assert.equal(E.floor(barWeightKg-1,total),null);
  assert.equal(E.floor(barWeightKg,total),barWeightKg);
  assert.equal(E.next(barWeightKg,total),barWeightKg+2.5);
  assert.equal(E.starter(total).kg,barWeightKg);assert.equal(E.label(total,barWeightKg),'empty bar');
  assert.equal(E.label(total,0),'0');
  assert.deepEqual(plain(E.profile({...page,availableLoads:[0,10,20]}).loads),[0,10,20]);
 }
});

test('canonical bar mass is explicit and positive without changing legacy total semantics',()=>{
 const page={equipmentId:'barbell',loadConvention:'barbell_plates',loadUnit:'kg',equipmentStepKg:2.5,title:'Squat'};
 for(const barWeightKg of [undefined,null,0,-15,NaN,Infinity,true,'']) {
  assert.equal(E.starter({...page,barWeightKg}).kg,null);
  assert.equal(E.next(0,{...page,barWeightKg}),null);
 }
 assert.equal(E.next(0,{...page,barWeightKg:0,minimumKg:0}),null);
 assert.equal(E.next(0,{...page,barWeightKg:-15,minimumKg:20}),null);
 const legacy={...page,loadConvention:'total',minimumKg:20,equipmentStepKg:2.5};
 assert.equal(E.starter(legacy).kg,0);assert.equal(E.next(0,legacy),2.5);
 assert.equal(E.profile(legacy).convention,'total');assert.equal(E.label(legacy,0),'empty bar');
});
