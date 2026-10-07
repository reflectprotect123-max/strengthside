const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('/home/agent/.local/lib/node_modules/@playwright/cli/node_modules/playwright');
(async()=>{const root=path.resolve(__dirname,'../../apps/athlete/conditioning');const server=http.createServer((q,r)=>{const file=q.url==='/native-plugins.js'?'native-plugins.js':'index.html';r.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');r.end(fs.readFileSync(path.join(root,file)));});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true});try{
const page=await browser.newPage({viewport:{width:393,height:852}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.testTime=2000000000000;Date.now=()=>testTime;window.setInterval=()=>0;});await page.goto('http://127.0.0.1:'+server.address().port);
const output=await page.evaluate(()=>{
 const out={},copy=()=>JSON.parse(JSON.stringify(S.liveWorkout));
 window.startGapTest=(type='Cardio',zones=true)=>{S.liveWorkout=null;testTime+=10000;S.settings.liveZones=zones?{blue:120,green:140,red:160,max:190,version:'gap-test'}:null;S.checkin[today()]={};S.liveCategory=type;LiveWorkout.begin();LiveWorkout.resume();};
 window.advanceGapTest=(seconds,bpm)=>{testTime+=seconds*1000;if(bpm==null)LiveWorkout.tick(testTime);else LiveWorkout.receive(bpm,testTime);};
 startGapTest();LiveWorkout.receive(130,testTime);for(let i=0;i<60;i++)advanceGapTest(1,130);out.regular=copy();
 startGapTest();LiveWorkout.receive(130,testTime);for(let i=0;i<20;i++)advanceGapTest(.25);out.pending=copy();LiveWorkout.receive(134,testTime);out.short=copy();LiveWorkout.view(2);
 startGapTest();LiveWorkout.receive(130,testTime);advanceGapTest(10,150);out.crossing=copy();
 startGapTest();LiveWorkout.receive(130,testTime);advanceGapTest(10.001,134);out.long=copy();
 startGapTest();LiveWorkout.receive(130,testTime);advanceGapTest(5,180);out.jump=copy();
 startGapTest();LiveWorkout.receive(130,testTime);advanceGapTest(1);LiveWorkout.pause();advanceGapTest(5);LiveWorkout.resume();advanceGapTest(1,134);out.pause=copy();
 startGapTest();LiveWorkout.receive(130,testTime);advanceGapTest(1);LiveWorkout.disconnect();advanceGapTest(4,134);out.disconnect=copy();
 startGapTest();LiveWorkout.receive(130,testTime);advanceGapTest(1,NaN);advanceGapTest(4,134);out.invalid=copy();
 startGapTest('Strength');LiveWorkout.receive(130,testTime);advanceGapTest(5,134);out.strength=copy();
 startGapTest('Mixed');LiveWorkout.receive(130,testTime);advanceGapTest(1);LiveWorkout.segment();advanceGapTest(2,134);LiveWorkout.segment();advanceGapTest(2,134);out.mixed=copy();
 startGapTest('Cardio',false);LiveWorkout.receive(130,testTime);S.settings.liveZones={blue:120,green:140,red:160,max:190,version:'late'};advanceGapTest(5,134);out.noZones=copy();
 startGapTest();const frozen=JSON.stringify(S.liveWorkout.activeZones);S.settings.liveZones={blue:90,green:110,red:130,max:195,version:'future'};S.checkin[today()]={whoopRecovery:0};LiveWorkout.zones();out.lockedDialog=document.querySelector('[role="dialog"]').innerText;out.hasEditor=!!document.querySelector('[role="dialog"] form');LiveWorkout.saveZones();out.freezeAfterSave=JSON.stringify(S.liveWorkout.activeZones)===frozen;LiveWorkout.pause();LiveWorkout.resume();out.freezeAfterResume=JSON.stringify(S.liveWorkout.activeZones)===frozen;
 // Save and read the interpolated workout through the real UI/storage path.
 startGapTest();LiveWorkout.receive(130,testTime);advanceGapTest(5,134);LiveWorkout.finish();LiveWorkout.submit();out.saved=S.liveWorkoutHistory.at(-1);setTab('home');out.homeText=document.getElementById('app').innerText;Progress.workout(out.saved.id);setTab('progress');out.historyText=document.getElementById('app').innerText;
 return out;
});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`),sum=o=>Object.values(o||{}).reduce((a,b)=>a+b,0);
near(output.regular.zoneSeconds.Blue,60);near(sum(output.regular.estimatedZoneSeconds),0);
near(output.pending.zoneSeconds.Blue,3);near(output.pending.unknownSeconds,2);
near(output.short.zoneSeconds.Blue,0);near(output.short.estimatedZoneSeconds.Blue,5);near(output.short.unknownSeconds,0);assert.equal(output.short.gapEstimates.length,1);
near(output.crossing.estimatedZoneSeconds.Blue,5);near(output.crossing.estimatedZoneSeconds.Green,5);
for(const k of ['long','jump','pause','disconnect','invalid','strength','mixed','noZones'])near(sum(output[k].estimatedZoneSeconds),0);
near(sum(output.strength.zoneSeconds),0);near(output.mixed.zoneSeconds.Blue,1);near(sum(output.noZones.zoneSeconds),0);assert.equal(output.noZones.activeZones,null);assert.equal(output.noZones.zoneHistory.length,0);
assert.equal(output.hasEditor,false);assert.equal(output.freezeAfterSave,true);assert.equal(output.freezeAfterResume,true);assert.match(output.lockedDialog,/locked/);
for(const k of ['regular','pending','short','crossing','long','jump','disconnect','invalid','noZones'])near(sum(output[k].zoneSeconds)+sum(output[k].estimatedZoneSeconds)+output[k].unknownSeconds,output[k].elapsed);
assert.match(output.homeText,/estimated/);assert.match(output.historyText,/estimated/);assert.equal(output.saved.zone_version,'gap-test:'+await page.evaluate(()=>today())+':missing');
await page.reload();assert.equal(await page.evaluate(()=>S.liveWorkoutHistory.at(-1).estimatedZoneSeconds.Blue),5);assert.equal(await page.evaluate(()=>S.liveWorkoutHistory.at(-1).gapEstimates.length),1);
assert.deepEqual(errors,[]);console.log('PASS: regular HR, bracketed/boundary-crossing gaps, delayed ticks, no double counting, long/suspect gaps, pause/disconnect/invalid/strength/mixed exclusions, locked/null zones, labelled Home/history totals and reload persistence.');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
