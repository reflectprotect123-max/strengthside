# Source register

Research date: 4 August 2026 (Australia/Sydney). Links are provided so Claude can re-check current documentation before implementation. Evidence is scoped; no source is treated as proof of product-specific algorithm parity.

## Claude Code and Git

| ID | Source | Use |
|---|---|---|
| C1 | [Claude Code quickstart](https://code.claude.com/docs/en/quickstart) | installation, launch, authentication, CLI basics |
| C2 | [Claude Code features overview](https://code.claude.com/docs/en/features-overview) | CLAUDE.md, skills, MCP, subagents, hooks, plugins |
| C3 | [Claude Code MCP quickstart](https://code.claude.com/docs/en/mcp-quickstart) | adding/listing/removing MCP servers and trust boundary |
| C4 | [Claude Code plugin discovery](https://code.claude.com/docs/en/discover-plugins) | official marketplace, scopes, official/community plugin cautions |
| C5 | [Claude Code plugins](https://code.claude.com/docs/en/plugins) | plugin layout, validation, local testing |
| C6 | [Claude Code worktrees](https://code.claude.com/docs/en/worktrees) | manual and isolated worktree workflows |
| C7 | [Git worktree documentation](https://git-scm.com/docs/git-worktree) | separate working directories sharing repository history |

## Sync, local-first, and database architecture

| ID | Source | Use |
|---|---|---|
| S1 | [Android offline-first data layer](https://developer.android.com/topic/architecture/data-layer/offline-first) | local source of truth, queues, retry, conflict/versioning principles |
| S2 | [Expo monorepos](https://docs.expo.dev/guides/monorepos/) | pnpm workspace and Metro monorepo guidance |
| S3 | [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) | local database/provider/migration capabilities |
| S4 | [Expo local-first guide](https://docs.expo.dev/guides/local-first/) | ecosystem options and conflict-resolution caveats |
| S5 | [Local-first software](https://www.inkandswitch.com/essay/local-first/) | offline, ownership, privacy, and collaboration principles |
| S6 | [Local-first collaboration paper](https://dl.acm.org/doi/10.1145/3359591.3359737) | research framing for local-first systems |
| S7 | [PostgreSQL MVCC](https://www.postgresql.org/docs/current/mvcc.html) | transaction/concurrency behavior to ground optimistic writes |
| S8 | [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) | isolation semantics and race testing |
| S9 | [Azure event sourcing pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing) | append-only events, projections, snapshots, and complexity trade-offs |
| S10 | [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) | RLS enablement, policies, grants, and exposed-schema safety |
| S11 | [Supabase testing overview](https://supabase.com/docs/guides/local-development/testing/overview) | database migration/function/RLS testing workflow |
| S12 | [Supabase pgTAP](https://supabase.com/docs/guides/database/extensions/pgtap) | SQL-level assertions for schema, functions, constraints, and policies |

## Provider integration

| ID | Source | Use |
|---|---|---|
| W1 | [WHOOP developer portal](https://developer.whoop.com/) | current API platform, OAuth and integration starting point |
| W2 | [WHOOP API reference](https://developer.whoop.com/api/) | endpoint and scope documentation |
| W3 | [WHOOP support/developer guidance](https://developer.whoop.com/docs/developing/support/) | access, refresh, API limitations, support/compatibility considerations |
| W4 | [WHOOP API terms](https://developer.whoop.com/api-terms-of-use/) | terms, authorization, membership, and provider boundary |

## Training/recovery evidence

| ID | Source | Use |
|---|---|---|
| E1 | [HRV-guided training meta-analysis](https://pubmed.ncbi.nlm.nih.gov/34639599/) | conditional HRV-guided training outcomes and limits |
| E2 | [HRV-guided training systematic review](https://pmc.ncbi.nlm.nih.gov/articles/PMC8507742/) | evidence quality and endurance context |
| E3 | [HRV applications in strength and conditioning](https://pmc.ncbi.nlm.nih.gov/articles/PMC11204851/) | measurement/interpretation boundaries for performance settings |
| E4 | [Endurance HRV meta-analysis](https://pubmed.ncbi.nlm.nih.gov/34489178/) | endurance-specific evidence, not a universal strength gate |
| E5 | [HRV-guided training review](https://pubmed.ncbi.nlm.nih.gov/33143175/) | practical limits and heterogeneity |
| E6 | [HRV-guided training trial](https://pubmed.ncbi.nlm.nih.gov/17849143/) | example conditional protocol |
| E7 | [HRV-guided training trial](https://pubmed.ncbi.nlm.nih.gov/26909534/) | example protocol and individual response |
| E8 | [HRV training meta-analysis](https://pubmed.ncbi.nlm.nih.gov/26888648/) | systematic review context |
| E9 | [Wearable measurement reliability study](https://www.nature.com/articles/s41598-025-89892-3) | device/protocol reliability caveats |
| E10 | [Concurrent training review](https://pubmed.ncbi.nlm.nih.gov/34757594/) | strength/hypertrophy/explosive-strength interference overview |
| E11 | [Concurrent training full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC8891239/) | review details and limitations |
| E12 | [Concurrent training interference review](https://pubmed.ncbi.nlm.nih.gov/24728927/) | mechanistic and programming context |
| E13 | [Concurrent training meta-analysis](https://pubmed.ncbi.nlm.nih.gov/22002517/) | strength/hypertrophy comparison |
| E14 | [Same-session exercise order review](https://pmc.ncbi.nlm.nih.gov/articles/PMC7224562/) | sequencing/context rather than blanket prohibition |
| E15 | [Concurrent strength meta-analysis](https://pubmed.ncbi.nlm.nih.gov/35476184/) | context-specific sex/strength findings |
| E16 | [Concurrent training meta-analysis](https://link.springer.com/article/10.1007/s40279-023-01943-9) | recent interference findings and uncertainty |
| E17 | [Athlete training-load consensus](https://pubmed.ncbi.nlm.nih.gov/28463642/) | internal/external load, monitoring, individual response |
| E18 | [Sleep/recovery practices review](https://pmc.ncbi.nlm.nih.gov/articles/PMC8072992/) | sleep and recovery context |
| E19 | [Sleep and athlete health review](https://pmc.ncbi.nlm.nih.gov/articles/PMC9960533/) | sleep, performance, and individual variability |
| E20 | [Acute sleep loss and performance](https://pmc.ncbi.nlm.nih.gov/articles/PMC9584849/) | acute impairment context |
| E21 | [Sleep deprivation meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC11996801/) | current synthesis, not a universal readiness threshold |
| E22 | [IOC acute respiratory illness consensus](https://pubmed.ncbi.nlm.nih.gov/35863871/) | illness and return-to-training safety context |
| E23 | [IOC illness consensus full text](https://bjsm.bmj.com/content/56/19/1066) | illness/load boundaries |
| E24 | [Non-infective illness consensus](https://pubmed.ncbi.nlm.nih.gov/35623888/) | non-infective illness considerations |
| E25 | [Pain-monitored tendon loading trial](https://pubmed.ncbi.nlm.nih.gov/17307888/) | context-specific pain-monitoring evidence; not universal app rule |
| E26 | [Pain-monitoring model review](https://pmc.ncbi.nlm.nih.gov/articles/PMC7249277/) | Achilles/tendon context and limits |
| E27 | [Return-to-sport consensus](https://pubmed.ncbi.nlm.nih.gov/27226389/) | multi-factor return decisions, not a single readiness score |

## Australian privacy, regulation, and security

| ID | Source | Use |
|---|---|---|
| R1 | [OAIC personal information and health information](https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information/what-is-personal-information) | sensitive information framing |
| R2 | [Australian Privacy Principles](https://www.oaic.gov.au/privacy/australian-privacy-principles) | privacy obligations and principles |
| R3 | [OAIC APP 11 security](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information) | reasonable security and destruction/retention |
| R4 | [OAIC data breach preparation/response](https://www.oaic.gov.au/privacy/notifiable-data-breaches/preventing-preparing-for-and-responding-to-data-breaches/data-breach-preparation-and-response/part-1-data-breaches-and-the-australian-privacy-act) | breach preparation and notification context |
| R5 | [OAIC APP 8 cross-border disclosure](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-8-app-8-cross-border-disclosure-of-personal-information) | vendor/cross-border review |
| R6 | [TGA software-based medical devices](https://www.tga.gov.au/resources/guidance/understanding-how-we-regulate-software-based-medical-devices) | intended-purpose/regulatory framing |
| R7 | [TGA general health/wellness software exclusion](https://www.tga.gov.au/resources/guidance/understanding-general-health-or-wellness-software-exclusion) | wellness boundary |
| R8 | [TGA coaching software exclusion](https://www.tga.gov.au/resources/guidance/understanding-behavioural-change-or-coaching-software-exclusion) | multi-function and clinical-claim boundary |
| R9 | [TGA software exclusions overview](https://www.tga.gov.au/products/medical-devices/software-and-artificial-intelligence-ai/overview/software-based-medical-device-exclusions) | exclusion categories and responsibilities |
| R10 | [OWASP MASVS](https://mas.owasp.org/MASVS/) | mobile security verification standard |
| R11 | [OWASP MASVS storage](https://mas.owasp.org/MASVS/05-MASVS-STORAGE/) | mobile storage controls |
| R12 | [OWASP MASVS privacy](https://mas.owasp.org/MASVS/12-MASVS-PRIVACY/) | privacy controls |
| R13 | [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) | server/API verification standard |

## How to use the register

Use official platform/regulator documentation for implementation details, primary studies/reviews for bounded evidence claims, and product decisions for heuristics. Re-check any version-sensitive Claude Code, Expo, WHOOP, Supabase, TGA, or store guidance at implementation time.
