import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,selectPolicy,gate,BASELINE,CANDIDATES} from './strength-simulator.mjs';

test('same seed is deterministic and different seeds alter physiology',()=>{
 const a=simulate({seed:1101,exposures:3,policy:BASELINE,cohort:'db_beginner'});
 assert.deepEqual(a,simulate({seed:1101,exposures:3,policy:BASELINE,cohort:'db_beginner'}));
 assert.notDeepEqual(a,simulate({seed:1102,exposures:3,policy:BASELINE,cohort:'db_beginner'}));
});
test('simulator exercises production core against independent perturbed capacity',()=>{
 const report=simulate({seed:1101,exposures:4,policy:BASELINE});
 assert.ok(report.aggregate.sets>0);assert.deepEqual(report.aggregate.invariants,{invalid:0,capViolations:0,equipmentViolations:0,actualMutations:0,wrongReferences:0,duplicateLearning:0,accountLeaks:0});
 for(const value of Object.values(report.strata)){assert.ok(value.sets>0);assert.ok(value.missRate>=0&&value.missRate<=1);}
});
test('strict gate rejects an aggressive miss increase',()=>{
 assert.deepEqual(gate({missRate:.04,underloadRate:.20},{missRate:.06,underloadRate:.10}),{pass:false,reasons:['all:miss_rate']});
});
test('selection reads tuning reports only and favors eligible underloading',()=>{
 const reports=CANDIDATES.slice(0,2).map((p,i)=>({policyVersion:p.version,strata:{all:{missRate:.04+i*.005}},aggregate:{missRate:.04+i*.005,underloadRate:.3-i*.1,invariants:{invalid:0}}}));
 assert.equal(selectPolicy(reports).version,CANDIDATES[1].version);
 assert.throws(()=>selectPolicy([{...reports[0],policyVersion:'holdout-only'}]),/baseline/);
});
