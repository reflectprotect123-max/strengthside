# MacroTrack research and build bundle

**Prepared:** 2026-08-03  
**Repository:** new `/workspace/macrotrack` repository  
**Handoff:** Claude Code

This is the starting point for the product, research, architecture, data, and
delivery decisions behind MacroTrack. Read this file first, then follow the
documents in the order below.

## What this repository is trying to become

MacroTrack is an Android Kotlin/Jetpack Compose nutrition tracker with a
Supabase/Postgres backend. The target is a MacroFactor-class experience for
fast logging and adaptive nutrition coaching, with Australian food coverage.

“MacroFactor-class” means comparable user-facing capability and quality, not a
claim that MacroTrack reproduces MacroFactor’s private code, constants, data,
or UI. The public MacroFactor material is a product precedent. The local
algorithm is an explicit, versioned product design that must be tested and
explained.

## Read order for Claude Code

1. `CLAUDE.md` — operating rules and non-negotiable constraints.
2. `README.md` — current repository commands and honest feature boundary.
3. `docs/PRODUCT_REQUIREMENTS.md` — what the product must do.
4. `docs/ALGORITHM_AND_EVIDENCE.md` — what is supported, what is inferred, and
   what is still an explicit product choice.
5. `docs/DATA_IMPORT_AND_PROVENANCE.md` — real-source food data, licenses,
   normalization, and reproducibility.
6. `docs/ARCHITECTURE_AND_DATA_SECURITY.md` — Android, local-first sync,
   Supabase, Postgres, RLS, privacy, and performance.
7. `docs/UX_FLOWS_AND_EDGE_CASES.md` — screen behaviour and failure states.
8. `docs/BUILD_ROADMAP_AND_TEST_PLAN.md` — staged implementation and release
   gates.
9. `docs/SOURCE_REGISTER.md` — direct source URLs and claim-level notes.
10. `docs/ADAPTIVE_ENGINE_CONTRACT.md` — the executable Python-to-Kotlin
    calculation contract.

## Evidence labels

Every material claim in the bundle should be interpreted using one of these
labels:

| Label | Meaning | How Claude Code may use it |
| --- | --- | --- |
| **DIRECT** | Primary peer-reviewed or official source directly supports the claim. | Use with a citation and preserve scope/population limits. |
| **ADJACENT** | Relevant evidence supports a related mechanism, but not this exact product rule. | Use as rationale, never as proof of the exact rule. |
| **PRODUCT PRECEDENT** | Public documentation describes another product’s observable behaviour. | Use for requirements and UX inspiration, not as scientific validation. |
| **CONVENTION** | Established engineering, data, or coaching convention. | Use with a source or mark it as convention. |
| **PRODUCT CHOICE** | MacroTrack’s explicit configurable decision. | Version it, test it, expose its explanation, and do not call it universal. |
| **UNRESOLVED** | The information is private, missing, conflicting, or not yet validated. | Keep it visible in the backlog; do not fill the gap with plausible numbers. |

## Current repository baseline

Already present:

* a Supabase migration covering foods, source provenance, servings, custom
  foods, recipes, food logs, explicit day status, weight entries, trend
  points, macro programs, expenditure estimates, check-ins, nutrient targets,
  favorites, measurements, photos, indexes, and RLS;
* standard-library Python importers for Open Food Facts API/local JSONL and
  AUSNUT/AFCD/NUTTAB-style CSV/TSV/XLSX sources;
* SQL output in batches of at most 500 rows;
* an executable deterministic Python adaptive-engine reference;
* an Android/Compose/Supabase starter and offline Python regression tests.

Not yet complete:

* production Compose navigation and screens;
* Room/local-first repositories and conflict-safe sync;
* real camera barcode capture and manual fallback UX;
* source search ranking, verified-food review, OCR, URL recipe import, voice,
  or image-AI adapters;
* Kotlin parity tests against the Python engine;
* production-grade migration/RLS integration tests;
* privacy policy, account deletion/export UX, notifications, billing, and
  launch operations.

## Working rule

When a requirement, implementation, and source disagree, stop and make the
disagreement explicit. A smaller honest implementation is preferable to a
larger feature that silently invents nutrition data, treats missing logging as
zero, or presents a product convention as medical/scientific certainty.
