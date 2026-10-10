/** Individual athlete-owned records, persistent outbox and optimistic Supabase sync. */
(function(root) {
  const KEY='strength-memory-v1',VERSION=1;
  let busy=false,timer=null,retry=0,nativePending=null,nativeWriting=false;
  const status={pending:0,lastError:'',lastSyncAt:null};
  const empty=()=>({version:VERSION,ownerId:null,records:{},pending:{},revisions:{}});
  let memory;
  try{memory=JSON.parse(root.localStorage.getItem(KEY))||empty();}catch{memory=empty();}
  if(memory.version!==VERSION)throw new Error('Unsupported strength memory version');
  function persist() {
    root.localStorage.setItem(KEY,JSON.stringify(memory));
    status.pending=Object.keys(memory.pending).length;
    if(root.Capacitor?.isNativePlatform?.()) {
      nativePending=JSON.stringify(memory);writeNative();
    }
  }
  function filesystem(){return root.Capacitor?.Plugins?.Filesystem||root.Capacitor?.registerPlugin?.('Filesystem');}
  async function writeNative() {
    if(nativeWriting||!nativePending)return;
    nativeWriting=true;const data=nativePending;nativePending=null;
    try{await filesystem().writeFile({path:'strength-memory-v1.json',directory:'DATA',data,encoding:'utf8'});}catch(e){status.lastError='Native backup failed';console.warn('Strength memory native backup failed');}
    finally{nativeWriting=false;if(nativePending)writeNative();}
  }
  async function restore() {
    if(!root.Capacitor?.isNativePlatform?.()||root.localStorage.getItem(KEY))return;
    try{const r=await filesystem().readFile({path:'strength-memory-v1.json',directory:'DATA',encoding:'utf8'});const saved=JSON.parse(r.data);if(saved.version===VERSION){memory=saved;persist();}}catch{/* First install has no backup. */}
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
  function currentSets(exerciseKey) {
    return Object.values(memory.records).filter(r=>r.kind==='set'&&!r.deleted&&r.exerciseKey===exerciseKey&&r.payload?.row&&r.payload?.page);
  }
  function replay(exerciseKey) {
    const sessions=new Map();
    for(const record of currentSets(exerciseKey)) {
      const payload=record.payload,bucket=sessions.get(record.sessionId)||{page:payload.page,records:[],at:payload.sessionStartedAt||payload.date||0,sessionId:record.sessionId};
      bucket.records.push(record);sessions.set(record.sessionId,bucket);
    }
    let state={freshE1rm:null,exposures:0,confidence:'unknown',modelVersion:root.StrengthBrain.VERSION,lastSourceSignature:null};
    const evidence=[];
    for(const bucket of [...sessions.values()].sort((a,b)=>String(a.at).localeCompare(String(b.at))||a.sessionId.localeCompare(b.sessionId))) {
      bucket.records.sort((a,b)=>(a.payload.row.ordinal||0)-(b.payload.row.ordinal||0));
      const result=root.StrengthBrain.review(bucket.page,bucket.records.map(r=>r.payload.row));
      if(!Number.isFinite(Number(result.e1rm))||Number(result.e1rm)<=0||!result.sourceSetIds?.length)continue;
      const sourceSignature=signature(bucket.records.map(r=>({id:r.id,revision:r.localRevision||0,content:fingerprint(r)})));
      state=root.StrengthBrainCore.learn(state,{estimate:result.e1rm,sourceSignature,modelVersion:root.StrengthBrain.VERSION});
      evidence.push({sessionId:bucket.sessionId,estimate:result.e1rm,sourceSignature,sourceSetIds:result.sourceSetIds});
    }
    return {...state,evidence};
  }
  function capture(session) {
    if(!session||session.demo)return;
    root.TrainingCore.migrateSession(session);
    session.id=session.id||root.crypto.randomUUID();
    const alive=new Set();
    session.brainEstimateIds=session.brainEstimateIds||{};
    for(const outer of session.pages||[])for(const page of outer.members||[outer]) {
      if(page.kind!=='lift')continue;
      const rows=session.logs?.[page.id]?.sets||[],exerciseKey=root.StrengthBrain.key(page),targets=authoredTargets(page);
      rows.forEach((row,index)=>{
        row.id=row.id||root.crypto.randomUUID();alive.add(row.id);
        if(!row.logged&&!memory.records[row.id])return;
        put({id:row.id,sessionId:session.id,exerciseKey,kind:'set',deleted:!row.logged,payload:{contractVersion:2,authoredTargets:targets,page:clone(page),row:{...clone(row),ordinal:index,context:clone(row.context||{})},sessionStartedAt:session.startedAt,date:session.date,prescriptionSignature:prescriptionSignature(page)}});
      });
      for(const record of Object.values(memory.records))if(record.kind==='set'&&record.sessionId===session.id&&record.exerciseKey===exerciseKey&&!alive.has(record.id)&&!record.deleted)put({...record,deleted:true});
      if(root.StrengthBrain.eligible(page) && (rows.some(r=>r.logged) || session.brainEstimateIds[page.id])) {
        const id=session.brainEstimateIds[page.id]||(session.brainEstimateIds[page.id]=root.crypto.randomUUID());
        const result=root.StrengthBrain.review(page,rows),state=replay(exerciseKey);
        const ownEvidence=state.evidence.find(e=>e.sessionId===session.id);
        put({id,sessionId:session.id,exerciseKey,kind:'session_estimate',deleted:!rows.some(r=>r.logged),payload:{...result,sourceSetIds:result.sourceSetIds||[],sourceSignature:ownEvidence?.sourceSignature||null,prescriptionSignature:prescriptionSignature(page),freshE1rm:state.freshE1rm,exposures:state.exposures,confidence:state.confidence,modelVersion:state.modelVersion,sessionStartedAt:session.startedAt,date:session.date}});
      }
    }
    for(const r of Object.values(memory.records))if(r.kind==='set'&&r.sessionId===session.id&&!alive.has(r.id)&&!r.deleted)put({...r,deleted:true});
    persist();schedule();
  }
  async function bind(uid) {
    root.bindStrengthAccount?.(uid);
    if(memory.ownerId&&memory.ownerId!==uid) {
      root.localStorage.setItem(KEY+':'+memory.ownerId,JSON.stringify(memory));
      try{memory=JSON.parse(root.localStorage.getItem(KEY+':'+uid))||empty();}catch{memory=empty();}
    }
    memory.ownerId=uid;persist();
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
      const uid=await io.userId();if(!uid)return {ok:false,reason:'auth_required'};
      await bind(uid);
      const remote=await io.pull(uid);
      const conflicts=[];
      for(const r of remote) {
        const id=r.record_id,base=memory.revisions[id]||0;
        if(memory.pending[id]&&r.revision!==base){
          const remoteRecord={sessionId:r.session_id,exerciseKey:r.exercise_key,kind:r.kind,deleted:r.deleted,payload:r.payload};
          if(fingerprint(remoteRecord)===fingerprint(memory.records[id])){memory.revisions[id]=r.revision;delete memory.pending[id];continue;}
          conflicts.push(id);continue;
        }
        memory.revisions[id]=r.revision;
        if(!memory.pending[id])memory.records[id]={id,sessionId:r.session_id,exerciseKey:r.exercise_key,kind:r.kind,deleted:r.deleted,payload:r.payload,localRevision:r.revision};
      }
      persist();
      if(conflicts.length){status.lastError='Concurrent edit requires reconciliation';return {ok:false,reason:'conflict',ids:conflicts};}
      const queued=Object.entries(memory.pending);
      for(let start=0;start<queued.length;start+=100) {
        const entries=queued.slice(start,start+100),batch=entries.map(([id])=>{const r=memory.records[id];return {record_id:id,session_id:r.sessionId,exercise_key:r.exerciseKey,kind:r.kind,deleted:r.deleted,payload:r.payload,expected_revision:memory.revisions[id]||0};});
        const result=await io.push(batch);
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
  function records(){return memory.records;}
  function getStatus(){return {...status,pending:Object.keys(memory.pending).length};}
  root.StrengthMemory={capture,removeSession,records,sync,schedule,restore,getStatus,bind,replay,ownerId:()=>memory.ownerId};
  root.addEventListener?.('online',()=>schedule(0));
  root.addEventListener?.('visibilitychange',()=>{if(root.document?.visibilityState==='visible')schedule(0);});
  restore().then(()=>schedule(0));
})(typeof window!=='undefined'?window:globalThis);
