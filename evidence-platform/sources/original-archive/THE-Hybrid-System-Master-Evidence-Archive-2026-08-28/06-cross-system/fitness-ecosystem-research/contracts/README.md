# Contract package

These JSON Schemas are implementation-neutral boundary contracts. They are not a substitute for the real application’s TypeScript types, database migrations, or server authorization. When Claude imports them into the target repository:

1. generate or hand-write strongly typed models;
2. validate at boundaries, not only at compile time;
3. add migration IDs and supported-version matrices;
4. enforce ownership server-side;
5. add golden fixtures and old/new client tests;
6. preserve unknown fields or reject the mutation explicitly;
7. never broaden `additionalProperties` to hide a compatibility failure without a decision record.

The initial contracts intentionally separate:

- raw integration events;
- derived Whole-Athlete State snapshots;
- specialist session proposals; and
- Coordinator-published weekly plans.

The exact field names should be reconciled with the baseline audit before production migration. The versioning and ownership principles are the important part of this package.
