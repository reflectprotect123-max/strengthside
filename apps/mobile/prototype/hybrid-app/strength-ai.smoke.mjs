/**
 * Smoke: strength progression LLM client + conservative merge (no network).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const aiSrc = readFileSync(join(dir, 'strength-ai.js'), 'utf8');
const adapterSrc = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');
const recoverySrc =
  readFileSync(join(dir, 'recovery-engine.js'), 'utf8') +
  readFileSync(join(dir, 'recovery-signals.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');

if (!html.includes('strength-ai.js')) throw new Error('index.html missing strength-ai.js');
if (!html.includes('llmProgression')) throw new Error('settings missing llmProgression toggle');
if (!html.includes('Show Library strength builder')) throw new Error('settings missing plain-language builder toggle');
if (!html.includes('settings-toggle-help')) throw new Error('settings toggle helper copy missing');

const sandbox = { window: {}, console, fetch: () => Promise.reject(new Error('no network')) };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(
  `${bundle}; window.HybridStrength = HybridStrength; ${recoverySrc}; ${aiSrc}; ${adapterSrc}`,
  sandbox,
);

const { StrengthAI, StrengthAdapter } = sandbox;

const decision = StrengthAI.validateProgressionDecision({
  action: 'hold',
  reason_codes: ['fatigue_pattern'],
  confidence: 0.7,
});
if (!decision || decision.action !== 'hold') throw new Error('validateProgressionDecision failed');

if (!StrengthAI.llmEnabled({ settings: { llmProgression: true } })) {
  throw new Error('llmProgression true should enable');
}
if (StrengthAI.llmEnabled({ settings: { llmProgression: false, llmCoachIntent: true } })) {
  throw new Error('llmProgression false should disable progression AI');
}
if (!StrengthAI.llmEnabled({ settings: { llmCoachIntent: true } })) {
  throw new Error('default progression AI should follow coach intent toggle');
}

const merged = StrengthAdapter.mergeAiProgressionAction('progress', { action: 'hold', reasonCodes: ['caution'] });
if (merged.action !== 'hold' || !merged.aiInfluenced) {
  throw new Error('AI should make progress more conservative');
}
const noAgg = StrengthAdapter.mergeAiProgressionAction('hold', { action: 'progress', reasonCodes: ['optimism'] });
if (noAgg.action !== 'hold' || noAgg.aiInfluenced) {
  throw new Error('AI must not make hold more aggressive');
}

const flash = StrengthAI.buildFlashCard(
  { exercises: [{ id: 'sq', name: 'Squat' }] },
  'sq',
  {
    deterministic: { action: 'progress' },
    sessionPain: 'none',
    recoveryGate: 'ok',
    exposures: [],
    calibration: 'calibrated',
  },
);
if (flash.exercise_id !== 'sq' || flash.deterministic_action !== 'progress') {
  throw new Error('buildFlashCard failed');
}

console.log('strength-ai.smoke: ok');
