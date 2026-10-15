/** Individual athlete-owned records, persistent outbox and optimistic Supabase sync. */
(function(root) {
  const KEY='strength-memory-v1',VERSION=1;
  let busy=false,timer=null,retry=0,nativePending=null,nativeWriting=false;
  const status={pending:0,lastError:'',lastSyncAt:null};
  const empty=()=>({version:VERSION,ownerId:null,records:{},pending:{},revisions:{}});
  let memory,recoveryRaw=null,ownerEpoch=0,restorePromise=null;
  function hydrate(value) {
    if(!value||typeof value!=='object'||Array.isArray(value))return empty();
    const dict=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
    return {version:VERSION,ownerId:typeof value.ownerId==='string'?value.ownerId:null,
      records:dict(value.records),pending:dict(value.pending),revisions:dict(value.revisions),conflicts:dict(value.conflicts)};
  }
  const raw=root.localStorage.getItem(KEY);
  try{const parsed=raw?JSON.parse(raw):null;memory=hydrate(parsed);if(parsed&&parsed.version!==VERSION)recoveryRaw=raw;}
  catch{memory=empty();recoveryRaw=raw;}
  let durable=JSON.stringify(memory);
  function persist() {
    try{
      if(recoveryRaw)root.localStorage.setItem(KEY+':recovery',recoveryRaw);
      const data=JSON.stringify(memory);root.localStorage.setItem(KEY,data);durable=data;recoveryRaw=null;
      status.pending=Object.keys(memory.pending).length;
      if(root.Capacitor?.isNativePlatform?.()){nativePending=data;writeNative();}
    }catch(e){memory=JSON.parse(durable);status.lastError='Could not save strength evidence: '+(e.message||'storage unavailable');throw e;}
  }
  function filesystem(){return root.Capacitor?.Plugins?.Filesystem||root.Capacitor?.registerPlugin?.('Filesystem');}
  async function writeNative() {
    if(nativeWriting||!nativePending)return;
    nativeWriting=true;const data=nativePending;nativePending=null;
    try{await filesystem().writeFile({path:'strength-memory-v1.json',directory:'DATA',data,encoding:'utf8'});}catch(e){status.lastError='Native backup failed';console.warn('Strength memory native backup failed');}
    finally{nativeWriting=false;if(nativePending)writeNative();}
  }
  function restore() {
    if(restorePromise)return restorePromise;
    if(!root.Capacitor?.isNativePlatform?.()||root.localStorage.getItem(KEY))return Promise.resolve();
    const epoch=ownerEpoch,snapshot=durable;
    restorePromise=(async()=>{
      try{
        const r=await filesystem().readFile({path:'strength-memory-v1.json',directory:'DATA',encoding:'utf8'});
        if(epoch!==ownerEpoch||durable!==snapshot||root.localStorage.getItem(KEY))return;
        memory=hydrate(JSON.parse(r.data));persist();
      }catch{/* First install has no backup; existing facts are left untouched. */}
    })();return restorePromise;
  }
  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function stable(value) {
    if(Array.isArray(value))return value.map(stable);
    if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
    return value;
  }
  function signature(value) {
    const text=JSON.stringify(stable(value));let hash=2166136261;
    for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return `fnv1a32:${(hash>>>0).toString(16).padStart(8,'0')}`;
  }
  function fingerprint(r){return JSON.stringify([r.sessionId,r.exerciseKey,r.kind,r.deleted,r.payload]);}
  function put(record) {
    const old=memory.records[record.id];
    if(old&&fingerprint(old)===fingerprint(record))return;
    const rev=(old?.localRevision||0)+1;
    memory.records[record.id]={...record,localRevision:rev};
    memory.pending[record.id]=rev;
  }
  function authoredTargets(page) {
    try{return clone(root.StrengthTargets.normalize(page));}catch{return clone(page?.setTargets||null);}
  }
  function prescriptionSignature(page) {
    return signature({exerciseKey:root.StrengthBrain.key(page),targets:authoredTargets(page),columns:page.columns||[],logMode:page.logMode||null});
  }
  function replay(exerciseKey,page) {
    page=page||Object.values(memory.records).find(r=>r.exerciseKey===exerciseKey&&r.payload?.page)?.payload.page;
    return root.StrengthBrain.history(records(),page||{},undefined,memory.ownerId);
  }
  function capture(session) {
    if(!session||session.demo)return;
    root.TrainingCore.migrateSession(session);
    session.id=session.id||root.crypto.randomUUID();
    const alive=new Set(),completed=!!session.completedAt&&session.phase==='summary';
    session.brainEstimateIds=session.brainEstimateIds||{};
    const pages=[];
    for(const outer of session.pages||[])for(const page of outer.members||[outer]) {
      if(page.kind!=='lift')continue;pages.push(page);
      const rows=session.logs?.[page.id]?.sets||[],exerciseKey=root.StrengthBrain.key(page),targets=authoredTargets(page);
      let workingIndex=0;
      rows.forEach((row,index)=>{
        row.id=row.id||root.crypto.randomUUID();alive.add(row.id);
        const position=['ramp','warmup'].includes(row.purpose)?-1:workingIndex++;
        if(!row.logged&&!memory.records[row.id])return;
        const target=position>=0?targets?.filter(t=>t.purpose!=='warmup')[position]:null;
        const snapshot={...clone(row),targetId:row.targetId||target?.id||null,workingIndex:position,ordinal:index,context:clone(row.context||{})};
        const candidate=root.StrengthContext.normalizeLoad(row.context?.normalizedLoad||memory.records[row.id]?.payload?.normalizedLoad);
        const expected=candidate&&root.StrengthLoad.fromPage({page,value:row.kg,provenance:candidate.provenance});
        const normalizedLoad=expected&&JSON.stringify(candidate)===JSON.stringify(expected)?candidate:null;
        put({id:row.id,sessionId:session.id,exerciseKey,kind:'set',deleted:!row.logged,payload:{contractVersion:3,ownerId:memory.ownerId,
          normalizedLoad,completed,authoredTargets:targets,page:clone(page),row:snapshot,sessionStartedAt:session.startedAt,date:session.date,prescriptionSignature:prescriptionSignature(page)}});
      });
    }
    // Lifecycle is a session fact: deleted rows also receive finish/reopen snapshots.
    for(const record of Object.values(memory.records))if(record.kind==='set'&&record.sessionId===session.id&&!alive.has(record.id))
      put({...record,deleted:true,payload:{...record.payload,completed}});
    for(const page of pages){
      const rows=session.logs?.[page.id]?.sets||[],exerciseKey=root.StrengthBrain.key(page);
      if(!root.StrengthBrain.eligible(page)&&!session.brainEstimateIds[page.id])continue;
      if(!rows.some(r=>r.logged)&&!session.brainEstimateIds[page.id])continue;
      const id=session.brainEstimateIds[page.id]||(session.brainEstimateIds[page.id]=root.crypto.randomUUID());
      const result=root.StrengthBrain.review(page,rows),state=replay(exerciseKey,page),own=state.evidence.find(e=>e.sessionId===session.id);
      put({id,sessionId:session.id,exerciseKey,kind:'session_estimate',deleted:!rows.some(r=>r.logged),payload:{...result,completed,
        sourceSetIds:own?.sourceSetIds||[],sourceSignature:own?.sourceSignature||null,prescriptionSignature:prescriptionSignature(page),
        freshE1rm:state.freshE1rm,exposures:state.exposures,confidence:state.confidence,modelVersion:state.modelVersion,sessionStartedAt:session.startedAt,date:session.date}});
    }
    persist();schedule();
  }
  async function bind(uid) {
    if(memory.ownerId!==uid) {
      if(memory.ownerId||Object.keys(memory.records).length)root.localStorage.setItem(KEY+':'+memory.ownerId,JSON.stringify(memory));
      const archived=root.localStorage.getItem(KEY+':'+uid);
      if(archived){try{memory=hydrate(JSON.parse(archived));}catch{memory=empty();}}
      else if(memory.ownerId)memory=empty();
      ownerEpoch++;
    }
    const adopt=memory.ownerId==null&&uid;
    memory.ownerId=uid;
    if(adopt)for(const r of Object.values(memory.records))if(r.payload?.ownerId==null)
      put({...r,payload:{...r.payload,ownerId:uid}});
    persist();root.bindStrengthAccount?.(uid);
  }
  function ioDefault() {
    const sb=root.Whoop.client();
    return {
      async userId(){const {data,error}=await sb.auth.getSession();if(error)throw error;return data.session?.user?.id||null;},
      async pull(uid){
        const out=[];for(let offset=0;;offset+=500){const {data,error}=await sb.from('strength_brain_records').select('*').eq('athlete_id',uid).order('record_id').range(offset,offset+499);if(error)throw error;out.push(...data);if(data.length<500)break;}return out;
      },
      async push(batch){const {data,error}=await sb.rpc('sync_strength_brain_records',{p_records:batch});if(error)throw error;return data;}
    };
  }
  async function sync(io=ioDefault()) {
    if(busy)return {ok:false,reason:'busy'};
    busy=true;
    try {
      const initialEpoch=ownerEpoch;
      const uid=await io.userId();if(ownerEpoch!==initialEpoch)return {ok:false,reason:'account_changed'};if(!uid)return {ok:false,reason:'auth_required'};
      await bind(uid);
      const syncEpoch=ownerEpoch;
      const current=()=>ownerEpoch===syncEpoch&&memory.ownerId===uid;
      const remote=await io.pull(uid);
      if(!current())return {ok:false,reason:'account_changed'};
      const conflicts=[];
      for(const r of remote) {
        if(r.athlete_id!=null&&r.athlete_id!==uid)continue;
        const id=r.record_id,base=memory.revisions[id]||0;
        if(typeof id!=='string'||!Number.isSafeInteger(r.revision)||r.revision<1||r.revision<base)continue;
        if(memory.pending[id]&&r.revision!==base){
          const remoteRecord={sessionId:r.session_id,exerciseKey:r.exercise_key,kind:r.kind,deleted:r.deleted,payload:clone(r.payload)};
          if(fingerprint(remoteRecord)===fingerprint(memory.records[id])){memory.revisions[id]=r.revision;delete memory.pending[id];delete memory.conflicts?.[id];continue;}
          (memory.conflicts||(memory.conflicts={}))[id]={id,localRevision:memory.records[id].localRevision,...remoteRecord};
          conflicts.push(id);continue;
        }
        memory.revisions[id]=r.revision;
        if(!memory.pending[id]){
          const next={id,sessionId:r.session_id,exerciseKey:r.exercise_key,kind:r.kind,deleted:r.deleted,payload:clone(r.payload)};
          const old=memory.records[id];next.localRevision=old?(old.localRevision+(fingerprint(old)!==fingerprint(next)?1:0)):1;
          memory.records[id]=next;delete memory.conflicts?.[id];
        }
      }
      persist();
      if(conflicts.length){status.lastError='Concurrent edit requires reconciliation';return {ok:false,reason:'conflict',ids:conflicts};}
      const queued=Object.entries(memory.pending);
      for(let start=0;start<queued.length;start+=100) {
        const entries=queued.slice(start,start+100),batch=entries.map(([id])=>{const r=memory.records[id];return {record_id:id,session_id:r.sessionId,exercise_key:r.exerciseKey,kind:r.kind,deleted:r.deleted,payload:clone(r.payload),expected_revision:memory.revisions[id]||0};});
        const result=await io.push(batch);
        if(!current())return {ok:false,reason:'account_changed'};
        if(!result?.ok){status.lastError=result?.reason||'Sync failed';persist();return result||{ok:false,reason:'push_failed'};}
        for(const [id,rev] of entries) {
          memory.revisions[id]=(memory.revisions[id]||0)+1;
          if(memory.pending[id]===rev)delete memory.pending[id];
        }
        persist();
      }
      retry=0;status.lastError='';status.lastSyncAt=new Date().toISOString();return {ok:true};
    }catch(e){status.lastError=e.message||'Sync failed';return {ok:false,reason:status.lastError};}
    finally{busy=false;if(Object.keys(memory.pending).length&&status.lastError&&!/conflict|Concurrent/.test(status.lastError))schedule(Math.min(60000,5000*2**Math.min(retry++,4)));}
  }
  function schedule(ms=1500) {if(timer)root.clearTimeout(timer);timer=root.setTimeout(()=>{timer=null;sync().catch(()=>{});},ms);}
  function removeSession(sessionId) {
    for(const record of Object.values(memory.records))if(record.sessionId===sessionId&&!record.deleted)put({...record,deleted:true});
    persist();schedule();
  }
  function records(){
    const out={...memory.records};
    for(const [id,remote] of Object.entries(memory.conflicts||{}))if(memory.records[id])
      out['conflict:'+id]={...clone(remote),id,localRevision:memory.records[id].localRevision};
    return out;
  }
  function getStatus(){return {...status,pending:Object.keys(memory.pending).length};}
  root.StrengthMemory={capture,removeSession,records,sync,schedule,restore,getStatus,bind,replay,ownerId:()=>memory.ownerId};
  root.addEventListener?.('online',()=>schedule(0));
  root.addEventListener?.('visibilitychange',()=>{if(root.document?.visibilityState==='visible')schedule(0);});
  restore().then(()=>schedule(0));
})(typeof window!=='undefined'?window:globalThis);
