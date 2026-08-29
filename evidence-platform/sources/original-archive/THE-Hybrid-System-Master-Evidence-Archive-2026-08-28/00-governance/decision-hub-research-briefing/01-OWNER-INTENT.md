# Owner intent and hard constraints

## Desired product

- Automation, not explanation.
- No athlete-facing chatbot or AI brief.
- Five rich domain data feeds, not thin weekly summaries.
- Static, versioned reference libraries for every engine.
- A deterministic interpreter per engine.
- One Coordinator output after conflict resolution and validation.
- Complete auditability through rule IDs, claim IDs, source IDs, and pack versions.
- Silent application through existing domain adapters.

## No-LLM constraint

No LLM may make runtime athlete decisions. The runtime must be deterministic rules, tables, scoring functions, and validators.

If an LLM is used during research or drafting, its output is untrusted research assistance only. It must not become an approved claim or executable rule without explicit source verification and human review.

## Binding product locks

- Training is never blocked.
- Pain holds strength autopilot load increases only.
- Illness is record-only; it does not automatically stop training.
- HRV must not be used as a pain, injury, or illness gate.
- Strength and Coordinator progression changes remain silent.
- There is no accept/decline progression UI.
- There is no weekly Coordinator peek.
- Existing pure engines remain free of I/O.
- Adapters own persistence and side effects.
- Shared database ownership boundaries must be respected.

## What the owner needs from ChatGPT

The owner needs strong direction, not a vague reading list. Research should be organized around decisions the software may eventually make. Every proposed decision rule should be traceable to evidence and clearly labelled as one of:

- directly supported by evidence;
- conservative engineering default;
- product-policy choice;
- unresolved hypothesis requiring validation.

## Scope truth

Three million lines cannot be responsibly reviewed in two days by one person. The two-day objective is to establish the research map, provenance model, source-quality hierarchy, initial source inventory, and first end-to-end evidence-to-rule examples across all five engines.

