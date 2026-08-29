# Decision Hub — briefing for external design chat

**Repo:** TheStrengthEngine (Hybrid HTML athlete app)  
**Date:** 28 August 2026  
**Purpose:** Owner wants to discuss unparking **Decision Hub** — a next-layer automation system on top of five existing engines. **No secrets in this bundle.**

---

## What to read first

1. This file (START-HERE.md) — owner intent + proposed architecture  
2. `CONVERSATION-SUMMARY.md` — how intent evolved in Cursor chat  
3. `reference/` — existing specs and code the repo already ships  

---

## Product today (shipped on `main`)

**One athlete app:** Hybrid HTML (`apps/mobile/prototype/hybrid-app/index.html`).

**Five engines wired:**

| # | Engine | Athlete sees | Brain today |
|---|--------|--------------|-------------|
| 1 | **Strength** (Hybrid Strength) | Library, log, Progress | Deterministic `decideProgression` — silent load bumps |
| 2 | **Conditioning** (The Engine) | Home, HR log | `@hybrid/engine` + `conAdapt` levels |
| 3 | **Nutrition** | Home daily log | Check-in + log; sparse Coordinator flags |
| 4 | **Recovery** | Debt row on Home only | `recovery-engine.js` — posture, debt, repay |
| 5 | **Coordinator** | Nothing (invisible) | Rule-based `planCoordinator` — thin 7-day receipts |

**Integrations:** WHOOP, Concept2, BLE HR on dogfood APK, Capgo OTA, strength/nutrition cloud sync.

**Phase F backend (shipped, not used for product decisions):** `coaching_note` table, pgvector, Voyage embed edge function, `progressionQueryText()` in strength-engine. Was built for a future "decision call" (Phase G) that was parked.

---

## Owner intent (Decision Hub — unparked for design)

### What they want

- **Automation, not explanation.** No chatbot. No "why did it hold?" UI. Silent apply stays.
- **Five domain data feeds** — each engine contributes rich data (not thin weekly summaries).
- **Static reference libraries** — versioned playbooks/rules built once per engine (curated knowledge, decision tables, examples).
- **Per-engine decision interpreters** — designed pipelines that read static lib + athlete snapshot → structured domain output.
- **One system output** — Coordinator layer merges five domain decisions into a single `SystemDecision` → validators → silent apply.
- **NO LLM.** Not ChatGPT, not embeddings for decisions. Deterministic rules / expert-system style. The "agent" is **software you design**, not a language model.

### What they explicitly do NOT want

- LLM / GPT / Claude for decisions  
- Athlete-facing AI chat or weekly AI brief  
- Training blocked by pain/illness (flags exist; nothing stops sessions)  
- Accept/decline progression UI  
- Weekly Coordinator peek (was removed per five-systems spec)  
- Rebuilding coach/ARC/Expo  

### Architecture sketch (owner model)

```
Static StrengthLib     + athlete strength snapshot     → Strength interpreter  → StrengthDecision
Static CondLib         + athlete cond snapshot         → Cond interpreter      → CondDecision
Static NutritionLib    + athlete nutrition snapshot    → Nutrition interpreter → NutritionDecision
Static RecoveryLib     + athlete recovery snapshot     → Recovery interpreter  → RecoveryDecision
Static CoordinatorLib + four decisions + cross slice  → Coordinator interpreter → SystemDecision
                                                                              ↓
                                                                    validators (product locks)
                                                                              ↓
                                                                    silent apply (existing adapters)
```

**Interpretation system** = the designed machinery: rule blocks, scorecards, decision tables, merge precedence, output schemas, audit (`reasonCodes`, rule IDs, pack version). Not free-form reasoning.

**Static data** = machine-readable playbooks (JSON/YAML/rules), not millions of lines of app code. Depth = coverage and rule quality, not LOC for its own sake.

---

## Product locks (binding — do not propose violating silently)

From `handoff.md` and five-systems spec:

