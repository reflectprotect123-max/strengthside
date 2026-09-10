# In-session logger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full-screen Hybrid Athlete logger overlay that walks Heavy Lower A→Done (9 pages) with pad logging; rest timer stays inert.

**Architecture:** Pure `session.js` (no DOM) owns phases, pages, sets, totals. `logger.js` + `logger.css` paint the overlay. `app.js` starts/resumes/exits; Home HTML is unchanged.

**Tech Stack:** Vanilla JS in `apps/athlete/`, `node:test` for `session.test.js`, athlete smoke checks.

**Spec:** `docs/superpowers/specs/2026-09-10-in-session-logger-design.md`

## Global Constraints

- Do not modify Home (`trainingHomeHtml` / WHOOP dials).
- Do not redesign the Training list layout beyond Start Session + tap-in.
- Play button is inert (rest-timer subsystem later).
- Hybrid/HPP marks, not TrainHeroic trademarks.
- `THE-brain-v1` localStorage; persist `S.session`.
- No `--passWithNoTests`. Wire `session.test.js` into `check:athlete-app`.

## File map

- Create: `apps/athlete/session.js`
- Create: `apps/athlete/session.test.js`
- Create: `apps/athlete/logger.js`
- Create: `apps/athlete/logger.css`
- Modify: `apps/athlete/index.html` (css + scripts + `#logger`)
- Modify: `apps/athlete/app.js` (Start Session, tap-in, hide FAB when logger open)
- Modify: `apps/athlete/checks/athlete-app.smoke.mjs`
- Modify: `package.json` `check:athlete-app` to run `session.test.js`

---

### Task 1: Session model (pages, phases, complete, kg log, totals)

**Files:**
- Create: `apps/athlete/session.js`
- Create: `apps/athlete/session.test.js`
- Modify: `package.json` (add `node --test apps/athlete/session.test.js` to `check:athlete-app`)

**Produces:** `HybridSession.pagesFromPlan`, `startSession`, `ackQuote`, `ackCoach`, `nextPage`, `prevPage`, `goToLetter`, `completeCurrent`, `logSet`, `totals`, `setWorkingMax`, `setFeel`, `finishToSummary`

- [ ] Write failing tests in `session.test.js` using `node:test` and `assert`.
- [ ] Run `node --test apps/athlete/session.test.js` — FAIL (module missing).
- [ ] Implement `session.js` as a script that assigns `globalThis.HybridSession` and `module.exports` when present.
- [ ] Re-run tests — PASS.
- [ ] Commit.

`pagesFromPlan(plan)` skips `kind === 'section'`, maps warmup/recovery → `{ logMode: 'complete' }`, lifts with `MAX` in prescription → `max`, letters matching `/^F\d/i` → `reps`, else `kg`. Appends `{ logMode: 'doneHub', id: 'done' }`. Parse `6 x 3` → `sets: 6, reps: 3`. Empty set rows: `{ reps, kg: null, logged: false, miss: false }`.

---

### Task 2: Overlay chrome — quote, coach, pager, complete, inert play

**Files:** `logger.js`, `logger.css`, `index.html`, `app.js`

- [ ] `#logger.hidden` host, `logger.css` linked, `session.js` then `logger.js` before `app.js`.
- [ ] Start Session sticky on Training list; tap lift/warmup/recovery calls `Logger.open({ date, letter })`.
- [ ] Phases: quote → coach → block. Chevron closes overlay, keeps `S.session`. Hide nav + FAB while open.
- [ ] Complete pages: Mark As Completed. Next/Back. Dots. Inert play.
- [ ] Smoke: `function startSession`, `#logger`, `logger.css`; Home still has `ath-whoop-dials`.
- [ ] Commit.

---

### Task 3: Kg / reps / MAX pad, C–E, F1/F2, Working Max, Goal Pro

- [ ] Custom pad (Kg/Lb, Log, Autofill, Miss). Circle logs. Header totals.
- [x] F1 and F2 stacked on one pager page (reps-only above MAX). Next from F goes to G.
- [ ] Working Max sheet (HPP, Save). Goal Pro sheet (HPP, dismiss).
- [ ] Commit.

---

### Task 4: Done hub, feel, summary

- [ ] Last pager page: HPP mark, Done Training, Add Exercise (alert ok).
- [ ] Feel: intensity 1–5, duration minutes, note, Finish Session.
- [ ] Summary cards then close overlay.
- [ ] Manual browser walk A→Done; Home unchanged.
- [ ] Commit.

Rest timer is not in this plan.
