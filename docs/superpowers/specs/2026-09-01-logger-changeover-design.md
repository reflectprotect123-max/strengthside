# Logger changeover — design spec (mockup authority)

**Date:** 1 September 2026  
**Status:** Draft — owner sign-off before Phase 1 ships  
**Plan:** `docs/superpowers/plans/2026-09-01-engine-strength-logger-changeover.md`  
**Visual reference:** ONE-SET LOGGER · THE HYBRID · Aug 2024; THE ENGINE interval/steady/recap boards

## Owner sign-off

- [ ] Strength screens (4) accepted
- [ ] Engine screens (4) accepted
- [ ] Shared chrome + rest overlay accepted
- [ ] Phase 1 may start

## Global design rules

| Rule | Value |
| --- | --- |
| Background | `#0a0c0e` |
| Strength accent | copper `#d4a574` / `#b68a50` |
| Engine accent | teal `#5ec4b4` |
| Tap minimum | 44px |
| Motion | reduced-motion safe; no required animation |
| Active session | logging + feedback only — no swap/history/video |
| Autoreg | silent apply; slider/throttle only |

**Acceptance artifacts:** `/opt/cursor/artifacts/<phase>-<screen>.png` (e.g. `strength-active-hero.png`, `engine-work-phase.png`).

---

# Hybrid Strength — four screens

## S1 — Active log · one set

**State:** athlete on working set *i* of *n*; ghost rows for done/upcoming visible.

```
┌─────────────────────────────────────┐
│ THE HYBRID · STRENGTH · WEEK 2/5    │  session chrome
│ Barbell Back Squat · Set 2 / 4      │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ TAP TO EDIT                     │ │
│ │      100 KG × 5 REPS            │ │  hero card
│ │ Target: RIR 2 — next adjusts    │ │
│ └─────────────────────────────────┘ │
│ [ghost set 1 done] [ghost set 3+]   │
│ How hard was that set? [slider]     │
│ Prescribed RIR 2. Slide if easier…  │
│ [ Next set          ] primary block │
│ [ + Extra set       ] secondary     │
└─────────────────────────────────────┘
```

**Copy strings:**
- Eyebrow: `THE HYBRID · STRENGTH · WEEK {n}`
- Hero hint: `TAP TO EDIT`
- Target line: `Target: RIR {n} — next set adjusts from slider`
- Slider labels: Very easy · Easy · On target · Hard · Max · Couldn't finish
- Guardrail: `Prescribed RIR {n}. Slide if it felt easier or harder — Next updates set {m} load.`

**Transitions:** Next set → S2 (rest) if more sets; else complete exercise.

**Not in v1:** video, exercise swap, history chart on active screen.

---

## S2 — Rest overlay · full screen

**State:** between sets; blocks underlying logger.

```
┌─────────────────────────────────────┐
│ REST · BETWEEN SETS                 │
│ Barbell Back Squat                  │
│ Set 2 logged · 100 kg × 5           │
│        ╭───────────╮                │
│        │  1:24      │  circular ring │
│        │ REMAINING  │                │
│        ╰───────────╯                │
│ Up next: Set 3 / 4                  │
│ 100 kg × 5 · RIR 2                  │
│ [ +30s ]    [ Skip rest ]           │
└─────────────────────────────────────┘
```

**Transitions:** Skip rest → S1 set *i+1*; timer expiry → same.

**Not in v1:** coach cue block (optional later).

---

## S3 — Superset · partner rest edge

**State:** superset round; shorter rest between partners.

**Badge:** `A2 ↔ B2 · {n}s between partners`  
**Adjustment line:** `Adjusted −2.5 kg after hard bench set` (when engine suggests)  
**Next label:** `Next · {m}:00 after round`

**Not in v1:** separate timer per edge type in builder publish (use exercise rest until graph lands).

---

## S4 — Missed reps · WL attempt

**State:** slider at Couldn't finish; partial reps logged.

**Hero:** `DID NOT COMPLETE — LOG REPS DONE`  
**Input:** reps done (prominent)  
**Engine copy:** `Next set capped at {n} reps — load unchanged`  
**Buttons:** `Log attempt · try again` (salmon) · `Next set · lower target` (copper)

---

# The Engine — four screens

## E1 — Work phase · live targets

```
┌─────────────────────────────────────┐
│ THE ENGINE · INTERVALS · ROW        │
│ WORK 3/8                            │
│ Row ERG · 4×4:00 / 3:00 Medium      │
│           2:16                      │  work countdown
│ 152W    1:58/500m    Zone 3         │
│      ╭─── 147 ───╮   HR ring        │
│ On target · Strap live · in zone 12s│
│ [Set 2 felt too hard — set 3 −8W]   │  toast
│ [ End interval early ]              │
└─────────────────────────────────────┘
```

---

## E2 — Rest · RPE slider overlay

**Summary:** `Interval 3 done · 152W avg · HR 151`  
**Timer:** circular `2:41 REST REMAINING`  
**Slider:** `How hard was that interval?` Easy → Max/Stopped  
**Up next:** `Work 4/8` + targets + delta badge  
**Primary:** `Skip · start work 4`

---

## E3 — Steady-state

**Header:** `STEADY · BIKE · ZONE 2`  
**Timer:** session countdown + conversational pace copy  
**Targets:** HR band · Zone label · RPE target  
**Finish:** `Finish · rate session`

---

## E4 — Session recap

**Stats card:** time in zone % · avg HR · intervals completed · session RPE  
**Progression box:** `Next session: Level N · +1 round OR +5s work (you earned it)`  
**Slider:** Overall session feel  
**Save:** `Save · update progression`

---

# Shared components (Phase 0)

## Session chrome

`SessionChrome.render({ product, title, subtitle, weekLabel, elapsedSec })`

- Strength: copper eyebrow `THE HYBRID`
- Engine: teal eyebrow `THE ENGINE`
- Right: session elapsed `MM:SS`

## Rest overlay

`RestOverlay.render({ mode, remainingSec, summaryHtml, upNextHtml, visible })`

- Full-screen fixed layer `z-index: 50`
- Circular ring + `#restOverlayClock`
- Buttons: +30s · Skip rest / Skip · start work N
- Hidden by default in Phase 0 (`visible: false`)

---

# State machines (summary)

| Engine | States |
| --- | --- |
| Strength | active → rest → active → … → complete |
| Strength edge | missed-rep · superset-partner |
| Engine interval | work → rest → work → … → recap |
| Engine steady | steady → recap |

**Capstone (Phase 9):** hybrid session chains strength nodes and cond nodes with shared chrome + timer.
