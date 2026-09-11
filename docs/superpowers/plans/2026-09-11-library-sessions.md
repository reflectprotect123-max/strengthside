# Library Sessions Implementation Plan

> **For agentic workers:** Tasks are tightly coupled in `apps/athlete/`. Execute in this session; do not split across subagents.

**Goal:** Athlete Library Sessions: create a template, pick/create lifts and circuits, assign to a day, run it in the existing logger.

**Architecture:** Pure `library.js` compiles templates into the Training plan shape. `session.js` groups 2+ numbered lifts (B1/B2/B3) onto one logger page. OLED chrome stays Training/logger tokens.

**Tech Stack:** Vanilla HTML/CSS/JS in `apps/athlete/`, `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-11-strength-track-lock.md`

## Global Constraints

- No Chat tab. Coach stays under +.
- Do not touch Home OLED WHOOP dials.
- Capgo only if owner marks IMPORTANT — skip OTA.
- Persist on-device (`THE-brain-v1`). No other athletes/teams/leaderboards.
- Watts/metres are Strength columns, not Engine.

---

## Tasks

1. TDD `HybridLibrary` (templates, catalog, letters, calendar compile).
2. TDD session grouping for 3-lift supersets.
3. Library OLED UI (list, editor, picker, create sheets, calendar assign).
4. Wire Training `planForDate` + coach notes + logger columns from the track lock.
5. Smoke/SW/index, browser walkthrough.
