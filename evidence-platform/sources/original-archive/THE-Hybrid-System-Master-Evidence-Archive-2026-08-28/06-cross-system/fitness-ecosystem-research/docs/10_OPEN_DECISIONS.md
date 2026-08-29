# Open decisions requiring product-owner approval

These are intentionally explicit. Claude should not make them silently.

## Decision 1 — target sync boundary

Choose one:

- **Recommended:** local-first clients plus relational/domain-owned server resources, append-only integration events, and snapshots.
- Transitional: per-domain JSONB envelopes with server-side versions and ownership, with a dated migration to relational resources.
- Not recommended for public split: one broad JSONB blob with client-side merge.

## Decision 2 — state authority mode

Choose one per rollout phase:

- observational state only;
- authoritative adapter for every prescription-sensitive call site.

The UI must not imply the second when the system is in the first.

## Decision 3 — identity model

Confirm whether Strength and Conditioning share the same Supabase Auth subject and how account deletion, email change, coach access, and provider revocation work across apps.

## Decision 4 — Coordinator location

Choose:

- server-side canonical planner;
- shared deterministic package invoked by one server-authorized job;
- temporary shadow planner only, with no public publication.

The combined plan needs one writer regardless of deployment choice.

## Decision 5 — Conditioning-first release posture

Recommendation: private/canary first. Confirm whether the product owner wants an internal test build, TestFlight/closed testing, or no separate app until Strength migration is ready.

## Decision 6 — legacy blob retirement window

Define the minimum supported old web/mobile versions and the date after which old clients may be forced to upgrade or become read-only.

## Decision 7 — claims and regulatory posture

Approve a product-language policy that avoids diagnosis, prognosis, treatment, injury prediction, and medical clearance. Assign privacy/regulatory and clinical reviewers.

## Decision 8 — Nutrition integration boundary

Nutrition remains out of scope, but choose whether it consumes:

- append-only workout-completed and body-weight events;
- read-only shared snapshots;
- a separate integration API.

## Decision 9 — minimum first public slice

Choose the first user-visible product after contracts:

- Strength continuity with shared-core only;
- Conditioning canary with no Coordinator;
- Whole-Athlete State display only;
- Coordinator shadow mode with no automatic schedule changes.

The safest option is the smallest slice that validates identity, sync, and data ownership.
