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
