/* STRENGTHSIDE-DESIGNED: timestamp coverage and bounded HR interpolation.
 * Limits are provisional, not a validated WHOOP/Morpheus physiological model. */
(function(){
const CONFIG=Object.freeze({version:'hr-gap-v1',freshSeconds:3,maxGapSeconds:10,maxEndpointDifference:20});
const names=['Blue','Green','Red'];
const empty=()=>Object.fromEntries(names.map(n=>[n,0]));
function validZones(z){return z&&[z.blue,z.green,z.red,z.max].every(Number.isFinite)&&z.blue>0&&z.blue<z.green&&z.green<z.red&&z.red<=z.max;}
function classify(hr,z){if(!validZones(z)||!Number.isFinite(hr)||hr<1||hr>300)return 'Unknown';return hr>=z.red?'Red':hr>=z.green?'Green':hr>=z.blue?'Blue':'Unknown';}
function coverage(start,end,sample,config=CONFIG){if(!sample||!Number.isFinite(sample.t)||end<=start)return 0;return Math.max(0,Math.min(end,sample.t+config.freshSeconds)-Math.max(start,sample.t));}
function interpolate(left,right,z,config=CONFIG){
 const result={zones:empty(),unknown:0,filledSeconds:0,eligible:false,version:config.version};
 if(!left||!right||!validZones(z)||![left.t,right.t,left.bpm,right.bpm].every(Number.isFinite)||left.bpm<1||left.bpm>300||right.bpm<1||right.bpm>300)return result;
 const dt=right.t-left.t;
 if(dt<=config.freshSeconds||dt>config.maxGapSeconds||Math.abs(right.bpm-left.bpm)>config.maxEndpointDifference)return result;
 const start=0,change=right.bpm-left.bpm,points=[start,dt];
 if(change)for(const boundary of [z.blue,z.green,z.red]){const crossing=(boundary-left.bpm)*dt/change;if(crossing>start&&crossing<dt)points.push(crossing);}
 points.sort((a,b)=>a-b);
 for(let i=1;i<points.length;i++){const duration=points[i]-points[i-1],mid=(points[i]+points[i-1])/2,zone=classify(left.bpm+change*mid/dt,z);if(zone==='Unknown')result.unknown+=duration;else result.zones[zone]+=duration;}
 result.eligible=true;result.filledSeconds=Object.values(result.zones).reduce((s,n)=>s+n,0);return result;
}
function total(workout,name){return Math.max(0,Number(workout?.zoneSeconds?.[name])||0)+Math.max(0,Number(workout?.estimatedZoneSeconds?.[name])||0);}
window.EngineHrAccounting={CONFIG,empty,classify,coverage,interpolate,total};
})();
