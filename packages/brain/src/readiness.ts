import type { BrainCheckin, BrainMetrics, TodayCall } from './types.js';

export type ReadinessResult = {
  todayCall: TodayCall;
  label: string;
  reason: string;
  score: number;
};

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function whoopRecoveryPenalty(v: number): number {
  if (!v) return 0;
  if (v >= 67) return -10;
  if (v >= 34) return 0;
  if (v >= 20) return 10;
  return 20;
}

export function scoreReadiness(metrics: BrainMetrics, checkin: BrainCheckin): ReadinessResult {
  const recovery = n(metrics.recovery);
  const sleepQ = n(checkin.sleepQuality);
  const energy = n(checkin.energy);
  const soreness = n(checkin.muscleSoreness);
  const joint = n(checkin.jointStress);
  const mental = n(checkin.mentalStress);

  const wearable = Math.max(0, whoopRecoveryPenalty(recovery));
  const subjective =
    Math.max(0, (10 - sleepQ) * 2) +
    Math.max(0, (10 - energy) * 2) +
    soreness * 2.5 +
    joint * 4 +
    mental * 3;

  const score = wearable + subjective;
  const signals: [string, number][] = [
    ['WHOOP recovery', Math.max(0, whoopRecoveryPenalty(recovery))],
    ['sleep quality', Math.max(0, (10 - sleepQ) * 2)],
    ['energy', Math.max(0, (10 - energy) * 2)],
    ['soreness', soreness * 2.5],
    ['joint stress', joint * 4],
    ['mental stress', mental * 3],
  ];
  signals.sort((a, b) => b[1] - a[1]);

  const reason = signals.find(([, v]) => v > 0)?.[0] ?? 'balanced';

  let todayCall: TodayCall = 'control';
  let label = 'Control';
  if (score <= 8 && recovery >= 67) {
    todayCall = 'build';
    label = 'Build';
  } else if (score >= 28 || recovery < 25) {
    todayCall = 'minimum';
    label = 'Minimum';
  }

  return { todayCall, label, reason, score };
}
