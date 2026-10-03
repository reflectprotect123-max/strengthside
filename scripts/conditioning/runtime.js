/* STRENGTHSIDE-DESIGNED: native transport and account-scoped storage adapters.
 * Uses the NEW HTML's timer, methods, screenshots and progression UI. */
(function(){
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=window.EngineNative,native=!!N?.Capacitor.isNativePlatform(),service='0000180d-0000-1000-8000-00805f9b34fb',characteristic='00002a37-0000-1000-8000-00805f9b34fb';
let accountMessage='',busy=false,connected=null,scanTimer=null,fsWriting=false,fsPending=false,foreground=false,storageWaiters=[];
// PlanSync writes window.S; the NEW HTML keeps its state in the shared binding.
Object.defineProperty(window,'S',{configurable:true,get:()=>S,set:v=>{S=v;}});
Whoop.autoSyncIfPossible=async function(){};
window.resetBlankSlate=function(){}; // Sign-in must never erase locally recorded workouts.
const oldSave=window.save;window.save=function(){oldSave();if(native){fsPending=true;persistNative();}};
async function persistNative(){if(fsWriting||!fsPending)return;fsWriting=true;fsPending=false;let failure;try{await N.Filesystem.writeFile({path:'engine-state.json',directory:N.Directory.Data,data:JSON.stringify(S),encoding:'utf8'});}catch(err){failure=err;accountMessage='Local file backup failed: '+err.message;}finally{fsWriting=false;if(fsPending)persistNative();else{for(const waiter of storageWaiters.splice(0))failure?waiter.reject(failure):waiter.resolve();}}}
function flushStorage(){return new Promise((resolve,reject)=>{if(!native){save();resolve();return;}storageWaiters.push({resolve,reject});save();});}
async function restoreNative(){if(!native)return;try{const old=localStorage.getItem(STORAGE_KEY);if(!old){const {data}=await N.Filesystem.readFile({path:'engine-state.json',directory:N.Directory.Data,encoding:'utf8'});const restored=JSON.parse(data);if(restored.build===BRAIN_BUILD){S={...defaultState(),...restored};S.library=HybridLibrary.ensure(S.library);if(S.liveWorkout?.status==='running')S.liveWorkout.status='paused';save();render();}}}catch{/* First installation has no native backup yet. */}}
function bindAccount(user){if(!user)return;if(S.accountId&&S.accountId!==user.id){localStorage.setItem('engine-account-'+S.accountId,JSON.stringify(S));const old=localStorage.getItem('engine-account-'+user.id);S=old?{...defaultState(),...JSON.parse(old)}:defaultState();S.library=HybridLibrary.ensure(S.library);}S.accountId=user.id;S.settings.whoop={...S.settings.whoop,email:user.email};save();}
async function history(body){let rows=body.dailyMetrics||body.dailyPhysiology;if(!rows&&body.recovery&&body.cycle)rows=Progress.normalize({recoveries:body.recovery.records,cycles:body.cycle.records}).rows;if(rows?.length){const existing=new Map((S.whoopHistory||[]).map(r=>[r.date,r]));for(const r of rows){const date=r.date;if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))continue;const row={date,source:'WHOOP account',recovery:r.recovery??r.recoveryScore,hrv:r.hrv??r.hrvMs,rhr:r.rhr??r.restingHr};const previous=existing.get(date)||{};existing.set(date,{...previous,...Object.fromEntries(Object.entries(row).filter(([,v])=>v!=null))});const c=S.checkin[date]||(S.checkin[date]={});if(row.recovery!=null)c.whoopRecovery=row.recovery;if(row.hrv!=null)c.hrv=row.hrv;if(row.rhr!=null)c.restingHr=row.rhr;}S.whoopHistory=[...existing.values()].sort((a,b)=>a.date.localeCompare(b.date));return rows.length;}return 0;}
async function sync(full=false){if(busy)return;busy=true;accountMessage='Syncing WHOOP and saved workouts…';render();try{const client=Whoop.client(),{data:{session}}=await client.auth.getSession();if(!session)throw Error('Sign in before syncing.');bindAccount(session.user);const response=await fetch(Whoop.fnUrl('whoop-sync',{backfill:'1',history:full?'all':'recent'}),{headers:{authorization:'Bearer '+session.access_token,apikey:ENGINE_CONFIG.supabaseAnon,'x-hybrid-product':'strength'}});const body=await response.json();if(!response.ok)throw Error(body.error||'WHOOP sync failed.');let count=await history(body);if(!count&&body.normalized){const n=body.normalized;count=await history({dailyMetrics:[{date:n.date,recovery:n.recoveryScore,hrv:n.hrvMs,rhr:n.restingHr}]});}S.settings.whoop={...S.settings.whoop,connected:true,lastSyncAt:body.syncedAt||new Date().toISOString()};save();const result=await PlanSync.syncNow();accountMessage=(count?'WHOOP: '+count+' dated readings received. ':'WHOOP server returned no dated HRV/RHR history. ')+(result.ok?'Workouts saved to your account.':'Cloud storage: '+result.reason)+(body.historyTruncated?' History reached the server record limit; older data needs another backfill.':'')+(full&&!body.dailyMetrics?' The deployed server needs the new full-history endpoint.':'');}catch(err){accountMessage=err.message;}finally{busy=false;render();}}
async function refreshWhoop(){
  if(busy)return;
  try{
    const {data:{session}}=await Whoop.client().auth.getSession();
    if(!session){accountMessage='Sign in to show your WHOOP readings.';setTab('me');return;}
    bindAccount(session.user);
    const status=await Whoop.refreshStatus();
    if(!status.whoop?.connected){accountMessage='Sign in is complete. Connect your WHOOP account to show recovery, HRV and resting HR.';render();return;}
    await sync(false);
  }catch(err){accountMessage='WHOOP connection check: '+err.message;render();}
}
async function signIn(){const email=document.getElementById('engineEmail').value.trim(),password=document.getElementById('enginePassword').value;if(!email||!password){accountMessage='Enter your account email and password.';render();return;}try{const {data,error}=await Whoop.client().auth.signInWithPassword({email,password});if(error)throw error;bindAccount(data.user);accountMessage='Signed in. Connect WHOOP or sync your saved workouts.';render();const result=await PlanSync.syncNow();if(!result.ok)accountMessage='Signed in; cloud storage: '+result.reason;render();await refreshWhoop();}catch(err){accountMessage=err.message;render();}}
async function signOut(){try{if(S.accountId)localStorage.setItem('engine-account-'+S.accountId,JSON.stringify(S));await Whoop.client().auth.signOut();S=defaultState();S.library=HybridLibrary.ensure(S.library);save();accountMessage='Signed out. Account data stays archived on this device.';render();}catch(err){accountMessage=err.message;render();}}
function accountHtml(){
  const email=S.settings.whoop?.email,connected=S.settings.whoop?.connected;
  return '<section class="pg-card engine-account"><h2>Account and WHOOP sync</h2>'+(email?
    '<p>'+esc(email)+'</p><button class="method-secondary" onclick="'+(connected?'EngineApp.refreshWhoop()':'EngineApp.connectWhoop()')+'" '+(busy?'disabled':'')+'>'+ (connected?'Refresh WHOOP':'Connect WHOOP account')+'</button><details><summary>Account</summary><button class="method-secondary" onclick="EngineApp.signOut()">Sign out</button></details>':
    '<label>Email<input id="engineEmail" type="email" autocomplete="username"></label><label>Password<input id="enginePassword" type="password" autocomplete="current-password"></label><button class="method-load" onclick="EngineApp.signIn()">Sign in</button>')+
    '<p role="status">'+esc(accountMessage)+'</p></section>';
}
const style=document.createElement('style');style.textContent='.engine-account input{display:block;width:100%;margin-top:8px}.engine-sensor-dialog{background:#101010;color:#fff;border:1px solid #333;border-radius:16px;max-width:360px;width:calc(100% - 40px);padding:24px}.engine-sensor-dialog::backdrop{background:#000b}';document.head.append(style);
const renderBase=window.render;window.render=function(){renderBase();if(S.tab==='me'||S.tab==='settings')document.querySelector('.pg-page h1')?.insertAdjacentHTML('afterend',accountHtml()+EngineUpdates.html());updateRecording();};
async function stopScan(){clearTimeout(scanTimer);if(native)try{await N.BleClient.stopLEScan();}catch{}}
function chooser(){return new Promise(async(resolve,reject)=>{const dialog=document.createElement('dialog');dialog.className='engine-sensor-dialog';dialog.innerHTML='<h2>Connect heart-rate monitor</h2><p>Turn on Heart Rate Broadcast in WHOOP.</p><div class="engine-devices"></div><p class="engine-scan-status">Searching…</p><button class="method-secondary">Cancel</button>';document.body.append(dialog);dialog.showModal();let done=false;const finish=async(device,error)=>{if(done)return;done=true;await stopScan();dialog.close();dialog.remove();error?reject(error):resolve(device);};dialog.querySelector('button').onclick=()=>finish(null,new DOMException('Device selection cancelled','NotFoundError'));dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null,new DOMException('Device selection cancelled','NotFoundError'));});try{await N.BleClient.initialize({androidNeverForLocation:true});if(!(await N.BleClient.isEnabled()))await N.BleClient.requestEnable();const seen=new Set();await N.BleClient.requestLEScan({services:[service]},result=>{const d=result.device;if(!d?.deviceId||seen.has(d.deviceId))return;seen.add(d.deviceId);const b=document.createElement('button');b.className='method-secondary';b.textContent=d.name||d.deviceId;b.onclick=()=>finish(makeDevice(d));dialog.querySelector('.engine-devices').append(b);});scanTimer=setTimeout(async()=>{await stopScan();if(!done)dialog.querySelector('.engine-scan-status').textContent='Scan finished. Choose a device or cancel and retry.';},12000);}catch(err){finish(null,err);}});}
function makeDevice(info){
  const device=new EventTarget(),char=new EventTarget();let streamGeneration=0;
  device.name=info.name||'WHOOP Heart Rate Broadcast';
  char.stopNotifications=()=>{streamGeneration++;return N.BleClient.stopNotifications(info.deviceId,service,characteristic);};
  char.startNotifications=async()=>{
    const generation=++streamGeneration;
    await N.BleClient.startNotifications(info.deviceId,service,characteristic,value=>{
      if(generation!==streamGeneration||!device.gatt.connected)return;
      char.value=value;char.dispatchEvent(new Event('characteristicvaluechanged'));
    });return char;
  };
  const ended=()=>{streamGeneration++;device.gatt.connected=false;if(connected===device)connected=null;device.dispatchEvent(new Event('gattserverdisconnected'));updateRecording();};
  device.gatt={connected:false,connect:async()=>{
    await N.BleClient.connect(info.deviceId,ended);device.gatt.connected=true;connected=device;updateRecording();
    return {getPrimaryService:async()=>({getCharacteristic:async()=>char})};
  },disconnect:()=>{ended();char.stopNotifications().catch(()=>{}).finally(()=>N.BleClient.disconnect(info.deviceId).catch(()=>{}));}};
  return device;
}
let serviceBusy=false;
async function updateRecording(){if(!native||serviceBusy)return;const running=S.liveWorkout?.status==='running',desired=running&&!!connected?.gatt.connected;if(desired===foreground)return;serviceBusy=true;try{if(desired){await N.KeepAwake.keepAwake();await N.WorkoutService.start();foreground=true;}else{await N.WorkoutService.stop();await N.KeepAwake.allowSleep();foreground=false;}}catch(err){accountMessage='Native recording support: '+err.message;}finally{serviceBusy=false;}}
if(native){Standalone.export=async()=>{try{await N.WorkoutService.share({filename:'engine-backup.json',data:JSON.stringify(S,null,2)});}catch(err){alert('Backup export failed: '+err.message);}};LiveWorkout.share=async()=>{try{await N.WorkoutService.share({filename:'engine-workout.json',data:JSON.stringify(S.liveWorkout,null,2)});}catch(err){alert(err.message);}};}
window.EngineApp={signIn,signOut,sync,history,bindAccount,flushStorage,refreshWhoop,async connectWhoop(){try{await Whoop.connect();}catch(err){accountMessage=err.message;render();}},async cloud(){const result=await PlanSync.syncNow();accountMessage=result.ok?'Saved workouts synced.':'Cloud storage: '+result.reason;render();}};
if(native){Object.defineProperty(navigator,'bluetooth',{configurable:true,value:{requestDevice:chooser}});N.App.addListener('appStateChange',({isActive})=>{save();if(!isActive&&!connected?.gatt.connected&&S.liveWorkout?.status==='running')LiveWorkout.pause();if(isActive){LiveWorkout.tick();render();}});N.App.addListener('backButton',()=>{if(S.tab==='training'){LiveWorkout.leave();return;}if(S.tab!=='home'){setTab('home');return;}N.App.minimizeApp();});}
restoreNative().then(async()=>{render();await EngineUpdates.ready();try{const {data:{session}}=await Whoop.client().auth.getSession();if(session){bindAccount(session.user);const result=await PlanSync.syncNow();accountMessage=result.ok?'Account storage ready.':'Cloud storage: '+result.reason;}}catch(err){accountMessage=err.message;}render();if(S.settings.whoop?.email)await refreshWhoop();});
render();
})();
