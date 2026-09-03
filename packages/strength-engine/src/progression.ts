// packages/strength-engine/src/progression.ts
import type { StrengthExposure } from './exposure';

export interface ProgressionDecision {
  exerciseId: string;
  action: 'progress' | 'hold' | 'deload' | 'retest';
  deltaPct?: number;
  deltaKg?: number;
  confidence: number;
  source: 'deterministic' | 'ai_retrieval';
  reasonCodes: string[];
}

export interface DecideCtx {
  exerciseId: string;
}

/**
 * The seam: both this deterministic implementation and a future AI-backed
 * one (on hold — see docs/superpowers/specs/2026-08-17-adaptive-engine-v2-design.md,
 * "build-order note") satisfy this same interface, interchangeably. `decide`
 * is async and takes the caller's already-computed `CalibrationState`
 * explicitly, so an AI-backed decider can use it without recomputing it.
 */
export interface ProgressionDecider {
  decide(exposures: StrengthExposure[], calibration: import('./calibration').CalibrationState, ctx: DecideCtx): Promise<ProgressionDecision>;
}

/**
 * The most recent load the athlete actually SUCCEEDED at — the anchor a
 * deload is measured from. A deload must never be cut from a load a MISSED
 * set already walked down within-session: an athlete who opened at 100kg
 * and missed down to 94kg is still anchored at 100, not 94, or the athlete
 * is charged twice for one miss. `null` is a real, held state — the caller
 * must not fall back to the most recent (missed) weight.
 *
 * Sorts its own defensive copy oldest-first by `performedAt` — callers may
 * pass an already-sorted list (as `strengthExposuresFor` guarantees), but
 * nothing enforces that for a caller who filters or concatenates two lists.
 */
export function anchorKgFor(exposures: StrengthExposure[]): number | null {
  const sorted = [...exposures].sort((a, b) => a.performedAt.localeCompare(b.performedAt));
  for (let i = sorted.length - 1; i >= 0; i--) {
    const e = sorted[i];
    if (e.exposureClass === 'successful' || e.exposureClass === 'successful_but_uncertain') return e.loadKg;
  }
  return null;
}

function base(ctx: DecideCtx): Pick<ProgressionDecision, 'exerciseId' | 'source'> {
  return { exerciseId: ctx.exerciseId, source: 'deterministic' };
}

/**
 * Athlete-facing progression: one rated on-target session is enough to bump.
 * Deload only after two consecutive missed sessions. No separate calibration
 * gate — the athlete should feel progression after a good logged week.
 */
export function decideProgression(exposures: StrengthExposure[], ctx: DecideCtx): ProgressionDecision {
  const sorted = [...exposures].sort((a, b) => a.performedAt.localeCompare(b.performedAt));
  const usable = sorted.filter(e => e.exposureClass !== 'pain_blocked');

  if (usable.length === 0) {
    return { ...base(ctx), action: 'hold', confidence: 0.3, reasonCodes: ['no_history'] };
  }

  const anchor = anchorKgFor(usable);
  const last = usable[usable.length - 1];
  const recent2 = usable.slice(-2);
  const repeatedDeterioration = recent2.length >= 2 && recent2.every(e => e.exposureClass === 'missed');

  if (repeatedDeterioration && anchor != null) {
    const deltaPct = -0.05;
    return {
      ...base(ctx), action: 'deload', deltaPct, confidence: 0.85, reasonCodes: ['repeated_deterioration'],
      deltaKg: anchor * deltaPct,
    };
  }

  if (last.exposureClass === 'successful' && last.onTarget) {
    const deltaPct = 0.025;
    return {
      ...base(ctx), action: 'progress', deltaPct, confidence: 0.85, reasonCodes: ['on_target_rated'],
      ...(anchor != null ? { deltaKg: anchor * deltaPct } : {}),
    };
  }

  return { ...base(ctx), action: 'hold', confidence: 0.7, reasonCodes: ['mixed_signal'] };
}

export const DeterministicDecider: ProgressionDecider = {
  async decide(exposures, _calibration, ctx) {
    return decideProgression(exposures, ctx);
  },
};
