# Coach assignment and result contract

Coach (`the-adaptivebrain-/apps/coach`) publishes to the strength-owned `assigned_session` table. The athlete consumes `resolved_snapshot.htmlSession` through `coach-assignments.js`.

## Identity and prescriptions

The server ID is canonical. Coach resolves `(athlete_id, coach_session_key)` before updating or unpublishing, persists the returned ID, and requires an affected row. Published snapshots and their original `published_at` remain frozen. Repeating the same publish, unpublishing and rescheduling are permitted; changed authored content requires a duplicate workout. The scheduled date column overrides the date inside the original snapshot.

`metric: Weight` with an empty kg prescription means the engine chooses a load while the athlete still logs kg. Explicit `metric: Reps` remains reps-only. Per-set reps/ranges/AMRAP, structured tempo, exercise/equipment metadata, block notes and per-side instructions cross the boundary. Prose notes are never parsed into authoritative tempo.

## Completion receipt

Migration `20261018040000_coach_assignment_results.sql` adds `assigned_session.athlete_result` and the authenticated, security-invoker RPC `complete_coach_assignment(assignment UUID, session UUID)`. Deploy this migration before releasing the new clients. Strength owns the table and RPC; Coach must not recreate them.

Assignment/exercise/block provenance travels through library compilation and session pages into durable `strength_brain_records`. After a completed session's final record revisions are acknowledged, the athlete requests a receipt. The server derives it from the authenticated athlete's stored records. It rejects foreign assignments and incomplete evidence. The receipt contains set actuals and the athlete engine's canonical session estimates, not another Coach calculation. An older session cannot replace newer results.

The assignment stays `published` so completed workouts remain available in Training. Coach considers `athlete_result` completed and displays the returned metrics, load convention and estimates. Result receipts are separate from immutable prescriptions. Unpublish removes the future assignment but does not erase athlete history or its completion receipt.

Receipt acknowledgements live with account-scoped strength memory. A lost response retries idempotently; restart, foreground and online sync retry delivery. A finish occurring during an upload queues its final revisions before attempting the receipt. Logging does not wait for network access.

## Verification and boundaries

Regression tests cover UI-produced weight/range prescriptions, provenance, notes/tempo/per-side, offline receipts, restart, account changes, in-flight finishing, zero-row updates and frozen publication. SQL tests run as `authenticated`, prove owner/coach reads and reject a different athlete. Coach browser tests exercise actual typing, per-set overrides and result visibility through redraw.

The cross-repository Playwright CLI walkthrough uses visible Coach creation/publish and Athlete logging controls, an isolated Supabase-shaped HTTP adapter and real disposable PostgreSQL/RLS/freeze rules. It does not certify production authentication, live roster setup, Windows installation or a physical APK. No Capgo deployment is implied by these tests.
