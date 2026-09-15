# HYBRID S&C — one install, two lockers

**Date:** 2026-09-15  
**Status:** Draft for owner review (chrome + hallway approved in chat; calendar both-ways locked)  
**Product name:** **HYBRID S&C**  
**Approach:** One Capacitor install, two HTML houses, Me hallway toggle. Do not merge loggers.

Approved in design chat: always boot Strength; Home wordmark HYBRID S&C with Strength | Engine status line; Me locker card; one login; separate notebooks; week marks go **both ways** without overlapping workouts.

---

## ELI5

One app on the phone. Two rooms, thick wall, one key.

- Gym room = lifts (Strength).
- Track room = conditioning (Engine).
- Front door is always the gym.
- Me → Engine walks the hallway to the track. Me → Strength walks back.
- Squat notebook stays in the gym locker. Row notebook stays in the track locker.
- The week strip is a sticker chart: copper = I lifted that day, teal = I did Engine that day. Both stickers can sit on Tuesday. They are not the same workout.

---

## Chrome (locked)

| Surface | Rule |
| --- | --- |
| Phone label / HTML title | `HYBRID S&C` |
| Store / Capgo id | Keep `com.hybrid.athlete` this slice |
| Home mark | `TH` + **HYBRID S&C** |
| Home subtitle | `Strength \| Engine` — current locker full white, the other muted. **Not tappable.** Switch is Me only. |
| Strength Home | Existing gym Home (Create session, no Engine zone card) |
| Engine Home | Existing Engine Home (Today’s zones, no gym Create session) |
| Me | Card **HYBRID S&C**, copy “One login. Strength and Engine stay in their own lockers.” Two buttons Strength \| Engine (active = filled white). Then existing App / OTA / sign-in / WHOOP. |
| Sign-in lead | One email/password for HYBRID S&C. After sign-in, land Strength, blank slate. |
| Cold open | Always Strength HTML, even if last session was Engine |

Throwaway previews (not product): Home Strength/Engine and Me Strength/Engine screenshots from 15 Sep chat.

---

## Hallway (locked)

One native shell. Both HTML trees ship in **one** Capgo bundle (do not `location` off to a random live URL).

| Event | Behaviour |
| --- | --- |
| Boot | Load Strength house |
| Me → Engine | Persist locker on the signed-in user, load Engine house |
| Me → Strength | Persist locker, load Strength house |
| Auth | Shared Supabase session. Sign in once. Sign out leaves the building |
| Strength cloud | Domain `strength_side` only |
| Engine cloud | Domain `engine_side` only |
| Brain | No `decideNext` across kinds. Strength logger stays Strength. Engine logger stays Engine |
| WHOOP | Unchanged this slice (`s:` vs `u:`). One WHOOP is a later job |
| Coach | Out of scope |

Hallway state is `user_metadata.hybrid_sc` = `strength` \| `engine`. That is not a workout. Cold open still ignores it and boots Strength.

Engine HTML lives in `Engine-side-`. Strength HTML lives in `strengthside` `apps/athlete/`. Both get the same chrome + Me card so the hallway can walk both directions.

---

## Calendar — both ways, no overlap (locked)

The week strip is **shared as a map of days**, not as a shared session list.

**Marks (both houses, Home + Training week):**

- Copper (or existing Strength dot) = this date has Strength / lift occupancy.
- Teal (or existing Engine accent) = this date has Engine occupancy.
- Tuesday may show **both** marks. That is two stickers, not one merged session.

**Occupancy** = that domain has a session or library assignment for that ISO date. Marks are date keys only — not sets, watts, templates, or logs.

**Open a day:**

- In Strength: only Strength plan/sessions for that date. Engine work is invisible as a workout.
- In Engine: only Engine plan/sessions for that date. Lifts are invisible as a workout.

**Do not:**

- Merge templates or loggers onto one calendar event
- Copy Engine pieces into `strength_side` or lifts into `engine_side`
- Let one dot mean “hybrid session”
- Stack two sports into one Start Session

**How to read the other locker without mixing notebooks:** each house may read **the other domain’s date keys** (or a tiny occupancy projection) to paint the second sticker. It must not hydrate the other house’s session payload into `S.library` / `S.sessions`.

---

## Out of scope

- Third hub / door screen
- Merging `app.js` into one room flag product
- Changing Android application id
- Coach product
- Nutrition
- One WHOOP token
- Restoring deleted prototype/hybrid-app

---

## Done when

1. Cold open = Strength Home, wordmark HYBRID S&C, Strength lit on the status line.
2. Me → Engine = Engine Home, same wordmark, Engine lit, zones card still there.
3. Me → Strength = gym Home again.
4. One sign-in unlocks both houses.
5. A lift never appears as an Engine logger page; an Engine piece never appears as a Strength set grid.
6. Week strip in **both** houses shows lift days and Engine days as **separate** marks; same day can hold two marks; opening the day still only plays that house’s work.

---

## Implementation note (not this spec’s job)

After this spec is approved, use `writing-plans` for the build plan. Design skills for chrome: existing OLED shell, `brand` / `frontend-design` / `ui-ux-pro-max` only to match the locked Home + Me cards — do not restyle Training or loggers.
