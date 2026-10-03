// STRENGTHSIDE-DESIGNED: prepare only this trial's allowlisted server secrets.
// Never imports a password/refresh token or prints the access token.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const [input,owner,output,timezone='Australia/Sydney']=process.argv.slice(2);
try{
  if(!input||!/^s:[a-f0-9-]{36}$/i.test(owner||'')||!output)throw Error('Usage: node scripts/conditioning/prepare-whoop-steps.mjs <Totem .env> s:<Supabase user UUID> <output outside repo> [IANA timezone]');
  new Intl.DateTimeFormat('en',{timeZone:timezone});
  const target=resolve(output),repo=resolve(import.meta.dirname,'../..');
  if(target===repo||target.startsWith(repo+'/'))throw Error('Secrets output must be outside the repository.');
  const line=readFileSync(input,'utf8').split(/\r?\n/).find(l=>/^WHOOP_IOS_BEARER_TOKEN\s*=/.test(l));
  let token=line?.slice(line.indexOf('=')+1).trim();
  if(token?.startsWith("'")||token?.startsWith('"'))token=token.slice(1,-1);
  if(!token||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))throw Error('Missing or malformed private WHOOP access token. Run Totem auth first.');
  const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());
  if(claims.token_use!=='access'||!Number.isFinite(claims.exp)||claims.exp*1000<Date.now()+60000)throw Error('Private access token is expired or unsuitable. Run Totem auth again.');
  writeFileSync(target,`WHOOP_STEPS_OWNER=${owner}\nWHOOP_PRIVATE_ACCESS_TOKEN=${token}\nWHOOP_STEPS_TIMEZONE=${timezone}\n`,{mode:0o600,flag:'wx'});
  console.log('Prepared protected server-secret file. Token values were not printed.');
}catch{console.error('Could not prepare secrets. Check the arguments, fresh Totem login and a new output path outside the repository.');process.exitCode=1;}
