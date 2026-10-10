import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const event=process.argv[2];
if(!event)process.exit(0);

const worker=process.env.CLAUDE_MEM_WORKER||join(homedir(),'claude-mem','plugin','scripts','worker-service.cjs');
if(!existsSync(worker))process.exit(0);

const configured=process.env.BUN_EXECUTABLE;
const local=join(homedir(),'.bun','bin',process.platform==='win32'?'bun.exe':'bun');
const bun=configured||(existsSync(local)?local:'bun');
const result=spawnSync(bun,[worker,'hook','cursor',event],{stdio:'inherit'});

// Memory is optional. A missing local plugin must never block Cursor work.
process.exit(result.error?.code==='ENOENT'?0:(result.status??0));
