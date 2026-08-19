/*
 * Apply every strength migration to a REAL, throwaway Postgres and prove it.
 *
 * Static checks read migration TEXT, and text cannot tell you that a policy is
 * actually consulted. A table can carry a correct-looking policy and still be
 * wide open because the RLS switch itself was never turned on, or because a
 * foreign key reference walks around it. So this builds its own cluster,
 * applies the migrations in order, and asserts the switch — empirically.
 *
 * Scoped to THIS repository's twelve tables. Everything the migrations lean on
 * but do not own is stubbed by checks/sql/strength-prelude.sql, which names the
 * real owner of each object. See CLAUDE.md's shared-Supabase contract.
 *
 * Ported from THE-HYBRID-ENGINE1's checks/migrations-apply.mjs at 34dfab4. The
 * hybrid version is ~2100 lines because it also proves the ecosystem RPCs, the
 * MacroTrack catalogue and the roster erasure paths — none of which this repo
 * owns. Dropping them is the point of the split, not an omission.
 *
 * Skipped unless a local postgres exists (initdb on PATH), because it needs a
 * server it can own. Never points at a real project — it builds a cluster in a
 * temp dir and destroys it.
 *
 * Run: node checks/migrations-apply.mjs
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, copyFileSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PGBIN = ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/local/bin'].find((p) => {
  try { execSync(`test -x ${p}/initdb`); return true; } catch { return false; }
});
if (!PGBIN) {
  console.log('SKIP — no local postgres (initdb not found). This check needs a server it can own.');
  process.exit(0);
}

/*
 * initdb refuses to run as root, so a root caller — a container — has to hand
 * the cluster to somebody else. A NON-root caller already is somebody else and
 * needs none of that: creating a user requires privileges it does not have.
 * Hence the conditional. (The hybrid repo learned this when the first version
 * died with `useradd: Permission denied` on a GitHub runner while passing in
 * the container it was written in.)
 *
 * The socket lives in a SHORT path: postgres caps it at 107 bytes.
 */
const AS_ROOT = typeof process.getuid === 'function' && process.getuid() === 0;
const OWNER = 'pgtester';
if (AS_ROOT) {
  try { execSync(`id -u ${OWNER}`, { stdio: 'ignore' }); } catch { execSync(`useradd -M ${OWNER}`); }
}
const dir = mkdtempSync(join('/tmp', 'strengthpg-'));
execSync(`chmod 777 ${dir}${AS_ROOT ? ` && chown -R ${OWNER} ${dir}` : ''}`);

