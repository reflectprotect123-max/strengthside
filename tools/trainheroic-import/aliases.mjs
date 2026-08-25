/**
 * Explicit alias map: alternate spellings → canonical lift.
 *
 * Keys and values are normalised names (see normaliseExerciseName). Only
 * entries we are confident are the same lift — not training variants.
 */
import { normaliseExerciseName } from './parse.mjs';

/** @type {Record<string, string>} normalised alias → normalised canonical */
export const ALIASES = {
  // abbreviations & redundant prefixes
  'trap bar dl': 'trap bar deadlift',
  'barbell deadlift': 'deadlift',
  'barbell bench press': 'bench press',
  'barbell shoulder press': 'shoulder press',
  'barbell split squat': 'split squat',
  'barbell sldl': 'stiff leg deadlift',

  // trap bar (same implement, coach label drift)
  'touch n go trap bar deadlift': 'trap bar deadlift',
  'banded trap bar deadlift': 'trap bar deadlift',
  'trap bar rdl': 'rdl',

  // bench / press naming noise
  'alt db bench press': 'db bench press',
  'alternating db bench press pronated grip': 'db bench press',
  '30 degree incline db bench press': 'incline db bench press',
  'db single arm neutral grip bench press': 'db bench press',
  'single arm db neutral grip bench press': 'db bench press',
  'slight incline bb bench press': 'incline bench press',
  'football bar bench press': 'football bar floor press',
  'seated db shoulder press': 'seated db press',

  // rows & pulldowns
  'lat pull downs': 'lat pulldown',
  'lat pulldowns pronated': 'lat pulldown',
  'lat pulldown supinated grip': 'lat pulldown',
  'wide grip lat pulldown': 'lat pulldown',
  'narrow grip lat pull down': 'lat pulldown',
  'pendlay rows': 'pendlay row',
  't bar row pronated': 't bar row',
  'db incline row pronated grip': 'db incline row',
  'symmetrical stance db row pronated grip': 'db row',
  'head supported pronated row': 'chest supported db row',
  'db row to chest': 'db row',

  // deadlift naming (NOT deficit / clean / pause variants)
  'deadlift sumo': 'sumo deadlift',

  // lunges / splits
  'goblet reverse lunge': 'reverse lunge',
  'zercher reverse lunge': 'reverse lunge',
  'db bulgarian split squat': 'bulgarian split squat',
  'single arm split squat': 'split squat',
  'db lunge': 'lunges',
  'db reverse lunge': 'reverse lunge',
  'walking lunge': 'walking lunges',

  // pull-ups / dips
  'weighted neutral grip pull ups': 'neutral grip pull ups',
  'strict bodyweight pull up': 'pull up',
  'weighted strict pullup': 'weighted pull ups',
  'chin up': 'pull up',
  'neutral pull up': 'neutral grip pull ups',
  'weighted bar dip': 'weighted strict dip',
  'strict bar dip': 'strict dip',

  // arms
  'kb hammer curl': 'hammer curl',
  'incline db skull crusher': 'skull crushers',
  'cable tricep pushdown': 'tricep pushdown',
  'supinated cable tricep pushdown': 'tricep pushdown',
  'tricep rope pulldown': 'tricep pushdown',
  'db bicep curl': 'db bicep curls',
  'seated incline db curl': 'incline db curl',
  'rolling tricep extension': 'rolling tricep extensions',
  'rear delt fly': 'rear delt flyes',
  'kb swing': 'kb swings',
  'b stance rdl': 'b stance rdls',
  'sl landmine rdl': 'sl landmine rdls',
  'reverse hyper': 'reverse hypers',
  'sumo deadlift with chain': 'sumo deadlift with chains',
  'slant board suitcase squat': 'slant board suitcase squats',
  'kot split squat': 'kot split squats',
  'poliquin lateral raise': 'db lateral raise',

  // oly — only labels that are clearly the same drill under two names
  'hang clean high pull': 'clean high pull',
  'db single arm push press': 'push press',
};

/** Normalised names we must never rewrite — training variants, not typos. */
export const ALIAS_BLOCKLIST = new Set([
  'pause back squat',
  'deficit deadlift',
  'clean deadlift',
  'box squat back squat',
  '1 1 4 back squat',
  'sumo box squat',
  'zercher box squat',
  'tempo front squat',
  'wide grip bench press',
  'yates row',
  'floor press',
  'floor press with chain',
  'close grip floor press',
  'close grip board press',
  'dead stop deadlift',
  'ssb squat',
  'front box squat',
  'snatch grip barbell row',
  'front squat back squat',
  'hip thrust',
  'romanian deadlift from deficit',
]);

/**
 * Resolve a raw TrainHeroic title to its canonical normalised name.
 * Returns { normalised, aliased, from }.
 */
export function resolveExerciseName(raw) {
  const normalised = normaliseExerciseName(raw);
  if (!normalised || ALIAS_BLOCKLIST.has(normalised)) {
    return { normalised, aliased: false, from: null };
  }
  const target = ALIASES[normalised];
  if (target && target !== normalised) {
    return { normalised: target, aliased: true, from: normalised };
  }
  return { normalised, aliased: false, from: null };
}

export function exerciseIdFromRaw(raw) {
  const { normalised } = resolveExerciseName(raw);
  const slug = normalised.replace(/\s+/g, '-');
  return slug ? `th-${slug}` : '';
}
