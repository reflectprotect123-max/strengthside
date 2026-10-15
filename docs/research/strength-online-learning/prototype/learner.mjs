/** Experimental simulator-only learner. No application integration. */
export const DEFAULT_K=.0333/(1+.0333);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const fraction=(n,k)=>1/(1+k*(n-1));
export function fit(rows){rows=rows.slice(-24);if(rows.length<8)return null;const ns=rows.map(r=>r.reps+r.rir);if(Math.max(...ns)-Math.min(...ns)<4||new Set(ns).size<3)return null;
 function evaluate(k){let dot=0,den=0;for(const r of rows){const f=fraction(r.reps+r.rir,k);dot+=f*r.weight;den+=f*f;}const A=dot/den;return {A,k,loss:rows.reduce((s,r)=>s+(r.weight-A*fraction(r.reps+r.rir,k))**2,0)};}
 let lo=.01,hi=.08;for(let i=0;i<32;i++){let a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(evaluate(a).loss<evaluate(b).loss)hi=b;else lo=a;}return evaluate((lo+hi)/2);
}
export function createLearner(){return {version:'sim-online-v1',k:DEFAULT_K,rows:[],seen:[],accepted:0,rejected:0,updates:0,lastReason:'default'};}
export function observe(previous,observation){const s=structuredClone(previous);if(s.seen.includes(observation.id))return s;s.seen.push(observation.id);s.seen=s.seen.slice(-128);
 if(!Number.isFinite(observation.weight)||observation.weight<=0||!Number.isInteger(observation.reps)||observation.reps<1||observation.reps>12||![1,3].includes(observation.rir)||observation.miss||observation.purpose!=='working'||observation.workingIndex!==0){s.rejected++;s.lastReason='ineligible';return s;}
 s.rows.push({...observation});s.rows=s.rows.slice(-24);s.accepted++;const fitted=fit(s.rows);if(!fitted){s.lastReason='insufficient_diverse_evidence';return s;}
 // A prior shrinks early estimates toward the default. A per-update bound
 // prevents a single new first-set observation from rewriting curve shape.
 const weight=clamp((s.rows.length-6)/(s.rows.length+6),0,.85),target=DEFAULT_K*(1-weight)+fitted.k*weight;
 s.k=clamp(target,s.k-.002,s.k+.002);s.updates++;s.lastReason='bounded_update';return s;
}
export function project(kg,fromReps,fromRir,toReps,targetRir,state){return kg*fraction(toReps+targetRir,state.k)/fraction(fromReps+fromRir,state.k);}
/** Separate fast calibration of the next session's starting-load scale.
 * Used identically by every candidate in the acquisition experiment.
 * Easy is directional: it does not become numerical evidence for curve fit.
 */
export function calibrateStartingScale(scale,observation,step){
 const pct=fraction(observation.reps+3,DEFAULT_K),oneStep=step/pct;
 if(observation.miss)return Math.max(scale*.9,scale-oneStep*2);
 if(observation.rir>=5)return scale+oneStep;
 const implied=observation.weight/fraction(observation.reps+Math.max(0,observation.rir),DEFAULT_K);
 return clamp(scale+(implied-scale)*.5,scale-Math.max(scale*.1,oneStep),scale+oneStep);
}
