# Acquisition batch 1 — received via handoff, 30 August 2026

60 source records (22 strength, 10 conditioning, 10 nutrition, 8 recovery,
10 coordinator) originally produced by a ChatGPT session the user ran in
parallel, delivered as
`THE_Hybrid_System_25MB_EACH_TAKEOVER_HANDOFF_20260830.zip`. That handoff's
own stated goal (~25MB of unique research per engine) was not met and is
not this project's actual target - see
`docs/research-acquisition-strategy.md` for why line/byte count is treated
as a byproduct here, not a metric. What's landed in this folder is only the
genuinely new material from that handoff: each engine's
`07_OPEN_ACCESS_RESEARCH_*` source records. The rest of that handoff
(repackaged governance docs, cross-engine research, original archives -
already present elsewhere in this corpus) was deliberately not copied in,
since re-landing already-known content a second time would only inflate
storage without adding evidence, which is exactly what this project's own
`docs/research-roadmap.md` warns against.

## Independent verification performed before landing

Every PMC-identified record (52 of 60; the other 8, all coordinator, cite
non-biomedical ML/decision-science papers by URL instead) was checked
directly against the live Europe PMC REST API on 30 August 2026:

- **52/52 PMC IDs exist.**
- **51/52 titles matched** the real paper's title.
- **1/52 confirmed wrong**: `NUT-OA-006` cites a PMCID for a different
  paper than the one it names. Flagged inline in that file rather than
  silently corrected or removed - see the file itself for the full note.
- 1 of the 8 non-PMC (URL-cited) records was spot-checked live (HTTP 200,
  real page).

None of this has been promoted, reviewed, or verified beyond identity
existence and title matching - `review_status` on every record stays
`extracted_untrusted_pending_source_validation`, same as everything else
in this corpus.
