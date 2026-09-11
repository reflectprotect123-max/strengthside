# Strength track lock (TrainHeroic clips, 11 Sep 2026)

**Status:** LOCKED — owner freeze. Do not add/remove columns without an explicit add/delete from the owner.

**Sources:** Library builder pickers + calendar → Training logger clip
`Screen_Recording_20260911_101146_TrainHeroic_2aed.mp4`.

This is the Strength **log column** catalog. Watts / metres on a lift is a
column on a Strength template. It is **not** The Engine product (splits,
Concept2, RPM). Do not mix those loggers.

---

## Always on the lift grid (not a picker option)

| Track | Role |
| --- | --- |
| Sets | Row count. `−` / `+` Set. Checkmark per row when logged. |
| Rest timer | Athlete-started (`Select Timer`). Does not auto-start from logging a set. |
| Exercise / circuit note | Optional text on the logger page. |
| Session instructions | First pager page after Start Session (`Got It`). |

---

## Track modes (one per block)

| Mode | Logger |
| --- | --- |
| **Measured** | 1–2 picker columns besides Sets (TrainHeroic: first defaults Reps, second optional). |
| **For Completion** | Warm-up / cooldown / circuit. Instructions + **Mark As Completed**. No number grid. |

---

## Picker columns — Strength tracks these

Exact labels from the TrainHeroic “What do you want to track?” sheet.

| # | Label | Notes |
| --- | --- | --- |
| 1 | None | Second column empty. Not a stored metric. |
| 2 | Reps | Default first column. |
| 3 | Rep Range | Min–max (e.g. 8–12). |
| 4 | Weight (lb) | Unit option. Dogfood default is kg. |
| 5 | Weight (kg) | Default load. |
| 6 | Weight (%) | % of working max. |
| 7 | Linear Weight Progression | Maps to existing LWP delta, not a new mystery unit. |
| 8 | Time (mm:ss) | Clock duration. |
| 9 | Seconds | Integer duration. |
| 10 | Miles | Distance. |
| 11 | Yards | Distance. |
| 12 | Meters | Distance. Confirmed on custom exercise (Reps + Meters). |
| 13 | Feet | Distance. |
| 14 | Watts | Strength **column**, not Engine. |
| 15 | RPE | Per-set effort. |
| 16 | Calories | |
| 17 | Inches | Once (TrainHeroic listed it twice — we do not). |
| 18 | Velocity (m/s) | Optional device field. Never infer from reps. |
| 19 | Other | Custom named column. |

---

## Shown on the logger, not extra picker rows

| Surface | Lock |
| --- | --- |
| Working max | Display + drill-in. Not a log column. |
| Last | Last logged prescription (e.g. `5 × 3 @ 80… kg`, `3 × 6 @ 65 RPE`). |
| Session header totals | TrainHeroic showed `REPS` + `KG` session sums. Hybrid sums whatever columns the template actually uses. |
| PR | Optional later. Not required to ship tracking. |

---

## Calendar door (this clip)

1. Library → Sessions → template **Add**.
2. **Add to Calendar** → date + **self only** (no other athletes, no Teams).
3. Training day shows the template + **Start Session**.
4. Pager: Coach Instructions → For Completion blocks → measured lifts → Done Training (or Add Exercise).

---

## Out of Strength tracking (TrainHeroic chrome we do not copy)

- Leaderboard / GOAL PRO / “verify profile to see comparisons”
- Assigning a template to another athlete or a team
- Chat tab
- Duplicate Inches row
- Filter Teams

---

## Existing code vs this lock

`apps/coach/log-columns.js` `KINDS` is a **subset** (reps, range, kg, % WM, LWP, seconds, metres).

When Library / logger work starts, expand `KINDS` to this lock. Do not ship a picker that offers anything else.
