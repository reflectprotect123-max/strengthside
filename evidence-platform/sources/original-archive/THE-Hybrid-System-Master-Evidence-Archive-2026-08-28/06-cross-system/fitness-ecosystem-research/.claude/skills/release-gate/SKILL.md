# Verify and hand off a phase

1. Read the relevant gate in `docs/07_TEST_AND_RELEASE_GATES.md`.
2. Run the package checks and every target-app command discovered by the baseline.
3. Verify migration fixtures, RLS, secrets, logs, device coverage, and rollback.
4. Record exact commands, environment, result, and unverified tests.
5. Update the phase README and handoff using the required format.
6. Do not claim a public release gate has passed when a native, store, security, or regulatory check is absent.
