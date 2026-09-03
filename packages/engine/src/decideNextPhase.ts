/**
 * In-session conditioning autoreg — rest-boundary target adjustment.
 *
 * Steady-state and free formats return no-op; session-end `conAdapt` handles those.
 * Interval formats use `condEffortGap` + zone compliance per decision tables.
 *
 * Coefficients: docs/research/in-session-autoreg-decision-tables-2026-08-30.md
 */

import { condEffortGap } from './conditioning.js';
import type { CondFmtKey } from './types.js';

/** PROVISIONAL — see decision tables doc */
export const IN_SESSION_CONDITIONING = {
  wattsPushPct: 0.03,
  wattsEaseMetPct: 0.05,
  wattsEaseMissPct: 0.08,
  hrCeilBumpBpm: 2,
  hrCeilTrimBpm: 4,
  workDurationCutPct: 0.1,
  minWatts: 40,
  maxWatts: 600,
  minHrBpm: 90,
  maxHrBpm: 195,
} as const;

export type ZoneCompliance = 'met' | 'borderline' | 'not_met';

export interface DecideNextPhaseInput {
  formatKey: CondFmtKey;
  /** Prescribed effort band for this interval */
  effort: { rpe: [number, number] } | null;
  /** Athlete-reported RPE after work (rest overlay) */
  felt: number | string | null;
  /** Did HR zones meet target for the work just completed? */
  zoneCompliance: ZoneCompliance;
  /** Current work targets — adjust whichever is prescribed */
  targetWatts?: number;
  targetHrCeilingBpm?: number;
  /** Remaining rounds / work duration for incomplete stop */
  roundsRemaining?: number;
  workDurationSec?: number;
  /** Athlete stopped the interval early */
  incomplete?: boolean;
  /** +3% pushes already applied this workout (Echo cap). */
  wattsPushCount?: number;
  /** Max +3% pushes per workout — default 2. */
  maxWattsPushes?: number;
}

export interface DecideNextPhaseResult {
  action: 'noop' | 'hold' | 'increase' | 'decrease';
  reasonCodes: string[];
  nextTargetWatts?: number;
  nextTargetHrCeilingBpm?: number;
  nextRounds?: number;
  nextWorkDurationSec?: number;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function roundWatts(w: number): number {
  return Math.round(w / 5) * 5;
}

/** Formats that skip intrasession autoreg — post-session conAdapt only. */
export function isIntrasessionAutoregFormat(fmtKey: CondFmtKey): boolean {
  return fmtKey !== 'steady' && fmtKey !== 'free';
}

export function decideNextPhase(input: DecideNextPhaseInput): DecideNextPhaseResult {
  const c = IN_SESSION_CONDITIONING;

  if (!isIntrasessionAutoregFormat(input.formatKey)) {
    return { action: 'noop', reasonCodes: ['steady_or_free_no_intrsession'] };
  }

  if (input.incomplete) {
    const reasons = ['incomplete_stop'];
    let nextRounds = input.roundsRemaining;
    let nextWorkDurationSec = input.workDurationSec;
    if (nextRounds != null && nextRounds > 1) {
      nextRounds -= 1;
      reasons.push('rounds_minus_one');
    } else if (nextWorkDurationSec != null) {
      nextWorkDurationSec = Math.round(nextWorkDurationSec * (1 - c.workDurationCutPct));
      reasons.push('work_duration_cut');
    }
    return {
      action: 'decrease',
      reasonCodes: reasons,
      nextTargetWatts: input.targetWatts,
      nextTargetHrCeilingBpm: input.targetHrCeilingBpm,
      nextRounds,
      nextWorkDurationSec,
    };
  }

  const gap = condEffortGap(input.effort, input.felt);
  if (gap == null) {
    return {
      action: 'hold',
      reasonCodes: ['missing_felt_or_effort'],
      nextTargetWatts: input.targetWatts,
      nextTargetHrCeilingBpm: input.targetHrCeilingBpm,
    };
  }

  if (gap === 0) {
    return {
      action: 'hold',
      reasonCodes: ['on_target_hold'],
      nextTargetWatts: input.targetWatts,
      nextTargetHrCeilingBpm: input.targetHrCeilingBpm,
    };
  }

  if (gap < 0) {
    const reasons = ['felt_easier_than_prescribed'];
    const maxPushes = input.maxWattsPushes ?? 2;
    const pushCount = input.wattsPushCount ?? 0;
    let nextWatts = input.targetWatts;
    let nextHr = input.targetHrCeilingBpm;
    if (nextWatts != null && pushCount >= maxPushes) {
      reasons.push('watts_push_cap');
      return {
        action: 'hold',
        reasonCodes: reasons,
        nextTargetWatts: nextWatts,
        nextTargetHrCeilingBpm: nextHr,
      };
    }
    if (nextWatts != null) {
      nextWatts = clamp(roundWatts(nextWatts * (1 + c.wattsPushPct)), c.minWatts, c.maxWatts);
      reasons.push('watts_push');
    } else if (nextHr != null) {
      nextHr = clamp(nextHr + c.hrCeilBumpBpm, c.minHrBpm, c.maxHrBpm);
      reasons.push('hr_ceiling_bump');
    }
    return {
      action: 'increase',
      reasonCodes: reasons,
      nextTargetWatts: nextWatts,
      nextTargetHrCeilingBpm: nextHr,
    };
  }

  // gap > 0 — harder than prescribed
  const reasons = ['felt_harder_than_prescribed'];
  const zoneMiss = input.zoneCompliance === 'not_met';
  const cutPct = zoneMiss ? c.wattsEaseMissPct : c.wattsEaseMetPct;
  let nextWatts = input.targetWatts;
  let nextHr = input.targetHrCeilingBpm;

  if (nextWatts != null) {
    nextWatts = clamp(roundWatts(nextWatts * (1 - cutPct)), c.minWatts, c.maxWatts);
    reasons.push(zoneMiss ? 'watts_ease_miss' : 'watts_ease_met');
  }
  if (nextHr != null && (zoneMiss || nextWatts == null)) {
    nextHr = clamp(nextHr - c.hrCeilTrimBpm, c.minHrBpm, c.maxHrBpm);
    reasons.push('hr_ceiling_trim');
  }

  return {
    action: 'decrease',
    reasonCodes: reasons,
    nextTargetWatts: nextWatts,
    nextTargetHrCeilingBpm: nextHr,
  };
}
