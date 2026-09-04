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
