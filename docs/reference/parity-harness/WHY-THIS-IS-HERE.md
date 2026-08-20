# Parity harness — reference copy, not a check

Copied verbatim from `THE-HYBRID-ENGINE1` on 21 August 2026, immediately before
Task 2 of the repo split deleted it there (`docs/superpowers/plans/
2026-08-19-strength-repo-split.md`, "parity harness/driver/baselines deleted").

These files are the recorded behavior of the OLD mobile strength logger — the
harness that proved web and mobile rendered a session identically, plus the
session fixture it drove. The hybrid repo's restore condition for its parity
gate was "Phase C ships the new logger"; Phase C now lives in this repository,
so the reference lives here too.

**This is documentation, not a check.** Nothing runs these files; they are not
in any workflow or verify list, deliberately — a check that exists and does not
run is worth very little, and wiring these up against apps that do not exist
yet would be a decorative guard. When Phase C builds the new logger, use these
as the record of what the old one did, then write NEW checks against the new
app in the same commit that adds them to CI.

Files:

- `Harness.tsx` — the mobile-side parity harness screen (Expo entry).
- `README.md` — the hybrid repo's own explanation of the parity gates.
- `session-fixture.mjs` — the canonical session both sides rendered.
- `drive.mjs`, `script.mjs`, `serve-harness.mjs` — the Playwright driver side.

Imports reference `@hybrid/*` workspace packages that exist in the hybrid
repo's tree at deletion time (`34dfab4`), not here — expected; see above.
