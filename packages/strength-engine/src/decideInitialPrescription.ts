import type { CalibrationState } from './calibration';

export type RecoveryGate = 'ok' | 'caution' | 'hold';

export interface LastSessionVolume {
  setCount: number;
  reps: number;
}

export interface DecideInitialPrescriptionInput {
  /** Coach-pinned — null/empty means defer to engine for that field. */
  coachSets?: number | null;
  coachReps?: string | null;
  calibration: CalibrationState;
  lastSession?: LastSessionVolume | null;
  recoveryGate?: RecoveryGate;
  /** Max sets allowed for this exercise in the session draft. */
  maxSetsForExercise?: number | null;
}

export interface InitialPrescriptionDecision {
  sets: number;
  reps: string;
  autopilotVolume: boolean;
  reasonCodes: string[];
}

const BASELINE = { sets: 3, reps: '8' };

function coachSetsPinned(v: number | null | undefined): v is number {
  return v != null && Number.isFinite(Number(v)) && Number(v) > 0;
}

function coachRepsPinned(v: string | null | undefined): boolean {
  return v != null && String(v).trim().length > 0;
}

/**
 * Pre-session volume when coach defers sets/reps to the engine.
 * Load is decided elsewhere (working max, hints, %WM).
 */
export function decideInitialPrescription(input: DecideInitialPrescriptionInput): InitialPrescriptionDecision {
  const reasons: string[] = [];
  const pinnedSets = coachSetsPinned(input.coachSets);
  const pinnedReps = coachRepsPinned(input.coachReps);

  if (pinnedSets && pinnedReps) {
    return {
      sets: Math.max(1, Math.min(12, Math.round(Number(input.coachSets)))),
      reps: String(input.coachReps).trim(),
      autopilotVolume: false,
      reasonCodes: ['coach_pinned_volume'],
    };
  }

  reasons.push('autopilot_volume');

  let sets = BASELINE.sets;
  let reps = BASELINE.reps;

  if (input.lastSession && input.lastSession.setCount > 0) {
    sets = Math.max(1, Math.min(12, Math.round(input.lastSession.setCount)));
    reps = String(Math.max(1, Math.round(input.lastSession.reps)) || BASELINE.reps);
    reasons.push('history_last_session');
  } else if (input.calibration === 'uncalibrated') {
    reasons.push('baseline_uncalibrated');
  } else if (input.calibration === 'building') {
    reasons.push('baseline_building');
  } else {
    reasons.push('baseline_calibrated');
  }

  if (input.recoveryGate === 'hold') {
    sets = Math.max(2, sets - 1);
    reasons.push('recovery_hold_reduce_sets');
  } else if (input.recoveryGate === 'caution' && sets > 3) {
    sets -= 1;
    reasons.push('recovery_caution_reduce_sets');
  }

  if (input.maxSetsForExercise != null && Number.isFinite(Number(input.maxSetsForExercise))) {
    const cap = Math.max(1, Math.floor(Number(input.maxSetsForExercise)));
    if (sets > cap) {
      sets = cap;
      reasons.push('volume_cap');
    }
  }

  if (pinnedSets) {
    sets = Math.max(1, Math.min(12, Math.round(Number(input.coachSets))));
    reasons.push('coach_pinned_sets');
  }
  if (pinnedReps) {
    reps = String(input.coachReps).trim();
    reasons.push('coach_pinned_reps');
  }

  return { sets, reps, autopilotVolume: true, reasonCodes: reasons };
}
