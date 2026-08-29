# Supplied project context and confidence labels

This document captures the plan and prior handoff context supplied in the conversation. It is not an independent audit of the application source. The real repository was not available in this workspace, so Claude’s first task is to verify these statements against `the-hybrid-engine1`.

## Product boundary supplied by the product owner

- Strength and Conditioning are intended to become two genuinely separate apps.
- Each app should have its own build and store listing.
- They share only explicit shared-core contracts and, eventually, Coordinator output.
- Nutrition/MacroTrack is a separate product and is out of implementation scope here.
- The goal is a full fitness ecosystem, not a single fused app with hidden cross-domain logic.

## Existing-system claims supplied in the plan

These are `provided`, not `verified` here:

| Claim | Why it matters | Required verification |
|---|---|---|
| pnpm monorepo with `apps/web`, `apps/mobile`, and `packages/engine` | determines extraction strategy | inspect package graph, build scripts, CI, and deploy configuration |
| Vite PWA/Netlify web and Expo/EAS React Native mobile | determines app/store migration risk | inspect actual app identifiers, EAS projects, Netlify sites, deep links |
| roughly 22k product lines and duplicated web/mobile screens | determines shared UI economics | run measured line/file audit; separate generated/vendor code |
| one Supabase `app_state.state` JSONB blob with client merge rules | primary cross-app risk | inspect schema, migrations, sync code, conflict tests, production shape |
| a known version-skew bug in `packages/engine/src/cloud.ts` | blocks public split until fixed | reproduce with old/new fixtures and document exact failure |
| WHOOP data currently persists only date/recovery/strain | blocks trend-quality state computation | inspect types, persistence, cache expiry, OAuth scopes, and tests |
| `balance.ts` is retrospective, not prescriptive | determines Coordinator starting point | inspect call sites and prove no hidden scheduling behavior |
| `Workout.kind` has been added to prevent mixed strength/conditioning workouts | useful invariant but not an app split | verify migration, render paths, tests, and backward compatibility |

## Prior design decisions carried forward

- The product loop is Plan → Schedule → Train → Log → Recover → Review → Progress.
- Athlete and coach are separate entities with an explicit, tested boundary.
- Prescription targets and observed/logged results remain separate.
- Offline/local-first behavior is a product requirement, not a polish item.
- The visual language should be calm, premium, legible, and explicit about placeholders.
- Jarvis is an external build/research agent. Do not turn it into an in-app chat, voice, or Claude API feature.

## Prior evidence constraints carried forward

- Deterministic outputs must expose version, state, action, reason codes, observed inputs, data quality, missingness, and conflict state.
- Observed data must be separated from estimated state.
- HRV may inform advisory context but never pain, injury, or tissue-integrity decisions.
- Pain is a safety/context route, not an ordinary fatigue scalar.
- Illness begins as an explicit manual state with a return-to-training workflow; do not infer a diagnosis.
- Conditioning progression must keep cardiovascular and local/mechanical outcomes separate; a cardio pass cannot override a local mechanics failure.
- Layoff return should be conservative and calibrated, not a universal percentage disguised as evidence.

## Unknowns that must not be guessed

- Which repository checkout is canonical.
- Current branch protection, CI, deployment identifiers, and production Supabase project.
- Whether app users share an auth namespace today.
- Whether old mobile versions can still write to the existing blob.
- Exact database row counts, real-world sync conflict rate, and data migration volume.
- Whether store listings, bundle IDs, app links, health permissions, BLE permissions, or privacy policies are already published.
- Whether the product’s intended claims fall within Australian wellness/coaching exclusions.
