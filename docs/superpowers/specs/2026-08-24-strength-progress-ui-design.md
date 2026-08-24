# Strength progress UI — design spec

**Date:** 2026-08-24  
**Status:** Approved in chat (build after silent wire)  
**Scope:** Read-only **Progress** surfaces for solo dogfood. Silent progression stays silent — this is proof, not permission.

## Problem

Silent wire updates loads and writes `S.meta.progressionAudit[]`, but the athlete has no calm place to see **working max trends**, **PRs**, or **what changed** without accept/decline theater. Charter job #3 (“Progress — proof over time”) is still thin.

## Goal

Add a **Progress** entry (Home module or Library sub-section — pick one surface, not both) showing:

1. **Recent PRs** — exercise, rep count, load, date (from logged sets + engine `detectPr`)
2. **Working max by lift** — current anchor per exercise (from `S.strengthState.workingMaxEvents`)
3. **Last silent changes** — last N audit entries (action, exercise, delta, reason codes) — **read-only**, no undo in v1

No banners. No “Accept progression?” sheets. Deloads appear in the audit list the same as progress.

## Locked product decisions

| Topic | Decision |
| --- | --- |
| Progression UX | **Still silent apply** — Progress UI does not gate changes |
| PR definition | Engine contract: per rep-count, same as `pr_event` table |
| Audit visibility | Show last 20 entries; link reason codes to plain-English one-liners |
| Pain / recovery | Show in audit row (e.g. “Held — session pain”, “Held — no check-in”) — not alarmist |
| Empty state | “Log a few sessions — PRs and loads show up here.” |
| Coach mode | None — athlete-only |

## Architecture

```text
index.html (Progress screen)
  → read S.strengthState, S.meta.progressionAudit, completed sessions
  → HybridStrength bundle: Pr.detectPr, WorkingMax.currentWorkingMax, E1rm.e1rm (optional trend)
  → render lists only — no adapter write path on this screen
```

Optional thin helper in `strength-adapter.js`:

```ts
progressSummary(state): {
  prs: PrRow[];
  workingMaxes: WmRow[];
  recentAudit: AuditRow[];
}
```

## UI sketch (Track Dawn)

- **Header:** “Progress” · copper accent (Hybrid Strength dial)
- **PRs card:** table or list — `Bench · 5 reps · 102.5 kg · 22 Aug`
- **Working max card:** top 5–8 lifts athlete actually logs
- **Recent autopilot card:** `+2.5 kg Bench · three on-target sessions` / `Held · no check-in today`

Tap exercise → optional detail: last 5 session exposures (load × reps), still read-only.

## Data sources

| Field | Source |
| --- | --- |
| `workingMaxEvents` | `S.strengthState` (written by silent wire) |
| `progressionAudit` | `S.meta.progressionAudit` |
| PR detection | Recompute from completed session rows OR maintain `S.strengthState.prEvents[]` on session complete (adapter extension) |

**Recommendation:** extend adapter on session complete to append `prEvents` when `detectPr` fires — avoids full-history recompute on every Progress open.

## Non-goals

- Charts / graphs v1 (list-first)
- Export CSV
- Cloud sync (separate spec)
- Comparing to RP “specialize volume” targets
- Editing working max manually (future athlete_set source if asked)

## Error handling

- Missing strength bundle → Progress screen shows “Engine not loaded” once; no crash
- No completed strength sessions → empty states per section
- Corrupt audit entry → skip row, log once in dev

## Testing

### Automated

- `strength-adapter` unit/smoke: fixture state → `progressSummary` shape
- `check:strength-progress-ui` smoke (new): HTML includes Progress route + adapter export

### Manual

1. Three sessions + silent bump → audit shows progress; WM card updates
2. PR set → appears in PR list
3. Pain yes session → audit shows hold with reason

## Exit criteria

- [ ] Progress surface reachable from Home or Library (one path)
- [ ] PR list from real logged sets
- [ ] Working max list from `strengthState`
- [ ] Audit list read-only with plain-English reason mapping
- [ ] No progression accept/decline UI introduced
- [ ] `pnpm run verify` green

## References

- `2026-08-24-strength-recovery-silent-wire-design.md`
- `packages/strength-engine/src/pr.ts`, `workingMax.ts`
- `apps/mobile/prototype/hybrid-app/strength-adapter.js`
