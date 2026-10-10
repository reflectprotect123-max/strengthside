import {readFileSync,writeFileSync} from 'node:fs';
for(const name of ['training-core','whoop-common']) {
const source=readFileSync(new URL(`../apps/shared/${name}.js`,import.meta.url),'utf8');
for(const app of ['athlete','coach']) {
 const path=new URL(`../apps/${app}/${name}.js`,import.meta.url);
 if(process.argv.includes('--check')) {if(readFileSync(path,'utf8')!==source)throw new Error(`${app} training contract is stale; run node scripts/sync-training-core.mjs`);}
 else writeFileSync(path,source);
}
}
