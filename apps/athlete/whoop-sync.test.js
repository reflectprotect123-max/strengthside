import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const common=readFileSync(new URL('./whoop-common.js',import.meta.url),'utf8');
const connector=common+'\n'+readFileSync(new URL('./connectors/whoop.js',import.meta.url),'utf8');
function fixture(fetch){const state={accountId:'athlete-a',settings:{whoop:{}},checkin:{}};const window={S:state,STRENGTH_CONFIG:{supabaseUrl:'https://example.test',supabaseAnon:'anon',hybridProduct:'strength'},today:()=> '2026-10-10',dailyCheckin:date=>state.checkin[date]||=( {date}),supabase:{createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:'athlete-token',user:{id:'athlete-a',email:'a@example.test'}}}})}})},save(){},setInterval:()=>0};runInNewContext(connector,{window,URL,URLSearchParams,Date,document:{getElementById:()=>null},fetch});return window;}
test('simultaneous refreshes issue one WHOOP request through the shared strength owner lane',async()=>{
 let finish,count=0,request;const w=fixture(async(url,opts)=>{count++;request={url,opts};await new Promise(r=>finish=r);return {ok:true,json:async()=>({connected:true,normalized:{date:'2026-10-10',recoveryScore:70}})};});
 const a=w.Whoop.sync({quiet:true}),b=w.Whoop.sync({quiet:true});await new Promise(r=>setImmediate(r));assert.equal(count,1);finish();await Promise.all([a,b]);assert.equal(w.S.checkin['2026-10-10'].whoopRecovery,70);assert.equal(new URL(request.url).searchParams.get('product'),'strength');assert.equal(request.opts.headers['x-hybrid-product'],'strength');
});
test('response arriving after an account switch cannot populate the next athlete',async()=>{
 let finish;const w=fixture(async()=>{await new Promise(r=>finish=r);return {ok:true,json:async()=>({connected:true,normalized:{date:'2026-10-10',recoveryScore:70}})};});const pending=w.Whoop.sync({quiet:true});await new Promise(r=>setImmediate(r));w.S.accountId='athlete-b';finish();await assert.rejects(pending,/Account changed/);assert.equal(Object.keys(w.S.checkin).length,0);
});

test('legacy return is ignored; new denial return reports cancellation without syncing',async()=>{
 let count=0;const w=fixture(async()=>{count++;return {ok:true,json:async()=>({})};});
 await w.Whoop.handleWhoopReturn('com.hybrid.athlete://whoop?status=connected');assert.equal(count,0);
 await w.Whoop.handleWhoopReturn('com.hybrid.strength://whoop?status=denied');assert.equal(count,0);assert.match(w.Whoop.uiMessage(),/cancelled/);assert.equal(w.S.settings.whoop.awaitingReturn,false);
});

test('undeployed namespaced account endpoint uses the existing authenticated Supabase lane; auth errors do not fall back',async()=>{
 const urls=[];const w=fixture(async url=>{urls.push(url);if(url.includes('/strength-whoop-status'))return {status:404,ok:false,json:async()=>({error:'not_found'})};return {status:200,ok:true,json:async()=>({whoop:{connected:true}})};});
 await w.Whoop.refreshStatus();assert.equal(urls.length,2);assert.ok(urls[1].includes('/functions/v1/integrations-status?product=strength'));assert.equal(w.S.settings.whoop.connected,true);
 let requests=0;const denied=fixture(async()=>{requests++;return {status:401,ok:false,json:async()=>({error:'unauthorized'})};});await assert.rejects(denied.Whoop.refreshStatus(),/Sign in/);assert.equal(requests,1);
});
