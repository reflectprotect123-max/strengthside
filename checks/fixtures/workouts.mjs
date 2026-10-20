/* Test-only dashboard payloads. These files are never staged into the athlete app. */
export function workout({id='assigned-workout',title='Assigned Strength Session',blocks,prep=true}={}) {
  const warmups = prep ? [['Bike','180'],['Row','180'],['Run','180'],['Ski','180'],['Jump Rope','60']].map(([title,prescribed],i)=>({id:`prep-${i}`,kind:'lift',title,role:'warmup',columns:['seconds'],prescribed,setCount:3,countIn:0})) : [];
  const lifts = (blocks || [{title:'Back Squat'}]).map((b,i)=>({id:`work-${i}`,kind:'lift',title:b.title||'Back Squat',columns:['reps','weight_kg'],setCount:3,repTarget:'8',groupId:null,notes:[],...(b.title==null||b.title==='Back Squat'?{exerciseId:'ex_back_squat',equipmentId:'barbell',loadConvention:'total',exerciseType:'main',minimumKg:20,equipmentStepKg:2.5}:{}),...b}));
  return {id,title,instructions:'Published workout fixture',blocks:[...warmups,...lifts]};
}
