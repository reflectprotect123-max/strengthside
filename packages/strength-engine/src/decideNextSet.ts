import type { Equipment } from './exercise';
import { roundLoadToEquipment } from './rounding';

/** Peak-style six-level difficulty reported after a set. */
export type SetDifficulty =
  | 'very_easy'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'max'
  | 'did_not_complete';

/** PROVISIONAL — see docs/research/in-session-autoreg-decision-tables-2026-08-30.md */
export const IN_SESSION_STRENGTH = {
  cutSoftPct: 0.025,
  cutHardPct: 0.05,
  bumpVeryEasyPct: 0.025,
  defaultTargetRir: 2,
} as const;

export interface DecideNextSetInput {
  /** Load the athlete just used (kg). */
  performedLoadKg: number;
  /** Reps the athlete just completed (0 if none). */
  performedReps: number;
  /** Prescribed reps for the set just completed. */
  prescribedReps: number;
  /** Prescribed load for the set just completed (may differ from performed after manual edit). */
  prescribedLoadKg: number;
  difficulty: SetDifficulty;
  equipment: Equipment | null;
  /** Opening successful load this session — informational; not mutated by this function. */
  sessionAnchorKg: number;
  targetRir?: number;
  repRangeLo?: number;
  repRangeHi?: number;
  ordinal: number;
  totalOrdinals: number;
}

export interface NextSetDecision {
  loadKg: number;
  reps: number;
  targetRir: number;
  reasonCodes: string[];
}

function bumpLoad(loadKg: number, pct: number, equipment: Equipment | null): { kg: number; bumped: boolean } {
  const raw = loadKg * (1 + pct);
  const rounded = roundLoadToEquipment(raw, equipment);
  return { kg: rounded, bumped: rounded > loadKg };
}

function cutLoad(loadKg: number, pct: number, equipment: Equipment | null): number {
  return roundLoadToEquipment(loadKg * (1 - pct), equipment);
}

/**
 * Intrasession autoreg: given what just happened on set N, suggest load/reps for set N+1.
 *
 * Does NOT update working max, load hints, or intersession anchor — callers run
 * `decideProgression` once at session end. Intrasession walk-down must never
 * become the deload anchor (`anchorKgFor` contract in progression.ts).
 */
export function decideNextSet(input: DecideNextSetInput): NextSetDecision {
  const targetRir = input.targetRir ?? IN_SESSION_STRENGTH.defaultTargetRir;
  const reasons: string[] = [];
  let loadKg = input.performedLoadKg;
  let reps = input.prescribedReps;

  switch (input.difficulty) {
    case 'did_not_complete': {
      const proven = Math.max(0, input.performedReps);
      reps = Math.min(input.prescribedReps, proven);
      const cutPct = proven <= 0 ? IN_SESSION_STRENGTH.cutHardPct : IN_SESSION_STRENGTH.cutSoftPct;
      loadKg = cutLoad(loadKg, cutPct, input.equipment);
      reasons.push(proven <= 0 ? 'did_not_complete_zero_reps' : 'did_not_complete_partial');
      reasons.push('reps_capped_to_proven', 'load_cut');
      break;
    }
    case 'very_easy': {
      const { kg, bumped } = bumpLoad(loadKg, IN_SESSION_STRENGTH.bumpVeryEasyPct, input.equipment);
      if (bumped) {
        loadKg = kg;
        reasons.push('very_easy_bump_load');
      } else if (input.repRangeHi != null && reps < input.repRangeHi) {
        reps += 1;
        reasons.push('very_easy_bump_reps');
      } else {
        reasons.push('very_easy_hold');
      }
      break;
    }
    case 'easy':
      reasons.push('easy_hold');
      break;
    case 'hard':
      loadKg = cutLoad(loadKg, IN_SESSION_STRENGTH.cutSoftPct, input.equipment);
      reasons.push('hard_cut_load');
      break;
    case 'max':
      reasons.push('max_hold');
      break;
    case 'medium':
    default:
      reasons.push('on_target_hold');
      break;
  }

  return { loadKg, reps, targetRir, reasonCodes: reasons };
}
