# TrainHeroic coach web — authoring, assign, review spec

Scope: Library (programs + session builder + exercises), Assign/publish, Coach Home feed, Athletes/Teams calendars.

Not in this dump: athlete today/logger, rest timer, phone athlete shell, marketplace, billing, messaging, video upload, analytics reports, gym tools, APIs, TrainHeroic brand/copy/program content to reuse.

Source: live coach web as Coach veldman, desktop Chrome, 2026-08-26/27. Nothing was saved, assigned, published, or commented.

Screenshots: 222 PNGs in `screenshots/`, numbered in capture order (`001_…` → `222_…`), plus two extra home/grid shots prefixed `000_`. Use the numbered set as the visual record; this doc is the field/button list.

Coach web is a **desktop layout**. No coach-mobile breakpoint observed around 1024px.

---

## How the coach loop actually works (observed)

1. Build **session templates** in Library (lettered blocks, prescriptions).
2. Drop those onto a **program grid** (weeks × Day 1–7).
3. **Add From Library** (or Assign) stamps them onto an **athlete calendar** or **team calendar**.
4. Calendar chips start **UNPUBLISHED**. **Publish** / **Publish All** makes them live. Published chips can **Unpublish**. Edits sit unpublished until you publish again. (Did not click Publish.)
5. Athletes log in the athlete app (out of scope). Results show on **Coach Home**.
6. Coach expands a card, compares prescribed vs actual, leaves a **Session Comment**.

Changing a program cell after assign: **not observed as a warning on the program grid**. What *was* observed: calendars have an explicit unpublished vs published state, so calendar edits do not go live until Publish. Do not assume program-grid edits rewrite already-stamped sessions.

No **compliance / adherence %** label on Home. Closest signal is **Blocks x/y**.

---

## A. Coach Home (collapsed)

**Screen name:** Coach Home  
**Purpose:** Dated feed of athlete sessions so the coach can scan who trained and jump into a session.  
**URL:** `coachapp.trainheroic.com/`

**Controls**
- Left nav: Coach Home, Athletes, Teams, Library, Analytics, Gym Tools, Support
- Top: “Welcome back, Coach …”, Manage Assistant Coaches / Manage Assistants, messages (badge), notifications (badge), profile
- Filter dropdown: **All Athletes** / **1:1 Athletes** / **New Members** / **Me** / team **hybrid training system.**
- **Latest** button (feed mode)
- Calendar icon → date mode (2-month picker, prev/next day, Latest to return)
- **Expand all cards** toggle (hides per-card See More when on)
- Athlete name (link) → athlete
- **See More** / **See Less**
- **Session Comment** (full-width blue)

**Fields on a collapsed card**
- Avatar
- Athlete name (optional “New 👋”)
- Session title (e.g. Week 1 Day 1)
- **Blocks** — x/y donut (example 3/5)
- **Readiness** — number or –
- **Minutes** — number or – (example 60 on another card)
- **Intensity** — number or –
- **Volume** — KG (example 799 KG). Unit follows coach setting.
- Dashes mean not logged

**Empty state (date/filter with no logs):** “No logged sessions found — Try a different combination of filters to see ath[lete activity]”

**Right rail:** Needs Programming — “All Clear! There are currently no teams or athletes in need of programming.”

**Not observed:** adherence/compliance percentage.

---

## B. Coach Home (expanded card + comment)

**Screen name:** Coach Home, expanded session card  
**Purpose:** Prescription vs what was logged, then comment.

**Expanded body**
- Block category headers: WARM UP, STRENGTH/POWER, CONDITIONING, etc.
- Letters: A, B, C, **D1/D2 supersets (paired)**, E
- Badge colour: green = completed, amber = partial, hollow/grey = not logged
- Prescribed **struck through** (`3 x 10-12`) with **bold actual** under it (`2 x 12 @ 70,75kg`)
- Per-set actuals as comma lists (`8,8,6 @ 80,100,105kg`)
- Scoring tag **For Completion** (link, blue) on completion-scored blocks
- Free-text prescriptions sit under the letter (`2-3 x E5OM`, farmers carry, etc.)

**Session Comment drawer** (opened, not sent)
- Shows team badge + session name + the session
- Composer: **GIF** button, text placeholder “Comment on Week 1 Day 1”, **Send**
- Close without sending

**What shows on the feed:** sessions that are completed **or** have logged work. Status `completed` / in-progress with results. A date with no logs shows the empty copy above. Not “scheduled only.”

---

## C. Library — Programs list

**Screen name:** Library → Programs  
**Purpose:** Find programs, open the week×day grid, assign.

**Controls / fields observed (Library chrome)**
- Tabs: **Programs · Sessions · Exercises · Circuits · Prescriptions**; More → Parent Calendars, Team Subscriptions
- Search
- Per program: title, **Assign** link
- Open program → grid at `coachapp.trainheroic.com/program/<id>` (builder also at `builder.trainheroic.com` for session templates)

**Folders / copy program:** folder+ icon on the program header (copy / save to folder). Exact menu labels are in the screenshots. Do not invent extra folder taxonomy beyond what the shots show.

