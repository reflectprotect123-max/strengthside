// Real durable record envelope; raw page/set facts are authoritative.
export function record(id,revision,weight) {
 const contextKey=JSON.stringify(['a','squat','barbell','barbell_total','2-0-X-1']);
 const sessionId=`session-${id}`;
 return {id,sessionId,kind:'set',deleted:false,localRevision:revision,
  payload:{contractVersion:3,ownerId:'a',sessionStartedAt:10,completed:true,
   page:{id:'squat-page',kind:'lift',title:'Barbell Squat',exerciseId:'squat',equipmentId:'barbell',
    loadConvention:'barbell_total',loadUnit:'kg',barWeightKg:20,tempo:'20X1',logMode:'kg',columns:['reps','weight_kg'],
    setTargets:[0,1,2].map(i=>({id:`work-${i}`,purpose:'working',reps:{min:5,max:5},loadRule:{kind:'adaptive'},toFailure:false}))},
   row:{id,targetId:'work-0',kg:weight,reps:5,effort:'average',purpose:'working',workingIndex:0,ordinal:0,miss:false,logged:true},
   normalizedLoad:{version:3,rawValue:weight,rawUnit:'kg',convention:'barbell_total',externalKg:weight,barKg:20,provenance:'explicit',eligible:true},
   learning:{ownerId:'a',contextKey,observation:{id,revision,contextKey,sessionId,weight,reps:5,rir:3,purpose:'working',workingIndex:0,miss:false,completed:true}}}};
}
