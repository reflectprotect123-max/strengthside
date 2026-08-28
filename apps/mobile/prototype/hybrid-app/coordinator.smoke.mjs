/**
 * Smoke: Coordinator bundle + adapter weekly plan.
 * Phase 5: athlete Coordinator weekly peek removed; NutritionUI check-in remains.
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
const recoveryEngine = readFileSync(join(dir, 'recovery-engine.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const nutritionUi = readFileSync(join(dir, 'nutrition-ui.js'), 'utf8');

must(html.includes('coordinator-adapter.js'), 'index loads coordinator-adapter');
must(html.includes('bootstrapSilent'), 'index still bootstraps silent coordinator');
must(!html.includes('onclick="openWeeklyReview()"'), 'Coordinator peek onclick removed');
must(!html.includes("onclick=\"event.stopPropagation();openWeeklyReview()\""), 'Coordinator peek stopPropagation removed');
must(!html.includes('This week · review'), 'Coordinator This week · review copy removed');
must(nutritionUi.includes('openWeeklyReview'), 'NutritionUI weekly check-in remains');
must(nutritionUi.includes('NutritionUI'), 'nutrition-ui exports NutritionUI');
must(coordAdapter.includes('bootstrapSilent'), 'adapter bootstrapSilent exists');
must(coordAdapter.includes('applySilentReceipt'), 'adapter applySilentReceipt exists');
must(coordAdapter.includes('weeklySheetHtml'), 'weeklySheetHtml kept for fixtures');

const sandbox = { window: { EngineAdapter: { weeklyZoneSeconds: () => ({ aerobic: 600 }) } }, console };
vm.createContext(sandbox);
vm.runInContext(`${recoveryEngine}\n${bundle}\nwindow.HybridStrength = HybridStrength;\n${coordAdapter}`, sandbox);

if (!sandbox.window.HybridStrength.Coordinator?.planCoordinator) throw new Error('Coordinator missing from bundle');

const { CoordinatorAdapter } = sandbox.window;
// Pin completedAt inside the fixture week. Date.now() rolls off 2026-08-24 after midnight UTC.
const completedAt = Date.parse('2026-08-24T12:00:00');
const state = {
  sessions: [{ id: 's1', status: 'completed', date: '2026-08-24', completedAt, tasks: [{ kind: 'conditioning', result: { zoneSeconds: { aerobic: 600 } } }] }],
  dailyCheckins: [{ date: '2026-08-24', readinessColor: 'green', steps: 8000 }],
  meta: { progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
};
const receipt = sandbox.window.CoordinatorAdapter.planWeek(state, '2026-08-24', 7);
must(receipt && receipt.headline, 'planWeek failed');
must(/Recovery|Strength|Conditioning|Nutrition/i.test(receipt.headline), 'headline references a domain');
must(Array.isArray(receipt.items) && receipt.items.length >= 1, 'receipt items');

const lowDoseState = {
  sessions: [{ id: 's2', status: 'completed', date: '2026-08-24', completedAt, tasks: [{ kind: 'conditioning', result: { zoneSeconds: { aerobic: 600 } } }] }],
  dailyCheckins: [],
  meta: { progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
};
const lowReceipt = CoordinatorAdapter.planWeek(lowDoseState, '2026-08-24', 7);
const easeItem = (lowReceipt.items || []).find(function (i) { return i.domain === 'conditioning' && i.kind === 'ease'; });
must(easeItem && easeItem.silentApply, 'low dose conditioning ease is silent apply');
CoordinatorAdapter.applySilentReceipt(lowDoseState, lowReceipt);
must(lowDoseState.meta.condPrescriptionEase && lowDoseState.meta.condPrescriptionEase.effort === 'easy', 'ease hint stored');
must(typeof CoordinatorAdapter.bootstrapSilent === 'function', 'bootstrapSilent callable');
CoordinatorAdapter.bootstrapSilent(lowDoseState, '2026-08-24', 7);

const flagState = {
  sessions: [],
  dailyCheckins: [{ date: '2026-08-24', readinessColor: 'green', illness: 'yes', fuel: 'poor' }],
  meta: { progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
};
const flagReceipt = CoordinatorAdapter.planWeek(flagState, '2026-08-24', 7);
must((flagReceipt.reasonCodes || []).includes('recovery_illness_flagged'), 'illness in weekly receipt');
must((flagReceipt.reasonCodes || []).includes('nutrition_low_energy'), 'low fuel in weekly receipt');

const heavySessions = [];
for (let i = 0; i < 5; i++) {
  heavySessions.push({
    id: 'hs' + i,
    status: 'completed',
    date: '2026-08-24',
    completedAt: completedAt - i * 86400000,
    summary: { strengthLoad: 500, conditioningLoad: 3, tonnage: 500, totalLoad: 503 },
    tasks: [{ kind: 'strength' }],
  });
}
const debtState = {
  sessions: heavySessions,
  dailyCheckins: [{ date: '2026-08-24', readinessColor: 'green', steps: 8000, sleepQuality: 8 }],
  meta: { progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
};
const debtReceipt = CoordinatorAdapter.planWeek(debtState, '2026-08-24', 7);
must((debtReceipt.reasonCodes || []).includes('recovery_debt_elevated') ||
  (debtReceipt.reasonCodes || []).includes('recovery_debt_high'), 'debt wired into coordinator');

console.log('coordinator.smoke: ok', receipt.headline);
