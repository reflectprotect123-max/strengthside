# The Hybrid Engine / StrengthSide handoff

Prepared 5 October 2026 (Australia/Sydney). This is a skills export and project-context handoff, not an app backup or release.

## Start here

The user wants a dependable personal conditioning engine. Preserve the current interface and working app. Do not redesign, modify, merge, or publish the app without a fresh instruction. The latest authorized task is packaging the skills and this handoff. The user prefers concise, plain language and dislikes repeated confirmation or unverified setup advice.

Read README.md and SKILL-INVENTORY.csv. Skills are instructions and supporting tools; copying them does not install browser-control capabilities or grant account access. Apply only the relevant skills and keep the user's instructions ahead of skill defaults. Do not start a replica build merely because the Replica pack is present.

## App and repository

- Main repository: https://github.com/reflectprotect123-max/strengthside
- Active checkout in this environment: /workspace/strengthside-daily-checkin
- Current branch at packaging: codex/engine-web-cloudflare
- Current HEAD: bfac04ebcdc6febe7e7ca11c12a77013a482e29b
- Existing second checkout: /workspace/strengthside. It contains the broader installed design-skill collection.
- Main HTML: apps/athlete/conditioning/index.html (also source.html; inspect build scripts before editing).
- Hosted web source: apps/engine-web; standalone local web checkout: /workspace/hybrid-engine-web.
- Web address previously deployed: https://hybrid-engine-web.pages.dev
- Android updates use Capgo; the hosted browser build uses Cloudflare Pages direct upload. These are separate publishing operations; publish shared changes to both only when authorized.
- Last reported Android release was 1.1.11 on engine-html. This export has not rechecked remote channel status.
- Prior PRs: https://github.com/reflectprotect123-max/strengthside/pull/234 and https://github.com/reflectprotect123-max/strengthside/pull/235. They were previously open; check current status before making claims or merging.
- Pre-existing changes include a modified native-plugins.js, Replica skill folders, and untracked dependency links. Preserve them; inspect git status rather than resetting.
- Existing Supabase backend supports account/auth/sync. Do not create a duplicate backend or request secret values in chat. Initial web WHOOP OAuth return and new-user signup were previously incomplete/unverified; confirm before claiming readiness.

## Product constraints

- Conditioning engine only; no community and no coach app features.
- Keep the user's branding and established app colours.
- Methods remain organized as Blue / Green / Red (low / medium / high).
- Current base phase: two conditioning days weekly, 80–100 minutes in Blue; no prescribed medium/high work.
- Recovery-adjusted zones freeze at workout start. They must not drift during that workout.
- Current zone boundaries should primarily appear on the main screen; avoid duplicate setup and progress controls.
- Missing wearable data must not stop training. Allow easy/medium/hard reporting and distinguish measured exposure from estimates.
- Short HR gaps may be estimated under bounded rules; long gaps must not be fabricated as recorded HR.
- Strength-only sessions produce zero cardio-zone minutes; mixed workouts count only explicit cardio segments.
- Keep the adaptive brain small, explained, and stepwise. Automatic progression has not been authorized for release.
- Bedtime questionnaire scope: fatigue 1–5, nutrition quality 1–5, number of alcoholic drinks. Sleep hours should come from WHOOP rather than duplicated manual entry.

## Morpheus evidence

Preserve the exact labels CONFIRMED, HISTORICAL, INFERRED, and STRENGTHSIDE-DESIGNED. Undisclosed details can remain UNKNOWN. Do not claim proprietary Morpheus formulas were recovered.

The user supplied a substantial research handoff earlier. It distinguishes HRV-led daily capacity, dynamic zones, and weekly progression gates. Current product descriptions are evidence; historical screenshot regressions are calibration clues, not universal production formulas. StrengthSide's proposed constants and original equations must remain STRENGTHSIDE-DESIGNED. Check existing repo research for the full sources and don't replace it with invented certainty.

## iPhone / Bluefy findings

The user uses Android; their partner uses iPhone. Bluefy has connected to her WHOOP HR broadcast on the real phone. The app has a hosted web shell and a Home Screen shortcut can open it in Bluefy using:

bluefy://open?url=hybrid-engine-web.pages.dev

This is a launcher, not a Safari standalone PWA. Safari Home Screen mode does not provide the same BLE access.

Real-device test: after locking, elapsed time continued/caught up, HR did not appear to populate, the app reported disconnection, and automatic reconnect did not occur. Therefore locked-screen HR recording is not verified and should not be described as reliable. A timer catching up does not prove samples were received during suspension.

Bluefy's official App Store release notes describe an Allowed BLE peripheral manager for background connection, bluetooth.setScreenDimEnabled, BLENative.notifyAppState, and background disconnection notifications. The user identified an Always On option; whether enabling it fixes continuous recording is still unverified. Do not invent its precise menu path or assume background BLE means JavaScript callbacks always execute.

Potential next implementation, only if requested: feature-detected Bluefy keep-awake support; fresh-packet monitoring; bounded reconnect attempts; re-subscribe on resume; durable saves; honest gap reporting. The current Android keep-awake/foreground-service path is native-only. A native iOS recording layer with Capacitor/CoreBluetooth is the stronger background route, but paid Apple membership/build requirements were discussed and no implementation was authorized.

## FBB / Replica research and browser blocker

Target: Functional Bodybuilding, https://fbb.apprabbit.co/. User wants the assistant to explore it, use Replica skills, and study features/flows with the user's own branding. Focus on workout experience, logging/history/progress; do not copy licensed training content or proprietary source/assets.

Replica pack: https://github.com/Jakeschincariol/replica-skill, fetched commit 77c9436fb3d18c3d58169efb8caf4fe906b0dc51. Eleven skills installed in the active project's .agents/skills. Upstream tools passed 57 unit tests at installation. No app build was started.

The in-app FBB browser tab was opened and successfully attached by the user through the Browser plugin. However, this cloud session continued to receive only the ambient URL/tab reference and open_in_codex; it had no DOM, click, screenshot, or CDP browser-control tools. Enabling CDP, installing an extension, and moving chats did not establish access. Do not repeat these unverified setup instructions or claim the assistant can see private screens.

At the final capability check, no browser-control tools were available. Any new session must inspect its actual tools before promising access. The open_in_codex tool opens panels; it does not inspect their contents. Skills and browser mentions do not automatically grant capabilities.

Reference documentation: https://learn.chatgpt.com/docs/browser?surface=app. It describes @Browser for the built-in browser and @Chrome for connected Chrome. A matching user-reported Windows issue is https://github.com/openai/codex/issues/41301; this is a reported symptom, not proof of the root cause or a confirmed fix.

Public FBB research started with the official collection:
https://intercom.help/functional-bodybuilding/en/collections/14419891-the-fbb-app

Its article list includes login/password reset, logging/updating results, finding past results, toggling tracks, charting progress and Apple Health integration. These topics were observed in the collection; individual article details and authenticated layouts have not all been reviewed. A completed recon map/feature matrix has not been produced. Continue public research honestly or inspect authenticated rendered pages only if supported browser tools become available.

## Expectations for the next assistant

The repeated browser setup detour was frustrating for the user. State what is actually available, do the work you can substantiate, and don't claim success from a URL or successful tool installation alone. Avoid asking the user to document the whole product or offering another speculative setup. No passwords, tokens, cookies, signed-in sessions or credentials are included in this export.

Packaging complete does not authorize further app work. Wait for the user's next objective.
