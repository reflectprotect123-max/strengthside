import assert from 'node:assert/strict';
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID;
assert.ok(token,'Set CLOUDFLARE_API_TOKEN securely.');assert.match(account||'',/^[0-9a-f]{32}$/i,'Set CLOUDFLARE_ACCOUNT_ID.');
const base='https://api.cloudflare.com/client/v4/accounts/'+account+'/pages/projects',name='hybrid-engine-web';
async function call(url,method='GET',body){const response=await fetch(url,{method,headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();return {response,data};}
let {response,data}=await call(base+'/'+name);
if(response.status===404){({response,data}=await call(base,'POST',{name,production_branch:'main'}));}
if(!response.ok||!data.success){console.error('Cloudflare Pages setup failed. HTTP',response.status,'error codes:',(data.errors||[]).map(e=>e.code));process.exit(1);}
if(data.result?.source){console.error('This project already uses Git integration. Deploy through that connection; the script will not change it.');process.exit(1);}
console.log('Cloudflare direct-upload project ready:',data.result.name);
