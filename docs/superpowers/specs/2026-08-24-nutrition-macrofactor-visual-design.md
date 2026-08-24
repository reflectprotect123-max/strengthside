# Design — Nutrition visual pass 1 (MacroFactor structure × Track Dawn)

> **Status:** Locked 24 Aug 2026 (brainstorm: look & feel like MacroFactor → split A/B into two passes → pass 1 visual first → hybrid C → whole Nutrition module including Home card → approach 1 restyle-only → §§1–4 approved).  
> **Product surface:** Hybrid HTML athlete mono-app (`apps/mobile/prototype/hybrid-app/`).  
> **Follow-on:** Pass 2 = interaction feel (scan → servings → confirm flow). Out of scope here.

## Goal

Make Nutrition **look and feel denser / more MacroFactor-like in structure**, while keeping **Track Dawn** colour and type (graphite, copper, zone teal; Space Grotesk + Barlow Condensed). Restyle only — no log/scan/serving behaviour changes in this pass.

## Locked decisions

| # | Decision | Choice |
| --- | --- | --- |
| 1 | Pass split | Pass 1 = visual; Pass 2 = interaction (later) |
| 2 | Visual target | Hybrid: Track Dawn tokens + MacroFactor layout density |
| 3 | Surfaces | Whole Nutrition module: Home Nutrition card + day screen + add/confirm/barcode sheets |
| 4 | Implementation | CSS + light HTML structure restyle of existing UI (approach 1) |
| 5 | Behaviour | Unchanged — same taps, same `nutrition-ui.js` / sync / core maths |
| 6 | Ship | Dogfood APK + Netlify athlete app after cache bump |

## Non-goals

- Pass 2 interaction redesign (serving prompts beyond what already shipped, new wizards, MacroFactor clone flows)
- New nutrition features (recipes UX overhaul, adaptive check-in UI, expenditure charts)
- Palette swap away from Track Dawn / MacroFactor colour clone
- MacroTrack schema migrations in this repo
- Changing `@hybrid/nutrition-core` scale rules or Supabase sync contracts
- Restyling Engine / Strength / Sleep / Settings beyond what Nutrition Home card shares

## Architecture

```
index.html (Track Dawn tokens + Nutrition CSS)
nutrition-ui.js (markup strings for day / sheets / homeModuleHtml)
        │ sync-hybrid-html.sh
        ▼
preview-site / THE-Hybrid-App.html / Capacitor webDir
```

Edit prototype hybrid-app only; sync copies. Bump `LOCAL_BUILD` / service-worker `CACHE` so clients pick up CSS.

No new packages. No new native bridges.

## Visual design

### Tokens

Reuse existing CSS variables (`--copper`, `--copper2`, `--zone`, graphite surfaces). Do not introduce purple/glow/AI-slop patterns banned by athlete UI polish notes.

### Home Nutrition card

- One primary line: calories eaten / target, or kcal left when target exists
- Three compact rows: Protein · Carbs · Fat (eaten; show / target when set)
- Density closer to MacroFactor summary strip; colours stay Track Dawn
- Still opens full Nutrition on tap — same `onclick`

### Nutrition day screen

- Sticky (or visually sticky) top summary: date control + prominent kcal remaining (or eaten/target) + P/C/F meters or compact bars
- Meal sections (breakfast / lunch / dinner / snack): tighter rows — name + macro line, less empty chrome
- Primary Add food stays obvious; secondary actions remain secondary

### Sheets (add / search / barcode / confirm)

- Cleaner hierarchy: title, one short lead, primary CTA
- Servings + unit fields remain readable (no logic change)
- Live kcal / P / C / F preview retained
- Same button handlers (`NutritionUI.*`)

## Error handling

Visual-only. Existing alerts / empty states / scan failures stay. If a restyle hides a control, that is a bug — fix visibility, do not invent new flows.

## Testing

- Automated: existing `check:nutrition-ui`, `check:nutrition-sync`, `check:food-catalog`, `pnpm run verify` stay green
- Manual: Home card, day screen with logged entries, add sheet, barcode confirm sheet (web and/or dogfood APK)
- Evidence: screenshots or short recording of Home + day + one confirm sheet

## Success criteria

1. Athlete can glance Home Nutrition card and read kcal + P/C/F without opening Nutrition  
2. Day screen reads as one MacroFactor-like composition (summary up top, dense meal list below) without leaving Track Dawn  
3. Sheets look cleaner but every current action still works  
4. No intentional behaviour diffs in log/scan/sync  

## Out of scope reminders (Pass 2+)

- Interaction feel: barcode → servings mental model, unit chips UX, MacroFactor-like logging speed  
- Full MacroFactor feature parity (trends, expenditure, weekly weigh-in UI)