---

## D. Library — Program builder (week × day)

**Screen name:** Program view (example title “1 Week Program”)  
**Purpose:** Lay sessions onto weeks × Day 1–7.

**Header controls**
- Editable program title
- **Eye** — preview / view options
- **Folder+** — copy / save to folder
- **Gear** — program settings (open, do not save)

**Grid**
- Columns DAY 1 … DAY 7
- Rows WEEK 1, WEEK n
- Empty cell: blank white (no “empty” placeholder copy on the grid itself)
- Populated cell: session card (TH mark, title e.g. “Week 1 Day 4”, kebab, block letter A, exercise name, “3 Sets”)
- Cell kebab (…) — copy / move / delete / save as template (see shots)
- Empty days on **calendars** (not this grid) show **EDIT** + **ADD FROM LIBRARY** or open Add From Library. On the **program grid**, empty = just empty.

**Add week / naming:** title is an editable text field on the header. Add-week control is on the program (see shots). 

**Program settings (gear, leave without saving):** record from screenshots. Observed in an earlier pass that settings exist as a form; use the gear-open shots rather than guessing field names not listed here.

**After-assign edit:** no warning dialog observed on the program grid. Publish/Unpublish lives on **calendars**, not on this grid.

---

## E. Assign / publish

**Assign (from Library program → Assign)**  
**Purpose:** Stamp a program onto a team (or athlete).

**Observed**
- Assign picks a **team** (team-first)
- Individual/1:1 exists as a Home filter (“1:1 Athletes”) and athlete calendar can Add From Library per person
- Start date / Monday: assign flow uses a date; calendars are month views
- Did **not** confirm a mutating assign on this pass

**Publish (observed on team calendar — this is the real “go live”)**
- Chip can show **UNPUBLISHED**
- **Publish All** greyed when nothing unpublished; **blue/enabled** when an unpublished chip exists
- Unpublished chip kebab: **Publish / Preview / Edit / Save to Library as… / Repeat / Copy / Delete**
- Published chip kebab: **Unpublish / Preview / Edit / Save to Library as… / Repeat / Copy / Delete**
- Duplicate-session: earlier pass, assign skipped if the same template already exists for that athlete on that date (domain rule). UI copy for duplicates was not popped on this pass because assign was not confirmed.

**Add From Library drawer** (empty day on athlete calendar)
- Tabs: **PROGRAMS / SESSIONS / PARENT CALENDARS**
- Search For…
- No **Create Session** on athlete calendar empty-day (unlike some team-calendar empty days which also show EDIT)

---

## F. Library — Session builder

**Screen name:** Session editor (builder.trainheroic.com / library session)  
**Purpose:** Author lettered blocks and exercise prescriptions.

**Session-level**
- Session title
- Coach instructions / session notes (placement: session form, above or beside blocks — see shots)
- Blocks A–G (add more via add-block)

**Block**
- Letter (A, B, C, D1/D2 if superset)
- **Category** dropdown: Uncategorized, Prep, Speed/Agility, Skill/Tech, Strength/Power, Conditioning, Recovery
- Scoring: **For Weight** / **For Completion** (circuits/conditioning use For Completion)
- Notes (rest, EMOM, carry text lives here)
- Kebab: **Test This Block** / **Delete**
- Trophy/PR control present on strength blocks (see shots)

**Exercise row**
- Exercise name (opens exercise picker)
- Sets × reps (ranges allowed, e.g. 10-12; lists 8,8,6)
- Load
- **Metric column** dropdown (open full list in screenshots). Options seen in the builder include: **Reps, Weight, Time, Distance, RPE, Watts**, plus further rows in the scrolled list — treat the screenshot of the open dropdown as canonical, not this sentence.
- Video attach affordance on published/results view

**Exercise picker**
- Equipment / category filters
- **NEW EXERCISE**
- Scope: ~2500+ library rows; TrainHeroic-branded H = built-in, plain = custom
- Cancel without adding

**Conditioning / circuit**
- Present. For Completion scoring, circuit block type, notes-driven prescriptions (E5OM, timed row/bike). Documented on both library sessions and expanded Home cards.

**Validation:** Save Exercise (create-exercise drawer) stays **disabled until Title** is filled. Session builder save rules: see shots (do not invent).

---

## G. Library — Exercises (medium)

**Screen name:** Library → Exercises  
**Purpose:** Catalog of movements used in the builder.

**Scope:** **All Exercises** (2,528, includes SUPERSET type rows) / **My Exercises** (403, type EXERCISE)

**Columns:** checkbox, thumbnail, Title, Type, Video, Points of Performance, Suggested Swaps, Tags, Created By

**Toolbar:** delete (disabled until selection), Search (live; “squat” → 196), **Create Exercises**, Library Settings gear

**Footer:** rows per page 100, “1–100 of N”, prev/next

