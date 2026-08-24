# Strength cloud sync — design spec

**Date:** 2026-08-24  
**Status:** Approved in chat (build when Account job needs it)  
**Scope:** Mirror local strength progression state to Supabase using the same pattern as nutrition sync. **Local-first remains source of truth on device.**

## Problem

Progression state (`workingMaxEvents`, `loadHints`, `progressionAudit`, completed sessions) lives only in `localStorage`. Export backup exists, but there is no cross-device restore or durable cloud copy. Nutrition already syncs via `athlete_domain_snapshots`.

## Goal

Debounced push/pull of a **strength domain snapshot** after relevant saves, using the athlete's existing Supabase session (same as WHOOP / nutrition). Conflict resolution: **newest revision wins** with stale-revision recovery (mirror nutrition-sync).

## Locked product decisions

| Topic | Decision |
| --- | --- |
| Domain key | `strength` (or `strength_progression` if hybrid repo already claims `strength` — verify at implement time) |
| Authority | **Device local state** wins on conflict unless cloud revision is strictly newer and user has not edited since last pull |
| Sync trigger | `save('completed-workout')`, `saveCheckin` (optional), manual “Sync now” in Settings |
| Offline | Queue silently; retry on reconnect — no blocking UI |
| Migrations | **No new Postgres tables in this repo** unless snapshot RPC insufficient — prefer opaque snapshot blob like nutrition |
| Tables owned | If structured sync later, only the twelve strength-owned tables — never hybrid roster/auth |

## Architecture

```text
index.html save()
  → StrengthSync.schedulePush()  (debounced, like NutritionSync)
  → envelope: { revision, strengthState, progressionAudit slice, templatesHash? }
  → upsert_athlete_domain_snapshot(p_domain, p_payload, p_revision)
  → pull on sign-in / Settings open
```

New file: `strength-sync.js` (IIFE, `window.StrengthSync`), loaded after `strength-adapter.js`.

## Payload shape (v1 opaque)

```ts
interface StrengthDomainSnapshot {
  snapshotVersion: 1;
  exportedAt: string;
  strengthState: {
    workingMaxEvents: WorkingMaxEvent[];
    prEvents: PrEvent[];
    loadHints: Record<string, { loadKg: number; updatedAt: string; source: string }>;
  };
  progressionAudit: ProgressionAuditEntry[];  // cap 200
  // Optional v1: completed session summaries only (not full tasks) for cross-device PR detection
}
```

**Do not** sync full `S` blob — nutrition already proved domain-scoped snapshots work.

## Pull merge rules

1. If no local `strengthState` → accept cloud wholesale
2. If local revision === cloud revision → noop
3. If cloud revision newer AND no local edits since `meta.lastSavedAt` before pull → merge cloud
4. If both edited → **keep local**, push on next save (nutrition stale pattern); log `stale_revision` once

## Non-goals

- Real-time multi-device live sync
- Coach read access from this repo
- Syncing Engine conditioning tasks (hybrid repo domain)
- Replacing export backup JSON

## Error handling

- No Supabase session → skip push quietly; Settings shows “Sign in via WHOOP/Nutrition to enable sync”
- RPC failure → retry with backoff; never corrupt local state
- Payload too large → trim audit to 100 entries before push

## Testing

- `strength-sync.smoke.mjs` — file exists, uses `upsert_athlete_domain_snapshot`, `Whoop.client`, `schedulePush`
- Manual: two browsers same account — session on A, pull on B shows load hint

## Exit criteria

- [ ] `strength-sync.js` + Settings card
- [ ] Push after completed strength workout
- [ ] Pull on app load when authenticated
- [ ] Stale revision handled like nutrition
- [ ] `check:strength-sync` in verify + CI
- [ ] No migration against foreign tables

## References

- `apps/mobile/prototype/hybrid-app/nutrition-sync.js` — pattern to copy
- `2026-08-24-strength-recovery-silent-wire-design.md` — data written locally today
- `CLAUDE.md` — shared-Supabase contract
