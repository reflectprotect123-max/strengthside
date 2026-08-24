/**
 * Smoke: Coordinator bundle + adapter weekly plan.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');
const coordAdapter = readFileSync(join(dir, 'coordinator-adapter.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');

must(html.includes('openWeeklyReview'), 'index must open weekly review');
must(html.includes('coordinator-adapter.js'), 'index loads coordinator-adapter');

const sandbox = { window: { EngineAdapter: { weeklyZoneSeconds: () => ({ aerobic: 600 }) } }, console };
vm.createContext(sandbox);
vm.runInContext(`${bundle}; window.HybridStrength = HybridStrength; ${coordAdapter}`, sandbox);

if (!sandbox.window.HybridStrength.Coordinator?.planCoordinator) throw new Error('Coordinator missing from bundle');

const { CoordinatorAdapter } = sandbox.window;
const state = {
  sessions: [{ id: 's1', status: 'completed', date: '2026-08-24', completedAt: Date.now(), tasks: [{ kind: 'conditioning', result: { zoneSeconds: { aerobic: 600 } } }] }],
  dailyCheckins: [{ date: '2026-08-24', readinessColor: 'green', steps: 8000 }],
  meta: { progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
};
const receipt = sandbox.window.CoordinatorAdapter.planWeek(state, '2026-08-24', 7);
must(receipt && receipt.headline, 'planWeek failed');
must(/Recovery|Strength|Conditioning|Nutrition/i.test(receipt.headline), 'headline references a domain');
must(Array.isArray(receipt.items) && receipt.items.length >= 1, 'receipt items');

const lowDoseState = {
  sessions: [{ id: 's2', status: 'completed', date: '2026-08-24', completedAt: Date.now(), tasks: [{ kind: 'conditioning', result: { zoneSeconds: { aerobic: 600 } } }] }],
  dailyCheckins: [],
  meta: { progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
};
const lowReceipt = CoordinatorAdapter.planWeek(lowDoseState, '2026-08-24', 7);
const easeItem = (lowReceipt.items || []).find(function (i) { return i.domain === 'conditioning' && i.kind === 'ease'; });
must(easeItem && easeItem.silentApply, 'low dose conditioning ease is silent apply');
CoordinatorAdapter.applySilentReceipt(lowDoseState, lowReceipt);
must(lowDoseState.meta.condPrescriptionEase && lowDoseState.meta.condPrescriptionEase.effort === 'easy', 'ease hint stored');

console.log('coordinator.smoke: ok', receipt.headline);