**Create Exercise drawer** (cancelled, not saved)
| Label | Type | Required | Default / notes |
| Title | text | yes | Save disabled until filled |
| Parameter 1 | select | yes | default Reps |
| Parameter 2 | select | no | default Weight (lb) |
| Video | URL | no | youtube/vimeo, “No Video.” |
| Suggested Swaps | picker | no | 0/3 |
| Points of Performance | text | no | 0/10000 |
| Tags | chips | no | |
| Reference Max | field | no | |
| Track As | field | no | |
| Cancel / Save Exercise | buttons | | Save disabled without Title |

---

## I. Athletes → athlete calendar

**Screen name:** My Athletes → athlete calendar  
**Purpose:** Roster, then one athlete’s month of sessions.

**List columns:** checkbox, Athlete Name (sortable), Actions (calendar / message / progress), Athlete Type (“Coach Plan”), Teams, Tags (“Add Tags”), Days Since Last Login

**Filters**
- GROUP: All Athletes / Athletes not on a Team / Athletes on a Team / hybrid training system. / Train HYBRD (program)
- STATUS: Active / Invited / Archived
- Bulk: Remove From Teams, Archive (greyed until selection), Invite Athletes, page kebab

**Athlete calendar** `/athlete/<id>/<yyyy>/<m>`
- Avatar + name dropdown, month ‹ ›
- Message Athlete
- **Publish All** (grey until unpublished exists)
- Eye: **Show Instructions / Show Block Titles**
- Folder+: Add From Library
- Clock icon
- Empty month: blank cells, **no placeholder copy**
- **Any empty day opens Add From Library** (PROGRAMS / SESSIONS / PARENT CALENDARS). No Create Session here.

---

## J. Teams → team calendar

**Screen name:** Teams → team calendar  
**Purpose:** Team month view, publish, edit, add from library.

**List columns:** Title (+owner), Planned Sessions, Difficulty (Intermediate), Athletes, Focus, Created, Actions (calendar, message, gear, kebab)

**Row kebab:** Invite Athletes / View Athletes

**Create Team dialog** (opened accidentally, cancelled): Team Name (0/75), Cancel, Create Team **disabled** until name filled

**Team settings** `/team/<id>/settings` (left without saving)
- Tabs: General, Access Codes
- Team Name
- Team Owner (select)
- Sport/Focus Interest (searchable; marketplace-filter copy)
- Program Difficulty (Intermediate)
- Logo Image 300×300 (placeholder unless uploaded)
- Save & Close

**Team calendar** `/team/4933295/2026/8`
- Same toolbar as athlete calendar + extra gear (opens team settings)
- Click day → cell expands: block list, **EDIT**, **ADD FROM LIBRARY**
- Session chips: unpublished label vs published
- Published chip can show completion 1/1 plus dash metrics and blocks A–E with D1/D2
- Chip kebabs: see Assign/publish section

---

## Field tables for v2 (build from this, don’t guess)

### Program builder
| Field / control | Type | Required |
| Program title | text | yes (always has a name) |
| Week rows | add week | |
| Day 1–7 cells | session card or empty | |
| Cell kebab | menu | |
| Eye / folder+ / gear | header icons | |
| Assign | link/button from list | |

### Session builder
| Field | Type | Notes |
| Session title | text | |
| Coach instructions | textarea | copies onto assigned sessions |
| Block letter | auto A, B, D1/D2 | |
| Block category | select | 7 categories listed above |
| Scoring | For Weight / For Completion | |
| Block notes | textarea | EMOM, rest prose |
| Exercise | picker | |
| Sets × reps | text | ranges and lists allowed |
| Load | text | lists allowed |
| Metric | select | full list in dropdown screenshots |
| Superset | toggle/pairing | D1/D2 |
| Add block / add exercise | buttons | |

### Assign / publish
| Control | Does |
| Assign (library) | pick team, stamp program |
| Add From Library | stamp program/session/parent calendar onto a day |
| Publish / Publish All | unpublished → live |
| Unpublish | live → unpublished |
| Repeat / Copy / Delete / Save to Library as… / Preview / Edit | chip kebab |

### Home card
| Metric | Meaning |
| Blocks x/y | work blocks completed |
| Readiness | athlete check-in or – |
| Minutes | duration or – |
| Intensity | or – |
| KG | volume in coach unit |
| Prescribed | strikethrough |
| Actual | bold under it |
| Session Comment | drawer, GIF + text + Send |

### Create exercise
See table in section G.

---

## Screenshot index

All captures are chronological in `screenshots/001_*.png` … `screenshots/222_*.png`.

Early numbers: Home, Library, program grid, session builder, assign/dialogs.  
Middle: exercises, create-exercise drawer, roster.  
Late: athlete calendar, Add From Library, team calendar unpublished/published, Home expanded, Session Comment, filters, empty feed.

Two extras:
- `000_coach-home-collapsed.webp`
- `000_program-grid.webp`

---

## Still not observed (do not invent)

- Exact program-settings field list in prose (use gear screenshots)
- Complete metric-dropdown option list in prose (use the open-dropdown screenshots)
- Duplicate-assign toast copy (assign not confirmed this pass)
- Whether editing a **program grid cell** rewrites already published calendar sessions
- Coach native mobile app
- Compliance % widget
