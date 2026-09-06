# Cut Hybrid Strength (Engine + Recovery remain)

**Date:** 2026-09-06  
**Status:** Approved in chat (human 2026-09-06) — awaiting written-spec review before implementation plan  
**Product surface:** Hybrid HTML athlete app (`apps/mobile/prototype/hybrid-app/`) + `@hybrid/adaptive`  
**Approach:** Surgical remove only (Approach 1). No redesign of remaining surfaces.

---

## 0. Goal

Remove **Hybrid Strength** from the athlete product end-to-end: UI, session/template data, and the **lift** side of `@hybrid/adaptive`.

**Remain:** **The Engine** (conditioning) and **Recovery** — unchanged in behavior and IA except where strength doors disappear.

**Out of product:** Strength training is done in TrainHeroic **outside** this app. This app must **not** mention TrainHeroic (silent cut).

**Success:** After upgrade, an athlete cannot open, build, log, or adapt a strength session in Hybrid. Library shows Engine + Recovery only (starters re-seeded). Lift adaptive APIs are gone from the package and bundle. No strength CTAs remain.

---

## 1. Locked decisions

| Topic | Choice |
| --- | --- |
| Park vs cut | **Cut** — delete strength system, not feature-flag hide |
| Adaptive | **Delete lift** Open/Next/Close; **keep** cond paths |
| Existing data | **Nuclear wipe** of stored sessions (all sessions, not strength-only strip) |
| Strength-shaped state | Wipe drafts, strength templates, WM/PR / `strengthState` blobs |
| Library after wipe | **Re-seed Engine + Recovery starters only** |
| TrainHeroic | **Silent** — no link, no copy |
| Remaining UX | **Do not redesign** Engine/Recovery/Home/Calendar/Settings; subtract only |
| Capgo | Not part of the cut unless explicitly requested later |

---

## 2. What gets removed

### 2.1 UI / navigation (HTML)

- Library tab **Hybrid Strength** and all strength library/empty CTAs (“New strength template”, Full Body starters, etc.)
- Strength builder and strength logger entry points (`openAthleteStrengthBuilder`, `openAthleteStrengthLibrary`, strength branches of `builder()` / `train()` / related)
- Home / Calendar doors that only exist to open strength library or strength builder
- Strength progress / WM / PR UI if still reachable
- Default Library tab must not remain `strength` — land on **The Engine** (necessary glue, not a redesign)

### 2.2 HTML logic

- Strength draft create/edit/save paths, strength starters (`buildStarterFullBody*`, strength branches of `ensureStarterTemplates`)
- Calls into lift adaptive (`openLift` / `decideNextLift` / `closeLift` and HTML wrappers)
- Dead strength-only helpers that nothing else references after the cut

### 2.3 `@hybrid/adaptive`

- Delete lift modules and colocated lift tests
- Keep conditioning Open/Next/Close (and recovery-as-Engine usage)
- Rebuild `adaptive-bundle.js` so the athlete shell cannot call deleted lift exports
- No new adaptive features in this work

### 2.4 Strength-only assets / smokes

- Remove or rewrite smokes that assert Hybrid Strength / lift adaptive / blank-slate WM strength behavior
- Delete JS assets **only if** nothing in Engine/Recovery still imports them (e.g. exercise-search / log-columns — verify before delete; do not break cond)

### 2.5 Not removed

- The Engine builder/logger/analytics
- Recovery tab (Engine builder/logger path)
- WHOOP / Concept2 / Echo / HR zone / pace-anchor settings used by Engine
- Shared session chrome needed for conditioning sessions
- Coach park page (already parked; no strength revive)

---

## 3. Upgrade migrate (one shot)

On load, if migrate marker (e.g. `strengthCutV1`) is absent:

1. Clear **all** `sessions` (and active workout / in-progress session pointers)
2. Clear strength drafts and strength templates
3. Clear strength-shaped state (`strengthState`, WM/PR, related meta keys as found in tree)
4. Preserve Engine-needed profile/settings (HR zones, pace anchors, WHOOP link tokens, units as used by cond)
5. Re-seed **Engine + Recovery** starter templates only
6. Persist migrate marker so the wipe does not repeat

**No** undo, export prompt, or soft-delete. Destructive by design.

Idempotent: second launch with marker set is a no-op for this migrate.

---

## 4. Unavoidable glue (not product redesign)

| After removal | Glue |
| --- | --- |
| Strength tab gone | `libraryActiveTab` default → `conditioning` |
| Strength-only onclick targets gone | Delete the controls; do **not** replace with TrainHeroic or new marketing CTAs |
| `builder()` strength fallback | Remove strength workshop path; do not invent a new builder UX — no-op or return to Library Engine tab only as required to avoid a dead screen |
| Adaptive bundle | Cond-only exports; HTML grep-clean of lift API names |

---

## 5. Testing

- Update `library-conditioning` / library tab smokes: Strength tab absent; Engine + Recovery present
- Remove or rewrite strength-builder / lift-adaptive / blank-slate-WM smokes that no longer apply
- Keep Engine routing guards (`close-old-builder-doors` and friends) honest after strength branches disappear
- `pnpm`-level adaptive package tests: lift suites removed; cond suites green
- Manual (post-plan): fresh load → wipe once → Engine/Recovery starters only → no strength door from Home/Library/Calendar

---

## 6. Ship shape

1. Edit canonical HTML + adaptive package  
2. `bash apps/mobile/sync-hybrid-html.sh` (or repo’s current sync script)  
3. Verify / smokes green  
4. Handoff + release notes: product is Engine + Recovery only; strength cut + nuclear migrate  
5. Capgo OTA **only on explicit ask**

---

## 7. Non-goals

- Redesigning Engine, Recovery, Home, or Calendar
- TrainHeroic deep links or copy
- Feature-flag soft park
- Restoring deleted historical engines (`strength-engine`, Big Mac, etc.)
- Cloud/Supabase strength ledger migration beyond local athlete state (local wipe is the contract)
- Cond analytics or adaptive cond feature work

---

## 8. Open implementation details (plan phase)

Resolve during implementation plan / first audit, not by changing this product intent:

- Exact list of HTML symbol names and files to delete (grep pass)
- Exact localStorage / state keys covered by the wipe
- Whether exercise-search / log-columns remain referenced by any non-strength path
- Cache / `LOCAL_BUILD` bump policy when the cut ships