- **Silent apply** for progression + Coordinator — no accept/decline  
- **Training never blocked** in solo dogfood  
- **Pain Yes** → holds **strength autopilot bumps only** (not cond/nutrition stops)  
- **Illness** → record-only; no auto-stop (auto-coach was deleted in hybrid repo)  
- **Do not use HRV** as pain/injury/illness gate  
- **No weekly Coordinator peek** — invisible brains  
- **`@hybrid/strength-engine` stays pure** — zero I/O; decision runners live in adapters / edge / new packages  
- **Shared Supabase:** this repo owns exactly twelve tables; no migrations against hybrid-owned tables  

---

## What exists vs gap

| Have | Gap |
|------|-----|
| Deterministic strength progression | Fat strength snapshot export + static StrengthLib |
| Recovery posture + debt | Recovery interpreter + static RecoveryLib |
| Cond engine + conAdapt | Cond interpreter + static CondLib |
| Nutrition log + check-in | Nutrition interpreter + static NutritionLib |
| `planCoordinator` (~240 LOC rules) | Coordinator as **merger** of five domain decisions + static CoordinatorLib |
| `ProgressionDecider` interface | Rule-based implementations for all domains (not LLM) |
| Thin `collectReceipts` (7-day skim) | Rich per-engine snapshot builders |
| Phase F RAG infra | **Optional / not required** for no-LLM model; notes may be compiled into static rules by humans |

---

## Rough job size (engineering terms, no calendar)

- **Large:** authoring static libraries (content + structure) for five domains  
- **Medium:** snapshot exporters, rule runner platform, validators, SystemDecision merge, wire silent apply per domain  
- **Medium:** golden tests per pack (mandatory for silent automation trust)  
- **Smaller than LLM path:** no API ops, token limits, or prompt drift — but **more explicit rule authoring**

Suggested milestones:

1. Pack schemas + snapshot exporters (deterministic still runs; log what Hub would see)  
2. Strength interpreter + static lib v1 + silent apply unchanged  
3. Recovery → Cond → Nutrition interpreters  
4. Coordinator merge → SystemDecision  
5. Deepen static libs over time  

---

## Open design questions for ChatGPT to help with

1. **Rule format:** pure JSON rules vs TS functions vs hybrid (JSON + small predicate library)?  
2. **Coordinator role:** AI-style merge agent as rules, or deterministic precedence table?  
3. **Cadence:** per strength session, daily batch, weekly batch — per brain vs system merge?  
4. **Static lib structure:** outline for RecoveryLib v1 and StrengthLib v1 (sections, example rules, example I/O).  
5. **Conflict resolution:** strength wants progress, recovery wants hold — static precedence rules?  
6. **Testing strategy:** golden vectors, property tests, dogfood acceptance without UI feedback.  
7. **Relationship to existing code:** extract from `decideProgression` / `planCoordinator` vs parallel system?  
8. **Phase F coaching notes:** compile to rules manually, ignore for v1, or separate coach-only surface?  

---

## Key repo paths

```
apps/mobile/prototype/hybrid-app/index.html          # athlete app
apps/mobile/prototype/hybrid-app/coordinator-adapter.js
apps/mobile/prototype/hybrid-app/recovery-engine.js
packages/strength-engine/src/coordinator.ts
packages/strength-engine/src/progression.ts
packages/engine/                                    # conditioning
handoff.md                                          # ops checkpoint (secrets redacted in this bundle)
docs/superpowers/specs/2026-08-24-five-systems-complete-design.md
docs/superpowers/specs/2026-08-24-four-system-coordinator-design.md
```

---

## Instructions for ChatGPT

Owner will paste or upload this zip. Please:

- Treat **no LLM** as a hard constraint unless owner changes it  
- Treat **silent automation** as the product — not explanation UX  
- Respect product locks in `reference/handoff-sanitized.md`  
- Propose concrete static pack outlines, rule schemas, merge logic, and phased build plans  
- Do not suggest restoring coach/ARC/Expo, weekly peek, or training blocks  

When owner returns to Cursor agent, they may want a spec written into the repo or a milestone added to handoff §2.
