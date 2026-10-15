# Cursor handoff: strength learning

Implementation status, test evidence and blocked release gates: [acceptance record](../../releases/strength-online-learning-acceptance.md). The planning snapshot below remains historical.

Read these in order:

1. [Design](../../superpowers/specs/2026-10-15-strength-online-learning-design.md)
2. [Implementation plan](../../superpowers/plans/2026-10-15-strength-online-learning.md)
3. [Evidence and its limits](evidence.md)
4. [Mandatory test gates](test-matrix.md)

This packet plans strength-only online learning. Conditioning is parked. No app changes, hosted database changes, merges or Capgo releases are part of this planning PR.

For implementation, refresh main and reconcile newer Cursor changes first. Execute the plan task by task with requirement and code review after each commit. Preserve the current app appearance and existing logging metrics. Keep default policy live until evaluation and native APK gates pass. Do not copy the simulator-only prototype into production or treat its assertion checks as app end-to-end evidence.
