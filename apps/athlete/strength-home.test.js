import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('./strength-home.js',import.meta.url),'utf8');
function home(){const window={};runInNewContext(code,{window});return window.StrengthHome;}
test('dated physiology, zero steps and sleep hours survive partial refresh without replacing answers',()=>{
 const H=home(),S={checkin:{'2026-10-09':{subjectiveRecovery:{soreness:4}}}};
 H.importHistory(S,{dailyMetrics:[{date:'2026-10-09',recovery:72,hrv:53,rhr:50,sleep:7.25,steps:0,sleepPerformance:80,strain:9.2}]},'2026-10-10');
 H.importHistory(S,{dailyMetrics:[{date:'2026-10-09',recovery:75,sleep:null,steps:null}]},'2026-10-10');
 assert.equal(S.checkin['2026-10-09'].sleepHours,7.25);assert.equal(S.checkin['2026-10-09'].steps,0);assert.equal(S.checkin['2026-10-09'].subjectiveRecovery.soreness,4);assert.equal(S.whoopHistory[0].recovery,75);
 const selected=H.selection(H.records(S),'2026-10-10','2026-10-10');assert.equal(selected.metrics.sleep.date,'2026-10-09');assert.equal(selected.metrics.sleep.value,7.25);
 assert.equal(Object.keys(H.selection(H.records(S),'2026-10-08','2026-10-10').metrics).length,0);
});
test('invalid dates, future readings and impossible values are rejected',()=>{
 const H=home(),S={checkin:{}};
 H.importHistory(S,{dailyMetrics:[{date:'2026-02-30',recovery:70},{date:'2026-10-11',recovery:70},{date:'2026-10-10',recovery:101,hrv:0,rhr:-1,sleep:25,steps:1.5}]},'2026-10-10');
 assert.equal(S.whoopHistory.length,0);assert.equal(H.day('2026-02-30'),null);
});
test('independent sleep and strain dates are preserved instead of assigned to latest recovery',()=>{
 const H=home(),S={checkin:{}};
 H.importHistory(S,{normalized:{date:'2026-10-10',recoveryScore:80,sleepPerformance:75,strain:10,metricDates:{sleepPerformance:'2026-10-09',strain:'2026-10-08'}}},'2026-10-10');
 assert.equal(S.checkin['2026-10-10'].whoopSleepPerformance,undefined);
 assert.equal(S.checkin['2026-10-09'].whoopSleepPerformance,75);assert.equal(S.checkin['2026-10-08'].whoopStrain,10);
});
test('Home keeps the newest value per metric and falls back to WHOOP when Fitbit is disconnected',()=>{
 const H=home(),S={settings:{fitbit:{connected:true}},checkin:{},whoopHistory:[],fitbitHistory:[]};
 H.importHistory(S,{dailyMetrics:[{date:'2026-10-21',recovery:76,hrv:70.3,rhr:66,sleep:7.1,steps:9000,sleepPerformance:73,strain:4.1}]},'2026-10-22');
 H.importHistory(S,{dailyMetrics:[{date:'2026-10-22',hrv:34.15,rhr:68,sleep:7.8,steps:4200,sleepPerformance:94,strain:3.4}],syncedAt:'2026-10-22T08:00:00Z'},'2026-10-22','Fitbit');
 const today=H.selection(H.records(S),'2026-10-22','2026-10-22');
 assert.equal(today.metrics.hrv.value,34.15);assert.equal(today.metrics.hrv.source,'Fitbit');
 assert.equal(today.metrics.recovery.value,76);assert.equal(today.metrics.recovery.source,'WHOOP account');
 assert.equal(today.metrics.sleep.value,7.8);assert.equal(today.metrics.sleep.source,'Fitbit');
 assert.equal(today.metrics.steps.value,4200);assert.equal(today.metrics.steps.source,'Fitbit');
 assert.equal(today.metrics.sleepPerformance.value,94);
 const whoopOnly=H.selection(H.records({...S,settings:{fitbit:{connected:false}}}),'2026-10-22','2026-10-22');
 assert.equal(whoopOnly.metrics.hrv.value,70.3);assert.equal(whoopOnly.metrics.hrv.source,'WHOOP account');
 assert.equal(whoopOnly.metrics.steps.value,9000);
});
test('sleep hours and steps stay on their own dates when the summary day is newer',()=>{
 const H=home(),S={settings:{fitbit:{connected:true}},checkin:{},fitbitHistory:[]};
 H.importHistory(S,{normalized:{date:'2026-10-22',hrvMs:34.15,restingHr:68,sleepHours:7.25,steps:22089,strain:3.4,sleepPerformance:94,metricDates:{sleepHours:'2026-10-20',steps:'2026-10-21',strain:'2026-10-21',sleepPerformance:'2026-10-20'}}},'2026-10-22','Fitbit');
 assert.equal(S.checkin['2026-10-22'].hrv,34.15);
 assert.equal(S.checkin['2026-10-22'].sleepHours,undefined);
 assert.equal(S.checkin['2026-10-22'].steps,undefined);
 assert.equal(S.checkin['2026-10-20'].sleepHours,7.25);
 assert.equal(S.checkin['2026-10-20'].whoopSleepPerformance,94);
 assert.equal(S.checkin['2026-10-21'].steps,22089);
 assert.equal(S.checkin['2026-10-21'].whoopStrain,3.4);
});

test('Strain shows one decimal on Progress',()=>{
 const H=home();assert.equal(H.metricText(13.73829,'strain'),'13.7');assert.equal(H.metricText(9,'strain'),'9.0');assert.equal(H.metricText(72,'recovery'),'72');assert.equal(H.metricText(null,'strain'),'—');
});
