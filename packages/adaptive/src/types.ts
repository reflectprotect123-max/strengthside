export type RepRange = { min: number; max: number };

export type DayKind = 'strength' | 'conditioning' | 'recovery';

export type LiftLogged = { loadKg: number; reps: number; rir?: number | null };

export type LiftNextInput = {
  dayKind: DayKind;
  range: RepRange;
  logged: LiftLogged;
};

export type LiftNextResult =
  | { ok: true; loadKg: number; reps: number }
  | { ok: false; reason: 'reps_out_of_sanity' | 'wrong_day' };

export type CloseLiftAnchor = { loadKg: number; reps: number; e1rmKg: number };

export type OpenLiftInput = {
  dayKind: DayKind;
  rangeText: string | null;
  lastClose: CloseLiftAnchor | null;
};

export type OpenLiftResult =
  | { ok: true; loadKg: number | null; reps: number }
  | { ok: false; reason: 'wrong_day' };
