const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('/home/agent/.local/lib/node_modules/@playwright/cli/node_modules/playwright');
(async()=>{
 const root=path.resolve(__dirname,'../../apps/athlete/conditioning');
 const server=http.createServer((q,r)=>{const file=q.url==='/native-plugins.js'?'native-plugins.js':'index.html';r.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');r.end(fs.readFileSync(path.join(root,file)));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.evaluate(()=>{window.testNow=Date.now();Date.now=()=>window.testNow;window.advanceTime=seconds=>{testNow+=seconds*1000;LiveWorkout.tick();LiveWorkout.paint();};S.settings.liveZones={mode:'karvonen',max:190,resting:50,restingMode:'manual',version:'test'};window.setup=(config)=>{S.liveWorkout=null;LiveWorkout.loadMethod(Standalone.methods.find(m=>m.continuous),{machine:'bike',work:1500,rest:0,rounds:1,warmup:0,cooldown:0,...config});};setup();});
  assert.equal(await page.getByLabel('Time remaining',{exact:true}).innerText(),'25:00');
  // A loaded session starts with Play, not a second interval-start action.
  await page.getByRole('button',{name:'Start workout',exact:true}).click();
  assert.equal(await page.evaluate(()=>S.liveWorkout.interval.phase),'work');
  await page.evaluate(()=>{LiveWorkout.receive(120);advanceTime(60);});
  assert.equal(await page.getByLabel('Time remaining',{exact:true}).innerText(),'24:00');
  await page.getByRole('button',{name:'Pause workout',exact:true}).click();
  await page.evaluate(()=>advanceTime(120));
  assert.equal(await page.evaluate(()=>S.liveWorkout.elapsed),60);
  await page.evaluate(()=>LiveWorkout.resume());
  assert.equal(await page.getByLabel('Time remaining',{exact:true}).innerText(),'24:00');
  await page.evaluate(()=>advanceTime(1439));
  assert.equal(await page.getByLabel('Time remaining',{exact:true}).innerText(),'00:01');
  // Delayed callbacks must cap accounting at 25:00, not record the extra two minutes.
  await page.evaluate(()=>advanceTime(121));
  const result=await page.evaluate(()=>({elapsed:S.liveWorkout.elapsed,status:S.liveWorkout.status,phase:S.liveWorkout.interval.phase,screen:S.liveScreen,reason:S.liveWorkout.finishedReason,accounted:S.liveWorkout.unknownSeconds+Object.values(S.liveWorkout.zoneSeconds).reduce((a,b)=>a+b,0),completed:S.liveWorkout.intervalHistory.filter(i=>i.completed).length}));
  assert.deepEqual(result,{elapsed:1500,status:'finished',phase:'done',screen:'ratings',reason:'planned-duration',accounted:1500,completed:1});
  await page.evaluate(()=>{advanceTime(30);LiveWorkout.receive(150);LiveWorkout.pause();});
  assert.equal(await page.evaluate(()=>S.liveWorkout.status),'finished');
  assert.equal(await page.evaluate(()=>S.liveWorkout.elapsed),1500);
  await page.evaluate(()=>{LiveWorkout.submit();save();});await page.reload();
  assert.equal(await page.evaluate(()=>S.liveWorkoutHistory.at(-1).elapsed),1500);
  // Include configured warm-up/cooldown and all phases of a repeat session.
  await page.evaluate(()=>{window.testNow=Date.now();Date.now=()=>window.testNow;S.liveWorkout=null;const m=Standalone.methods.find(m=>!m.continuous);LiveWorkout.loadMethod(m,{machine:'bike',work:10,rest:5,rounds:2,warmup:1,cooldown:1,recoverAfterLast:false});LiveWorkout.resume();});
  assert.equal(await page.getByLabel('Time remaining',{exact:true}).innerText(),'02:25');
  await page.evaluate(()=>{testNow+=60000;LiveWorkout.tick();LiveWorkout.paint();});
  assert.equal(await page.evaluate(()=>S.liveWorkout.interval.phase),'work');
  assert.equal(await page.getByLabel('Time remaining',{exact:true}).innerText(),'01:25');
  await page.evaluate(()=>{testNow+=90000;LiveWorkout.tick();});
  assert.equal(await page.evaluate(()=>S.liveWorkout.elapsed),145);
  assert.equal(await page.evaluate(()=>S.liveWorkout.status),'finished');
  // Unplanned workouts retain an elapsed stopwatch and manual finish.
  await page.evaluate(()=>{S.liveWorkout=null;LiveWorkout.begin();LiveWorkout.resume();testNow+=30000;LiveWorkout.tick();LiveWorkout.paint();});
  assert.equal(await page.getByLabel('Elapsed time',{exact:true}).innerText(),'00:30');
  assert.equal(await page.evaluate(()=>S.liveWorkout.status),'running');
  assert.deepEqual(errors,[]);
  console.log('PASS: 25-minute countdown, Play starts loaded timer, pause exclusion, delayed-callback cap, exact HR accounting, one automatic finish, no post-finish recording, saved history, warm-up/repeats/cooldown, unplanned stopwatch.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
