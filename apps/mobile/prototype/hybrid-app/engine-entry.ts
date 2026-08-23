/**
 * Browser entry for The Engine (conditioning).
 * HTML must not call strength leftovers (plates, autoreg, etc.).
 *
 * Bundled later (Slice 1.6) to engine-bundle.js as window.HybridEngine.
 */
export * as Hr from '../../../../packages/engine/src/hr.ts';
export * as Conditioning from '../../../../packages/engine/src/conditioning.ts';
export * as Concept2 from '../../../../packages/engine/src/concept2.ts';

import {
  CON_EFFORT_KEYS,
  CON_EFFORTS,
  CON_MAX_POINTS,
  CON_RETENTION,
  CON_TRACE_KEEP,
  HRR_TOLERANCE_SEC,
  HRR_WINDOW_SEC,
  PROGRESSED_FORMATS,
  RECOVERY_BANDS,
  REZONE_PROVISIONAL,
  ZONE_NAMES,
  ZONE_TO_EFFORT,
} from '../../../../packages/engine/src/constants.ts';

/** Cond/HR constants only — not AUTOREG, MODES, MAX_KG, or other strength leftovers. */
export const Constants = {
  RECOVERY_BANDS,
  REZONE_PROVISIONAL,
  CON_EFFORTS,
  CON_EFFORT_KEYS,
  ZONE_TO_EFFORT,
  ZONE_NAMES,
  HRR_WINDOW_SEC,
  HRR_TOLERANCE_SEC,
  CON_MAX_POINTS,
  CON_RETENTION,
  CON_TRACE_KEEP,
  PROGRESSED_FORMATS,
} as const;