const sqlFiles = readdirSync(join(ROOT, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort();
for (const src of [...sqlFiles.map((f) => join(ROOT, 'supabase/migrations', f)), join(ROOT, 'checks/sql/strength-prelude.sql')]) {
  const dest = join(dir, src.split('/').pop());
  copyFileSync(src, dest);
  execSync(`chmod 644 ${dest}${AS_ROOT ? ` && chown ${OWNER} ${dest}` : ''}`);
}

const asOwner = (cmd) => execSync(AS_ROOT ? `su ${OWNER} -c ${JSON.stringify(`${PGBIN}/${cmd}`)}` : `${PGBIN}/${cmd}`, { stdio: 'pipe' });
/* ON_ERROR_STOP=1 is LOAD-BEARING, not tidiness. Without it psql exits 0 even
   when every statement in the file errored, so `applies <migration>` reports
   PASS for a migration that did nothing — which is exactly what this check
   exists to catch, reported as its opposite. Dropped by accident during the
   port from THE-HYBRID-ENGINE1 (which has always had it) and caught only
   because pgvector was genuinely absent and the run still went green. */
const psql = (args) => asOwner(`psql -h ${dir} -p 5433 -U postgres -d postgres -v ON_ERROR_STOP=1 ${args}`).toString();
/* Every statement is collapsed to ONE line before it goes near psql: the
   command crosses `su -c "..."`, and a newline inside the SQL arrives at the
   server as a literal backslash-n and dies with a syntax error pointing at a
   backslash nobody wrote. Cost a real debugging session; do not re-wrap. */
const oneLine = (sql) => sql.replace(/\s+/g, ' ').trim();
const runSql = (sql) => psql(`-tc ${JSON.stringify(oneLine(sql))}`);
const lastLine = (out) => out.trim().split('\n').map((l) => l.trim()).filter(Boolean).pop() ?? '';

let failures = 0;

/*
 * KNOWN ENVIRONMENT GAPS — counted separately from failures, on purpose.
 *
 * pgvector (20260819_phase_f_knowledge_base's `create extension vector`) is a
 * COMPILED extension shipping as its own package (postgresql-<ver>-pgvector),
 * not with whatever postgres this check borrows. A check that is always red
 * hides every NEW failure behind the one it already reports. Red has to mean
 * something.
 *
 * So a missing pgvector is named, printed loudly, and NOT counted as a failure.
 * It is not allowed to pass silently in CI either — the workflow installs the
 * package and greps this output for `KNOWN ENVIRONMENT GAP`, failing the build
 * if the marker appears there. On the runner the extension IS installed, so a
 * gap there means the install broke, not the environment.
 *
 * The cost, stated plainly: without pgvector the phase F migration does not
 * apply, so nothing it creates exists for later probes. Any check against those
 * objects must tolerate their absence when `knownGaps > 0`.
 */
let knownGaps = 0;
const KNOWN_GAPS = [
  { pattern: /extension "vector" is not available/, name: 'pgvector is not installed (apt: postgresql-<ver>-pgvector)' },
];
const check = (label, fn) => {
  try { fn(); console.log(`  PASS — ${label}`); }
  catch (e) { failures++; console.error(`  FAIL — ${label}: ${String(e.message || e).split('\n').slice(0, 3).join(' ')}`); }
};

/* The twelve tables this repository owns. Not a convenience list — it is the
   shared-Supabase contract in executable form. A table added here that the
   contract does not name is the violation this check exists to catch. */
const OWNED_TABLES = [
  'metric', 'equipment', 'exercise', 'strength_block_item', 'prescribed_set',
  'prescribed_target', 'assigned_session', 'performed_set',
  'performed_measurement', 'working_max_event', 'pr_event',
];
const VECTOR_TABLES = ['coaching_note'];

try {
  asOwner(`initdb -D ${dir}/data -U postgres --auth=trust`);
  asOwner(`pg_ctl -D ${dir}/data -o '-p 5433 -k ${dir} -c listen_addresses=""' -l ${dir}/log start`);
  execSync('sleep 3');

  console.log('Stubbing what this repo does not own (see checks/sql/strength-prelude.sql):\n');
  psql(`-q -f ${join(dir, 'strength-prelude.sql')}`);
  console.log('  PASS — prelude applies\n');

  console.log('Applying strength migrations to a throwaway cluster:\n');
  for (const f of sqlFiles) {
    try {
      psql(`-q -f ${join(dir, f)}`);
      console.log(`  PASS — applies ${f}`);
    } catch (e) {
      const out = `${e.stdout ?? ''}${e.stderr ?? ''}${e.message ?? ''}`;
      const gap = KNOWN_GAPS.find((g) => g.pattern.test(out));
      if (gap) {
        knownGaps++;
        console.error(`  KNOWN ENVIRONMENT GAP — ${f} did not apply: ${gap.name}.`);
        console.error('      Not counted as a failure, but nothing this migration creates exists');
        console.error('      for the rest of this run. CI installs the extension and FAILS on this');
        console.error('      marker, so the migration is still proven there.');
      } else {
        failures++;
        console.error(`  FAIL — applies ${f}: ${String(e.message || e).split('\n').slice(0, 3).join(' ')}`);
      }
    }
  }

  console.log('\nOwned tables and their RLS:\n');

  check(`all ${OWNED_TABLES.length} non-vector strength tables exist`, () => {
    const list = OWNED_TABLES.map((t) => `'${t}'`).join(',');
    const got = lastLine(runSql(`select count(*) from pg_tables where schemaname='public' and tablename in (${list});`));
    if (Number(got) !== OWNED_TABLES.length) throw new Error(`expected ${OWNED_TABLES.length}, found ${got}`);
  });

  /* RLS enabled is NOT implied by having a policy — a table can carry policies
     that are simply never consulted. Assert the switch itself. */
  check('row level security is on for every one of them', () => {
    const list = OWNED_TABLES.map((t) => `'${t}'`).join(',');
    const off = lastLine(runSql(
      `select coalesce(string_agg(relname, ','), 'none') from pg_class
       where relname in (${list}) and relnamespace='public'::regnamespace and not relrowsecurity;`,
    ));
    if (off !== 'none') throw new Error(`RLS off on: ${off}`);
  });

  for (const t of VECTOR_TABLES) {
    check(`row level security is on for ${t} (where pgvector let it exist)`, () => {
      const exists = lastLine(runSql(`select coalesce(to_regclass('public.${t}')::text, 'absent');`));
      if (exists === 'absent') {
        if (knownGaps > 0) return; // the named gap covers it
        throw new Error(`${t} is missing with no known environment gap to explain it`);
      }
      const on = lastLine(runSql(
        `select relrowsecurity from pg_class where relname='${t}' and relnamespace='public'::regnamespace;`,
      ));
      if (on !== 't') throw new Error('RLS is off');
    });
  }

  console.log('\nCross-repo contract:\n');

  /* The whole point of the split. A migration here that creates a table the
     contract does not name means the two repos have started fighting over the
     same database, and the shared Postgres will not warn anyone. */
  check('no migration creates a table outside the twelve this repo owns', () => {
    const all = [...OWNED_TABLES, ...VECTOR_TABLES];
    const declared = sqlFiles
      .flatMap((f) => [...readFileSync(join(ROOT, 'supabase/migrations', f), 'utf8')
        .matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_]+)/gi)]
        .map((m) => m[1].toLowerCase()));
    const stray = [...new Set(declared)].filter((t) => !all.includes(t));
    if (stray.length) throw new Error(`creates tables it does not own: ${stray.join(', ')}`);
  });

  check('no migration writes against a hybrid-owned object', () => {
    const FORBIDDEN = ['coach_athlete_assignments', 'organization_memberships', 'athlete_weekly_plans', 'athlete_domain_snapshots'];
    const bad = [];
    for (const f of sqlFiles) {
      const sql = readFileSync(join(ROOT, 'supabase/migrations', f), 'utf8');
      for (const t of FORBIDDEN) {
        if (new RegExp(`(alter|drop)\\s+table\\s+(if\\s+exists\\s+)?(public\\.)?${t}\\b`, 'i').test(sql)) bad.push(`${f} -> ${t}`);
      }
    }
    if (bad.length) throw new Error(bad.join('; '));
  });
} finally {
  try { asOwner(`pg_ctl -D ${dir}/data stop -m immediate`); } catch { /* already down */ }
  rmSync(dir, { recursive: true, force: true });
}

if (knownGaps > 0) {
  console.error(`\n${knownGaps} KNOWN ENVIRONMENT GAP(S) — see above. Green here does NOT cover them; CI does.`);
}
if (failures > 0) {
  console.error(`\n${failures} FAILURE(S).`);
  process.exit(1);
}
console.log('\nOK');
