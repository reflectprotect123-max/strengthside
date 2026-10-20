import {readFileSync,writeFileSync} from 'node:fs';
for(const name of ['training-core','whoop-common','strength-targets','strength-equipment','strength-rts','strength-policy','strength-load','strength-context','strength-learning','strength-replay','strength-brain-core']) {
const source=readFileSync(new URL(`../apps/shared/${name}.js`,import.meta.url),'utf8');
const targets=[];
if(name==='whoop-common') targets.push(new URL('../apps/athlete/whoop-common.js',import.meta.url), new URL('../park/strength-app/whoop-common.js',import.meta.url));
else targets.push(new URL(`../park/strength-app/${name}.js`,import.meta.url));
for(const path of targets) {
 if(process.argv.includes('--check')) {if(readFileSync(path,'utf8')!==source)throw new Error(`${path.pathname} training contract is stale; run node scripts/sync-training-core.mjs`);}
 else writeFileSync(path,source);
}
}
