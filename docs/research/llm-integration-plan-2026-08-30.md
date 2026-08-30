# LLM integration plan

**Date:** 30 August 2026  
**Status:** Phase 1 started  
**Constraint:** LLM interprets context → **engines own all numbers** (kg, reps, watts, rounds).

---

## Architecture

```
Coach prose / athlete context
        ↓
   LLM (OpenRouter, server-side key)
        ↓
   Validated JSON hints (schema-bound)
        ↓
   Deterministic engines (strength-engine, @hybrid/engine)
        ↓
   Silent apply (existing adapters)
```

The LLM never returns load, reps, sets, watts, rounds, or minutes. It returns hints:
- `recovery_gate`: ok | caution | hold
- `cond_effort`: easy | medium | hard
- `flags`: pain | illness | travel | deload | test
- `athlete_cue`: one-line rest-phase copy

---

## Phases

| Phase | What | Status |
|-------|------|--------|
| **1** | Coach intent parser (`ai-coach-intent` + `coach-ai.js`) | **Shipped** — session start |
| **2** | Post-session progression advisor (`strength-ai.js` — already stubbed) | Next |
| **3** | In-session rest cues (one sentence on rest overlay) | Planned |
| **4** | RAG from `coaching_note` corpus (Phase F infra exists) | Planned |

---

## Ops

- **API:** OpenRouter (`OPENROUTER_API_KEY` on Netlify)
- **Model default:** `google/gemini-2.5-flash-lite`
- **Toggle:** Settings → “Coach intent AI” (`S.settings.llmCoachIntent`, default on)
- **Fail-soft:** LLM errors never block training; engines run unchanged

---

## Tests

- `check:coach-ai` — client validation, no network
- Existing `ai-strength-progression.mjs` — progression JSON (Phase 2)
