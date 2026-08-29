# REC-VENDOR-002

**Title:** WHOOP 101 (Strain and Recovery methodology)

**Publisher:** WHOOP (official developer documentation)

**URL:** https://developer.whoop.com/docs/whoop-101/

**Access state:** Fetched live 30 August 2026. Full page content confirmed readable at this URL. Note: whoop.com/us/en/thelocker/ blog URLs returned HTTP 403 to automated fetch during this run; the developer docs page was used instead and covers the same methodology.

**Source tier:** vendor_practitioner_content — NOT peer-reviewed. WHOOP's own description of its proprietary scoring, not an independently reviewed study.

**Evidence note (quoted/paraphrased from the fetched page):**
Strain is a 0-21 scale (based on the Borg RPE scale) measuring cardiovascular/musculoskeletal load continuously through the day; WHOOP's own page states the scale is non-linear ("it takes more stress to move from 16 to 17 than 4 to 5") and that identical workouts produce different Strain scores depending on the individual's current recovery state. Recovery is a 0-100% score computed once per day on waking, from resting heart rate, HRV, respiratory rate, sleep duration/quality, skin temperature and blood oxygen from the prior day and night; it does not update through the day unless sleep data is edited.

**Review state:** Research staging only. Not an executable rule, policy, model parameter, or athlete decision. WHOOP's exact scoring weights/formula are proprietary and not disclosed in this document - this record captures only what WHOOP itself states publicly about inputs and scale behavior, not a reproducible algorithm. This project's existing hard rule (`platform_core/engines/recovery.py`: no HRV gate, no universal readiness score) is directly relevant context for any future reviewer evaluating this source - a vendor recovery score is exactly the shape of thing that rule already exists to keep out of athlete-facing decisions without review.
