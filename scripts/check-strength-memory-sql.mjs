import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const name=`strength-memory-sql-${process.pid}`;
const run=(command,args,options={})=>{
  const result=spawnSync(command,args,{cwd:root,encoding:'utf8',...options});
  if(result.status!==0)throw new Error(`${command} ${args.join(' ')} failed\n${result.stdout||''}${result.stderr||''}`);
  return result.stdout||'';
};

try {
  run('docker',['run','-d','--name',name,'--mount',`type=bind,src=${root},dst=/repo,readonly`,'-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-bookworm']);
  let ready=false;
  for(let attempt=0;attempt<30;attempt++) {
    const probe=spawnSync('docker',['exec',name,'pg_isready','-U','postgres'],{encoding:'utf8'});
    if(probe.status===0){ready=true;break;}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  if(!ready)throw new Error('Throwaway Postgres did not become ready');
  const output=run('docker',['exec','-w','/repo',name,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-f','checks/sql/strength-brain-memory-test.sql']);
  process.stdout.write(output);
} finally {
  spawnSync('docker',['rm','-f',name],{encoding:'utf8'});
}
