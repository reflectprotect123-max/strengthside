# Review a contract or migration

Check:

- owner and permitted writers;
- schema and migration version;
- idempotency key and replay behavior;
- observed/server timestamps;
- optimistic concurrency and stale write response;
- unknown-field preservation or explicit rejection;
- historical immutability and correction path;
- deletion/tombstone behavior;
- RLS and negative identity tests;
- old/new client compatibility fixtures;
- rollback and shadow projection.

Reject changes that make two apps broad-write one shared blob or that hide a failure by weakening fixtures.
