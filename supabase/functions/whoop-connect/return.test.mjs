import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';
let handler;globalThis.Deno={serve:fn=>handler=fn,env:{get:key=>({SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'test-service',WHOOP_CLIENT_ID:'test-client',WHOOP_CLIENT_SECRET:'test-secret',INTEGRATION_ENCRYPT_KEY:'test-encryption-key'})[key]}};
const plugin={name:'isolated-oauth',setup(b){b.onResolve({filter:/^https:\/\/esm\.sh/},args=>({path:args.path,namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:"export function createClient(){return {auth:{getUser:async token=>token==='athlete-session'?{data:{user:{id:'test-athlete'}}}:{data:{user:null},error:new Error('unauthorized')}}}}"}));b.onLoad({filter:/_shared\/store\.ts$/},()=>({contents:'const store=new Map();export const getJson=async key=>store.get(key)||null;export const setJson=async(key,value)=>store.set(key,value);export const deleteKey=async key=>store.delete(key);'}));}};
async function load(entry){const out=await build({stdin:{contents:entry,resolveDir:import.meta.dirname},bundle:true,write:false,format:'esm',platform:'node',plugins:[plugin]});return import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));}
const api=await load("import './index.ts'; export * from '../_shared/oauth.ts';"),connect=handler;
const req=id=>new Request('https://example.test/whoop-connect?client=native&product=strength&appId='+id,{headers:{authorization:'Bearer athlete-session','x-hybrid-product':'strength'}});
test('strength connection records the new return; arbitrary app IDs cannot redirect OAuth',async()=>{
 const response=await connect(req('com.hybrid.strength')),body=await response.json();assert.equal(response.status,200);assert.equal(body.returnUrl,'com.hybrid.strength://whoop');
 const state=new URL(body.authorizeUrl).searchParams.get('state'),pending=await api.consumePending('whoop',state);assert.equal(pending.owner,'s:test-athlete');assert.equal(pending.appId,'com.hybrid.strength');assert.equal(await api.consumePending('whoop',state),null);
 const attacker=await (await connect(req('malicious.app'))).json();assert.equal(attacker.returnUrl,'com.hybrid.strength://whoop');
 const conditioning=await (await connect(req('com.hybrid.athlete'))).json();assert.equal(conditioning.returnUrl,'com.hybrid.athlete://whoop');
});
const callbackApi=await load("import '../whoop-callback/index.ts'; export * from '../_shared/oauth.ts';"),callback=handler;
test('callback returns to the new APK and consumes state once without relying on polling',async()=>{
 await callbackApi.savePending('whoop','state-123',{owner:'s:test-athlete',kind:'native',product:'strength',appId:'com.hybrid.strength'});
 const response=await callback(new Request('https://example.test/whoop-callback?state=state-123&error=access_denied'));assert.equal(response.status,200);const html=await response.text();assert.match(html,/com\.hybrid\.strength:\/\/whoop\?status=denied/);assert.match(html,/package=com\.hybrid\.strength/);assert.doesNotMatch(html,/com\.hybrid\.athlete/);
 const replay=await callback(new Request('https://example.test/whoop-callback?state=state-123&error=access_denied'));assert.equal(replay.status,302);assert.match(replay.headers.get('location'),/invalid_oauth_state/);
});
