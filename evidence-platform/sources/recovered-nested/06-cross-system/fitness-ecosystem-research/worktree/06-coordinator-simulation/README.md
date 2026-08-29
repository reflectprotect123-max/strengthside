# Phase 06 — Coordinator simulation

Branch: `phase/06-coordinator-simulation`

## Goal

Validate a transparent rules-based arbiter before it publishes schedules.

## Tasks

- freeze proposal/state/plan versions;
- create historical and synthetic fixtures;
- apply hard-first decision order;
- test interference, availability, priority, locks, missed sessions, pain/illness, and stale versions;
- reason-code every outcome;
- run shadow plans against current behavior and record differences;
- define canonical writer and user override semantics.

## Exit criteria

Golden outputs are deterministic, explainable, and accepted by product review. No app independently writes the combined plan.
