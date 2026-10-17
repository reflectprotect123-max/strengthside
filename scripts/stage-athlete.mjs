import {cpSync,existsSync,readFileSync,readdirSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,dirname,resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const source=fileURLToPath(new URL('../apps/athlete',import.meta.url));
export function runtimeFile(path){return !/(^|\/)\.[^/]+/.test(path)&&!/(^|\/)(?:checks|node_modules)(\/|$)/.test(path)&&!/(?:\.test\.|\.smoke\.)/.test(path);}
export function validateAssets(dir,entry='index.html'){
 const html=readFileSync(join(dir,entry),'utf8');const base=dirname(join(dir,entry));
 for(const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){const p=m[1];if(!/^(?:https?:|data:|#)/.test(p)&&/\.(?:js|css)$/.test(p)&&!existsSync(join(base,p)))throw new Error(`Missing runtime asset: ${relative(dir,join(base,p))}`);}
}
export function stageAthlete(dir){
 dir=resolve(dir);const rel=relative(dir,source);
 if(!rel||(!rel.startsWith('..')&&!rel.startsWith('/')))throw new Error('Cannot stage into the source directory or its parent');
 if(existsSync(dir)&&readdirSync(dir).length){if(!existsSync(join(dir,'.strength-stage')))throw new Error('Refusing to replace a non-staging directory');rmSync(dir,{recursive:true,force:true});}
 mkdirSync(dir,{recursive:true});writeFileSync(join(dir,'.strength-stage'),'Generated strength runtime\n');
 cpSync(source,dir,{recursive:true,filter:(p)=>runtimeFile(p.slice(source.length))});validateAssets(dir);validateAssets(dir,'engine/index.html');
}
export function runtimeAssets(dir=source){const out=[];function walk(p,rel=''){for(const entry of readdirSync(p,{withFileTypes:true})){const next=rel?`${rel}/${entry.name}`:entry.name;if(!runtimeFile(next))continue;if(entry.isDirectory())walk(join(p,entry.name),next);else if(/\.(?:js|css|html|jpg|png|woff2?|ttf)$/.test(next)&&next!=='service-worker.js')out.push('./'+next);}}walk(dir);return ['./',...out.sort()];}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){if(!process.argv[2])throw new Error('Specify output directory');stageAthlete(process.argv[2]);}
