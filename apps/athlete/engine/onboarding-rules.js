/* STRENGTHSIDE-DESIGNED onboarding rules. These are not Morpheus formulas.
 * Maximum: Tanaka 2001 for male, Gulati 2010 for female. Fitness does not change the maximum.
 * Zones: fitness-zones-v1 fractions of heart-rate reserve at full recovery.
 * Week: weekly-targets-v1 minute ranges. Resting HR at or above 70 scales them by 0.9.
 */
(function (root) {
  const VERSION = 'fitness-onboarding-v2';
  const FITNESS = ['low', 'moderate', 'high'];
  const GOALS = ['maintain', 'improve'];
  const SEXES = ['female', 'male'];
  const ZONE_FRACTIONS = {
    low: { blue: 0.45, green: 0.65, red: 0.80 },
    moderate: { blue: 0.50, green: 0.70, red: 0.85 },
    high: { blue: 0.55, green: 0.75, red: 0.88 },
  };
  const WEEKLY = {
    low: {
      maintain: { Blue: [60, 90], Green: [10, 20], Red: [0, 5] },
      improve: { Blue: [80, 120], Green: [15, 30], Red: [0, 8] },
    },
    moderate: {
      maintain: { Blue: [90, 140], Green: [20, 40], Red: [5, 15] },
      improve: { Blue: [120, 180], Green: [30, 50], Red: [8, 20] },
    },
    high: {
      maintain: { Blue: [120, 180], Green: [30, 50], Red: [10, 20] },
      improve: { Blue: [150, 210], Green: [40, 70], Red: [15, 30] },
    },
  };

  function estimatedMaximum(age, sex) {
    if (!Number.isInteger(age) || age < 18 || age > 100) return null;
    if (sex === 'female') return Math.round(206 - 0.88 * age);
    if (sex === 'male') return Math.round(208 - 0.7 * age);
    return null;
  }

  function maxEquation(sex) {
    if (sex === 'female') return { equation: '206 - 0.88 × age', version: 'gulati-2010' };
    if (sex === 'male') return { equation: '208 - 0.7 × age', version: 'tanaka-2001' };
    return null;
  }

  function zoneFractions(fitness) {
    const row = ZONE_FRACTIONS[fitness];
    return row ? { ...row, version: 'fitness-zones-v1' } : null;
  }

  function monday(date) {
    const day = new Date(`${date}T12:00:00Z`);
    if (Number.isNaN(day.getTime())) return null;
    day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
    return day.toISOString().slice(0, 10);
  }

  function scaleRange(range, factor) {
    return range.map((minutes) => Math.max(0, Math.round(minutes * factor)));
  }

  function weeklyTarget({ fitness, goal, resting, weekStart }) {
    const base = WEEKLY[fitness]?.[goal];
    if (!base || !weekStart) return null;
    const factor = typeof resting === 'number' && resting >= 70 ? 0.9 : 1;
    const zones = {};
    for (const name of ['Blue', 'Green', 'Red']) zones[name] = scaleRange(base[name], factor);
    return {
      weekStart,
      zones,
      fitness,
      goal,
      resting: typeof resting === 'number' ? resting : null,
      source: 'onboarding-v2',
      model_version: 'weekly-targets-v1',
      evidenceLabel: 'STRENGTHSIDE-DESIGNED',
    };
  }

  function putWeekTarget(history, target) {
    const rows = Array.isArray(history) ? history.filter((row) => row.weekStart !== target.weekStart || row.source !== 'onboarding-v2') : [];
    if (rows.some((row) => row.weekStart === target.weekStart)) return rows;
    return [...rows, target];
  }

  function peakCandidate(workout, currentMax) {
    if (!workout || workout.type === 'Strength' || !Number.isFinite(currentMax)) return null;
    const counts = new Map();
    for (const sample of workout.samples || []) {
      const bpm = Math.round(Number(sample.bpm));
      if (!Number.isInteger(bpm) || bpm < 40 || bpm > 230) continue;
      counts.set(bpm, (counts.get(bpm) || 0) + 1);
    }
    const repeated = [...counts.keys()].filter((bpm) => counts.get(bpm) >= 2);
    if (!repeated.length) return null;
    const bpm = Math.max(...repeated);
    if (bpm <= currentMax) return null;
    return { bpm, previousMax: currentMax, samples: counts.get(bpm) };
  }

  function error(step, draft) {
    if (step === 'age' && estimatedMaximum(draft.age, 'male') == null) return 'Enter your age, from 18 to 100.';
    if (step === 'sex' && !SEXES.includes(draft.sex)) return 'Choose the estimate that matches you.';
    if (step === 'fitness' && !FITNESS.includes(draft.fitness)) return 'Choose your current cardio fitness.';
    if (step === 'goal' && !GOALS.includes(draft.goal)) return 'Choose your cardio goal.';
    if (step === 'maximum') {
      if (draft.maximumMode === 'estimated' && estimatedMaximum(draft.age, draft.sex) == null) return 'Choose an estimate, or enter a maximum you have measured.';
      if (draft.maximumMode === 'known' && (!Number.isInteger(draft.knownMaximum) || draft.knownMaximum < 1 || draft.knownMaximum > 300)) return 'Enter your known maximum heart rate.';
      if (!['estimated', 'known'].includes(draft.maximumMode)) return 'Choose how to set your maximum heart rate.';
    }
    return '';
  }

  root.EngineOnboardingRules = {
    VERSION, FITNESS, GOALS, SEXES, ZONE_FRACTIONS, WEEKLY,
    estimatedMaximum, maxEquation, zoneFractions, monday, weeklyTarget, putWeekTarget, peakCandidate, error,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
