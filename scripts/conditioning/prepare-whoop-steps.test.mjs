import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,statSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const helper=new URL('./prepare-whoop-steps.mjs',import.meta.url);
const owner='s:11111111-1111-1111-1111-111111111111';
const jwt=exp=>'synthetic.'+Buffer.from(JSON.stringify({token_use:'access',exp})).toString('base64url')+'.signature';
test('login export excludes password/refresh token, hides secrets, protects output and refuses overwrite or expired sessions',()=>{
  const dir=mkdtempSync(join(tmpdir(),'whoop-secret-test-')),input=join(dir,'.env'),output=join(dir,'export.env');
  try{
    const token=jwt(Date.now()/1000+3600);
    writeFileSync(input,`WHOOP_IOS_BEARER_TOKEN='${token}'\nWHOOP_PASSWORD=synthetic-password\nWHOOP_COGNITO_REFRESH_TOKEN=synthetic-refresh\n`);
    const run=()=>spawnSync(process.execPath,[helper.pathname,input,owner,output],{encoding:'utf8'});
    const result=run();assert.equal(result.status,0);assert.doesNotMatch(result.stdout+result.stderr,/synthetic|signature/);
    const content=readFileSync(output,'utf8');assert.ok(content.includes(token));assert.doesNotMatch(content,/PASSWORD|REFRESH|synthetic-password|synthetic-refresh/);
    assert.equal(statSync(output).mode&0o777,0o600);assert.equal(run().status,1);assert.equal(readFileSync(output,'utf8'),content);
    rmSync(output);writeFileSync(input,`WHOOP_IOS_BEARER_TOKEN=${jwt(1)}\n`);assert.equal(run().status,1);assert.equal(existsSync(output),false);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
