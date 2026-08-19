import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { METRICS } from '@hybrid/strength-engine';
import { Bench } from './Bench';

describe('Bench', () => {
  it('renders every metric the engine declares', () => {
    const { container } = render(<Bench />);
    // Queried by data-metric-key, not by text: a metric's key and its canonical
    // unit are the same string for `rpe`, so a text query matches two cells and
    // the assertion fails for a reason that has nothing to do with the screen.
    // Not a hardcoded count either — if a migration adds a metric row and the
    // registry is regenerated, this follows it rather than failing for being right.
    for (const key of Object.keys(METRICS)) {
      expect(container.querySelector(`[data-metric-key="${key}"]`)).not.toBeNull();
    }
  });

  it('names the missing config rather than rendering an empty state', () => {
    render(<Bench />);
    expect(screen.getByText(/VITE_SUPABASE_URL/)).toBeDefined();
  });
});
