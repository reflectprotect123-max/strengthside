# Decision log

## 2026-08-04 — research handoff created

**Decision:** Treat separate Strength and Conditioning apps as the product destination, with explicit shared-core, Whole-Athlete State, and Coordinator boundaries.

**Status:** architectural recommendation; requires product-owner approval before implementation.

## 2026-08-04 — cross-app storage redline

**Decision:** Do not use the existing broad client-merged JSONB blob as the public compatibility boundary for independently deployed apps. Retain local-first clients, but introduce server-side ownership, versions, idempotency, and integration events/snapshots.

**Status:** recommended; baseline audit must measure migration cost and confirm current source behavior.

## 2026-08-04 — Whole-Athlete State boundary

**Decision:** State interprets context and emits constraints. It does not prescribe workouts. Pain and illness remain hard safety routes; HRV is advisory only.

**Status:** non-negotiable safety boundary for implementation.

## 2026-08-04 — Conditioning-first posture

**Decision:** If Conditioning is built first, treat it as a private/canary validation build, not an automatic public release. BLE/GPS/Concept2/native permissions are integration risks.

**Status:** recommendation; product owner to choose release posture.

## 2026-08-04 — Coordinator writer

**Decision:** Only the Coordinator may publish a combined weekly plan. Apps can propose, preview, override, complete, or miss owned sessions.

**Status:** architecture invariant.

## 2026-08-04 — evidence boundary

**Decision:** No universal claims for deload thresholds, readiness cutoffs, HRV injury prediction, or one-number recovery debt. Product heuristics require versioning, reasons, confidence, fixtures, and rollback.

**Status:** safety and evidence invariant.
