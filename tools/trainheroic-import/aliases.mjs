/**
 * TrainHeroic naming rules — codified from athlete naming conventions:
 *
 * 1. No prefix = barbell (default implement). DB/KB/Cable/Trap Bar/etc. are explicit.
 * 2. "Barbell X" is redundant when X already exists without a prefix → strip to X.
 * 3. Two-word order flips: "Deadlift Sumo" → "Sumo Deadlift" (modifier goes first).
 * 4. Variant qualifiers (pause, deficit, strict, wide, close, …) = different lift.
 * 5. Explicit overrides only for abbreviations and oddballs the rules cannot infer.
 */
import { normaliseExerciseName } from './parse.mjs';

/** Non-default implements — if the name starts with one of these, never strip "barbell". */
export const IMPLEMENT_PREFIXES = new Set([
  'db', 'dumbbell', 'kb', 'kettlebell', 'cable', 'trap', 'landmine', 'ez',
  'smith', 'machine', 'ssb', 'football', 'hex', 'swiss', 'goblet', 'zercher',
  'barbell', // handled separately
]);

/**
 * Lifts where the bare name (no prefix) means barbell. "Barbell Bench Press"
 * folds to "Bench Press" because DB would say DB at the front if it were bells.
 */
export const DEFAULT_BARBELL_BASES = new Set([
  'bench press',
  'deadlift',
  'shoulder press',
  'split squat',
  'lunge',
  'reverse lunge',
  'overhead press',
  'z press',
]);

/** Second word in a two-word name that should come first: deadlift sumo → sumo deadlift. */
export const MODIFIER_FIRST = new Set([
  'sumo', 'front', 'back', 'romanian', 'pendlay', 'reverse', 'bulgarian',
  'zercher', 'goblet', 'overhead', 'split', 'hang', 'power', 'push', 'clean',
  'snatch', 'incline', 'decline', 'seated', 'standing', 'neutral', 'wide',
  'close', 'strict', 'tempo', 'pause', 'deficit', 'box', 'slight',
]);

/** Never rewrite these to something else — genuinely different lifts / combos. */
export const VARIANT_BLOCKLIST = new Set([
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
  'barbell row', // bare "row" is too generic — keep barbell row as its own lift
]);

/** Oddballs and abbreviations the rules cannot infer. Keys/values are normalised. */
export const EXPLICIT_ALIASES = {
  // abbreviations
  'trap bar dl': 'trap bar deadlift',
  'tbd': 'trap bar deadlift',
  'barbell sldl': 'stiff leg deadlift',
  'overhead press ohp': 'shoulder press',
  'barbell overhead press ohp': 'shoulder press',

  // spelling / punctuation drift
  'lat pull downs': 'lat pulldown',
  'lat pulldowns pronated': 'lat pulldown',
  'lat pulldown supinated grip': 'lat pulldown',
  'wide grip lat pulldown': 'lat pulldown',
  'narrow grip lat pull down': 'lat pulldown',
  'chin up': 'pull up',
  'pull ups': 'pull up',
  'pullup': 'pull up',
  'pullups': 'pull up',

  // same implement, coach label drift (not a variant qualifier change)
  'touch n go trap bar deadlift': 'trap bar deadlift',
  'banded trap bar deadlift': 'trap bar deadlift',
  'trap bar rdl': 'rdl',
  'deadlift sumo': 'sumo deadlift', // belt-and-braces if word-order pass misses

  // DB / cable naming noise (implement prefix stays — target is still DB/cable lift)
  'alt db bench press': 'db bench press',
  'alternating db bench press pronated grip': 'db bench press',
  'db single arm neutral grip bench press': 'db bench press',
  'single arm db neutral grip bench press': 'db bench press',
  'seated db shoulder press': 'seated db press',
  'db row to chest': 'db row',
  'db bulgarian split squat': 'bulgarian split squat',
  'db lunge': 'lunges',
  'db reverse lunge': 'reverse lunge',
  'db bicep curl': 'db bicep curls',
  'kb hammer curl': 'hammer curl',
  'kb swing': 'kb swings',
  'cable tricep pushdown': 'tricep pushdown',
  'supinated cable tricep pushdown': 'tricep pushdown',
  'tricep rope pulldown': 'tricep pushdown',

  // accessory / grip labels on same movement
  't bar row pronated': 't bar row',
  'db incline row pronated grip': 'db incline row',
  'symmetrical stance db row pronated grip': 'db row',
  'head supported pronated row': 'chest supported db row',
  'strict bodyweight pull up': 'pull up',
  'weighted strict pullup': 'weighted pull ups',
  'neutral pull up': 'neutral grip pull ups',
  'weighted neutral grip pull ups': 'neutral grip pull ups',
  'weighted bar dip': 'weighted strict dip',
  'strict bar dip': 'strict dip',
  'walking lunge': 'walking lunges',
  'goblet reverse lunge': 'reverse lunge',
  'zercher reverse lunge': 'reverse lunge',
  'single arm split squat': 'split squat',
  'incline db skull crusher': 'skull crushers',
  'seated incline db curl': 'incline db curl',
  'rolling tricep extension': 'rolling tricep extensions',
  'rear delt fly': 'rear delt flyes',
  'b stance rdl': 'b stance rdls',
  'sl landmine rdl': 'sl landmine rdls',
  'reverse hyper': 'reverse hypers',
  'sumo deadlift with chain': 'sumo deadlift with chains',
  'slant board suitcase squat': 'slant board suitcase squats',
  'kot split squat': 'kot split squats',
  'poliquin lateral raise': 'db lateral raise',
  'hang clean high pull': 'clean high pull',
  'db single arm push press': 'push press',
  'football bar bench press': 'football bar floor press',
  'slight incline bb bench press': 'incline bench press',
  '30 degree incline db bench press': 'incline db bench press',
};

