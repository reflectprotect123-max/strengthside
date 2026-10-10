# Skills bundle — 5 October 2026

This archive contains 134 distinct local skill folders (131 original folder names, including three alternate versions) plus two cloud-plugin skill snapshots. Exact duplicate copies across the workspace have been deduplicated. Each distinct skill's supporting files are included.

## Contents

- HANDOFF.md: app context, priorities, releases previously reported, iPhone findings, and the browser-access blocker.
- skills/: local skill instructions, scripts, templates and references.
- cloud-skills/: cloud-environment-runtime and setup snapshots, with the referenced documentation exported from their provider.
- SKILL-INVENTORY.csv and inventory.json: source locations, variants, file counts and tree hashes.
- FILE-SHA256.csv: checksum for every packaged file other than this checksum list itself.

The collection includes Taste variants, Image to Code, Playwright CLI, UI/UX Pro Max, frontend design, Impeccable, many design styles, Caveman tools, Supabase skills, development/test workflows, graphify, four platform document skills, and all eleven Replica skills. The inventory is the authoritative list.

## Use in another chat

Upload this ZIP and say:

> Extract this skills bundle, read HANDOFF.md and README.md, and inventory the skills. Do not change or publish the app yet. Verify the tools you actually have before promising browser access.

The next assistant can read any SKILL.md directly even if automatic skill discovery is unavailable.

## Install into a project

1. Extract the ZIP using Windows File Explorer's Extract All, or your usual archive tool.
2. Choose the skills you need from skills/. Avoid loading all the design styles at once.
3. Copy those complete folders into the project's .agents/skills/ for Codex, .claude/skills/ for Claude, or .cursor/skills/ for Cursor as supported by that host.
4. Preserve any existing skill with the same name; compare versions before replacing it.
5. Open a new session and check discovery. If a skill doesn't appear, explicitly ask the assistant to read its SKILL.md.

Folders ending --variant-2 preserve different contents under the same original skill name. They are archive alternatives, not separate skill identities: choose one version of caveman, frontend-design, or ui-ux-pro-max and install it under its original folder name. Do not install both variants simultaneously.

Platform builtins (documents, pdf, presentations, spreadsheets) and cloud-plugin snapshots may reference host tools or bundled resources unavailable elsewhere. These are included for completeness, not a promise of portability. The cloud snapshots cannot recreate credential injection, networking policy or cloud configuration tools; use the actual Cloud Environment plugins when available. Some scripts require runtimes/tools; installing instructions is not installing those dependencies.

No app code, node_modules, authentication tokens, browser cookies or account sessions are included. No new app release, merge or deployment was performed for this export. Original skill licenses and notices within their folders remain intact; broader host/vendor repository licensing has not been independently audited.
