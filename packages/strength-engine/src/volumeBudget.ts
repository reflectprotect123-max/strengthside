export type SplitType = 'full_body' | 'upper_lower' | 'push_pull_legs';

export interface VolumeBudgetInput {
  sessionsPerWeek: number;
  minutesPerSession: number;
  splitType: SplitType;
  /** Non-lifting time reserved per session (warm-up, transitions). */
  warmupMinutes?: number;
  /** Average minutes per logged working set including rest. */
  minutesPerWorkingSet?: number;
}

export interface VolumeBudget {
  sessionsPerWeek: number;
  minutesPerSession: number;
  splitType: SplitType;
  sessionWorkingSetCap: number;
  weeklyWorkingSetCap: number;
  perMuscleSessionCap: number;
  perMuscleWeeklyCap: {
    maintain: number;
    grow: number;
    emphasize: number;
  };
  reasonCodes: string[];
}

export interface SessionVolumeAudit {
  workingSets: number;
  sessionCap: number;
  overSessionCap: boolean;
  warnings: string[];
  reasonCodes: string[];
}

const DEFAULT_WARMUP_MINUTES = 10;
const DEFAULT_MINUTES_PER_SET = 4;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function perMuscleSessionCapForSplit(splitType: SplitType, sessionCap: number): number {
  switch (splitType) {
    case 'full_body':
      return clamp(Math.min(4, Math.floor(sessionCap / 3)), 3, 4);
    case 'upper_lower':
      return clamp(Math.min(8, Math.floor(sessionCap / 2)), 4, 8);
    case 'push_pull_legs':
      return clamp(Math.min(10, Math.floor(sessionCap * 0.55)), 5, 10);
  }
}

/**
 * Time-budget volume caps for strength templates. Priors only — not a universal MRV.
 * Designed so 3×60-min full-body plans stay near ~12 session sets and ~10–12 sets/muscle/week.
 */
export function computeVolumeBudget(input: VolumeBudgetInput): VolumeBudget {
  const sessionsPerWeek = clamp(Math.round(input.sessionsPerWeek), 1, 7);
  const minutesPerSession = clamp(Math.round(input.minutesPerSession), 20, 180);
  const warmupMinutes = input.warmupMinutes ?? DEFAULT_WARMUP_MINUTES;
  const minutesPerWorkingSet = input.minutesPerWorkingSet ?? DEFAULT_MINUTES_PER_SET;

  const available = Math.max(0, minutesPerSession - warmupMinutes);
  const rawSessionCap = Math.floor(available / minutesPerWorkingSet);
  const sessionWorkingSetCap = clamp(rawSessionCap, 8, 20);
  const weeklyWorkingSetCap = sessionWorkingSetCap * sessionsPerWeek;
  const perMuscleSessionCap = perMuscleSessionCapForSplit(input.splitType, sessionWorkingSetCap);

  const emphasize = Math.min(
    perMuscleSessionCap * sessionsPerWeek,
    Math.max(6, Math.floor(weeklyWorkingSetCap * 0.32)),
  );
  const grow = Math.max(6, emphasize - 2);
  const maintain = Math.max(4, Math.floor(emphasize * 0.55));

  return {
    sessionsPerWeek,
    minutesPerSession,
    splitType: input.splitType,
    sessionWorkingSetCap,
    weeklyWorkingSetCap,
    perMuscleSessionCap,
    perMuscleWeeklyCap: { maintain, grow, emphasize },
    reasonCodes: ['volume.timeBudget.v1', `volume.split.${input.splitType}`],
  };
}

export function auditSessionWorkingSets(workingSets: number, budget: VolumeBudget): SessionVolumeAudit {
  const sets = Math.max(0, Math.round(workingSets));
  const overSessionCap = sets > budget.sessionWorkingSetCap;
  const warnings: string[] = [];
  const reasonCodes = [...budget.reasonCodes];

  if (overSessionCap) {
    warnings.push(
      `${sets} working sets is above the ~${budget.sessionWorkingSetCap}-set guide for a typical ${budget.minutesPerSession}-minute session — fine if you had extra time.`,
    );
    reasonCodes.push('volume.session_guide_exceeded');
  }

  return {
    workingSets: sets,
    sessionCap: budget.sessionWorkingSetCap,
    overSessionCap,
    warnings,
    reasonCodes,
  };
}

/** Highest set count allowed for one exercise in the current session draft. */
export function maxSetsForExerciseInSession(
  currentSessionWorkingSets: number,
  currentExerciseSets: number,
  budget: VolumeBudget,
): number {
  const sessionSets = Math.max(0, Math.round(currentSessionWorkingSets));
  const exerciseSets = Math.max(0, Math.round(currentExerciseSets));
  const remainingSession = Math.max(0, budget.sessionWorkingSetCap - (sessionSets - exerciseSets));
  return Math.min(budget.perMuscleSessionCap, remainingSession);
}
