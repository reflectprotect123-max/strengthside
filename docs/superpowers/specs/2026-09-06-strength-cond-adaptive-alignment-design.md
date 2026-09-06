# Strength ↔ Cond Adaptive Alignment (+ pace anchors)

**Date:** 2026-09-06  
**Status:** Approved in brainstorm — awaiting human review of this written spec  
**Product surface:** Hybrid HTML athlete app (`apps/mobile/prototype/hybrid-app/`) + `@hybrid/adaptive`  
**Related:** Instrument / workshop / chassis design; session/template sync contract (Phase M)

---

## 0. Goal

Keep **strength** and **conditioning** on the **same adaptive shape** so the app feels like one training partner:

**Open the day → do the work → log what you actually did → say how it felt → Next re-aims remaining work → Close remembers last made.**

Conditioning also gains **Settings race/anchors**, a **band map**, and **WHOOP only for today’s Open** — without a chatty AI coach.

**Success:** A rower interval session and a fan-bike session behave like logging a lift: overriding the real number + RPE changes the **next** piece; Settings anchors do not get rewritten by one bad piece.

---

## 1. One shape (binding)

| Step | Strength (keep) | Cond (align / build) |
| --- | --- | --- |
| Anchor | Last Close / history | Settings **2k** (+ bike **watts** or **RPM** anchor as needed) |
| Day Open | From memory | **Map from anchor × WHOOP** (then Close memory where it already applies) |
| Log | Actual load + reps | Actual **split / watts / RPM** (override OK) |
| Feel | RIR | RPE |
| Next | From **actual + feel** | From **actual + feel** (fix today’s gap: Next must not baseline only on the plan) |
| Close | Remembers last made | Remembers last made (**per modality unit**) |
| Guard | Hold / carry sealed off Next | Recovery skipped; **no silent unit swap** |

HTML opens doors. `@hybrid/adaptive` stays pure (deterministic, receipted). No LLM writes loads or targets.

---

## 2. Settings anchors

- Athlete enters **2k race time** once (rowing report card).
- From 2k, derive `/500m` race split and (when needed) watts via Concept2-style math for **rowing/ski display only**.
- Fan bike needs its own anchor(s) matching the unit the athlete uses in the builder (**watts** and/or **RPM**) — not invented from a universal RPM↔watts formula.
- **Immutability:** logging a hard/failed interval does **not** auto-update Settings anchors. Athlete updates 2k (or bike anchor) deliberately after a real test/race.

### Default band map (from 2k split) — starting point

| Band | Pace vs 2k `/500m` | ≈ % 2k watts | Target HR |
| --- | --- | --- | --- |
| Easy / longer | (bike often; map via bike anchor) | ~55–65% | ~65–75% HRmax |
| Steady | 2k + 20–25s | ~70–75% | ~75–80% |
| Tempo | 2k + 12–15s | ~80–85% | ~80–85% |
| Threshold | 2k + 7–10s | ~88–92% | ~85–90% |
| Intervals / hard | 2k + 0–5s (work) | ~95–105% | ~90–95% (work) |

Numbers may be tuned later; the **rail** is “map from anchor,” not these exact offsets forever.

### WHOOP day Open

| Recovery | Effect on **today’s Open only** |
| --- | --- |
| High | Map as written (optional slight sharpen) |
| Mid | Soften (slower split / lower watts or RPM) |
| Low | Soften more; hard intervals may suggest easier band |

WHOOP does not rewrite Settings.

---

## 3. Builder rules

- **Machine free:** rower **or** fan bike for easy **or** hard (intervals / threshold / tempo included on either).
- **One unit per block — not switchable mid-block:**
  - Rower / ski: **split** XOR **watts**
  - Fan bike: **watts** XOR **RPM**
- No silent convert between units. No “split day, fill watts.” No universal fan-bike RPM↔watts interchange driving Next.

---

## 4. Logger + Next (the alignment fix)

1. Session/task **Open** paints the unit target for today (map × WHOOP / OpenCond memory as designed).
2. Athlete may **override** the logged actual (e.g. plan `2:00`, truth `2:05`).
3. Athlete enters **RPE** (existing Cond Next door after work).
4. After rest, **Next** baselines on **logged actual + RPE** to re-aim **remaining** pieces — same story as strength Next from logged load + RIR.
5. Settings anchors stay put.

Within a session, guesses improve from piece to piece. Across days, **Close** memory improves the next Open for that unit. That is “adaptive” here — not an opaque model.

---

## 5. Out of scope

- Genius / LLM coach that proposes or writes targets directly
- Fake RPM↔watts conversion as adaptive truth
- Auto-updating 2k from routine interval logs
- Capgo / store ship unless explicitly requested
- Rewriting Instrument / workshop / chassis room work except where Cond doors must change

---

## 6. Guard rail (product + engineering)

Ship a short contract mindset (this spec) plus **smokes that fail on drift**, including at least:

- Cond Next input includes **actual** modality value (splitSec / watts / rpm) and RPE; baseline is not plan-only
- Strength and Cond door story remains Open → log → feel → Next → Close
- Builder modality enum / wiring: fan bike supports RPM XOR watts; no silent cross-fill
- Settings anchor fields exist; no logger path writes Settings 2k on interval complete

---

## 7. Delivery order

1. This spec reviewed and approved  
2. Implementation plan (writing-plans):  
   - Fix Cond Next parity (actual + RPE) in `@hybrid/adaptive` + HTML door  
   - Settings 2k / map / WHOOP Open  
   - Builder unit lock + fan-bike RPM\|watts  
   - Smokes for the rail  
3. Human tests the app (Instrument / workshop / chassis already on branch; then this alignment)  
4. Capgo only on explicit ask  

---

## 8. Naming note

Room nickname **Atelier** (French: workshop) was product shorthand for Library + builders. Prefer plain **workshop / Library** in athlete-facing copy. Internal doc titles may keep the old filename for continuity.
