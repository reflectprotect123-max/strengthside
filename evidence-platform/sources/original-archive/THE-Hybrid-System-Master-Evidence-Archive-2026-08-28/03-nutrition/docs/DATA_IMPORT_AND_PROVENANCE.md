# Food data, import, provenance, and licensing

## 1. Source strategy

Use separate source families for separate jobs:

| Source | Best use | Identifier | Barcode | Main limitation |
| --- | --- | --- | --- | --- |
| Open Food Facts | Packaged/branded products and barcode lookup | Product barcode/GTIN | Yes when present | Contributor-entered data varies in completeness and quality; licensing obligations must be respected. |
| FSANZ AUSNUT | Australian generic foods and survey foods | FSANZ food code | No | Generic composition values are not a branded package label. |
| FSANZ AFCD | Australian food composition and nutrient reference data | AFCD food code | No | Official composition database; not a complete branded barcode catalogue. |
| NUTTAB 2010 / older AUSNUT | Compatibility with historical source files | Source food code | No | Legacy layouts and naming need explicit parser fixtures. |

The current importers intentionally do not merge values from different source
families into one “best guess” row. A later search index may rank sources, but
the underlying source identity remains visible.

## 2. Open Food Facts pipeline

### Accepted input modes

* API mode with an Australia country filter and a post-filter for the
  `australia`/`en:australia` tag;
* local newline-delimited JSON, optionally gzip-compressed, from a dump or
  previously downloaded API output.

### Required source fields

* `product_name` or English fallback;
* `brands`;
* `code`;
* serving-size text;
* `nutriments` values for energy, protein, carbohydrate, and fat;
* country tags.

The importer skips missing barcode/name/macro rows, keeps only Australia-tagged
products, de-duplicates barcodes by default, and prints counters. It uses kcal
when supplied, converts kJ only when kcal is absent, and keeps the original
numeric nutrient map in JSONB.

### Serving rules

* Parse explicit mass/volume values such as `40 g`, `250 ml`, `1 oz`, or
  `1 kg`.
* Normalize compatible mass/volume units to grams or millilitres.
* If the source only says “1 bar”, “1 cup”, or another unit without an explicit
  mass/volume, fall back to the source basis (`100 g` or `100 ml`) and set a
  quality flag.
* Never infer a density conversion between millilitres and grams.
* Store both `nutrition_basis_*` and serving fields so UI can explain scaling.

### License and redistribution

Open Food Facts states that its database is released under the Open Database
License (ODbL). Attribution and share-alike obligations must be reviewed with
the current terms before distributing a database containing OFF data. The
application must preserve source attribution and must not assume that combining
OFF with another database makes the combined database freely redistributable.
Use the official terms, not a third-party summary, for the final release
decision.

## 3. FSANZ pipeline

The current FSANZ pages publish Excel files for current AUSNUT/AFCD releases.
The importer reads `.xlsx` with the Python standard library and accepts CSV,
TSV, and older NUTTAB-style exports. Binary `.xls` must be converted to an
accepted format before import.

### Current source choices

At the 2026-08-03 research pass:

* AUSNUT 2023 contains 3,741 foods and includes food details, nutrient
  profiles, measures, and Australian Dietary Guidelines profiles;
* AFCD describes 1,588 foods and up to 268 nutrients on its current page;
* current FSANZ download pages publish data-file links and update dates.

Pin the exact downloaded filenames, URLs, release date, retrieval timestamp,
and SHA-256 digest in a local import manifest. Do not rely on a page’s current
default file forever.

### Required extraction

* food code and food name;
* energy, converted from kJ to kcal when the source unit is kJ;
* protein, carbohydrate, and fat in grams;
* source-supplied standard measure when its mass/volume is known;
* full numeric nutrient profile in JSONB where available.

Generic rows use `barcode = NULL` and `external_id = source food code`. Missing
measures fall back to `100 g` or `100 ml` according to source basis, without a
guessed household-unit weight.

FSANZ licensing/user terms and data-quality notices must be reviewed before
commercial redistribution. The source describes food composition values as
estimates/averages with natural variation; the app should not display them as
laboratory measurements for a particular package.

## 4. Canonical database representation

The enhanced `foods` row contains:

```text
name, brand, barcode, serving_qty, serving_unit,
calories, protein_g, carbs_g, fat_g,
source, external_id,
nutrition_basis_qty, nutrition_basis_unit, serving_size_text,
nutrients jsonb, ingredients_text, allergens, categories, countries,
image_url, source_url, source_updated_at, data_quality
```

The original 11-column contract remains available through `--legacy-schema`.
New code should use the enhanced form.

## 5. Reproducible import protocol

For every import run, record:

1. source family and release/API endpoint;
2. source file name and SHA-256 digest;
3. retrieval time and parser version/commit;
4. command-line arguments;
5. rows read, rows written, and skip counters by reason;
6. source/license attribution;
7. target schema/migration version;
8. output SQL digest and row count.

Generated SQL is disposable output and is ignored by Git. Load it with a
service-role/admin connection or controlled migration runner; never put that
credential in Android. Before production, add a staging/upsert path so reruns
are idempotent instead of relying on a clean database.

## 6. Data-quality policy

Recommended quality states:

* `source_complete` — required values supplied in a compatible unit;
* `energy_converted_from_kj` — energy conversion performed with 4.184 kJ/kcal;
* `serving_fallback_to_source_basis` — no compatible explicit serving measure;
* `user_entered` — entered by the user;
* `ocr_pending_review` / `ai_pending_review` — machine proposal not accepted;
* `source_conflict` — duplicate sources disagree materially;
* `deprecated` — source row should no longer be offered by default.

Do not reduce “missing” to `0`. A missing micronutrient stays absent and is
excluded from a percentage calculation.

## 7. Search/index policy

Exact barcode lookup must be deterministic. Name search may use normalized
lowercase names, brand, token matching, source priority, locale, recency, and
user history. Search ranking must never alter the stored nutrient values.

When two source rows share a barcode, show the conflict or apply a documented
source-priority rule with a visible provenance link. Never silently average
label values across products.
