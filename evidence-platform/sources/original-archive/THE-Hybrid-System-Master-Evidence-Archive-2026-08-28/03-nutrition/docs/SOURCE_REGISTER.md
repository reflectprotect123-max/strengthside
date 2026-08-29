# Source register

**Research pass date:** 2026-08-03  
**Rule:** verify changing versions and terms again before release.

## Product precedent

| Source | URL | Use |
| --- | --- | --- |
| MacroFactor feature overview | <https://macrofactor.com/macrofactor/> | Observable logging, recipes, barcode/search, micronutrients, weight trend, expenditure, body metrics, macro modes, and check-in-related product capabilities. |
| MacroFactor algorithms and core philosophy | <https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/> | Public conceptual description of intake/weight feedback, trend, expenditure, targets, missing-data handling, and adherence-neutral recommendations. |
| MacroFactor check-ins and coaching modules | <https://help.macrofactorapp.com/en/articles/247-introduction-to-check-ins-and-coaching-modules> | Weekly check-in concept, optional modules, skip/decline behaviour, and module categories. |
| MacroFactor energy expenditure interpretation | <https://help.macrofactorapp.com/en/articles/26-how-should-i-interpret-changes-to-my-energy-expenditure> | Public discussion of intake/weight inputs, coverage, trend noise, initial learning period, and limitations. |

These sources are **PRODUCT PRECEDENT**, not validation of MacroTrack’s
algorithm and not a license to copy private implementation details.

## Open Food Facts and barcode data

| Source | URL | Use |
| --- | --- | --- |
| Open Food Facts API documentation | <https://openfoodfacts.github.io/openfoodfacts-server/api/> | API purpose and product/nutrition/ingredient data surface. |
| Open Food Facts data/download page | <https://world.openfoodfacts.org/data> | Official dump/download entry point; access may be blocked by automated tools, so verify manually when downloading. |
| Open Food Facts ODbL page | <https://wiki.openfoodfacts.org/ODBL_License> | Database license and attribution/share-alike review. |
| GS1 Global GTIN | <https://www.gs1.org/standards/id-keys/gtin> | GTIN as a trade-item identifier. |
| GS1 Australia 1D barcodes | <https://www.gs1au.org/standards/barcodes/1d-barcodes> | Australian EAN-8/EAN-13/UPC-A/ITF-14 use. |
| GS1 Australia barcode check digit | <https://www.gs1au.org/services/tools/check-digit-calculator> | Check-digit integrity concept. |

OFF data is contributor-maintained. A decoded barcode is an identifier, not a
guarantee that the attached nutrition values are correct.

## Australian food composition

| Source | URL | Use |
| --- | --- | --- |
| Australian Food Composition Database | <https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd> | Official AFCD scope and current database page. |
| AFCD data files | <https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/data-files> | Official AFCD downloadable files and release details. |
| AUSNUT overview | <https://www.foodstandards.gov.au/science-data/food-nutrient-databases/ausnut> | Current AUSNUT scope and food-count context. |
| AUSNUT data files | <https://www.foodstandards.gov.au/science-data/food-nutrient-databases/ausnut/data-files> | Food details, nutrient profiles, food measures, and release downloads. |
| AUSNUT Australian Dietary Guidelines profiles | <https://www.foodstandards.gov.au/science-data/food-nutrient-databases/ausnut/dietary-guidelines> | Food-group profile context; not a personalized target engine. |
| FSANZ nutrient reference values | <https://www.foodstandards.gov.au/consumer/nutrition/nutrient-reference-values> | Reference values and upper safe levels; not automatically a personalized prescription. |
| FSANZ nutrition information panels | <https://www.foodstandards.gov.au/consumer/labelling/panels> | Australian label nutrient-field context. |
| FSANZ data user licence/terms | <https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd/datauserlicenceagreement> | Review before distributing derived data. |

The exact production seed must pin a release, file URL, retrieval date, and
digest. Page counts and file links can change.

## Scientific and technical evidence

