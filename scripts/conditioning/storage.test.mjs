import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(new URL('../../apps/athlete/engine/plan-sync.js',import.meta.url),'utf8'),sandbox);const P=sandbox.PlanSync;
test('new HTML workouts, precise physiology and settings round-trip through existing cloud ledger',()=>{const state={library:{templates:[],assignments:{},catalog:{}},checkin:{'2026-09-28':{hrv:48.123,restingHr:54}},whoopHistory:[{date:'2026-09-28',hrv:48.123,rhr:54}],liveWorkoutHistory:[{id:'live-a',date:'2026-09-28',samples:[{t:1,bpm:140}],zoneSeconds:{Blue:30}}],weeklyTargetHistory:[{weekStart:'2026-09-28',zones:{Blue:[100,150],Green:[20,30],Red:[0,5]}}],settings:{liveZones:{blue:90,green:140,red:170,max:190},methodAlerts:{0:'Bell'}}};const plan=P.pack(state),restored=P.applyPlan({library:{},settings:{}},plan);assert.equal(restored.liveWorkoutHistory[0].samples[0].bpm,140);assert.equal(restored.whoopHistory[0].hrv,48.123);assert.equal(restored.checkin['2026-09-28'].restingHr,54);assert.equal(restored.settings.liveZones.green,140);assert.equal(restored.weeklyTargetHistory[0].zones.Blue[1],150);});
test('fitness answers and onboarding completion round-trip through account storage',()=>{
  const state={library:{templates:[],assignments:{},catalog:{}},settings:{
    fitnessProfile:{age:40,cardioFitness:'moderate',goal:'improve',maximumSource:'age-estimated'},
    onboarding:{version:'fitness-onboarding-v1',completed:true,completedAt:'2026-10-03T02:00:00Z'}
  }};
  const plan=JSON.parse(JSON.stringify(P.pack(state)));
  const restored=P.applyPlan({library:{},settings:{}},plan);
  assert.equal(restored.settings.fitnessProfile.age,40);
  assert.equal(restored.settings.fitnessProfile.cardioFitness,'moderate');
  assert.equal(restored.settings.onboarding.completed,true);
  assert.equal(restored.settings.onboarding.completedAt,'2026-10-03T02:00:00Z');
});

test('subjective check-ins and skipped dates round-trip without changing WHOOP physiology',()=>{
  const subjectiveRecovery={sleepQuality:4,soreness:2,wellbeing:5,completedAt:'2026-10-03T09:00:00Z',updatedAt:'2026-10-03T09:00:00Z',model_version:'subjective-recovery-v1',evidenceLabel:'STRENGTHSIDE-DESIGNED'};
  const state={checkin:{'2026-10-03':{whoopRecovery:82,hrv:48.123,restingHr:54,sleepHours:7.25,subjectiveRecovery},'2026-10-02':{subjectiveRecoverySkippedAt:'2026-10-02T09:00:00Z'}},whoopHistory:[{date:'2026-10-03',recovery:82,sleep:7.25}],settings:{}};
  const plan=JSON.parse(JSON.stringify(P.pack(state)));
  const restored=P.applyPlan({library:{},settings:{}},plan);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.checkin['2026-10-03'].subjectiveRecovery)),subjectiveRecovery);
  assert.equal(restored.checkin['2026-10-02'].subjectiveRecoverySkippedAt,'2026-10-02T09:00:00Z');
  assert.equal(restored.checkin['2026-10-03'].whoopRecovery,82);
  assert.equal(restored.checkin['2026-10-03'].sleepHours,7.25);
  assert.equal(restored.whoopHistory[0].recovery,82);
});
