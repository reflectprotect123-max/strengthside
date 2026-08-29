# Evidence Gate and Coach Receipt

Implemented 21 August 2026.

## Why this exists

The useful part of a three-layer AI architecture is not the diagram. It is the
contract between layers. Raw wearable and self-reported fields must not become
a confident coaching decision merely because several numbers are populated.

This feature implements that contract without adding an unconstrained model:

1. **Sensing / evidence** — `@hybrid/whole-athlete-state` cleans and groups
   current observations into independent readiness constructs.
2. **Decision** — a versioned deterministic policy emits one bounded coach
   receipt with ordered reason codes and actions.
3. **Interface** — the athlete Home screen and coach Readiness pillar render
   the receipt. A future language model may translate it, but may not change
   its call, reasons or actions.

The design responds to the validation gap described by Reiner et al.,
*Artificial Intelligence in Exercise Programming and Coaching: Opportunities
and Limitations* (2026, DOI `10.1249/JSR.0000000000001357`): individual AI
components are commonly evaluated, while closed-loop adaptive programming and
downstream outcomes remain under-tested.

## Layer 1 — evidence gate

Model: `readiness-evidence-v1`.

The gate converts raw fields into at most five constructs:

- sleep;
- wearable recovery;
- subjective recovery;
- stress and life load; and
- recent training load.

Rules:

- Confidence counts independent source families, not populated fields.
- Correlated fields first average inside their construct, so one form cannot
  outvote every other source by containing more questions.
- The stress value written to both recovery and life-load records by Settings
  is explicitly deduplicated.
- Independent families measuring the same construct are compared. A spread of
  35 points or more is a conflict: the conservative family value is retained
  for display, confidence is capped, and training advice is withheld.
- Wearable-only evidence is always `limited`, even when the device supplies
  several metrics.
- No HRV value can create or clear a pain/illness gate.

Evidence states are `strong`, `usable`, `thin`, `conflicted` and `missing`.
The complete raw-signal ledger, disposition, reason codes and plain-language
limitations stay on `readiness.evidence`.

## Layer 2 — coach receipt

Policy: `coach-receipt-v1`.

Decision order is executable and test-pinned:

1. pain or illness → `stop_and_reassess`;
2. conflicting inputs → `review_inputs`;
3. missing or single-source evidence → `collect_context`;
4. soft constraints → `adjust`; and
5. no justified change → `proceed`.

Every receipt declares `generatedBy: deterministic_policy` and
`prescriptionChanged: false`. Whole-athlete state does not own workout writes.
The receipt can recommend a bounded adjustment, but cannot rewrite a session,
schedule make-up work or override a coach-published week.

`readinessInfluenceAllowed` is true only after this complete policy runs. It is
false for pain/illness stops as well as missing, thin or conflicted evidence,
so evidence quality can never outrank an explicit safety hold.

## Layer 3 — interfaces

The athlete Home card shows the call, evidence state, independent source count,
construct coverage and a direct route to today's check-in when inputs need
review.

The coach Readiness pillar shows the same receipt plus the raw-field-to-model
reduction, limitations, bounded action and both policy versions. Roster
readiness remains behind its existing consent and data boundary; this panel is
only on the signed-in user's local readiness view.

## Training integration

A daily WHOOP recovery score can change zone ceilings and a conditioning
prescription only when the evidence state is `strong` or `usable` and no hard
safety stop is active.

When the gate does not clear:

- the raw WHOOP values remain visible;
- measured resting heart rate remains available to the HRR zone calculation;
- the one-day recovery score does not shift zone ceilings; and
- `conPrescription` receives `ignoreDaily: true`.

This is a narrow gate around one-day adaptation. Direct session performance
and the existing conditioning progression arithmetic remain unchanged.

## Validation

Focused tests pin:

- one multi-field form is still one source;
- duplicate manual stress is counted once;
- wearable-only evidence is limited;
- independent source/construct coverage can earn strong evidence;
- cross-source conflict withholds advice;
- safety flags outrank conflicts;
- zone adaptation can be withheld without discarding measured resting HR; and
- the coach pillar renders the bounded receipt.

This implementation improves auditability. It does **not** establish that the
readiness score or resulting coaching language improves long-term adherence or
training outcomes. That requires prospective product validation, not another
claim in the codebase.
