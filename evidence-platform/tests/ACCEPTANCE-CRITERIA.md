# Validation tests and acceptance criteria

## Required gates

| Test | Acceptance criterion |
|---|---|
| Contradictory evidence | Linked contradiction is unresolved or an owned resolution is referenced; silent winner selection fails. |
| Missing values | Required value missing causes explicit `insufficient_data` or schema failure; never coerced to zero. |
| Incompatible units | No comparison or arithmetic without an approved lossless/versioned conversion. |
| Different denominators | Records remain non-comparable until denominator semantics match. |
| Different populations | Synthesis retains population strata or an explicit applicability judgment. |
| Stale rules | Expired/review-overdue rule cannot execute. |
| Invalid model versions | Unknown, hash-mismatched, deprecated-without-override, or unapproved version fails closed. |
| Unsafe decisions | Any hard safety constraint blocks the candidate regardless of soft score. |
| Incomplete provenance | Missing source-to-rule lineage blocks release and receipt finalization. |
| Conflicting recommendations | Coordinator records conflict, priority policy, rejected candidates, and reason codes. |
| Replay | Same inputs/artifacts produce identical state, decision and receipt hash. |

## Foundation acceptance

All JSON parses; JSON Schemas have valid JSON structure; all CSV rows match their header width; YAML parses where a parser is available; Markdown indexes contain no broken relative links; source copies match the supplied archive hash; every registry ID is unique; references resolve; no model is marked active; no claim extracted from the archive is marked independently verified without a validation record.
