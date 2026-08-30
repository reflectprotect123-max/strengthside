# In-session autoreg — decision tables (fallback spec)

**Date:** 30 August 2026  
**Implements in:** `packages/strength-engine/src/decideNextSet.ts`, `packages/engine/src/decideNextPhase.ts`  
**Evidence classes:** same as MacroFactor/RP pack — Product fact · Scientific · Hybrid convention · Private/unknown

---

## 1. Strength — `decideNextSet`

**Inputs:** performed load/reps, difficulty slider (6 levels), prescribed reps, target RIR (default 2), equipment, session anchor kg (informational — not mutated here).

**Output:** next load kg, next reps, target RIR, `reasonCodes[]`.

| Difficulty | Reps completed? | Next load | Next reps | Evidence |
|------------|-----------------|-----------|-----------|----------|
| Medium | yes | Hold performed load | Hold prescribed | Hybrid convention — on target |
| Very easy | yes | +smallest equipment step, else hold | +1 if below rep range top | Product fact — Alpha double progression |
| Easy | yes | Hold | Hold | Hybrid convention |
| Hard | yes | −2.5% (rounded down) | Hold | Hybrid convention — aligns with APRE “0 to −5 lb” band at same scale |
| Max | yes | Hold | Hold | Hybrid convention — effort hit, no walk-up mid-session |
| Did not complete | partial | −2.5% (rounded down) | Cap to reps proven | Protocol fact — APRE miss band; Hybrid convention % not lb |
| Did not complete | zero | −5% (rounded down) | Cap to 0 or skip | Hybrid convention — stronger cut |

**Constants (PROVISIONAL — `decideNextSet.ts`):**

```text
CUT_SOFT = 0.025
CUT_HARD = 0.05
BUMP_VERY_EASY = 0.025
DEFAULT_TARGET_RIR = 2
```

**Must not:**

- Use intrasession failed load as intersession anchor (`anchorKgFor` stays post-session only).
- Progress load when difficulty is Hard/Max and athlete missed reps (did not complete only).

**Private/unknown:** Peak slider→kg mapping — do not reverse-engineer.

**Scientific:** RIR/RPE as set-to-set autoreg signal (Helms et al. 2016; Zourdos et al. 2016) — supports slider, not numeric coefficients.

---

## 2. Conditioning — `decideNextPhase`

**When:** end of **work** interval, on rest screen, after RPE/felt captured.  
**Skip intrasession:** `steady`, `free`, recovery sessions.

| Felt vs prescribed effort | Zone compliance | Next work adjustment | Evidence |
|---------------------------|-----------------|----------------------|----------|
| Easier (gap < 0) | any | +3% watts OR +2 bpm HR ceiling (whichever prescribed) | Hybrid convention |
| On target (gap = 0) | met | Hold | Hybrid convention |
| Harder (gap > 0) | met | −5% watts OR −4 bpm HR ceiling | Hybrid convention |
| Harder (gap > 0) | not met | −8% watts AND −4 bpm ceiling | Hybrid convention |
| Stopped / incomplete | — | −1 round or −10% work duration | Hybrid convention |

Uses existing `condEffortGap(effort, felt)` from `packages/engine/src/conditioning.ts`.

**Constants (PROVISIONAL):**

```text
WATTS_EASE_PCT = 0.05
WATTS_PUSH_PCT = 0.03
HR_CEIL_TRIM_BPM = 4
HR_CEIL_BUMP_BPM = 2
```

**Post-session unchanged:** `conAdapt` still uses total zone seconds + session felt.

---

## 3. Coach publish (minimal)

| Domain | Publish today | Add later (optional) |
|--------|---------------|----------------------|
| Strength | sets, reps, kg, rest, superset | `targetRir` default per exercise |
| Conditioning | format, effort, modality, work/rest | nothing required |
| Recovery | duration, effort, modality | nothing required |

---

## 4. Dogfood tuning

All PROVISIONAL constants live at top of engine files. Tests assert **ordering** (hard eases more than medium) not exact kg values after rounding.

---

## 5. Open product calls (owner)

1. Slider on every set vs last set only for WM — **recommend every set** for intrasession; last set still representative for exposure.  
2. Weightlifting second attempt — coach flag `allowAttempts` (defer).  
3. Miss first: load vs reps — **load first** (table above).
