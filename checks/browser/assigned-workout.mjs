import {workout} from '../fixtures/workouts.mjs';

export async function loadAssignedWorkout(page, options={}) {
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.PlanSync && window.S));
  const template=workout(options);
  await page.evaluate(template=>{
    const date=S.selectedDate;
    const plan=PlanSync.pack(S);
    plan.templates=[template];
    plan.sessions=plan.sessions.filter(x=>x.kind!=='assignment');
    plan.sessions.push({id:'asg_'+date,date,kind:'assignment',templateId:template.id});
    S=PlanSync.applyPlan(S,plan);S.tab='training';S.libUi={screen:'list'};save();render();
  },template);
}
export async function setAssignedReps(page, index, value) {
  await page.evaluate(({index,value})=>{
    const plan=PlanSync.pack(S),block=plan.templates[0].blocks.find(b=>b.kind==='lift'&&!b.role);
    const targets=StrengthTargets.normalize(block);
    const parsed=TrainingCore.repTarget(value);
    if(!parsed)throw new Error('Invalid fixture reps');
    targets[index]={...targets[index],reps:{min:parsed.min,max:parsed.max}};
    block.setTargets=targets;block.setCount=targets.length;
    S=PlanSync.applyPlan(S,plan);save();render();
  },{index,value});
}
export async function patchAssignedBlock(page, patch) {
  await page.evaluate(patch=>{
    const plan=PlanSync.pack(S),block=plan.templates[0].blocks.find(b=>b.kind==='lift'&&!b.role);
    Object.assign(block,patch);S=PlanSync.applyPlan(S,plan);save();render();
  },patch);
}
export async function addAssignedAmrap(page) {
  await page.evaluate(()=>{
    const plan=PlanSync.pack(S),block=plan.templates[0].blocks.find(b=>b.kind==='lift'&&!b.role);
    block.setTargets=StrengthTargets.normalize(block).concat({id:'fixture-amrap',purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'}});
    block.setCount=block.setTargets.length;S=PlanSync.applyPlan(S,plan);save();render();
  });
}
export async function scheduleExistingWorkout(page, date) {
  await page.evaluate(date=>{
    const plan=PlanSync.pack(S);plan.sessions=plan.sessions.filter(x=>x.id!=='asg_'+date);
    plan.sessions.push({id:'asg_'+date,date,kind:'assignment',templateId:plan.templates[0].id});
    S=PlanSync.applyPlan(S,plan);S.selectedDate=date;S.tab='training';save();render();
  },date);
}
