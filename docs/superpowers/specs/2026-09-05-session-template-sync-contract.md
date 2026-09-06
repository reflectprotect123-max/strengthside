# Session + template sync contract (Chassis Phase M)

**Date:** 2026-09-05  
**Status:** Contract only — **not implemented** (Phase S)  
**Parent:** [Instrument · Atelier · Chassis design](./2026-09-05-instrument-atelier-chassis-design.md) §4 Phase M  
**Product surface:** Hybrid HTML athlete app (`apps/mobile/prototype/hybrid-app/index.html`)

---

## 1. Current state (honest)

| What syncs today | What does **not** sync |
| --- | --- |
| WHOOP recovery (when linked + signed in) | Calendar **sessions** |
| Concept2 Logbook (when linked) | Library **templates** |
| Supabase auth session for integrations | Performed-set / logger state beyond what lives inside a session root |

`Whoop.syncAll()` is **integration sync only**. Training plan state (`sessions`, `templates`, nested blocks/exercises) lives in device `localStorage` (`THE-builder-clean-v1`). Settings copy must stay honest until Phase S ships.

---

## 2. Entities in scope

Phase M/S sync covers **two root entities**. Nested structure ships as opaque payload under each root — no separate sync rows for blocks or exercises.

| Root entity | Source in app state | Notes |
| --- | --- | --- |
| **`templates`** | `state.templates[]`, `state.archivedTemplates[]` | Library workouts; Publish upserts then schedules a session |
| **`sessions`** | `state.sessions[]` | Scheduled, active, completed, abandoned calendar sessions |

**Out of scope for this contract:** custom exercise catalog (`state.exercises[]`), daily check-ins, adaptive Close memory, WHOOP/Concept2 tokens, nutrition, coach publish/pull, structured writes to the twelve-table strength ledger (unless Phase S explicitly adds them).

Each root record MUST carry sync metadata (see §4). The app already stamps `_meta` via `ensureEntityMeta` / `touchRecord`; Phase S maps `_meta.version` → **`rev`**.

---

## 3. Offline-first authority

1. **Device is source of truth** until the server returns a successful ack for that entity.
2. All mutations (create, update, delete, publish) apply **locally first**, then enqueue for upload.
3. UI reads local state only — never block training on network.
4. On reconnect, flush the outbound queue in stable order (templates before sessions that reference them, or include embedded template snapshot on session push).
5. Pull merges only after comparing revisions (§5); never overwrite dirty local rows without explicit conflict handling.

---

## 4. Revision model (explicit — not device-clock LWW)

**Binding rule:** monotonic **explicit revision**, not last-write-wins by device clock.

| Field | Owner | Rule |
| --- | --- | --- |
| `rev` | per entity | Integer, strictly increasing on every local mutation (`touchRecord` already increments `_meta.version`) |
| `updatedAt` | per entity | ISO timestamp for UX/debug only — **not** the conflict tie-break |
| `localId` | device | Stable id assigned before first successful server ack |
| `serverId` | server | Assigned on first ack; nullable until then |
| `ownerId` | auth | Supabase user id |
| `deviceId` | device | Stable per install |

**Rejected alternative:** LWW using `updatedAt` or device clock — clocks lie offline and across time zones.

### Server write rule

- Accept push when `clientRev > serverRev` (or entity is new).
- Reject with **`409 STALE_REV`** when `clientRev <= serverRev` and bodies differ.
- Client on `409`: fetch server copy, surface conflict if local is dirty, else adopt server and bump local `rev` to match.

### Delete rule

- Tombstone with monotonic `rev`; server retains tombstone for pull.
- Client must not resurrect deleted ids without a new `localId`.

---

## 5. Sync transport (sketch for Phase S)

Phase M does **not** pick storage backend. Phase S MUST implement push/pull that respects §3–§4. Acceptable shapes:

- **Per-entity RPC** (upsert by `serverId` + `rev`), or
- **Domain snapshot** envelope with per-entity `rev` map (similar to retired `athlete_domain_snapshots` pattern — do **not** restore deleted `StrengthSync` verbatim).

Minimum API surface:

```text
push(entities[]) → { acks: [{ localId, serverId, rev }], conflicts: [{ localId, serverRev, serverBody }] }
pull(sinceRev | sinceCursor) → { templates[], sessions[], tombstones[] }
```

Debounce outbound push (e.g. 2–5 s after last save); manual “Sync now” may call the same pipeline after integration sync completes.

---

## 6. Boundaries — integration sync vs plan sync

| Channel | Scope | Netlify site |
| --- | --- | --- |
| **Integration sync** | WHOOP OAuth/tokens/recovery, Concept2 Logbook | Athlete site **proxies** to `thehybridengine1.netlify.app`; ownership checks unchanged (`pnpm run check:whoop-ownership`, `check:whoop-live`, `check:whoop-deeplink`) |
| **Plan sync (this contract)** | `sessions`, `templates` | Athlete site (or Supabase RPC directly from signed-in client) — **not** the WHOOP proxy path |

Do not route session/template payloads through WHOOP/Concept2 proxy handlers. Do not conflate “Sync WHOOP & Concept2” success with plan sync.

---

## 7. Non-goals (Phase M and unless Phase S expands scope)

- Real-time multi-device live editing
- Coach read/write of athlete plans from this repo
- Restoring deleted packages (`StrengthSync`, `CoachSync`, adapters, Big Mac)
- Migration changes to the shared twelve-table ledger without explicit cross-repo coordination
- Using HRV/recovery data to gate sync or mutate sessions

---

## 8. Phase S handoff checklist

Phase S implements the contract above. Before Capgo ship:

- [ ] **`SessionTemplateSync` module** (IIFE or small module): queue, debounced push, pull on sign-in + manual sync, status for Settings UI
- [ ] **Wire `_meta` → `rev`** on every mutating save path (`save`, publish, template upsert, session complete)
- [ ] **Server storage + RPC** with `409 STALE_REV` enforcement (snapshot or per-entity — document choice in Phase S plan)
- [ ] **Merge + conflict UI** when local dirty and server ahead (keep local default; offer “use cloud copy”)
- [ ] **Honest copy update**: Settings / sync card distinguishes integration sync vs plan sync; remove “device only” caveat only when plan sync acks work
- [ ] **Smokes**: module exists, uses auth client, handles stale rev; extend `account-sync-checkin.smoke.mjs` or add dedicated smoke
- [ ] **CI**: new check in `verify` + `.github/workflows/ci.yml` if a guard is added
- [ ] **`pnpm run verify`** green; manual dogfood: edit template on A, pull on B, conflict on simultaneous edit

---

## 9. References

- Chassis design: [2026-09-05-instrument-atelier-chassis-design.md](./2026-09-05-instrument-atelier-chassis-design.md)
- Historical snapshot shape (deleted code — reference only): [2026-08-24-strength-cloud-sync-design.md](./2026-08-24-strength-cloud-sync-design.md)
- WHOOP ownership: `CLAUDE.md` § WHOOP / Netlify ownership
- Handoff sync honesty: `handoff.md` § Sync honesty
