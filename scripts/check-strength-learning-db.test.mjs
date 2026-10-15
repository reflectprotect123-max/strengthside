import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
for(const input of ['http://[DO_NOT_LOG_TEST_SECRET','postgres://user:DO_NOT_LOG_TEST_SECRET@production.invalid/db','postgres://user:DO_NOT_LOG_TEST_SECRET@127.0.0.1/db'])test('database harness rejects and redacts '+(input.startsWith('http')?'malformed input':input.includes('production')?'external database':'existing local database'),()=>{
 const r=spawnSync(process.execPath,['scripts/check-strength-learning-db.mjs'],{encoding:'utf8',env:{...process.env,STRENGTH_TEST_DATABASE_URL:input}});
 assert.notEqual(r.status,0);assert.doesNotMatch(r.stdout+r.stderr,/DO_NOT_LOG_TEST_SECRET/);
});
