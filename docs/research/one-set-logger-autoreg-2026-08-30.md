# One-set logger & intrasession autoreg — industry research pack

**Research date:** 30 August 2026  
**Purpose:** document what other products do for Peak Strength–style one-set logging, RPE/RIR feedback, missed-rep handling, supersets/rest, and set-to-set vs session-to-session adaptation — then translate into design constraints for the Hybrid HTML athlete logger and `@hybrid/strength-engine`.

**Scope:** athlete-facing strength loggers and algorithmic coaches. Coach-only platforms (TrainHeroic) included where prescription vs actual logging differs from autoreg apps.

---

## 1. Executive summary

The market splits into **three logger archetypes**, not one “best” pattern:

| Archetype | Examples | In-session autoreg? | Primary UX |
|-----------|----------|---------------------|------------|
| **Fast multi-row logger** | Strong, Hevy, Boostcamp, Setgraph | Mostly no — prefill previous, manual edit | All sets visible; rest auto-starts after log |
| **Coach-prescribed table** | TrainHeroic | No — athlete logs vs prescription; coach sees deltas | Table/checkboxes; session RPE at end |
| **Algorithm-driven suggestions** | Peak, JuggernautAI, Volt Cortex, Alpha Progression, RP Hypertrophy, Hevy Trainer, Fitbod | Yes for Peak/Juggernaut/Volt; mostly **between sessions** for AP/RP/Hevy/Fitbod | One focus screen or guided flow; engine owns next target |

**Closest reference to the Hybrid redesign direction:** **Peak Strength** — one active set, big weight/reps, difficulty slider (including “Did not complete”), instant “Log set” → next set, built-in rest, preview mode for video/history/swap **before** Start (stripped from active log).

**Architectural lesson repeated everywhere credible:** separate **intrasession** (“what should the *next set* be, given what just happened?”) from **intersession** (“what should the *next workout* be?”). Hybrid already has intersession in `decideProgression`; it does **not** yet have intrasession `decideNextSet`.

---

## 2. Evidence classes

Same convention as `docs/research/strength-macrofactor-rp-2026-08-25/`:

- **Product fact** — documented in official help, marketing, or changelog.
- **Scientific / protocol fact** — APRE tables, RIR/RPE literature.
- **Hybrid design convention** — explicit choice for this repo where products do not disclose algorithms.
- **Private / unknown** — production coefficients (Peak’s exact % drops, Juggernaut’s RPE→load mapping).

---

## 3. UX archetypes in detail

### 3.1 Fast multi-row logger (Strong, Hevy, Boostcamp)

**Screen model:** exercise block shows **all sets at once** (or swipe between sets on watch). Athlete taps weight/reps, marks complete, rest timer fires.

