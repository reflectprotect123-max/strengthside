/**
 * Smoke: strength cloud sync module.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const syncSrc = readFileSync(join(dir, 'strength-sync.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(syncSrc.includes('athlete_domain_snapshots'), 'pull from athlete_domain_snapshots');
must(syncSrc.includes('upsert_athlete_domain_snapshot'), 'push via ecosystem RPC');
must(syncSrc.includes('Whoop.client'), 'reuse WHOOP supabase session');
must(syncSrc.includes('schedulePush'), 'debounced push');
must(syncSrc.includes('bootstrap'), 'pull on app load bootstrap');
must(syncSrc.includes("save('strength-sync-pull')"), 'persist merged pull');
must(syncSrc.includes("DOMAIN = 'strength'"), 'strength domain');
must(html.includes('strength-sync.js'), 'index loads strength-sync.js');
must(syncSrc.includes('mergeSnapshots'), 'merge remote and local snapshots');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(syncSrc, sandbox);

const merged = sandbox.window.StrengthSync.mergeSnapshots(
  {
    strengthState: {
      workingMaxEvents: [{ exerciseId: 'bp', valueKg: 100, effectiveAt: '2026-08-20T00:00:00.000Z' }],
      prEvents: [],
      loadHints: { bp: { loadKg: 100, updatedAt: '2026-08-20T00:00:00.000Z' } },
    },
    progressionAudit: [{ at: '2026-08-20', exerciseId: 'bp', action: 'hold' }],
  },
  {
    strengthState: {
      workingMaxEvents: [{ exerciseId: 'bp', valueKg: 102.5, effectiveAt: '2026-08-24T00:00:00.000Z' }],
      prEvents: [{ exerciseId: 'bp', repCount: 5, valueKg: 105 }],
      loadHints: { bp: { loadKg: 102.5, updatedAt: '2026-08-24T00:00:00.000Z' } },
    },
    progressionAudit: [{ at: '2026-08-24', exerciseId: 'bp', action: 'progress' }],
  }
);
must(merged.strengthState.workingMaxEvents[0].valueKg === 102.5, 'newer WM wins');
must(merged.strengthState.loadHints.bp.loadKg === 102.5, 'newer hint wins');
must(merged.progressionAudit.length === 2, 'audit merged');

console.log('strength-sync.smoke: ok');
