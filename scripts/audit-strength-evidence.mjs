#!/usr/bin/env node
/** Read-only aggregate audit. Store private JSON exports under ignored tmp/ or /tmp. */
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const args=process.argv.slice(2);
if(args.length!==1||args[0].startsWith('-')) {
 console.error('Usage: node scripts/audit-strength-evidence.mjs <local-records.json>\nRead-only; accepts an array or {records: array|object}. Keep private exports in tmp/ or /tmp.');
 process.exitCode=1;
} else {
 try {
  const root={};
  for(const name of ['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-load','strength-context','strength-brain-core'])vm.runInNewContext(readFileSync(new URL(`../apps/shared/${name}.js`,import.meta.url),'utf8'),{window:root});
  const parsed=JSON.parse(readFileSync(args[0],'utf8'));
  const input=Array.isArray(parsed)?parsed:parsed?.records;
  if(!input||typeof input!=='object')throw new Error('Expected a records array or object');
  const records=Array.isArray(input)?input:Object.values(input),counts={total:records.length,known:0,ambiguous:0,unsupported:0};
  for(const record of records) {
   const payload=record?.payload,row=payload?.row,page=payload?.page;
   const weight=row?.kg;
   const actual=['number','string'].includes(typeof weight)&&String(weight).trim()!==''&&Number.isFinite(Number(weight))&&Number(weight)>=0;
   const load=root.StrengthContext.normalizeLoad(payload?.normalizedLoad);
   const matchesActual=!load||load.rawValue===Number(weight);
   const supported=page&&typeof page==='object'&&(!page.columns||Array.isArray(page.columns))&&root.StrengthBrainCore.supported({...page,loadUnit:load?'kg':page.loadUnit});
   // Movement support is separate from load provenance; never infer convention from a title.
   if(record?.kind!=='set'||record.deleted||!actual||!matchesActual||!supported||load?.convention==='added_bodyweight')counts.unsupported++;
   else if(root.StrengthContext.classifyLegacy(payload)==='known_legacy_version')counts.known++;
   else counts.ambiguous++;
  }
  process.stdout.write(JSON.stringify(counts,null,2)+'\n');
 }catch {
  // Parse errors can contain snippets of private exports. Report only a generic failure.
  console.error('Cannot audit records: use a readable JSON records array or {records: array|object}.');
  process.exitCode=1;
 }
}
