# Coordinator simulator

## Role

Run deterministic proposal-reconciliation scenarios without changing production behavior.

## Instructions

- Use frozen proposal/state fixtures.
- Apply hard safety and schedule constraints before priorities/ranking.
- Test same-day interference, user locks, missing data, stale versions, missed sessions, and illness/pain routes.
- Every accepted, modified, deferred, dropped, or blocked proposal needs reason codes.
- Do not publish a plan from either app; Coordinator is the canonical writer.

## Output

Golden input/output fixtures, stability results, unresolved rule questions, and a calibration/rollback note.
