# Handoff — TheStrengthEngine

## Skills — install before anything else

If you opened this file because the user said "read the hand off.md", or you are starting a session by reading `handoff.md`, install the skills before any other work. Do not ask first.

```sh
node scripts/setup-cursor-skills.mjs
bash scripts/ensure-skills.sh
node scripts/setup-cursor-skills.mjs --check
```

The first command copies the saved collection from `.agents/skills` into `.cursor/skills`. It adds missing files and keeps a file that already differs. The second command restores the vendored Claude skills, the caveman hook, Graphify, and the Obsidian wiki skills. Do not run `graphify install --project`. That command edits `CLAUDE.md`.

A healthy run is the install. Report the counts. A missing skill is a failure.

This list is every skill in the checkout on 15 October 2026: 146 active Cursor skills, 3 saved alternatives, and 2 cloud snapshots. The download link is the folder in this repository. The other link is the upstream this project already recorded. Where no upstream is recorded, the folder in this repository is the download.

### Active Cursor skills (146)

| Skill | What it is | Download | Install |
|---|---|---|---|
| `agentic` | Conversational AI-first interface with minimal controls, clear outcomes, and delegated task flows for agentic workflows. | [.cursor/skills/agentic](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/agentic) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `ant` | Structured, enterprise-focused design system emphasizing clarity, consistency, and efficiency for data-dense web applications. | [.cursor/skills/ant](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/ant) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `artistic` | High-contrast, expressive style with creative typography and bold color choices for visually striking interfaces. | [.cursor/skills/artistic](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/artistic) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `autoresearch` | Run a bounded, source-grounded research loop, draft a cited dossier, and optionally propose a separately reviewed canonical vault merge. Use when the user wants | [.cursor/skills/autoresearch](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/autoresearch) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `banner-design` | Design banners for social media, ads, website heroes, creative assets, and print. Multiple art direction options with AI-generated visuals. Actions: design, cre | [.cursor/skills/banner-design](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/banner-design) · https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `npx ui-ux-pro-max-cli init --ai cursor` |
| `basic` | Print-inspired visual language for books, magazines, and reports with editorial grids and expressive typography. | [.cursor/skills/basic](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/basic) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `bento` | Modular grid layout with card-like blocks, clear hierarchy, soft spacing, and subtle visual contrast for organized, scannable interfaces. | [.cursor/skills/bento](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/bento) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `bold` | Strong visual presence with heavyweight typography, high-contrast colors, and commanding layouts. | [.cursor/skills/bold](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/bold) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `brainstorming` | You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirem | [.cursor/skills/brainstorming](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/brainstorming) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `brand` | Brand voice, visual identity, messaging frameworks, asset management, brand consistency. Activate for branded content, tone of voice, marketing assets, brand co | [.cursor/skills/brand](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/brand) · https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `npx ui-ux-pro-max-cli init --ai cursor` |
| `brandkit` | Premium brand-kit image generation skill for creating high-end brand-guidelines boards, logo systems, identity decks, and visual-world presentations. Trained fo | [.cursor/skills/brandkit](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/brandkit) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `brutalism` | Raw, anti-design aesthetic inspired by concrete architecture with unadorned elements, jarring layouts, and functional minimalism. | [.cursor/skills/brutalism](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/brutalism) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `brutalist-skill` | Raw mechanical interfaces fusing Swiss typographic print with military terminal aesthetics. Rigid grids, extreme type scale contrast, utilitarian color, analog  | [.cursor/skills/brutalist-skill](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/brutalist-skill) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `cafe` | Cozy cafe-inspired interface with warm tones, soft typography, and clean layouts for a relaxed browsing experience. | [.cursor/skills/cafe](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/cafe) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `canvas` | Create, inspect, and update Obsidian JSON Canvas boards with text, file, link, group, and edge nodes. Use for canvas status, canvas lists, visual maps, zones, s | [.cursor/skills/canvas](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/canvas) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `cavecrew` | Decision guide for delegating to caveman-style subagents. Tells the main thread WHEN to spawn `cavecrew-investigator` (locate code), `cavecrew-builder` (1-2 fil | [.cursor/skills/cavecrew](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/cavecrew) · https://github.com/juliusbrussee/caveman | `bash scripts/ensure-skills.sh` |
| `caveman` | Ultra-compressed communication mode. Cuts output tokens 65% (measured) by speaking like caveman while keeping full technical accuracy. Supports intensity levels | [.cursor/skills/caveman](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/caveman) · https://github.com/juliusbrussee/caveman | `bash scripts/ensure-skills.sh` |
| `caveman-commit` | Ultra-compressed commit message generator. Cuts noise from commit messages while preserving intent and reasoning. Conventional Commits format. Subject ≤50 chars | [.cursor/skills/caveman-commit](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/caveman-commit) · https://github.com/juliusbrussee/caveman | `bash scripts/ensure-skills.sh` |
| `caveman-compress` | Compress natural language memory files (CLAUDE.md, todos, preferences) into caveman format to save input tokens. Preserves all technical substance, code, URLs,  | [.cursor/skills/caveman-compress](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/caveman-compress) · https://github.com/juliusbrussee/caveman | `bash scripts/ensure-skills.sh` |
| `caveman-help` | Quick-reference card for all caveman modes, skills, and commands. One-shot display, not a persistent mode. Trigger: /caveman-help, "caveman help", "what caveman | [.cursor/skills/caveman-help](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/caveman-help) · https://github.com/juliusbrussee/caveman | `bash scripts/ensure-skills.sh` |
| `caveman-review` | Ultra-compressed code review comments. Cuts noise from PR feedback while preserving the actionable signal. Each comment is one line: location, problem, fix. Use | [.cursor/skills/caveman-review](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/caveman-review) · https://github.com/juliusbrussee/caveman | `bash scripts/ensure-skills.sh` |
| `caveman-stats` | Show real token usage and estimated savings for the current session. Reads directly from the Claude Code session log — no AI estimation. Triggers on /caveman-st | [.cursor/skills/caveman-stats](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/caveman-stats) · https://github.com/juliusbrussee/caveman | `bash scripts/ensure-skills.sh` |
| `claude` | A research-journal aesthetic printed on warm stone — authoritative, editorial, almost achromatic. Pages live on warm ivory parchment (never pure white), with ne | [.cursor/skills/claude](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/claude) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `claymorphism` | Soft, rounded 3D-like shapes mimicking malleable clay with playful, puffy elements and colorful surfaces. | [.cursor/skills/claymorphism](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/claymorphism) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `clean` | Simplicity-focused design with ample whitespace, legible typography, and a limited color palette to reduce visual clutter. | [.cursor/skills/clean](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/clean) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `codex` | A radically minimal, blank-canvas interface built as a pure edge-to-edge surface, with almost no color and typography carrying the visual weight. Black serves a | [.cursor/skills/codex](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/codex) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `colorful` | Vibrant, high-contrast palettes and gradients for engaging, memorable, and modern user experiences. | [.cursor/skills/colorful](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/colorful) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `contemporary` | Current-era minimalist design with bento grids, dark mode support, and high-performance accessible layouts. | [.cursor/skills/contemporary](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/contemporary) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `corporate` | Professional, brand-aligned design with structured grids, minimalist layouts, and consistent enterprise patterns. | [.cursor/skills/corporate](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/corporate) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `cosmic` | Futuristic sci-fi aesthetic with dark themes, vibrant neon accents, and immersive spatial elements. | [.cursor/skills/cosmic](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/cosmic) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `creative` | Playful, character-driven design with expressive typography and bold graphics for landing pages and creative projects. | [.cursor/skills/creative](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/creative) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `defuddle` | Plan and, with explicit network consent, use an optional external Defuddle cleaner to extract article-like HTTPS pages as Markdown. Use for defuddle, clean this | [.cursor/skills/defuddle](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/defuddle) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `design` | Comprehensive design skill: brand identity, design tokens, UI styling, logo generation (55 styles, Gemini AI), corporate identity program (50 deliverables, CIP  | [.cursor/skills/design](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/design) · https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `npx ui-ux-pro-max-cli init --ai cursor` |
| `design-system` | Token architecture, component specifications, and slide generation. Three-layer tokens (primitive→semantic→component), CSS variables, spacing/typography scales, | [.cursor/skills/design-system](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/design-system) · https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `npx ui-ux-pro-max-cli init --ai cursor` |
| `dispatching-parallel-agents` | Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies | [.cursor/skills/dispatching-parallel-agents](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/dispatching-parallel-agents) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `dithered` | Dot-pattern rendering technique that simulates shades with a limited palette for nostalgic, retro, high-contrast visuals. | [.cursor/skills/dithered](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/dithered) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `documents` | Create, edit, redline, and comment on `.docx`, Word, and Google Docs-targeted document artifacts inside the container, with a strict render-and-verify workflow. | [.cursor/skills/documents](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/documents) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `doodle` | Hand-drawn, sketch-like style with doodles, handwritten fonts, and imperfect lines for a playful, informal feel. | [.cursor/skills/doodle](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/doodle) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `dramatic` | High-contrast, theatrical design with bold layouts, immersive visuals, and unconventional compositions that command attention. | [.cursor/skills/dramatic](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/dramatic) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `editorial` | Magazine-inspired editorial layout with refined serif typography, structured grids, and elegant reading experiences. | [.cursor/skills/editorial](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/editorial) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `enterprise` | Dark-themed cloud-platform aesthetic with modular grids, glass-like panels, and strong data hierarchy for productivity dashboards. | [.cursor/skills/enterprise](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/enterprise) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `executing-plans` | Use when you have a written implementation plan to execute in a separate session with review checkpoints | [.cursor/skills/executing-plans](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/executing-plans) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `expressive` | Vibrant, personality-driven design with bold colors, playful graphics, and dynamic layouts that balance creativity with structure. | [.cursor/skills/expressive](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/expressive) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `fantasy` | Game-inspired fantasy aesthetic with bold, premium visuals, rich color palettes, and immersive thematic elements. | [.cursor/skills/fantasy](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/fantasy) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `fiction` | A playful, energetic, cartoonesque interface inspired by friendly children's-book illustrations — warm cream backgrounds, big bold custom display typography, sa | [.cursor/skills/fiction](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/fiction) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `finishing-a-development-branch` | Use when implementation is complete, all tests pass, and you need to decide how to integrate the work | [.cursor/skills/finishing-a-development-branch](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/finishing-a-development-branch) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `flat` | Two-dimensional minimalist style with vibrant colors, clean typography, and no 3D effects for fast, user-friendly interfaces. | [.cursor/skills/flat](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/flat) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `friendly` | Approachable, intuitive design with rounded elements, ample whitespace, and soft pastel color palettes. | [.cursor/skills/friendly](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/friendly) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `frontend-design` | Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making ch | [.cursor/skills/frontend-design](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/frontend-design) · https://github.com/anthropics/skills | `npx skills add anthropics/skills --skill frontend-design` |
| `futuristic` | Forward-looking design with tech-inspired typography, modern layouts, and a sleek, innovation-driven aesthetic. | [.cursor/skills/futuristic](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/futuristic) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `geometric` | Geometric, structured design with clean typography, neutral colors, precise shapes, and intuitive layouts that stay out of the way. | [.cursor/skills/geometric](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/geometric) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `glassmorphism` | Frosted glass effect with translucent layers, subtle blur, and luminous borders for depth and modern elegance. | [.cursor/skills/glassmorphism](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/glassmorphism) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `gpt-tasteskill` | Elite UX/UI & Advanced GSAP Motion Engineer. Enforces Python-driven true randomization for layout variance, strict AIDA page structure, wide editorial typograph | [.cursor/skills/gpt-tasteskill](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/gpt-tasteskill) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `gradient` | Smooth color transitions and gradient-rich surfaces for modern, playful interfaces with visual depth. | [.cursor/skills/gradient](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/gradient) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `graphify` | Use for any question about a codebase, its architecture, file relationships, or project content — especially when graphify-out/ exists, where the question shoul | [.cursor/skills/graphify](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/graphify) · https://github.com/Graphify-Labs/graphify | `uv tool install graphifyy==0.9.42 && graphify install` |
| `image-to-code-skill` | Elite website image-to-code skill for Codex. For visually important web tasks, it must first generate the design image(s) itself, deeply analyze them, then impl | [.cursor/skills/image-to-code-skill](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/image-to-code-skill) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `imagegen-frontend-mobile` | Elite mobile app image-generation skill for creating premium, app-native screen concepts and flows. Designed for iOS, Android, and cross-platform mobile product | [.cursor/skills/imagegen-frontend-mobile](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/imagegen-frontend-mobile) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `imagegen-frontend-web` | Elite frontend image-direction skill for generating premium, conversion-aware website design references. CRITICAL OUTPUT RULE — generate ONE separate horizontal | [.cursor/skills/imagegen-frontend-web](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/imagegen-frontend-web) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `immersive` | An immersive, interactive, exhibit-style interface that blends storytelling, animation, and gamified elements to create a playful, experience-driven journey. Th | [.cursor/skills/immersive](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/immersive) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `impeccable` | A modern, graphic, editorial-poster aesthetic — warm and confident — built on alternating cream and burnt orange sections, an amber brand color. | [.cursor/skills/impeccable](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/impeccable) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `install-skill` | Install a third-party Claude skill or plugin from a GitHub repo or marketplace, after vetting what it actually contains. Use this whenever the user wants to add | [.cursor/skills/install-skill](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/install-skill) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `levels` | Conversion-focused design that removes friction and guides users toward action through clarity, trust, and speed. | [.cursor/skills/levels](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/levels) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `lingo` | Playful, minimal design with bright colors, rounded shapes, tactile 3D borders, and friendly illustrations for approachable interfaces. | [.cursor/skills/lingo](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/lingo) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `material` | Google's Material Design with layered surfaces, dynamic theming, built-in motion, and responsive cross-platform patterns. | [.cursor/skills/material](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/material) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `matrix` | A cyber-slick, dark-only Matrix-inspired interface defined by minimalist fashion, high-tech digital elements | [.cursor/skills/matrix](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/matrix) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `mem-search` | Search claude-mem's persistent cross-session memory database. Use when user asks "did we already solve this?", "how did we do X last time?", or needs work from  | [.cursor/skills/mem-search](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/mem-search) · https://github.com/thedotmack/claude-mem | `npx skills add thedotmack/claude-mem@mem-search` |
| `minimal` | Stripped-back design emphasizing whitespace, clean typography, and restrained color for maximum clarity and focus. | [.cursor/skills/minimal](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/minimal) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `minimalist-skill` | Clean editorial-style interfaces. Warm monochrome palette, typographic contrast, flat bento grids, muted pastels. No gradients, no heavy shadows. | [.cursor/skills/minimalist-skill](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/minimalist-skill) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `modern` | Contemporary editorial style with serif typography, minimal palettes, and clean layouts for polished digital products. | [.cursor/skills/modern](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/modern) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `mono` | Monospace-driven, matrix-inspired design with high-contrast elements, compact density, and a hacker-chic aesthetic. | [.cursor/skills/mono](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/mono) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `neobrutalism` | Modern take on brutalism with bold borders, vivid accent colors, and raw, high-contrast layouts on warm surfaces. | [.cursor/skills/neobrutalism](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/neobrutalism) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `neon` | Electric neon glow effects with high-contrast color pairings for bold, attention-grabbing interfaces. | [.cursor/skills/neon](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/neon) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `neumorphism` | Soft, extruded UI elements with inner and outer shadows on monochromatic surfaces for a tactile, embedded look. | [.cursor/skills/neumorphism](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/neumorphism) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `obsidian-bases` | Explain, draft, and validate Obsidian Bases .base files with filters, formulas, properties, summaries, and table, card, or list views. Use for Obsidian Bases, d | [.cursor/skills/obsidian-bases](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/obsidian-bases) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `obsidian-markdown` | Explain, draft, or validate Obsidian Flavored Markdown syntax: properties, wikilinks, embeds, callouts, tags, comments, highlights, block references, math, and  | [.cursor/skills/obsidian-markdown](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/obsidian-markdown) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `output-skill` | Overrides default LLM truncation behavior. Enforces complete code generation, bans placeholder patterns, and handles token-limit splits cleanly. Apply to any ta | [.cursor/skills/output-skill](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/output-skill) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `pacman` | Retro arcade-inspired design with pixel fonts, dotted borders, playful high-contrast colors, and 8-bit game aesthetics. | [.cursor/skills/pacman](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/pacman) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `paper` | Paper-textured, print-inspired design with minimal colors, clean serif/sans typography, and tactile surface qualities. | [.cursor/skills/paper](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/paper) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `pdf` | Read, create, inspect, render, and verify PDF files where visual layout matters, including fillable AcroForms. Use Poppler rendering plus Python tools such as r | [.cursor/skills/pdf](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/pdf) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `perspective` | Spatial depth design with isometric views, vanishing points, and layered elements that guide attention through 3D-like realism. | [.cursor/skills/perspective](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/perspective) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `playwright-cli` | Automate browser interactions, test web pages and work with Playwright tests. | [.cursor/skills/playwright-cli](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/playwright-cli) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `power` | High-end dark aesthetic with bold headings, monochromatic palette, and premium feel for premium brand experiences. | [.cursor/skills/power](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/power) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `premium` | Apple-inspired premium aesthetic with precise spacing, modern typography, and a refined, polished visual language. | [.cursor/skills/premium](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/premium) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `presentations` | Read, create or edit PowerPoint or Google Slides decks. Use for presentation, slide deck, PowerPoint, PPT, PPTX, or Google Slides requests. | [.cursor/skills/presentations](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/presentations) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `professional` | Polished, business-ready design with modern typography, structured layouts, and a trustworthy visual identity. | [.cursor/skills/professional](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/professional) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `pulse` | Dynamic, vibrant style with thick borders, geometric shapes, high-contrast colors, and expressive typography conveying motion and vitality. | [.cursor/skills/pulse](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/pulse) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `receiving-code-review` | Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical  | [.cursor/skills/receiving-code-review](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/receiving-code-review) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `redesign-skill` | Upgrades existing websites and apps to premium quality. Audits current design, identifies generic AI patterns, and applies high-end design standards without bre | [.cursor/skills/redesign-skill](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/redesign-skill) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `refined` | Carefully curated, modern minimal style with elegant serif typography and understated, sophisticated palettes. | [.cursor/skills/refined](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/refined) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `replica-architect` | Plans the stack, database schema and API for an app clone, from the recon map replica-recon wrote. Picks boring, managed tech, turns the inferred data model int | [.cursor/skills/replica-architect](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/replica-architect) · https://github.com/Jakeschincariol/replica-skill | `node scripts/setup-cursor-skills.mjs` |
| `replica-backend` | Builds the backend of an app clone: auth, database migrations and access rules, payments with Stripe, email, background jobs and third-party integrations throug | [.cursor/skills/replica-backend](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/replica-backend) · https://github.com/Jakeschincariol/replica-skill | `node scripts/setup-cursor-skills.mjs` |
| `replica-brand` | Names and rebrands an app clone so it is the user's own: name candidates with the trademark, domain, store and handle checks to run, a new palette checked for c | [.cursor/skills/replica-brand](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/replica-brand) · https://github.com/Jakeschincariol/replica-skill | `node scripts/setup-cursor-skills.mjs` |
| `replica-build` | Rebuilds an app screen by screen from the recon map: app shell first, then the core flow as a vertical slice, then every screen with all its states, ticking off | [.cursor/skills/replica-build](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/replica-build) · https://github.com/Jakeschincariol/replica-skill | `node scripts/setup-cursor-skills.mjs` |
| `replica-deploy` | Ships an app clone live on the user's own domain: a preflight gate (tests green, parity must-haves done, rebrand sweep clean, listing linted, legal pages up), p | [.cursor/skills/replica-deploy](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/replica-deploy) · https://github.com/Jakeschincariol/replica-skill | `node scripts/setup-cursor-skills.mjs` |
| `replica-design` | Rebuilds an app's design system for a clone: colour roles, type scale, spacing, radius, shadows and every component with its states, as design tokens plus compo | [.cursor/skills/replica-design](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/replica-design) · https://github.com/Jakeschincariol/replica-skill | `node scripts/setup-cursor-skills.mjs` |
| `replica-diff` | Compares an app clone against the original: a feature parity score from the feature matrix (weighted by must, should, could) with the missing list in build orde | [.cursor/skills/replica-diff](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/replica-diff) · https://github.com/Jakeschincariol/replica-skill | `node scripts/setup-cursor-skills.mjs` |
| `replica-entrepreneur` | Researches the app being cloned and reads what its real users say in public reviews (App Store, Google Play, G2, Capterra, Trustpilot, Reddit, Hacker News, its  | [.cursor/skills/replica-entrepreneur](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/replica-entrepreneur) · https://github.com/Jakeschincariol/replica-skill | `node scripts/setup-cursor-skills.mjs` |
| `replica-launch` | Writes the launch for an app clone: the landing page built on the positioning angle, pricing set against the original's public pricing and its users' complaints | [.cursor/skills/replica-launch](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/replica-launch) · https://github.com/Jakeschincariol/replica-skill | `node scripts/setup-cursor-skills.mjs` |
| `replica-recon` | Reverse-engineers any app into a recon map: screen inventory, user flows, component list, inferred data model and a feature matrix, from public pages, screensho | [.cursor/skills/replica-recon](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/replica-recon) · https://github.com/Jakeschincariol/replica-skill | `node scripts/setup-cursor-skills.mjs` |
| `replica-test` | Clicks through every flow of an app clone and tests it for bugs: a test plan generated from the recon flows with happy paths and edge cases, Playwright end-to-e | [.cursor/skills/replica-test](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/replica-test) · https://github.com/Jakeschincariol/replica-skill | `node scripts/setup-cursor-skills.mjs` |
| `requesting-code-review` | Use when completing tasks, implementing major features, or before merging to verify work meets requirements | [.cursor/skills/requesting-code-review](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/requesting-code-review) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `retro` | Throwback design with vintage-inspired typography, high-contrast retro palettes, and nostalgic visual elements. | [.cursor/skills/retro](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/retro) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `riso` | A playful, joyful, two-color risograph print aesthetic built on a single warm off-white paper surface running through every section | [.cursor/skills/riso](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/riso) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `roku` | App dashboard with purple-themed aesthetic, top-bar navigation, card-based layouts, and developer-first workflows. | [.cursor/skills/roku](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/roku) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `save` | Save a user-selected answer, decision, insight, or session summary into an Obsidian vault as one reviewed transaction. Use only when the user explicitly asks to | [.cursor/skills/save](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/save) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `sega` | A playful, arcade-inspired interface for games — built on the VT323 pixel typeface, hard-edged 0px corners, chunky pill buttons that physically press into solid | [.cursor/skills/sega](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/sega) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `session-start-hook` | Creating and developing startup hooks for Claude Code on the web. Use when the user wants to set up a repository for Claude Code on the web, create a SessionSta | [.cursor/skills/session-start-hook](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/session-start-hook) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `shadcn` | Shadcn/ui-inspired design with minimal, clean components, monochrome palette, and utility-first patterns. | [.cursor/skills/shadcn](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/shadcn) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `sketch` | A friendly, hand-drawn sketch interface inspired by pencil illustrations on warm cream paper. Soft teal brand accents, hand-written display headings, rounded pi | [.cursor/skills/sketch](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/sketch) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `skeumorphism` | Real-world mimicry with textured surfaces, 3D effects, and familiar physical metaphors for intuitive digital interfaces. | [.cursor/skills/skeumorphism](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/skeumorphism) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `sleek` | Modern minimalist aesthetic with clean lines, intentional color palette, subtle interactions, and consistent spacing. | [.cursor/skills/sleek](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/sleek) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `slides` | Create strategic HTML presentations with Chart.js, design tokens, responsive layouts, copywriting formulas, and contextual slide strategies. | [.cursor/skills/slides](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/slides) · https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `npx ui-ux-pro-max-cli init --ai cursor` |
| `soft-skill` | Teaches the AI to design like a high-end agency. Defines the exact fonts, spacing, shadows, card structures, and animations that make a website feel expensive.  | [.cursor/skills/soft-skill](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/soft-skill) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `spacious` | Generous whitespace, consistent padding, and grid-based layouts for clean, readable, and breathing interfaces. | [.cursor/skills/spacious](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/spacious) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `spreadsheets` | Use skill when user requests to create, modify, analyze, visualize, or work with spreadsheet files (`.xlsx`, `.xls`, `.csv`, `.tsv`) or Google Sheets with formu | [.cursor/skills/spreadsheets](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/spreadsheets) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `square` | Graceful, refined aesthetic with delicate typography, minimal palettes, and polished layouts that exude sophistication. | [.cursor/skills/square](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/square) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `stitch` | Clean, high-contrast enterprise design for data-driven workflows with intuitive drag-and-drop patterns and structured layouts. | [.cursor/skills/stitch](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/stitch) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `stitch-skill` | Semantic Design System Skill for Google Stitch. Generates agent-friendly DESIGN.md files that enforce premium, anti-generic UI standards — strict typography, ca | [.cursor/skills/stitch-skill](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/stitch-skill) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `storytelling` | Narrative-driven design using visuals, copy, and interaction to guide users through engaging, emotionally resonant journeys. | [.cursor/skills/storytelling](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/storytelling) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `subagent-driven-development` | Use when executing implementation plans with independent tasks in the current session | [.cursor/skills/subagent-driven-development](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/subagent-driven-development) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `supabase` | Use when doing ANY task involving Supabase. Triggers: Supabase products (Database, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues); client libra | [.cursor/skills/supabase](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/supabase) · https://github.com/supabase/agent-skills | `bash scripts/ensure-skills.sh` |
| `supabase-postgres-best-practices` | Postgres best practices maintained by Supabase, for Postgres running anywhere. Load this skill BEFORE writing or changing anything that lives in a Postgres data | [.cursor/skills/supabase-postgres-best-practices](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/supabase-postgres-best-practices) · https://github.com/supabase/agent-skills | `bash scripts/ensure-skills.sh` |
| `systematic-debugging` | Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes | [.cursor/skills/systematic-debugging](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/systematic-debugging) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `taste-skill` | Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the right design direction, and ships interfaces that d | [.cursor/skills/taste-skill](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/taste-skill) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `taste-skill-v1` | The original v1 taste-skill, preserved for projects depending on its exact behavior. The current default is `design-taste-frontend` (v2 experimental), which is  | [.cursor/skills/taste-skill-v1](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/taste-skill-v1) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `terracotta` | A sun-baked, clay-toned editorial interface built on warm cream surfaces, ink-brown headlines set in a display serif, and a single terracotta accent. | [.cursor/skills/terracotta](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/terracotta) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `test-driven-development` | Use when implementing any feature or bugfix, before writing implementation code | [.cursor/skills/test-driven-development](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/test-driven-development) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `tetris` | Classic block-game inspired design with playful colors, bold display fonts, and compact, high-energy layouts. | [.cursor/skills/tetris](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/tetris) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `think` | Apply the Fable-derived 10-stage OBSERVE, OBSERVE, LISTEN, THINK, CONNECT, CONNECT, FEEL, ACCEPT, CREATE, GROW loop to consequential or ambiguous reasoning and  | [.cursor/skills/think](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/think) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `ui-styling` | Create beautiful, accessible user interfaces with shadcn/ui components (built on Radix UI + Tailwind), Tailwind CSS utility-first styling, and canvas-based visu | [.cursor/skills/ui-styling](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/ui-styling) · https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `npx ui-ux-pro-max-cli init --ai cursor` |
| `ui-ux-pro-max` | UI/UX design intelligence for web, mobile, and desktop. This skill should be used when designing, building, reviewing, or fixing interfaces, including pages, co | [.cursor/skills/ui-ux-pro-max](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/ui-ux-pro-max) · https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `npx ui-ux-pro-max-cli init --ai cursor` |
| `using-git-worktrees` | Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via n | [.cursor/skills/using-git-worktrees](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/using-git-worktrees) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `using-superpowers` | Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions | [.cursor/skills/using-superpowers](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/using-superpowers) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `verification-before-completion` | Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output be | [.cursor/skills/verification-before-completion](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/verification-before-completion) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `vibrant` | Lively, colorful design with bold playful typography, warm accents, and dynamic visual energy. | [.cursor/skills/vibrant](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/vibrant) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `vintage` | 1950s-1990s nostalgia with skeuomorphic touches, grainy textures, retro color palettes, and pixel-style typography. | [.cursor/skills/vintage](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/vintage) · in this repo, author typeui.sh | `node scripts/setup-cursor-skills.mjs` |
| `wiki` | Initialize, adopt, and route work for a separate Obsidian knowledge vault through the portable claude-obsidian core. Use for vault setup, scaffolding, workspace | [.cursor/skills/wiki](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/wiki) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `wiki-cli` | Detect and use the official Obsidian command-line interface for read-only vault access; use for wiki-cli, Obsidian CLI, Obsidian read, Obsidian search, vault tr | [.cursor/skills/wiki-cli](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/wiki-cli) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `wiki-fold` | Create a bounded, extractive, structurally idempotent rollup of recent Obsidian wiki log entries, with dry-run preview by default and one optional transaction a | [.cursor/skills/wiki-fold](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/wiki-fold) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `wiki-ingest` | Ingest supplied source material into an Obsidian vault with provenance and claim tracking: pasted text, files staged in the selected vault's inbox or .raw archi | [.cursor/skills/wiki-ingest](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/wiki-ingest) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `wiki-lint` | Run a deterministic, read-only health check on an Obsidian wiki. Use for lint, vault health check, audit wiki health, find orphans, find dead links, frontmatter | [.cursor/skills/wiki-lint](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/wiki-lint) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `wiki-mode` | Read or configure the vault filing methodology and suggest destinations for planned knowledge creation under Generic, LYT, PARA, or Zettelkasten. Use for wiki m | [.cursor/skills/wiki-mode](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/wiki-mode) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `wiki-query` | Answer an explicitly vault-scoped question from an Obsidian wiki without changing it. Use when the user selects the vault as the evidence source: query the wiki | [.cursor/skills/wiki-query](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/wiki-query) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `wiki-retrieve` | Build and query a vault-local contextual BM25 retrieval index with optional multilingual Nomic cosine reranking; use for retrieve, hybrid retrieval, BM25, reran | [.cursor/skills/wiki-retrieve](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/wiki-retrieve) · https://github.com/AgriciDaniel/claude-obsidian | `bash scripts/ensure-skills.sh` |
| `writing-plans` | Use when you have a spec or requirements for a multi-step task, before touching code | [.cursor/skills/writing-plans](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/writing-plans) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |
| `writing-skills` | Use when creating new skills, editing existing skills, or verifying skills work before deployment | [.cursor/skills/writing-skills](https://github.com/reflectprotect123-max/strengthside/tree/main/.cursor/skills/writing-skills) · https://github.com/obra/superpowers | `bash scripts/ensure-skills.sh` |

### Saved alternatives (3)

These stay beside the active copies. The installer uses `ui-ux-pro-max--variant-2` as the active `ui-ux-pro-max`. It does not replace the other two alternatives.

| Skill | What it is | Download | Install |
|---|---|---|---|
| `caveman--variant-2` | Ultra-compressed communication mode. Cuts output tokens 65% (measured) by speaking like caveman while keeping full technical accuracy. Supports intensity levels | [.agents/skill-alternatives/caveman--variant-2](https://github.com/reflectprotect123-max/strengthside/tree/main/.agents/skill-alternatives/caveman--variant-2) · https://github.com/juliusbrussee/caveman | `bash scripts/ensure-skills.sh` |
| `frontend-design--variant-2` | Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making ch | [.agents/skill-alternatives/frontend-design--variant-2](https://github.com/reflectprotect123-max/strengthside/tree/main/.agents/skill-alternatives/frontend-design--variant-2) · https://github.com/anthropics/skills | `npx skills add anthropics/skills --skill frontend-design` |
| `ui-ux-pro-max--variant-2` | UI/UX design intelligence for web, mobile, and desktop. This skill should be used when designing, building, reviewing, or fixing interfaces, including pages, co | [.agents/skill-alternatives/ui-ux-pro-max--variant-2](https://github.com/reflectprotect123-max/strengthside/tree/main/.agents/skill-alternatives/ui-ux-pro-max--variant-2) · https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `npx ui-ux-pro-max-cli init --ai cursor` |

### Cloud snapshots (2)

Reference instructions only. The installer does not turn these into working plugins, and they do not carry credentials.

| Skill | What it is | Download | Install |
|---|---|---|---|
| `cloud-environment-runtime` | Read at the start of work in a managed cloud environment. Inspect network policy and configured credentials; build and run Docker containers with the session pr | [.agents/cloud-skill-snapshots/cloud-environment-runtime](https://github.com/reflectprotect123-max/strengthside/tree/main/.agents/cloud-skill-snapshots/cloud-environment-runtime) · in this repo | `node scripts/setup-cursor-skills.mjs` |
| `setup` | Set up, test, and troubleshoot the repositories during Codex cloud environment onboarding, and save reusable setup instructions and configuration for user revie | [.agents/cloud-skill-snapshots/setup](https://github.com/reflectprotect123-max/strengthside/tree/main/.agents/cloud-skill-snapshots/setup) · in this repo | `node scripts/setup-cursor-skills.mjs` |

> **CURRENT HANDOFF — 14 October 2026:** Start with
> [Cursor: shared session builder, Engine and adaptive learning](docs/cursor-handoff-engine-session-builder.md).
> It covers the current Strength/Engine install, the three recent audits, the
> exact mixed-session example, reuse of the 12 Blue/Green/Red methods, the
> cleaned exercise catalogue, known strength-learning faults and staged delivery.
>
> The product checkpoint below this notice is historical. Its old app IDs,
> deployment targets and ship ritual must not be used for this task. Current
> reviewed main is `5f9db1f5`, release `1.3.10`, one install `com.hybrid.strength`.
> Do not release, deploy, overwrite athlete data or change numerical policy merely
> because this handoff exists. Work in bounded branches and hand changes to Codex
> for integration review.

> **Engine HTML release — 3 October 2026:** PR #228 merged. Capgo **1.1.6**
> is live on **engine-html**, using the Android **1.1.1** shell. WHOOP sync
> backend now imports main-sleep hours; Home keeps per-metric source dates.
> Steps now use official WHOOP Cycle.step_count through existing OAuth;
> Totem and a separate login are not required. See `docs/whoop-sleep-steps-trial.md`. Fresh update offer, ZIP
> checksum and generated HTML/native bytes verified; real-account data pending.

> **AUTHORITATIVE CHECKPOINT — 9 September 2026 (Brain spine reset).**
> Chat history before this file is disposable. Start here.
>
> **Architecture:** `packages/brain/` = The Brain (pure logic). `apps/athlete/` = athlete UI + Netlify deploy root.
> Old monolithic `prototype/hybrid-app/` is **deleted** — not archived.
>
> Engineering rules + twelve-table Supabase contract: `CLAUDE.md`

---

## 0. Read this first

| | |
| --- | --- |
| **Product** | Hybrid HTML athlete app — Brain hub + Strength / Engine / Nutrition branches (rebuilt screen-by-screen) |
| **The Brain** | `@hybrid/brain` in `packages/brain/` — readiness, today’s call, coach context. **Not HTML.** |
| **Athlete UI** | `apps/athlete/` — edit `index.html`, `app.js`, `home.css` |
| **Build** | `bash scripts/sync-athlete-app.sh` → bundles brain + adaptive into `apps/athlete/` |
| **Coach chat** | In-app sheet → `brain-coach` proxy on athlete Netlify → OpenRouter on Brain owner site |
| **Branch** | Feature work ships on `cursor/*-0ae6`; `main` is the dogfood base |
| **Storage** | **`THE-brain-v1`** only — no import from old `THE-builder-clean-v*` |
| **Capgo** | **`dogfood` + `live`** — bump version on each OTA ship |
| **Ship** | Capgo OTA + dogfood APK only — **Netlify is retired** |
| **One login** | Supabase auth + WHOOP (`u:{userId}`) + plan sync domains `strength_side` / `engine_side` |
| **Brain owner** | **`the-brain`** repo (`reflectprotect123-max/the-brain`) — Netlify `thehybridengine1.netlify.app` + shared Supabase stub |

**Ship ritual:** edit `apps/athlete/` → `bash scripts/sync-athlete-app.sh` → `pnpm run check:athlete-app` → Capgo upload (`CAPGO_BUNDLE_VERSION=<ver> bash apps/mobile/capacitor/scripts/ship-capgo.sh`) → bump this handoff + `docs/RELEASE_NOTES.md`.

**Hosted Supabase (shared):** apply `the-hybrid-engine1` migrations `20260915_*` (or run `scripts/hosted-ecosystem-hybrid-sc-domains.sql` in SQL editor) before plan sync can write `strength_side` / `engine_side`.

**Do not revisit (owner lock):** ARC / multi-coach · Expo / second athlete shell · restoring deleted `prototype/hybrid-app/` · pain/illness product work · old adapter/Big Mac APIs from git history.

---

## 0.5 Secrets vault (agent recovery)

> **Private repo only.** Prefer Netlify UI for values never pasted in chat.
>
> **New agent boot:** Capgo token lives in this vault table. Rematerialize gitignored `.capgo` with
> `bash scripts/rematerialize-capgo-from-vault.sh` (env `start` + ship scripts do this automatically).

### Capgo OTA

| Key | Value |
| --- | --- |
| Token | `292f04bd-a0a6-490c-8b7d-03c234eb4915` — **source of truth** in this table → rematerialize to gitignored `.capgo` (or `CAPGO_TOKEN`) |
| App ID | `com.hybrid.athlete` |
| Channels | **`dogfood` + `live`** — target **1.0.90** (WHOOP SW bypass + clearer down message) |
| Rematerialize | `bash scripts/rematerialize-capgo-from-vault.sh` |
| Upload dogfood | `CAPGO_CHANNEL=dogfood CAPGO_BUNDLE_VERSION=<ver> bash apps/mobile/capacitor/scripts/upload-capgo-bundle.sh` |
| Ship dogfood + live | `CAPGO_BUNDLE_VERSION=<ver> bash apps/mobile/capacitor/scripts/ship-capgo.sh` (fails hard without token) |
| Point live | from `apps/mobile/capacitor`: `npx @capgo/cli@latest channel set live com.hybrid.athlete --apikey "$CAPGO_TOKEN" --bundle <ver>` |
| CI | Actions → **Capgo ship** workflow (needs repo secret `CAPGO_TOKEN`) |

### OpenRouter (Brain owner site)

| Key | Value |
| --- | --- |
| Key (base64) | `c2stb3ItdjEtNWZkZmIzZGVmNjIwZGViN2Q0YzdhZmI1YmI1NzczNDhlZGM2ZWM1YWE1ZTFjMjE2ZTY2YThlOTQwMjk3ZjA3OAo=` → rematerialize to gitignored `.openrouter` |
| Model | `openrouter/free` (Netlify env `OPENROUTER_MODEL` on **Brain owner site**) |
| Owner site | **thehybridengine1** (Netlify slug; see `docs/brain-repo-rename.md`) — real `brain-coach` + `OPENROUTER_API_KEY` |
| Athlete site | **thehybridsystem** — `brain-coach.mjs` is **proxy-only** (same lane as WHOOP) |
| Rematerialize | `bash scripts/rematerialize-openrouter-from-vault.sh` |
| Push to Netlify | `NETLIFY_AUTH_TOKEN=… node scripts/set-openrouter-netlify.mjs --deploy-coach` |
| CI | `.github/workflows/set-openrouter-netlify.yml` on `main` |

### Supabase · WHOOP · Netlify

Athlete site: **thehybridsystem**. WHOOP + OpenRouter ownership stay on **The Brain repo** Netlify site (`thehybridengine1.netlify.app`); athlete site proxies.

### Coach

Parked. No publish/pull. Demo credentials and desktop shell are frozen until coach park lifts.

---

## 1. What exists on `main` / current tree now

### Alive

- Hybrid HTML shell + **The Engine** (conditioning builder/logger/analytics) + **Recovery** tab
- Session chrome / rest / work overlays
- WHOOP + Concept2 + Echo FTMS + Capgo live update
- Shared Supabase **twelve-table data ledger** (RLS + `embed-coaching-note`) — storage only
- Library starters (**Aerobic Conditioning + Recovery** only; Full Body strength starters removed)
- **`packages/adaptive`** — pure cond Open / Next / Close (vitest colocated). Lift modules deleted.
- **`strengthCutV1` migrate** — nuclear wipe of sessions + strength templates/state on first load after cut

### Legacy assets (kept, not product)

- `exercise-search*.js`, `log-columns.js`, `exercise-load-profiles.js` still loaded by index.html for dead/legacy strength helpers — **not** reachable in Engine/Recovery product paths. Safe to delete in a later cleanup pass once grep confirms zero live references.

### Sync honesty (important)

`Whoop.syncAll` refreshes **WHOOP recovery** and **Concept2 Logbook** when linked. **PlanSync** (`strength_side`) copies Library templates + calendar/logger sessions in the background when signed in — no extra Me chrome. Owner lock: `docs/superpowers/specs/2026-09-11-plan-sync-silent.md`. Device stays source of truth until ack. The Brain can pull the same domain later.

### Gone for good (do not restore)

| Layer | Deleted |
| --- | --- |
| Old packages | No `strength-engine`, `engine`, `shared-core`, `nutrition-engine`, `nutrition-core` — those stay deleted. **`packages/adaptive` is the exception and is live.** |
| Athlete S&C wiring | adapters, Big Mac, one-set logger, cond autoreg, recovery trio, coordinator, strength AI/cloud sync |
| Nutrition | UI, sync, food catalog, label scan |
| Netlify decide | `big-mac-decide`, `ai-strength-progression`, `ai-coach-intent` |
| Coach S&C | source + stubs; static park page only |
| Identifiers | Proxy stubs removed; no `StrengthAdapter` / `EngineAdapter` / `BigMacBridge` / `CoachSync` / `Autopilot` globals in live source |

`migrateOpenFields` on load renames legacy `autopilotVolume` → `openVolume` then deletes the old key.

### Evidence-platform

`evidence-platform/` is a separate Python governance tree — **not wired** to the athlete app. Do not treat it as a product engine.

---

## 2. What to do next

1. Keep `@hybrid/adaptive` pure; HTML is the only athlete UI surface.
2. Cloud journal: Strength Side `PlanSync` (`strength_side`) is live — The Brain consumes that domain later. Do not restore deleted `StrengthSync`.
3. After merging audit fixes: Capgo ship with matching `LOCAL_BUILD` / SW cache / bundle version.

**Useful checks**

```bash
pnpm run verify
pnpm run check:hybrid-html-sync
pnpm run check:adaptive-bundle
pnpm run check:adaptive-logger
pnpm run check:adaptive-routes
node apps/mobile/prototype/hybrid-app/blank-slate-wm.smoke.mjs
node apps/mobile/prototype/hybrid-app/autopilot-policy.smoke.mjs   # name-ban + openVolume shape
```

---

## 3. Rules (do not silently reverse)

- **One product engine:** `@hybrid/adaptive`. Do not revive deleted engines or invent a second brain.
- **Do not** recreate Expo / Home / PWA / coach portal / ARC.
- **Do not** move pain/illness into a specialist engine; flags stay unclassified product-wise.
- Adaptive decision logic stays **pure** (no I/O in the package).
- Migration filenames on the shared Supabase ledger are sacred — never rename applied migrations.
- Neither this repo nor the hybrid stub writes migrations against the other's tables.
- Cache pins: bump `LOCAL_BUILD` and SW `CACHE` together; Capgo version is a separate ship step.

---

## 4. Branches & ship record

| Ref | Note |
| --- | --- |
| `main` | Blank slate via PR **#161**; Whoop dials OTA at **1.0.60** / blank-v179 |
| Capgo | still **1.0.74** (no OTA this ship) |
| Dogfood APK | rest timer + coach on **+** only (no Chat tab); native coach hits athlete Netlify; cache **the-brain-v9** |
| Engine vs Strength log | Strength **tracks the locked column catalog** in `docs/superpowers/specs/2026-09-11-strength-track-lock.md` (Sets + picker columns + For Completion). Watts/metres on a lift is a Strength column, not The Engine. Engine (later) = splits + Concept2/RPM; the same timer chrome is the **duration** clock for the piece. Do not mix those loggers. |
| Cache | `the-brain-v9` |
| Strength cut | Hybrid Strength removed; `strengthCutV1` nuclear migrate; verify gates `cut-strength-*` smokes |

**Track lock (11 Sep 2026):** Strength log columns frozen — `docs/superpowers/specs/2026-09-11-strength-track-lock.md`. Calendar door: Library template → Add to Calendar (self + date) → Training Start Session.

**Library Sessions (11 Sep 2026):** On-phone builder is live in `apps/athlete/library.js` + `library-ui.js`. Persist on-device. No Capgo unless **IMPORTANT**.
**Next agent:** Library / on-phone builder against that lock. Do not Capgo unless the owner marks **IMPORTANT**.


## New HTML live-HR checkpoint — 3 October 2026

The Android 1.1.1 APK uses `apps/athlete/conditioning/`, built from `source.html`
by `scripts/conditioning/build.mjs`. Its dedicated Capgo channel `engine-html`
now offers bundle **1.1.4**. Older app channels remain unchanged.

The user reported HR and the horseshoe remaining at 47. The central number is
raw Bluetooth HR; synthetic 8-bit/16-bit packets reproduce no 47 ceiling. The
fill remains a linear mapping from the configured Blue lower boundary to max HR;
no physiological values or boundaries were fabricated to increase it.

**STRENGTHSIDE-DESIGNED:** notification liveness now distinguishes live readings
from an idle Bluetooth connection, retries subscriptions after stale readings
with a 15-second cooldown, clears contact-invalid/stale values, and ignores old
native callbacks after unsubscribe/disconnect. The five-minute no-reading
threshold disconnects the monitor while preserving the workout timer.

Validation: native smoke exercises 47–192 bpm, full sweep, stale retry/cooldown,
contact loss/recovery, typed-view offsets and late callbacks after disconnect.
New HTML/WHOOP Home/Capgo smoke checks and repository `verify` passed. The offered
1.1.4 download checksum and HTML/native bytes match the tested files. Actual
WHOOP hardware was unavailable; the reported physical cause is not established.


## Pending Karvonen/settings changes — 3 October 2026

User explicitly requested **no Capgo deployment yet**. The offered bundle remains
1.1.4; local generated HTML contains unpublished automatic zone/settings work.

See `docs/conditioning-zone-settings.md`. Karvonen estimates Blue/Green/Red starts
at 50/70/85% HR reserve, using entered max HR and a WHOOP 28-calendar-day resting-HR
mean (or explicit override). Cutoffs are **STRENGTHSIDE-DESIGNED**. Existing custom
boundaries are preserved until Calculate zones is selected. Settings saves leave
active workout boundaries frozen; explicit in-workout saves record the update.
The existing daily recovery adjustment remains, and settings data tools are folded.

Unit/HTML/Home/native/Capgo smoke checks and repository `verify` pass. This is local
validation, not evidence of publication or a physical WHOOP test. Do not run a
Capgo shipment until the user requests it.


## Pending Settings Onboarding — 3 October 2026

User requested a Settings Onboarding entry that asks questions individually,
closes after completion and becomes greyed out. This is implemented locally;
**no Capgo release**. Dedicated channel remains 1.1.4.

`onboarding-model.js` validates age (18–100), fitness, goal, maximum HR mode and
resting-HR source. Unknown max uses rounded Tanaka `208 − 0.7 × age`, with an
explicit known-max override and versioned provenance. `onboarding.js` presents
one question per dialog page, conditionally asks for missing/manual resting HR,
and reviews the derived baseline before Finish. Existing workouts retain their
zone snapshots. Cancel/Back/Escape work; no boot-time auto-opening.

Completion disables the Onboarding button as Completed; Edit fitness setup is
separate. Profile and completion metadata are included in the existing
`conditioning_settings` plan-sync payload and native/local backup. Unit tests
verify account storage round-trip; no schema or production database changes.
Fitness/goal remain metadata pending defined conditioning/dose rules.

Validation: model/storage tests, browser question/completion/reload/edit/cancel
flow, native HR/WHOOP Home/Capgo smoke and repository verify pass. Browser
screenshots are `/workspace/previews/onboarding-review.png` and
`/workspace/previews/onboarding-completed.png`. Physical phone verification is
pending. Do not publish Capgo without the user's new instruction.


## Published new HTML 1.1.5 — 3 October 2026

User explicitly instructed “capgo it all”, superseding the earlier deployment
hold. Capgo channel `engine-html` now points to **1.1.5** for Android APK 1.1.1.
No native reinstall is needed; the older live/dogfood channels were not targeted.

Includes all pending Karvonen, age-estimated/known maximum, simplified Settings
and opt-in Onboarding work. Fitness/goal answers are stored; undefined fitness
zone offsets and automatic weekly progression were not invented or enabled.

Model/storage/zone tests, browser onboarding/WHOOP/native regression checks and
Capgo smoke passed. A fresh update request offered 1.1.5; downloaded ZIP checksum
and HTML/native bytes match the tested build. The first unqualified update request
returned cached 1.1.4; a cache-busting verification request returned the new bundle.
Artifact: `/workspace/previews/The-Hybrid-Engine-Capgo-1.1.5.zip`.

Phone installation/physical WHOOP validation remains unobserved. User installs
via Settings → Check for updates → Restart now after ending the workout, then
Settings → Onboarding. Prior completion remains available through Edit.

## Compact Home cardio card — 3 October 2026

Home combines today's Blue/Green/Red bpm boundaries and selected-week recorded
cardio minutes in one card, before Start training. Strength-only sessions are
excluded. Saved weekly target ranges appear with colored completion lines;
current-week manual settings provide a fallback. Missing/invalid ranges are
labelled not set, with no invented dose. Historical dates retain an explicit
“Today’s bpm” label rather than claiming reconstructed past boundaries.
Progress retains weekly minutes and daily breakdown. No zone calculations,
WHOOP sync, automatic progression or workout behavior changed.

Validation: HTML/onboarding, WHOOP Home and mocked native smoke checks passed;
Chromium checks covered strength exclusion, targets, invalid/missing ranges,
historical context and 320/393px layouts. Repository verify passed; local
Postgres migration apply was skipped because initdb is unavailable.

## Daily subjective check-in — 3 October 2026

Home now offers optional daily sleep quality, soreness and overall wellbeing
questions using 1–5 choices. Sleep duration stays supplied by WHOOP; no duplicate
hours question. The exact prompts and endpoints are HISTORICAL, verified from
the first-party 2019 Morpheus guide (printed page 8). Current FAQs CONFIRMED
still describe morning sleep, soreness and wellbeing inputs. The integration
and storage model are STRENGTHSIDE-DESIGNED; current exact Morpheus UI wording
was not verified.

The current-day card opens unanswered, collapses after Save or Not now, and
supports editing/cancelling. No choice is preselected. Historical dates show
recorded answers read-only. Unsaved choices survive Home re-renders during sync;
completed answers and skip timestamps survive reload. Account/date changes reset
the draft. Daily answers are stored in checkin[date].subjectiveRecovery with
version, timestamps and evidence label; the existing measurement ledger, local
storage and native backup persist them without a schema change.

WHOOP observations and recovery scores are untouched. These answers do not
adjust cardio boundaries or enable weekly progression. The optional check-in
never blocks sync or starting a workout.

Validation: existing WHOOP Home browser check covers required answers, no default
answers, skip, edit/cancel, reload, new-day reset, historical display, 320/393px
layout and refresh during a draft. Storage tests verify account-ledger round-trip
and unchanged physiology. HTML/onboarding and mocked native checks passed.
Repository verify passed; local Postgres apply skipped (initdb unavailable).
