import {readFileSync} from 'node:fs';
const token=process.env.SUPABASE_ACCESS_TOKEN;
if(!token){console.error('SUPABASE_ACCESS_TOKEN is not configured for this deployment.');process.exit(2);}
const query=readFileSync(new URL('../supabase/migrations/20261010120000_strength_brain_memory.sql',import.meta.url),'utf8');
const res=await fetch('https://api.supabase.com/v1/projects/orysjncrksmdfabpuftd/database/query',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query})});
if(!res.ok){console.error(`Supabase migration failed: HTTP ${res.status}`);process.exit(1);}
console.log('Applied strength brain memory schema and authenticated sync RPC.');