**Strong** ([supersets help](https://help.strongapp.io/article/98-supersets-and-circuits), [rest timer](https://help.strongapp.io/article/231-rest-timer)):

- Default rest **2:00**, starts **automatically** after completing a set; expandable full-screen timer with Skip.
- Per-exercise rest defaults; separate warm-up vs working rest.
- Superset: vertical grouping; **Next** cycles **A1→B1→A2→B2** (not all A then all B).
- **No** engine adjusts next set weight from RPE — athlete edits manually; previous session values prefilled.
- User-requested gap: **per-transition rest** in supersets (shorter between partners, longer after round) — timers are per-exercise, not per-edge in the graph ([App Store reviews](https://appsupports.co/464254577/strong-workout-tracker-gym-log/positive-reviews)).

**Hevy / Boostcamp** ([Hevy Trainer](https://www.hevyapp.com/features/workout-plan-generator/), [Boostcamp tracker](https://www.boostcamp.app/workout-tracker)):

- Tap set → log reps → grey check → **rest auto-starts**.
- RPE/RIR fields optional; supersets, drop sets, warmups in editor.
- **Hevy Trainer:** weight increases **between sessions** when athlete hits **top of rep range on all prescribed sets** — not mid-workout slider autoreg.
- Boostcamp mentions “auto-progression” for **next session** weight prefill, not published intrasession rules.

**Takeaway for Hybrid:** this archetype optimizes **speed and manual control**. Good for experienced lifters who self-regulate. Poor fit if product promise is “engine tells you next load from effort feedback.”

### 3.2 Coach-prescribed table (TrainHeroic)

**Screen model:** coach-built session with text/video; athlete fills **table cells** per set or checks off rows.

**TrainHeroic** ([logging](https://support.trainheroic.com/hc/en-us/articles/18156631592589-Logging-your-Training-Session), [modifications](https://support.trainheroic.com/hc/en-us/articles/18156760246029-For-Coaches-How-can-athletes-adjust-or-modify-their-training-sessions)):

- Athlete can swap exercises, add sets, edit prescriptions; coach sees **prescribed struck through**, actual below; blocks green/yellow/red.
- **Cannot delete** coach-prescribed sets — leave blank if missed.
- **Session-level RPE slider** at finish (feeds Athlete Pro heatmaps — [Training Load](https://support.trainheroic.com/hc/en-us/articles/42680203186829-Athlete-Pro-Heatmaps)), not per-set difficulty driving next set in-app.
- Superset rest typically **in coach notes**, not a first-class timer edge type.

**Takeaway for Hybrid:** coach owns prescription snapshot; athlete owns actuals; **diff is the product**. Autoreg, if any, is coach brain + offline review — not athlete slider mid-set.

### 3.3 Algorithm-driven (Peak, JuggernautAI, Volt, AP, RP, Fitbod)

**Screen model:** one primary action per set — log effort, engine updates **next target** (same session and/or future sessions).

See §4 for product specifics.

---

## 4. Product deep dives

### 4.1 Peak Strength — closest UX reference

**Sources:** [update log](https://www.garagestrength.com/pages/peak-strength-update-log), [Est. 1RM help](https://intercom.help/peak-strength/en/articles/15656862-what-s-the-difference-between-an-est-1-rep-max-and-a-1-rep-max), [App Store](https://apps.apple.com/us/app/peak-strength/id1632549195)

| Dimension | What Peak does |
|-----------|----------------|
| **Active log screen** | One set focus; tap weight/reps to edit; **Log set** advances instantly |
| **Difficulty slider** | 6 levels: Very Easy → Easy → Medium → Hard → Max Effort → **Did not complete**; tooltip maps to RPE/RIR |
| **Slider semantics (2024+)** | Shows **how hard set should feel**; athlete reports **how hard it actually was** |
| **Missed reps** | Select Did not complete → enter reps achieved; app **won’t suggest more reps than proven** on next set; WL: **Missed Rep** → Log **Attempt** → second try; dots for made/missed attempts; after two misses, **next set lower weight** |
| **Rest** | Built-in rest timer; notification when complete |
| **Preview vs active** | **Preview** (before Start): swap, history, videos, starting weights. **Active workout:** logging + feedback only |
| **Est. 1RM** | From recent sets: weight, reps, **difficulty effort**, variation; drives **future** weight suggestions; separate from Rep Max PR badges |
| **Published load math** | **Private** — no public % tables for slider positions |

**Hybrid alignment:** matches owner direction (strip video/history/swap from active log; one-set screen; slider as throttle; rest overlay after Next).

### 4.2 JuggernautAI — explicit intrasession + readiness stack

**Sources:** [individualization help](https://help.jtsstrength.com/en/articles/3-how-juggernautai-is-individualized-to-you), [guided warmups blog](https://www.juggernautai.app/blog/optimizing-your-warmups)

| Layer | Adjustment |
|-------|----------------|
| Pre-session | Readiness questionnaire → volume/weight for the day |
| **Intra-session** | Top set + back-off **RPE** → **real-time** tweaks to remaining sets |
| Warmups | Guided warmup asks “how did that feel?” → may move day’s target (e.g. 190 → 192.5 kg) |
| Post-session | Check-in → readiness score for future sessions |

**Takeaway:** separates **warmup feedback**, **working-set RPE**, and **multi-session readiness** — three inputs, one pipeline. Hybrid should not collapse these into a single slider without deciding which gate each feeds.

### 4.3 Volt Cortex Smart Sets — RPE vs expected RPE → e1RM

**Sources:** [Smart Sets](https://help.voltathletics.com/how-do-smart-sets-work), [e1RM changes](https://help.voltathletics.com/what-causes-an-e1rm-to-go-up-or-down-coaches)

- After loaded sets: **“How hard was that set?”** (7-point RPE).
- Cortex compares actual RPE to **expected RPE from Prilepin relative-intensity chart** for that load×reps.
- Mismatch → adjust **e1RM** → **next set’s prescribed load** changes.
- **Product fact:** autoreg = athlete can diverge from original prescription based on feel; Volt claims better long-term gains from this ([coach FAQ](https://help.voltathletics.com/what-causes-an-e1rm-to-go-up-or-down-coaches)).

**Takeaway:** transparent **mechanism** (expected vs actual → e1RM delta) even if coefficients are private. Good pattern for a **testable** `decideNextSet` in strength-engine.

### 4.4 Alpha Progression — RIR + double progression, mostly intersession

**Sources:** [double progression glossary](https://alphaprogression.com/en/glossary/double-progression), [marketing](https://alphaprogression.com/en)

- **Per-set** weight/rep/**RIR targets** shown every set.
- After log + RIR → e1RM estimate → **next session** suggestion (double progression: hit top of rep range → add weight next time).
- Large vs small **equipment steps** → wider rep ranges on dumbbell lifts vs fixed rep count on leg press.
- **No published** same-day walk-down from missed reps on set 2 affecting set 3 in the same workout (intrasession = athlete manual).

### 4.5 RP Hypertrophy — mesocycle volume loop, not set screen

**Sources:** [weight/reps/sets FAQ](https://help.rpstrength.com/hc/en-us/articles/32600173777815-How-does-the-app-determine-when-to-add-weight-reps-and-sets), [missed RIR](https://hypertrophy.zendesk.com/hc/en-us/articles/13516072516375-What-if-I-miss-my-target-RIR-in-week-1)

- Weight +few%/week; awkward dumbbell jumps → **add a rep** instead.
- **Volume** from post-workout surveys: pump, soreness, workload perception.
- Miss RIR / rep range → algorithms adjust **future** sessions; flags for underperformance.
- **Hybrid already studied** in `docs/research/strength-macrofactor-rp-2026-08-25/` as the **second loop** (weekly volume), not the intrasession logger.

### 4.6 Hevy Trainer — session-end progression rule

**Sources:** [Trainer feature page](https://www.hevyapp.com/features/workout-plan-generator/)

- Progression when **all sets hit top of rep range** at a weight → increase next session.
- In-workout: manual overrides; optional RPE toggle.
- Launched Feb 2026 as algorithmic layer on top of fast logger UX.

### 4.7 Fitbod — RiR shapes future workouts, not current

**Sources:** [RiR help](https://help.fitbod.me/hc/en-us/articles/360033133174-Reps-in-Reserve-RiR-Formerly-Exertion-Rating-RPE)

- RiR logged per exercise; adjusts **future** weight/reps.
- **Explicit gap:** superset RiR treated as if exercise was fresh — **no** intrasession fatigue adjustment for partner exercise.
- Too hard/easy → athlete **manually** edits during workout.

### 4.8 MacroFactor Workouts (context)

Already documented in-repo: Smart Progression updates **recommendations** after logged workouts; program structure stable unless user edits. Same **snapshot vs recommendation** split Hybrid should keep.

---

## 5. Missed reps & failure — how others handle it

| System | Trigger | Same-session response | Next-session response |
|--------|---------|----------------------|------------------------|
| **Peak** | Did not complete / Missed Rep | Enter reps done; cap next-set reps; WL second attempt; then lower weight | Est. 1RM from effort + reps; remember performance |
| **APRE 6** (protocol) | Reps on set 3 below band | Set 4: **−5 to −10 lb** (0–2 reps) down to **+10–15 lb** (13+ reps) | Set 4 reps → **next session start load** via same table |
| **Volt Cortex** | RPE >> expected | Lower e1RM → lighter next set | Continues in later sessions via Smart Sets |
| **Hevy Trainer** | Below rep range on a set | Manual | No auto increase until all sets hit top of range |
| **Hybrid today** (`progression.ts`) | `missed` exposure class | **None in HTML app** | **−5% deload** after ≥2 missed in last 3 **sessions**; `anchorKgFor` ignores intrasession walk-down weight |

**APRE adjustment table (APRE 6, set 3 → set 4)** — protocol fact ([Training & Conditioning](https://training-conditioning.com/article/understanding-apre-part-1/)):

| Reps on set 3 | Set 4 load change |
|---------------|-------------------|
| 0–2 | −5 to −10 lb |
| 3–4 | −0 to −5 lb |
| 5–7 | No change |
| 8–12 | +5 to +10 lb |
| 13+ | +10 to −15 lb |

**Hybrid design convention (proposal, not implemented):** intrasession miss → **load drop first** (rounded to equipment), rep target capped to proven reps; intersession deload still uses `anchorKgFor` on last **successful** exposure, not failed intrasession weight.

---

## 6. Supersets, rest, and navigation

| App | Navigation | Rest behavior | Configurable rest edges |
|-----|------------|---------------|-------------------------|
| **Strong** | Next → next set in superset order | Auto after each log; per-exercise default | **No** — users want shorter between partners ([reviews](https://appsupports.co/464254577/strong-workout-tracker-gym-log/positive-reviews)) |
| **Peak** | Log set → next (complexes: per-exercise reps) | Built-in timer + notification | Not published as coach-facing edge types |
| **Boostcamp** | Alternate grouped exercises | Auto on log | Editor: rest per exercise in program |
| **TrainHeroic** | Table per exercise | Coach text | Coach prose |
| **Fitbod** | Superset grouping | Standard timer | RiR ignores partner fatigue (product fact) |

**Hybrid design convention:** model superset rest as a **transition graph**, not one `restSec` per block:

```text
A1 ──restPartner──► B1 ──restRound──► A2 ──restPartner──► B2 ──restRound──► …
```

Coach builder publishes edge durations; logger state machine walks edges after Next.

---

## 7. RPE / RIR / slider — semantics matrix

| Product | Input | When | Drives |
|---------|-------|------|--------|
| Peak | 6-level difficulty (+ did not complete) | Every set | Next set targets + Est. 1RM |
| JuggernautAI | RPE | Warmups + working sets | Same-day remaining sets |
| Volt | 7-point RPE | Selected sets | e1RM → next set load |
| Alpha Progression | RIR | Every set (premium) | Next **session** |
| Strong/Hevy | Optional RPE/RIR | Per set | Analytics / future (Hevy Trainer) |
| TrainHeroic | Session RPE 0–10 | End of session | Heatmap / coach review |
| Hybrid today | RIR on **last set only** | Last planned set | `decideProgression` next session |

**Open product decisions for Hybrid:**

1. Slider **every set** vs **last set only** for WM/e1RM (Peak: every set; Hybrid today: last only).
2. Slider = **prescribed difficulty band** (“should feel RIR 2”) vs **reported only** (Peak 2024: both — show target, collect actual).
3. Missed reps: **load drop** vs **rep drop** vs **both** first.

---

## 8. Comparison matrix (at a glance)

| App | One-set focus UI | In-session autoreg | Missed-rep handling | Rest overlay | Active log stripped |
|-----|------------------|--------------------|---------------------|--------------|---------------------|
| Peak Strength | Yes | Yes (slider) | Did not complete + WL attempts | Yes | Yes (preview only) |
| JuggernautAI | Guided | Yes (RPE) | Not detailed publicly | Yes | N/A |
| Volt Cortex | Set flow | Yes (RPE vs expected) | Via e1RM down | Yes | N/A |
| Alpha Progression | Multi-set list | Manual | Next session adjust | Timer | No |
| Hevy / Strong | Multi-row | Manual | Manual | Auto timer | No |
| TrainHeroic | Table | No | Blank / coach sees miss | Coach-defined | No |
| RP Hypertrophy | Session list | No (weekly AI) | Flags + adjust later | Timer | No |
| Fitbod | List | Manual | Manual + future RiR | Timer | No |
| **Hybrid today** | Multi-row | **No** | Inter-session deload only | Partial | No |

---

## 9. Implications for `@hybrid/strength-engine` and HTML logger

### 9.1 Two clocks (required split)

```text
decideNextSet(performedSet, ctx)     → next set reps/kg/RIR band  (NEW — intrasession)
decideProgression(exposures, ctx)    → next session action         (EXISTS — intersession)
```

`anchorKgFor` in `progression.ts` already documents why intrasession failures must not poison intersession deload anchors.

### 9.2 Logger = state machine, engine = pure functions

Industry pattern: UI holds **cursor** (exercise, set index, superset leg, rest phase); engine returns **immutable suggestion** for next node. Peak’s “Log set instant” implies suggestions are **precomputed** or cheaply synchronous.

### 9.3 Coach publish contract

Coach grid can stay; **publish** should emit:

- Set ordinals with **effort bands** (target RIR/RPE range), not frozen kg for all sets.
- Superset **graph** with `restPartnerSec` / `restRoundSec`.
- Static fallback loads where coach pins absolute weight (percentage or kg).

### 9.4 What not to copy blindly

- **Fitbod superset RiR bug class** — if Hybrid adds intrasession autoreg, superset partner order must feed fatigue into `decideNextSet`.
- **Strong’s per-exercise-only rest** — athletes explicitly want partner vs round rest; build edges once.
- **Peak offline/latency complaints** — next-set suggestion should compute **locally** from engine; no round-trip for Log set.

---

## 10. Suggested `decideNextSet` decision table (Hybrid convention — draft)

Not implemented; starting point for tests:

| Event | Next-set action |
|-------|-----------------|
| Hit reps, difficulty = on-target | Hold or micro-progress load per periodization slot |
| Hit reps, difficulty = very easy | +reps toward top of range, or +smallest load step |
| Hit reps, difficulty = max effort | Hold load; optionally −reps if next set same exercise |
| Did not complete | Cap reps at proven; **−2.5% to −5% load** (equipment-rounded); no second attempt unless coach flag (WL) |
| Pain blocked (Hybrid exposure) | **No progression credit**; suggest regression or skip (engine classifies only — no stop) |

Coefficients are **Hybrid design convention** until validated against dogfood.

---

## 11. Source index

### Peak Strength
- Update log: https://www.garagestrength.com/pages/peak-strength-update-log  
- Est. 1RM vs Rep Max: https://intercom.help/peak-strength/en/articles/15656862  
- Progress update: https://intercom.help/peak-strength/en/articles/15668645  

### JuggernautAI
- Individualization: https://help.jtsstrength.com/en/articles/3-how-juggernautai-is-individualized-to-you  
- Guided warmups: https://www.juggernautai.app/blog/optimizing-your-warmups  

### Volt
- Smart Sets: https://help.voltathletics.com/how-do-smart-sets-work  
- e1RM adjustments: https://help.voltathletics.com/what-causes-an-e1rm-to-go-up-or-down-coaches  

### Loggers
- Strong supersets: https://help.strongapp.io/article/98-supersets-and-circuits  
- Strong rest timer: https://help.strongapp.io/article/231-rest-timer  
- Hevy Trainer: https://www.hevyapp.com/features/workout-plan-generator/  
- Boostcamp tracker: https://www.boostcamp.app/workout-tracker  
- Alpha Progression progression glossary: https://alphaprogression.com/en/glossary/double-progression  
- Fitbod RiR: https://help.fitbod.me/hc/en-us/articles/360033133174  
- TrainHeroic logging & modifications: https://support.trainheroic.com/hc/en-us/articles/18156631592589  
- RP progression FAQ: https://help.rpstrength.com/hc/en-us/articles/32600173777815  

### Protocol
- APRE overview: https://training-conditioning.com/article/understanding-apre-part-1/  

### In-repo
- `packages/strength-engine/src/progression.ts` — intersession `decideProgression`, `anchorKgFor`  
- `docs/research/strength-macrofactor-rp-2026-08-25/` — MacroFactor + RP intersession loops  
- `apps/mobile/prototype/hybrid-app/index.html` — current `strengthTask` multi-row logger  

---

## 12. Next steps (implementation — out of scope for this doc)

1. Product call on §7 open decisions.  
2. Spec + colocated tests for `decideNextSet` in `@hybrid/strength-engine`.  
3. Replace `strengthTask` / `supersetTask` with one-set-screen state machine + rest overlay.  
4. Extend coach publish schema for superset rest edges and effort bands.  
