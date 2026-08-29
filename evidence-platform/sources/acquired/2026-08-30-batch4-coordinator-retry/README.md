# Acquisition batch 4 — coordinator retry with different search terms

Requested: retry coordinator with different search terms after batch 3's
104-record ceiling. Delivered: 500.

## What changed

Batch 3's queries used generic decision-science vocabulary (explainable
AI, calibration, human-in-the-loop) that pulled in unrelated ML literature
from every field (mammography, mosquito density, solar forecasting) and
had to be filtered down from 500 raw hits to 104 real ones.

This retry used different, more concrete terms tied to what coordinator
actually needs to arbitrate in practice: return-to-play/return-to-sport
decision-making, load-management trade-offs in professional sport,
athlete-monitoring-system adoption, AI implementation in sports science
teams, digital twins for performance prediction, and injury-vs-performance
"competing priorities." Every query still requires a sport/athlete-context
term - the lesson from batch 3.

First pass still leaked some off-topic hits on a spot check (Neandertal
genetics, prenatal-mercury multi-omics, hospital nursing organizational
studies - matched via an incidental "athlete" or "training" mention deep
in an unrelated abstract). Filtered a second time, requiring the
sport/athlete/injury/return-to-play term appear in the **title**, not just
somewhere in the note - titles are a much stronger relevance signal than
an abstract mention. That cut 911 raw hits to 567 genuinely on-topic ones;
a second spot check of the filtered set found no more leaks. 500 of the
567 are landed here.

## Result

104 (batch 3) + 500 (this batch) = 604 coordinator sources total, now
comparable in scale to the other four engines rather than the outlier it
was after batch 3. Same status as everything else: research-staging only,
`extracted_untrusted_pending_source_validation`, nothing reviewed or
promoted.
