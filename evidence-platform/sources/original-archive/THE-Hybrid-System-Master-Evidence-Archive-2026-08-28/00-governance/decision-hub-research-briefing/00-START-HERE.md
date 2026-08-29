# Decision Hub — five-engine research kickoff

**Prepared:** 28 August 2026  
**Purpose:** Brief a new ChatGPT conversation to begin fresh, cited research for a deterministic five-engine athlete Decision Hub.

## Read in this order

1. `00-START-HERE.md`
2. `01-OWNER-INTENT.md`
3. `02-RESEARCH-MISSION.md`
4. `03-FIVE-ENGINE-QUESTIONS.md`
5. `04-EVIDENCE-TO-RULE-PIPELINE.md`
6. `05-TWO-DAY-FIRST-SPRINT.md`
7. `06-CHATGPT-OPERATING-PROMPT.md`
8. `templates/`

## Situation

The owner has one shipped athlete app with five connected systems:

1. Strength
2. Conditioning
3. Nutrition
4. Recovery
5. Coordinator

The next ambition is Decision Hub: rich domain snapshots enter deterministic interpreters, each interpreter emits a structured domain decision, and Coordinator merges them into one validated system decision that is silently applied.

The owner is starting alone. They have a long-term ambition to gather roughly **three million lines of internet evidence**. That number expresses desired depth, not a requirement to load or review all material before beginning.

## The key architectural decision

Raw evidence must never directly control athlete decisions.

```text
Internet sources
  -> immutable source registry
  -> atomic evidence claims
  -> reviewed product policies
  -> versioned executable rule packs
  -> deterministic interpreters
  -> validators
  -> silent apply
```

The first research effort should cover all five engines at breadth, identify the strongest evidence families and decision questions, and then recommend the order for deeper evidence extraction.

## What this briefing requests

Use current web research and primary/authoritative sources wherever possible. Produce a research map and structured evidence inventory for all five engines. Clearly distinguish:

- source findings;
- scientific or authoritative claims;
- uncertainty and limitations;
- product-policy choices;
- possible executable rules.

Do not collapse those categories into one another.

