import type { CondNextInput, CondNextResult, RepRange } from './types';

function condBand(
  actual: number,
  target: RepRange,
  stopped?: boolean,
  cooked?: boolean,
): 'hold' | 'up' | 'down' | 'cut' {
  if (stopped || actual >= 10) return 'cut';
  if (cooked) return 'down';
  if (actual < target.min) return 'up';
  if (actual > target.max) return 'down';
  return 'hold';
}

function present(n: number | undefined): n is number {
  return n != null && Number.isFinite(n);
}

function nextWatts(w: number, band: 'hold' | 'up' | 'down' | 'cut'): CondNextResult {
  if (band === 'hold') return { ok: true, watts: w };
  if (band === 'up') return { ok: true, watts: Math.round(w * 1.03) };
  if (band === 'down') return { ok: true, watts: Math.round(w * 0.95) };
  return { ok: true, watts: Math.round(w * 0.92) };
}

function nextSplit(s: number, band: 'hold' | 'up' | 'down' | 'cut'): CondNextResult {
  if (band === 'hold') return { ok: true, splitSec: s };
  if (band === 'up') return { ok: true, splitSec: s - 1 };
  if (band === 'down') return { ok: true, splitSec: s + 1 };
  return { ok: true, splitSec: s + 3 };
}

export function decideNextCond(input: CondNextInput): CondNextResult {
  if (input.dayKind !== 'conditioning') return { ok: false, reason: 'wrong_day' };

  const hasWatts = present(input.currentWatts);
  const hasSplit = present(input.currentSplitSec);
  if (!hasWatts && !hasSplit) return { ok: true, skipped: true };

  const band = condBand(input.actualRpe, input.targetRpe, input.stopped, input.cooked);

  // Split modalities never fall back to watts — locked architecture.
  if (input.modality === 'split') {
    if (!hasSplit) return { ok: true, skipped: true };
    return nextSplit(input.currentSplitSec as number, band);
  }

  if (!hasWatts) return { ok: true, skipped: true };
  return nextWatts(input.currentWatts as number, band);
}
