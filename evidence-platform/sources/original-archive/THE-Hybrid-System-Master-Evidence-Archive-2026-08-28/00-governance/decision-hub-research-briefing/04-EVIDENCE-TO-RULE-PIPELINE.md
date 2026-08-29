# Evidence-to-rule pipeline

## Never use raw corpus text at runtime

The runtime should load small versioned rule packs, not millions of raw lines. The corpus is a build-time research asset.

```text
Raw document
  -> source record
  -> paragraph or passage references
  -> atomic claims
  -> evidence synthesis
  -> product policy
  -> executable rule
  -> golden scenarios
  -> shadow-mode evaluation
  -> approved release
```

## Recommended storage boundary

### Outside Git

- original PDFs and web captures;
- OCR and extracted full text;
- large search indexes;
- copyrighted material not licensed for redistribution.

### Inside Git

- source manifests and checksums;
- short, compliant source locations or excerpts;
- normalized claims;
- evidence syntheses;
- reviewed product policies;
- executable rule packs;
- test fixtures and decision receipts.

## Provenance chain

Every silent decision should be traceable:

```text
SystemDecision
  -> domain decision
  -> ruleId + packVersion
  -> policyId
  -> claimIds
  -> sourceIds
  -> URL + version + exact location
```

## Review states

Use explicit states instead of treating every imported item as trusted:

```text
discovered -> captured -> extracted -> verified -> synthesized
           -> policy-approved -> rule-approved -> released
```

## Conflict handling

When sources disagree, do not average them mechanically. Record:

- populations and contexts;
- intervention and comparator differences;
- outcome definitions;
- study designs and quality;
- publication dates;
- plausible reasons for disagreement;
- the conservative product response.

## Rule-pack release gate

A rule may enter a released pack only if:

- its schema validates;
- its policy owner is recorded;
- evidence links resolve;
- limitations are documented;
- conflict and boundary cases have golden tests;
- product-lock validators cannot be bypassed;
- missing data produces a safe deterministic result;
- shadow-mode results have been reviewed.

