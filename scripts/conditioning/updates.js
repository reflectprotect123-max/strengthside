/* Capgo transports app files. Save workout data before switching bundles. */
(function(){
const native=window.EngineNative, updater=native?.Capacitor.isNativePlatform()?native.CapacitorUpdater:null;
let readyBundle=null, currentVersion='', message='Updates are available in the Android app.', checking=false, booted=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const redraw=()=>window.render?.();
const activeWorkout=()=>['running','paused'].includes(window.S?.liveWorkout?.status);
const newer=(version,current)=>{const a=version?.split('.').map(Number),b=current?.split('.').map(Number);if(a?.length!==3||b?.length!==3||[...a,...b].some(v=>!Number.isFinite(v)))return false;for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;};
async function accept(bundle){
  if(!bundle?.id||bundle.id==='builtin'||(currentVersion&&!newer(bundle.version,currentVersion)))return;
  readyBundle=bundle;message='Update '+bundle.version+' is ready. Restart when your workout is finished.';redraw();
}
async function ready(){
  if(!updater||booted)return;
  booted=true;
  // Acknowledge a rendered app before any network login/history request. Without
  // this handshake Capgo rolls a downloaded bundle back to its previous version.
  try{await updater.notifyAppReady();}catch{message='The app could not confirm this update. Try reopening it.';redraw();return;}
  try{
    await updater.addListener('updateAvailable',event=>accept(event.bundle));
    await updater.addListener('download',event=>{message='Downloading update… '+event.percent+'%';redraw();});
    await updater.addListener('downloadFailed',()=>{message='Update download failed. Check your connection and try again.';redraw();});
    const current=await updater.current();currentVersion=current.bundle?.id==='builtin'?current.native:current.bundle?.version||current.native||'';
    const {bundles=[]}=await updater.list();
    const available=bundles.filter(b=>b.id!==current.bundle?.id&&b.id!=='builtin'&&['success','pending'].includes(b.status)&&newer(b.version,currentVersion)).sort((a,b)=>String(b.downloaded).localeCompare(String(a.downloaded)))[0];
    if(available)await accept(available);else message='Your app is up to date.';
  }catch{message='Updates are unavailable right now. You can keep using the app.';}
  redraw();
}
async function check(){
  if(!updater||checking)return;
  checking=true;message='Checking for updates…';redraw();
  try{
    const latest=await updater.getLatest({channel:'engine-html'});
    if(latest.kind==='blocked'){message='This update needs a newer APK.';return;}
    if(latest.kind==='failed'||(latest.error&&latest.kind!=='up_to_date'))throw Error('Update service unavailable. Try again later.');
    if(latest.kind==='up_to_date'||!newer(latest.version,currentVersion)||(!latest.url&&!latest.manifest?.length)){message='Your app is up to date.';return;}
    const existing=(await updater.list()).bundles?.find(b=>b.version===latest.version&&['success','pending'].includes(b.status));
    await accept(existing||await updater.download({url:latest.url,version:latest.version,checksum:latest.checksum,sessionKey:latest.sessionKey,manifest:latest.manifest}));
  }catch(error){message=error.message||'Update check failed. Try again later.';}
  finally{checking=false;redraw();}
}
async function apply(){
  if(!updater||!readyBundle)return;
  if(activeWorkout()){message='Finish your workout before restarting for an update.';redraw();return;}
  try{
    // Flush the private-file copy as well as localStorage before destroying JS.
    await window.EngineApp.flushStorage();
    await updater.set({id:readyBundle.id});
  }catch{message='The update could not be applied. Your current app is still available.';redraw();}
}
function html(){
  if(!updater)return '';
  return '<section class="pg-card"><h2>App updates</h2><p>'+esc(currentVersion?'Version '+currentVersion:'The Hybrid Engine')+'</p><p role="status">'+esc(message)+'</p><button class="method-secondary" onclick="EngineUpdates.check()" '+(checking?'disabled':'')+'>Check for updates</button>'+(readyBundle?'<button class="method-load" onclick="EngineUpdates.apply()" '+(activeWorkout()?'disabled':'')+'>Restart now</button>':'')+'</section>';
}
window.EngineUpdates={ready,check,apply,html};
})();
