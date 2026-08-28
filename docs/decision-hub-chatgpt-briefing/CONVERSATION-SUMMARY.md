# Cursor conversation summary (28 Aug 2026)

Chronological intent — for ChatGPT context.

## 1. Unpark Decision Hub

Owner unparked "Decision Hub / AI automation" (was parked in handoff during engine audit). Wanted to **talk**, not build immediately.

## 2. Not explanation — automation

Owner corrected: the system does **not** explain anything to the athlete. It **automates** — silent decisions applied through existing adapters. No chat, no weekly AI brief.

## 3. Rich data per engine

Owner wants **tons of data** from each of the **five engines** fed into decision-making — not the thin 7-day receipts Coordinator uses today. Vision: deep data packages per domain (built seriously over time).

## 4. Five brains → one system output

All five engines' data feeds into **per-engine decision brains**. Each produces its own output. Outputs combine into **one big system decision** for full-system automation.

## 5. Static data + interpretation system

Owner clarified: give the **agent they build** **static reference data** (versioned playbooks). Design a **system for how it interprets** that data and **pumps out decisions**. Not dynamic search — structured interpretation pipeline.

## 6. No LLM (final constraint)

Owner explicitly: **do not use an LLM.** No GPT/Claude for decisions. The "agent" is deterministic software — rules, tables, scoring, pipelines. Static libs + athlete snapshot → structured JSON out → validators → silent apply.

## 7. Size question

Full vision = multi-milestone program. Bigger than four-system Coordinator (PR #36). Static rule libraries are the long pole. No-LLM path is narrower than five LLM brains but still substantial.

## 8. Side topics (not Decision Hub)

Same session also covered: Capgo 1.0.13 upload, handoff rewrite + secrets vault (PR #93), dogfood smoke — separate from Decision Hub design.

## Terms owner used loosely

- "3 million lines of code per pack" — meant **build it deep / don't skimp**, not literal LOC target  
- "AI engine brains" — means **decision interpreters**, not machine learning (given no-LLM constraint)  
- "GPT do searching" — explored then **rejected** in favor of static data + designed interpretation  
