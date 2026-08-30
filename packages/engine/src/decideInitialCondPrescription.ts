/**
 * Pre-session conditioning volume when coach defers rounds/work/rest/minutes.
 * Wraps conPrescription (progression + daily recovery ease) with optional coach pins.
 */

import { conPrescription } from './conditioning.js';
import type { CondFmtKey, Modality, Settings, WhoopSample } from './types.js';

export type RecoveryGate = 'ok' | 'caution' | 'hold';

export interface LastCondSessionVolume {
  rounds?: number;
  workSec?: number;
  restSec?: number;
  minutes?: number;
}

export interface DecideInitialCondPrescriptionInput {
  formatKey: CondFmtKey;
  effortKey?: string;
  /** Coach-pinned — null/empty means defer to engine for that field. */
  coachRounds?: number | null;
  coachWorkSec?: number | null;
  coachRestSec?: number | null;
  coachMinutes?: number | null;
  whoop?: WhoopSample | null;
  settings?: Settings;
  modality?: Modality;
  recoveryGate?: RecoveryGate;
  lastSession?: LastCondSessionVolume | null;
}

export interface InitialCondPrescriptionDecision {
  rounds: number;
  workSec: number;
  restSec: number;
  minutes: number;
  targetDurationMin: number;
  autopilotCond: boolean;
  condRxLevel: number;
  condRxDailyAdj: number;
  condRxNote: string;
  reasonCodes: string[];
}

function coachNumPinned(v: number | null | undefined): v is number {
  return v != null && Number.isFinite(Number(v)) && Number(v) > 0;
}

function coachMinPinned(v: number | null | undefined): v is number {
  return v != null && Number.isFinite(Number(v)) && Number(v) >= 0;
}

function isIntervalFormat(fmtKey: CondFmtKey): boolean {
  return fmtKey === 'intervals' || fmtKey === 'tempo' || fmtKey === 'custom';
}

/**
 * Pre-session conditioning prescription when coach defers volume to the engine.
 */
export function decideInitialCondPrescription(
  input: DecideInitialCondPrescriptionInput,
): InitialCondPrescriptionDecision {
  const reasons: string[] = [];
  const fmtKey = input.formatKey || 'steady';
  const interval = isIntervalFormat(fmtKey);

  const pinnedRounds = coachNumPinned(input.coachRounds);
  const pinnedWork = coachMinPinned(input.coachWorkSec) && Number(input.coachWorkSec) > 0;
  const pinnedRest = coachMinPinned(input.coachRestSec);
  const pinnedMinutes = coachMinPinned(input.coachMinutes) && Number(input.coachMinutes) > 0;

  const allIntervalPinned = interval && pinnedRounds && pinnedWork && pinnedRest;
  const allSteadyPinned = fmtKey === 'steady' && pinnedMinutes;
  const allFreePinned = fmtKey === 'free';

  if (allIntervalPinned || allSteadyPinned || allFreePinned) {
    const rounds = pinnedRounds ? Math.max(1, Math.round(Number(input.coachRounds))) : 1;
    const workSec = pinnedWork ? Math.max(0, Math.round(Number(input.coachWorkSec))) : 0;
    const restSec = pinnedRest ? Math.max(0, Math.round(Number(input.coachRestSec))) : 0;
    const minutes = pinnedMinutes
      ? Math.max(1, Math.round(Number(input.coachMinutes)))
      : interval
        ? Math.max(1, Math.round((rounds * (workSec + restSec)) / 60))
        : 20;
    return {
      rounds,
      workSec,
      restSec,
      minutes,
      targetDurationMin: minutes,
      autopilotCond: false,
      condRxLevel: 0,
      condRxDailyAdj: 0,
      condRxNote: '',
      reasonCodes: ['coach_pinned_volume'],
    };
  }

  reasons.push('autopilot_cond');

  const rx = conPrescription(fmtKey, {
    whoop: input.whoop ?? null,
    settings: input.settings,
    modality: input.modality,
  });

  let rounds = Math.max(1, Math.round(Number(rx.rounds) || 8));
  let workSec = Math.max(0, Math.round(Number(rx.work) || 30));
  let restSec = Math.max(0, Math.round(Number(rx.rest) || 90));
  let minutes = Math.max(1, Math.round(Number(rx.minutes) || 20));

  if (rx.level > 0) reasons.push('progression_level_' + rx.level);
  if (rx.dailyAdj < 0) reasons.push('daily_recovery_ease');

  if (input.lastSession) {
    if (interval && input.lastSession.rounds != null && input.lastSession.rounds > 0) {
      rounds = Math.max(1, Math.min(12, Math.round(input.lastSession.rounds)));
      reasons.push('history_last_session');
    }
    if (interval && input.lastSession.workSec != null && input.lastSession.workSec > 0) {
      workSec = Math.max(0, Math.round(input.lastSession.workSec));
    }
    if (!interval && input.lastSession.minutes != null && input.lastSession.minutes > 0) {
      minutes = Math.max(10, Math.min(60, Math.round(input.lastSession.minutes)));
      reasons.push('history_last_session');
    }
  }

  if (input.recoveryGate === 'hold') {
    if (interval && rounds > 3) {
      rounds -= 1;
      reasons.push('recovery_hold_reduce_rounds');
    } else if (fmtKey === 'steady') {
      minutes = Math.max(10, minutes - 5);
      reasons.push('recovery_hold_reduce_minutes');
    }
  } else if (input.recoveryGate === 'caution') {
    if (interval && rounds > 4) {
      rounds -= 1;
      reasons.push('recovery_caution_reduce_rounds');
    }
  }

  if (pinnedRounds) {
    rounds = Math.max(1, Math.min(12, Math.round(Number(input.coachRounds))));
    reasons.push('coach_pinned_rounds');
  }
  if (pinnedWork) {
    workSec = Math.max(0, Math.round(Number(input.coachWorkSec)));
    reasons.push('coach_pinned_work');
  }
  if (pinnedRest) {
    restSec = Math.max(0, Math.round(Number(input.coachRestSec)));
    reasons.push('coach_pinned_rest');
  }
  if (pinnedMinutes) {
    minutes = Math.max(1, Math.round(Number(input.coachMinutes)));
    reasons.push('coach_pinned_minutes');
  }

  if (interval) {
    minutes = Math.max(1, Math.round((rounds * (workSec + restSec)) / 60));
  }

  return {
    rounds,
    workSec,
    restSec,
    minutes,
    targetDurationMin: minutes,
    autopilotCond: true,
    condRxLevel: rx.level || 0,
    condRxDailyAdj: rx.dailyAdj || 0,
    condRxNote: rx.note || '',
    reasonCodes: reasons,
  };
}
