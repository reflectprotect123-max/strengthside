# Handoff: ARC Coach Bench

## Overview
Coach-facing workspace ("ARC — Coach workspace", brand: THE HYBRID SYSTEM) for a strength & conditioning coaching product. It covers: a Command Center (per-athlete overview), Readiness pillar (recovery gauge + biometric trends), Conditioning pillar (zone minutes, HR-zone donut, erg trends), a Library month calendar for scheduling sessions, a full Session Builder (exercise blocks with sets/metric tables, supersets, save-to-library, publish), and an Analytics report launcher.

## About the Design Files
The files in this bundle are **design references created in HTML** — interactive prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these designs in the target codebase** — the intended target is the existing repo `reflectprotect123-max/THE-HYBRID-ENGINE1` (React + Vite, `apps/web/src/coach/`), using its established patterns, routing, and `packages/design/src/tokens.css`. The prototype's palette was lifted from that tokens file, so most colors map 1:1 to existing CSS variables.

## Fidelity
**High-fidelity.** Recreate pixel-perfectly. Exact hex values, sizes, and copy are specified below and in the HTML source (`ARC.dc.html` — all styles are inline, so every value is readable in place).

## Design Tokens
- Background (page): `#070706`; panel: `#0a0a09`; raised panel gradient: `linear-gradient(180deg,#141311,#0a0a09)`; input/menu: `#0c0c0a` / `#141311`; hover: `#1c1b18`
- Text: primary `#f5f1e9`, secondary `#aaa49a`, muted `#847d73`
- Brass accent: `#e0bc87` (bright), `#c09358` (mid); brass tint bg `rgba(192,147,88,0.09)`; brass border `rgba(224,188,135,0.22)`
- Session-builder palette (ported screen, darker steel-grey scheme): bg `#0a0c0d`/`#0d0f11`/`#101214`, borders `#24272b`/`#2b2f33`/`#1c1f22`, text `#f2f1ee`/`#9a9c9e`/`#6f7276`/`#55585c`, brass `#a9803f`/`#c2974e`/`#9c7136`, red `#f0625f`, green `#3ecb6a`
- Status: good `#9fc59b` / `#3ecb6a`, warn `#d1a464`, bad `#cf7f7c` / `#f0625f`; conditioning blue `#33c4ff`
- HR zone colors: Z1 `#33c4ff`, Z2 `#3dff9e`, Z3 `#ffc24d`, Z4 `#c09358`, Z5 `#ff5b57`
- Font: Inter (500/650/750/800/900), fallback system-ui. Mono accents: IBM Plex Mono (dates, character counters)
- Radii: cards 18px, tiles/inputs 10px, small controls 8px, pills 999px. Border hairline: `rgba(255,255,255,0.1)`, subtle `rgba(255,255,255,0.065)`

## Screens / Views

### 1. App shell
- Top bar: 28px logo square (brass tint bg, "A"), eyebrow "THE HYBRID SYSTEM" (9px, letter-spacing 0.2em, `#c09358`), title "ARC — Coach workspace" (13px/750). Right: client select (Dan Veldman, Carolyn Purvis, You).
- Left rail 180px, bg `#0a0a09`, right hairline. Items: Command Center, Readiness, Conditioning, Library, Analytics. Active: bg `#141311`, hairline border, 4px brass dot; inactive text `#aaa49a`.
- Content bg: `#070706` with faint brass radial glow top-left.

### 2. Command Center (home)
- Client select + heading "Dan Veldman" (19px/800) + meta "Week 3 of 8".
- Pillar tile grid `repeat(auto-fill,minmax(240px,1fr))`: icon square 38px (brass tint), eyebrow (9px uppercase), name (16px/750), status dot + label right-aligned, chevron. Tiles: Readiness (high, green), Conditioning (1 pending, red), Nutrition (2 exceptions, amber).
- "This week" card: 7-column strip MON–SUN; logged days brass-tinted with "Logged", rest "—"/"Rest".

### 3. Readiness
- "← Back" link. Hero card (radial `#1c1b18` → `#0a0a09`): 192px SVG gauge — brass bezel ring (gradient stroke), 72r progress ring (stroke 11, `#3dff9e`, dasharray 452.4), needle line + hub, centered "71%" (42px/900) over "RECOVERY". Below: readiness band slider — 6px gradient track (red→amber→green) with white 15px thumb at 74%, label "High" green.
- 2×2 trend cards: HRV 62 ms (+4), Resting HR 48 bpm (−1), Sleep performance 88% (+6%), Strain 13.2 (+1.4). Each: icon + uppercase label, 25px/800 value, delta line in green/neutral.

### 4. Conditioning
- "Now / Progression queue" banner (brass tint bg + brass border): count right, empty-state copy.
- Hero card, two halves split by hairline: left — "84 min" (40px/900, `#33c4ff` with glow) "LOGGED THIS WEEK", stacked zone bar 14px (Easy `#5b8def` / Moderate `#cf9d4f` / Hard `#e0524d`), legend Easy 42m / Moderate 28m / Hard 14m; right — "TIME IN HR ZONE · % of max HR", 132px donut (5 arcs, stroke 15, colors above, center "84 / MIN TOTAL"), legend rows: name, range, minutes · percent.
- "Erg trends" card: 2000m row 6:52, "−3s · 8-test trend" green.