/** Collect every normalised exercise title in the export (pass 1). */
export function buildNameCatalog(rows) {
  const catalog = new Set();
  for (const row of rows) {
    const title = String(row.ExerciseTitle || '').trim();
    if (title) catalog.add(normaliseExerciseName(title));
  }
  return catalog;
}

function stripRedundantBarbell(normalised, catalog) {
  if (!normalised.startsWith('barbell ')) return normalised;
  const rest = normalised.slice('barbell '.length);
  if (!rest || VARIANT_BLOCKLIST.has(normalised)) return normalised;
  // Strip when the unprefixed name exists in the export, or it's a known default barbell lift.
  if (catalog.has(rest) || DEFAULT_BARBELL_BASES.has(rest)) return rest;
  return normalised;
}

function flipWordOrder(normalised) {
  const words = normalised.split(' ').filter(Boolean);
  if (words.length !== 2) return normalised;
  const [a, b] = words;
  if (MODIFIER_FIRST.has(b)) return `${b} ${a}`;
  return normalised;
}

function normalisePullDown(normalised) {
  return normalised
    .replace(/\bpull downs\b/g, 'pulldown')
    .replace(/\bpull down\b/g, 'pulldown');
}

/** Rule pipeline — no explicit overrides yet. */
export function applyNamingRules(normalised, catalog) {
  if (!normalised || VARIANT_BLOCKLIST.has(normalised)) return normalised;
  let n = normalised;
  n = stripRedundantBarbell(n, catalog);
  n = flipWordOrder(n);
  n = normalisePullDown(n);
  // overhead press → shoulder press when it's the barbell default name
  if (n === 'overhead press') n = 'shoulder press';
  return n;
}

/**
 * Resolve a raw TrainHeroic title to its canonical normalised name.
 * @param {string} raw
 * @param {Set<string>} [catalog] normalised names seen in this export (pass 1)
 */
export function resolveExerciseName(raw, catalog = new Set()) {
  const original = normaliseExerciseName(raw);
  if (!original || VARIANT_BLOCKLIST.has(original)) {
    return { normalised: original, aliased: false, from: null };
  }

  let normalised = applyNamingRules(original, catalog);
  const explicit = EXPLICIT_ALIASES[normalised];
  if (explicit && explicit !== normalised) normalised = explicit;

  return {
    normalised,
    aliased: normalised !== original,
    from: normalised !== original ? original : null,
  };
}

export function exerciseIdFromRaw(raw, catalog = new Set()) {
  const { normalised } = resolveExerciseName(raw, catalog);
  const slug = normalised.replace(/\s+/g, '-');
  return slug ? `th-${slug}` : '';
}

/** @deprecated use EXPLICIT_ALIASES — kept so older imports of ALIASES still work in tests */
export const ALIASES = EXPLICIT_ALIASES;
