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

test('the first sync pulls every stored day once, then later syncs ask for the day', async () => {
  const urls = [];
  const metrics = [
    { date: '2026-10-01', recovery: 60, hrv: 48, rhr: 54, sleep: 7, steps: 1000 },
    { date: '2026-10-10', recovery: 70, hrv: 50, rhr: 52, sleep: 8, steps: 2000 },
  ];
  const w = fixture(async (url) => {
    urls.push(String(url));
    const day = urls.length > 1;
    return { ok: true, json: async () => ({
      connected: true,
      historyTruncated: false,
      syncedAt: '2026-10-13T01:00:00.000Z',
      normalized: { date: '2026-10-10', recoveryScore: day ? 71 : 70, hrvMs: 50, restingHr: 52 },
      dailyMetrics: day ? [{ date: '2026-10-10', recovery: 71, hrv: 50, rhr: 52, sleep: 8, steps: 2000 }] : metrics,
    }) };
  });
  runInNewContext(readFileSync(new URL('./strength-home.js', import.meta.url), 'utf8'), w);
  await w.Whoop.sync({ quiet: true });
  assert.equal(new URL(urls[0]).searchParams.get('history'), 'all');
  assert.equal(new URL(urls[0]).searchParams.get('backfill'), null);
  assert.equal(w.S.settings.whoop.historyBackfillAt, '2026-10-13T01:00:00.000Z');
  assert.equal(w.S.whoopHistory.length, 2);
  await w.Whoop.sync({ quiet: true });
  assert.equal(new URL(urls[1]).searchParams.get('history'), 'day');
  assert.equal(w.S.whoopHistory.find((row) => row.date === '2026-10-01').recovery, 60);
  assert.equal(w.S.whoopHistory.find((row) => row.date === '2026-10-10').recovery, 71);
});

test('a cut-off full history stays unmarked so the next sync tries again', async () => {
  const urls = [];
  const w = fixture(async (url) => { urls.push(String(url)); return { ok: true, json: async () => ({ connected: true, historyTruncated: true, syncedAt: '2026-10-13T01:00:00.000Z', dailyMetrics: [{ date: '2026-10-10', recovery: 70, hrv: 50, rhr: 52 }] }) }; });
  runInNewContext(readFileSync(new URL('./strength-home.js', import.meta.url), 'utf8'), w);
  await w.Whoop.sync({ quiet: true });
  assert.equal(new URL(urls[0]).searchParams.get('history'), 'all');
  assert.equal(w.S.settings.whoop.historyBackfillAt, undefined);
});

test('the calendar date is Australia/Sydney', () => {
  const sandbox = { window: {}, Intl, Date };
  runInNewContext(common, sandbox);
  assert.equal(sandbox.window.WhoopCommon.sydneyToday(new Date('2026-10-13T14:30:00.000Z')), '2026-10-14');
  assert.equal(sandbox.window.WhoopCommon.sydneyToday(new Date('2026-10-13T12:00:00.000Z')), '2026-10-13');
});

test('undeployed namespaced account endpoint uses the existing authenticated Supabase lane; auth errors do not fall back',async()=>{
 const urls=[];const w=fixture(async url=>{urls.push(url);if(url.includes('/strength-whoop-status'))return {status:404,ok:false,json:async()=>({error:'not_found'})};return {status:200,ok:true,json:async()=>({whoop:{connected:true}})};});
 await w.Whoop.refreshStatus();assert.equal(urls.length,2);assert.ok(urls[1].includes('/functions/v1/integrations-status?product=strength'));assert.equal(w.S.settings.whoop.connected,true);
 let requests=0;const denied=fixture(async()=>{requests++;return {status:401,ok:false,json:async()=>({error:'unauthorized'})};});await assert.rejects(denied.Whoop.refreshStatus(),/Sign in/);assert.equal(requests,1);
});