### 5. Library (calendar)
- Eyebrow "ARC · library", heading "Build once. Coach the individual.", sub-copy. Pill toggle: Calendar (active, brass bg `#e0bc87`, text `#1b1509`) / Programs.
- Month nav ‹ › + "August 2026". 7-col grid, 1px gutters (hairline bg), header row Mon–Sun with brass underline inset. Cells min-height 88px, bg `#0a0a09`, date 11px/700.
- Session cards in-cell: brass border + tint gradient, title 10px/750, meta "PUBLISHED/UNPUBLISHED · 1 ITEM" (8px uppercase; unpublished amber).
- Empty-cell click reveals overlay with two brass links: "Create session" and "Add from library" (opens drawer).

### 6. Session Builder (day view) — ported 1:1 from the earlier Coach App prototype; steel-grey palette above; entire screen wrapped in `zoom:0.77`
- Two columns: 250px sidebar + editor.
- Sidebar: mini month (7-col, 23px circles, selected bg `#2b2f33`, brass event dot), "Session Preview" list — HTS chip, mono date, per block: lettered circle (A, A1, A2, B…), exercise name, "3 Sets".
- Header row: title (26px/700); right cluster: Save to Library (bookmark glyph + label, brass when saved), bin icon (hover red) = reset session, "Publish Session" brass gradient button (`#c2974e`→`#a9803f`; pressed state "Published", `#8d6a33`).
- HTS chip + mono date + status dot/label (Unpublished red `#f0625f` / Published green `#3ecb6a`).
- "Coach Instructions" inset textarea card (`#0a0c0d`, inset shadow) with brass `0/10000` mono counter.
- Blocks: each starts with block-name row (checkbox glyph, ▾, editable category input, right: cup glyph, "– ▾" select, ✕ remove). Between blocks: chain-link control — "LINK AS SUPERSET" (grey) toggles to "SUPERSET" (brass `#c2974e`, filled circle); linked blocks renumber A1/A2 and hide their category row, gap tightens 22px→10px.
- Block body grid `1fr 340px`:
  - Left: letter circle + exercise-name pill (inset, editable) + ≡ square; "Exercise Instructions" inset card with counter; swaps panel — "Edit Swaps ⧉" brass link, video placeholder (diagonal-stripe 82px block with play triangle), "SUGGESTED SWAPS / No swaps added yet.", "POINTS OF PERFORMANCE / No points of performance."
  - Right: sets widget — header split "3 Sets ▾" + "Save Prescription" (120px, turns brass "Saved" on click); column header row: sets dropdown (1–10), metric dropdown, optional-metric dropdown (19 metrics: Reps, Rep Range (min-max), Weight lb/kg/%/LWP+, Time (min::sec), Seconds, Distance miles/yd/ft/inches/meters, Height (inches), Calories, RPE, Watts, Velocity (m/s), Other Number; optional list adds "Optional"); numbered rows with two editable cells each; "− Sets +" brass stepper (1–12) below.
- Footer: brass gradient "Add Block" button (with ⓘ circle) appends a fresh empty block; hairline divider; outlined "Add New Session" button.

### 7. Saved-sessions drawer
- Fixed right drawer 340px over dim scrim, bg `#0a0a09`, left hairline. Header "Saved sessions" + ✕. Rows: brass "S" chip, title, "N blocks" meta, "LOAD" brass label; row hover `#141311`. LOAD deep-copies the session's blocks + coach instructions into the builder. Empty state copy: "Nothing saved yet. Build a session and hit Save to library."

### 8. Analytics
- Eyebrow "ARC · analytics", heading "Readiness, output and adherence across the roster."
- 3-col report cards: title + 2-letter brass mark chip, description, scope links (brass, underline on hover). Reports: Readiness (Single athlete/Team), Performance (Single athlete/Team), Lift history (Complete/Working max), Training summary (Single athlete/Team), Compliance (Team), Lift progress (Team).
- Clicking a scope opens an inline report panel (title, ✕, "Scope: … No logged data in range yet.").

## Interactions & Behavior
- Rail + back links navigate between views; no URL routing in the prototype (single state variable `view`).
- Calendar: month prev/next; day-cell click toggles the create/add overlay; session-card click opens the builder for that day.
- Builder: all inputs controlled; dropdown menus are exclusive (opening one closes others); superset toggle recomputes block letters live; sets count changes preserve existing row values; bin resets to one empty block; Save to Library flips to "Saved ✓" until edited; Publish toggles status dot/label and button state.
- Hover states are specified inline in the HTML (`style-hover` attributes) — mostly background lift to `#1c1b18`/`#191c1f`, brass text on links, red on destructive icons.

## State Management
- `view` (home/readiness/conditioning/library/analytics/day), `month`, `calOpen` (calendar overlay key), `dayDate`, `calDay` (builder mini-month selection)
- `blocks[]`: `{ category, name, instr, sets, metric, optional, v[], v2[], linked }`
- `coachInstr`, `published`, `savedLib`, `savedBlock`, `openMenu` (`{i, which}`), `library[]` (saved sessions: title, coachInstr, blocks), `report`
- Real implementation should persist library/sessions to the backend; readiness/conditioning numbers come from athlete biometric + logged-session data.

## Assets
No external images. All icons are CSS/SVG-drawn glyphs. Fonts from Google Fonts (Inter; IBM Plex Mono used in the builder).

## Files
- `ARC.dc.html` — the full prototype (all screens; inline styles; logic class at bottom of file)
- `Coach App.dc.html` — earlier standalone builder prototype (superseded; kept for reference)
- `support.js` — prototype runtime; needed only to open the HTML files in a browser, irrelevant to implementation
