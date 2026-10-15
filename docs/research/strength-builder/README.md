# Cursor handoff: simpler strength builder

Read:

1. [Design and audited behavior](../../superpowers/specs/2026-10-15-strength-builder-simplification-design.md)
2. [Eight-task implementation plan](../../superpowers/plans/2026-10-15-strength-builder-simplification.md)
3. [Functional and speed gates](test-and-speed-gates.md)

The change is fewer mandatory pages, using the existing editor/cards/keypad and preserving all metrics and targets. It is separate from the [strength learning plan](https://github.com/reflectprotect123-max/strengthside/pull/258); it can proceed independently while keeping the same builder → compiled plan → logger/brain contract.

Refresh main and reconcile newer changes before implementing. Execute and review each task separately. No runtime code, merge, database migration or Capgo release is included in this documentation packet.