| Source | URL | Use and limit |
| --- | --- | --- |
| Mifflin et al. (1990), *A new predictive equation for resting energy expenditure* | <https://pubmed.ncbi.nlm.nih.gov/2305711/> | Direct source for the Mifflin–St Jeor predictive equation; it is not a measured metabolic test. |
| Chow & Hall (2008), *The dynamics of human body weight change* | <https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1000045> | Dynamic model of weight/body-composition response; supports dynamic thinking, not a production app calibration. |
| Hall et al. (2012), *Energy balance and its components* | <https://pmc.ncbi.nlm.nih.gov/articles/PMC3302369/> | Energy-balance framework and limitations. |
| Hall et al. (2011), *Quantification of the effect of energy imbalance on bodyweight* | <https://www.thelancet.com/journals/lancet/article/PIIS0140-6736%2811%2960812-X/abstract> | Dynamic weight-response modelling; not a MacroTrack validation study. |
| Nunes et al. (2022), protein intake systematic review/meta-analysis | <https://pubmed.ncbi.nlm.nih.gov/35187864/> | Group-level resistance-training protein evidence; not a universal personalized target. |
| Morton et al. (2018), protein supplementation meta-analysis | <https://pubmed.ncbi.nlm.nih.gov/28698222/> | Dose-response context; avoid turning a group plateau into a hard individual rule. |

## Android and camera

| Source | URL | Use |
| --- | --- | --- |
| Android architecture guide | <https://developer.android.com/topic/architecture> | Layering, single source of truth, and unidirectional data flow. |
| Android offline-first data layer | <https://developer.android.com/topic/architecture/data-layer/offline-first> | Local reads, network synchronization, queued/lazy writes, and conflict considerations. |
| Android architecture recommendations | <https://developer.android.com/topic/architecture/recommendations> | Repositories, coroutines/flows, ViewModels, Compose, and optional domain layer. |
| Room | <https://developer.android.com/training/data-storage/room> | Local structured persistence and migration/testing rationale. |
| CameraX | <https://developer.android.com/media/camera/camerax> | Camera use cases and device abstraction. |
| CameraX image analysis | <https://developer.android.com/media/camera/camerax/analyze> | Analyzer pipeline for barcode/OCR inputs. |
| ML Kit barcode scanning for Android | <https://developers.google.com/ml-kit/vision/barcode-scanning/android> | Supported formats, image-quality considerations, and processing flow. |
| ML Kit supported formats | <https://developers.google.com/ml-kit/vision/barcode-scanning> | EAN/UPC and other format inventory. |

## Supabase and privacy

| Source | URL | Use |
| --- | --- | --- |
| Supabase Kotlin installation | <https://supabase.com/docs/reference/kotlin/installing> | Kotlin modules, Android minimum SDK, BOM, and Ktor engine requirement. |
| Supabase Row Level Security | <https://supabase.com/docs/guides/database/postgres/row-level-security> | RLS enablement, policies, grants, and `auth.uid()` patterns. |
| Australian Privacy Act overview (OAIC) | <https://www.oaic.gov.au/privacy/privacy-legislation/the-privacy-act> | Australian privacy scope. |
| OAIC APP guidelines | <https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines> | Current APP guidance; review with counsel for the actual business model. |
| OAIC health privacy guide | <https://www.oaic.gov.au/__data/assets/pdf_file/0020/251183/Guide-to-Health-Privacy-Collated-May-2025.pdf> | Health-data handling context. |
| OAIC cross-border disclosure guidance | <https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-8-app-8-cross-border-disclosure-of-personal-information> | Hosting/processor disclosure questions. |

## Source-use rules

1. Cite a primary/official source close to each non-obvious claim.
2. Record access/retrieval date for changing pages and dependencies.
3. Use product pages for product requirements, not scientific validation.
4. Use peer-reviewed sources for mechanisms and equations, but preserve their
   population and measurement limitations.
5. Keep licenses and attribution in the product release checklist.
6. If a source is blocked or inaccessible, mark the claim unresolved instead of
   silently substituting a secondary summary.
