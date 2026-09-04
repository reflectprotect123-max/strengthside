import type { CloseCondInput, CloseCondResult } from './types';

export function closeCond(input: CloseCondInput): CloseCondResult {
  if (input.lastMade.watts != null) return { ok: true, watts: input.lastMade.watts };
  return { ok: true, splitSec: input.lastMade.splitSec as number };
}
