# Security, privacy, and Australian product-boundary review

This is engineering guidance, not legal advice. Obtain jurisdiction-specific legal/privacy and clinical/regulatory review before release.

## Data classification

The system will handle personal information and likely sensitive health information: body metrics, sleep, HRV, resting heart rate, training history, pain/illness reports, nutrition events, and wearable account identifiers. Treat all of it as sensitive in access control, logs, exports, backups, support tooling, and analytics.

## Australian privacy controls

The Privacy Act and Australian Privacy Principles are relevant to health information and security. Build for:

- transparent collection notices and purpose limitation;
- consent/authorization flows for wearable providers;
- access and correction requests;
- data quality and provenance;
- retention and secure destruction;
- data breach preparation and response;
- cross-border disclosure review and vendor contracts;
- account deletion that covers primary data, caches, exports, backups, and provider tokens where legally/technically possible;
- separate staff/coach access from athlete ownership;
- no health data in general-purpose analytics or support tickets by default.

Do not assume that using a hosted database makes the application compliant. Verify region, subprocessors, access logs, backup retention, encryption, and incident response with the chosen vendors.

## TGA product boundary

Australia’s TGA guidance says some consumer software for general health/wellness coaching or behavioral change may be excluded from medical-device regulation, but intended purpose controls and every feature in a multi-function product must qualify. A feature that diagnoses, provides prognosis, makes treatment decisions, or supplies information requiring professional interpretation may fall outside an exclusion.

Engineering consequences:

- use “training context,” “estimated,” and “user-reported” rather than “medically recovered”;
- do not claim injury prediction or tissue clearance;
- do not provide diagnosis or treatment plans;
- include professional-care escalation language only after clinical review;
- keep provider scores and app estimates labeled;
- review every store description, onboarding screen, notification, coach feature, and AI-generated explanation;
- document the intended purpose and data flows before adding a feature that looks clinical.

## Threat model

| Asset | Threat | Control |
|---|---|---|
| athlete health data | cross-account read | Supabase RLS, server ownership checks, negative tests |
| wearable tokens | client extraction/log leakage | secure storage, short-lived access, refresh/revoke flow, redaction |
| mutation queue | replay/duplication | idempotency keys, server dedupe, audit IDs |
| weekly plan | cross-app overwrite | Coordinator-only writer, versioned plan, RLS |
| exports | accidental sharing | explicit export UI, expiry, audit, redacted default |
| health observations | prompt/log injection | schema validation, content boundaries, no secrets in model context |
| admin/coach access | overreach | explicit roles, scoped queries, access logs, support approval |
| deletion | resurrection from offline cache | tombstones/erasure protocol, cache invalidation, conflict tests |
| native integrations | permission abuse | least privilege, user-visible rationale, fallback behavior |

## Minimum security verification

- RLS enabled on every exposed table and tested with positive and negative identities.
- No service-role key in mobile/web bundles.
- Auth callback/deep-link paths validate state and redirect allowlists.
- Local databases and secure token stores are protected according to platform capability.
- Sensitive fields are excluded from logs, crash breadcrumbs, analytics, and screenshots.
- Exports are authorized, scoped, and revocable/expiring where feasible.
- Mutation endpoints reject malformed schema, unknown ownership, stale versions, and replayed IDs.
- Dependency, SAST, secret scan, and mobile security checks run in CI.
- Deletion and data-access requests have an owner, SLA, and test fixture.

## Claude Code security boundary

Claude Code, plugins, MCP servers, hooks, and agent code can execute tools or read repository context. Treat each integration as code with privileges:

- trust the source before installing;
- prefer project-local, read-only, least-privilege servers;
- do not connect production Supabase, Sentry, GitHub, or email by default;
- inspect `.mcp.json`, `.claude/settings.json`, hooks, plugin manifests, and scripts in review;
- use a sandbox/test project for schema and migration work;
- never include secrets in prompts, fixtures, or issue descriptions;
- require human approval for production writes, deletion, publishing, or store actions.

## Security standards to map

Use OWASP MASVS for mobile storage/privacy/platform/network controls and OWASP ASVS for server/API controls. Map each control to a test or evidence artifact; a checklist without a test owner is not a release gate.
