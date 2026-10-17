/** OpenRouter coach lives behind the authenticated Supabase Edge function. */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const functionFile = join(repo, 'supabase/functions/brain-coach/index.mjs');
const configFile = join(repo, 'supabase/config.toml');
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

must(existsSync(functionFile), 'missing Supabase brain-coach Edge function');
const source = readFileSync(functionFile, 'utf8');
must(source.includes("https://openrouter.ai/api/v1/chat/completions"), 'coach must call OpenRouter server-side');
must(source.includes("env('OPENROUTER_API_KEY')"), 'coach API key must come from Supabase function secrets');
must(!source.includes('process.env'), 'Edge function must not depend on Node process env');
const config = readFileSync(configFile, 'utf8');
must(source.includes("import('../_shared/auth.ts')"), 'coach must verify the Supabase user identity in the handler');
must(/\[functions\.brain-coach\][\s\S]*?verify_jwt\s*=\s*false/.test(config), 'ES256 verification must be handled by the function, not the gateway');

if (failures.length) {
  console.error('openrouter-ownership.smoke: FAIL');
  for (const failure of failures) console.error(' -', failure);
  process.exit(1);
}
console.log('openrouter-ownership.smoke: ok');
