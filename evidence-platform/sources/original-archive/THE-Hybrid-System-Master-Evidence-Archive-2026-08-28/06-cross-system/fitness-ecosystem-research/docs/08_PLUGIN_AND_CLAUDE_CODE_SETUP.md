# Claude Code, plugins, MCP, agents, and worktrees

This guide is for the person operating Claude Code on the handoff. The repository does not install plugins or connect accounts automatically. Add integrations deliberately and only when the project needs them.

## 1. Install Claude Code

Use Anthropic’s official installer for the operating system. On macOS/Linux/WSL the documented native installer is:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Other documented options include Homebrew (`brew install --cask claude-code`), Windows PowerShell, Windows CMD, and WinGet. Verify and launch:

```bash
claude --version
cd /path/to/fitness-ecosystem-research
claude
```

Log in interactively. An API key may be configured for supported environments, but never commit it or paste it into this repository.

## 2. What each Claude Code extension is for

| Capability | Use here | Default |
|---|---|---|
| `CLAUDE.md` | durable project rules and boundaries | included |
| project skills | repeatable audit/review/release workflows | included in `.claude/skills` |
| subagents | isolated specialist review | included in `.claude/agents` |
| hooks | deterministic lint/secret/test enforcement | add after baseline |
| MCP | external tools such as docs, browser, Sentry, Supabase | optional, least privilege |
| plugins | package skills/agents/hooks/MCP for reuse | optional |
| agent teams | parallel work with higher coordination cost | defer until contracts are stable |

Keep `CLAUDE.md` short and place detailed reference material in docs/skills. This package follows that pattern.

## 3. Recommended official plugins

Install only what the current phase needs. These commands use the official marketplace namespace documented by Claude Code:

```text
/plugin install security-guidance@claude-plugins-official
/plugin install typescript-lsp@claude-plugins-official
```

Install the TypeScript language-server binary separately if the LSP plugin requires it:

```bash
npm install -g typescript typescript-language-server
```

Add only when the corresponding external system is ready:

```text
/plugin install github@claude-plugins-official
/plugin install supabase@claude-plugins-official
/plugin install sentry@claude-plugins-official
/plugin install commit-commands@claude-plugins-official
/plugin install pr-review-toolkit@claude-plugins-official
```

Notes:

- `github` is useful for issues/PRs after repository access is explicitly approved.
- `supabase` should target a disposable or staging project during migration work; do not give Claude production write access by default.
- `sentry` is useful after an error-monitoring project exists and health-data redaction is confirmed.
- `commit-commands` and `pr-review-toolkit` are workflow helpers, not substitutes for tests or review.
- The existing web deployment is described as Netlify, so Vercel is not recommended unless that deployment decision changes.

Install scope deliberately. Project scope writes project settings that should be reviewed and committed only when intended. User scope affects other projects. Local scope is appropriate for one operator’s experiment.

## 4. Recommended MCP servers

MCP servers are executable integrations. Verify the source and permissions before adding them.

Claude Code documentation MCP:

```bash
claude mcp add --transport http claude-code-docs https://code.claude.com/docs/mcp
claude mcp list
```

Playwright for local browser E2E:

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
claude mcp list
```

Use Playwright only against a local/staging app. Do not point it at an authenticated production account without an explicit, human-approved task. The Node requirement and server version should be verified against current official documentation at install time.

Do not add Supabase, GitHub, Sentry, Slack, or email MCP connections until credentials, project scope, data classification, and write permissions are approved. The package intentionally does not include a project `.mcp.json`, because auto-loading an external server from a ZIP would be an unsafe default.

## 5. Worktrees and Claude

Manual Git worktree:

```bash
git worktree add ../fitness-ecosystem-baseline -b phase/00-baseline-audit
cd ../fitness-ecosystem-baseline
claude
```

Check and remove only after work is safely committed:

```bash
git worktree list
git worktree remove ../fitness-ecosystem-baseline
```

Claude also supports isolated worktrees for subagents. Keep one owner for migrations and contract files to avoid parallel schema drift.

## 6. Local skills and agents in this package

The `.claude/skills/` and `.claude/agents/` files are project-local instructions, not installed marketplace plugins. They encode the handoff’s boundaries:

- `audit-app` — read-only source inventory;
- `contract-review` — schema/ownership/version review;
- `security-review` — RLS, secrets, privacy, and claims review;
- `release-gate` — exact verification and handoff report;
- `baseline-auditor`, `contract-guardian`, `state-evidence-reviewer`, `coordinator-simulator`, `mobile-integration-auditor`, `release-gatekeeper` — isolated reviewer roles.

Invoke them by asking Claude to use the relevant project instruction; do not assume an agent has access to secrets or production systems.

## 7. Plugin safety checklist

Before installation or first use:

1. Read the plugin/marketplace source and manifest.
2. Confirm who publishes and what it can execute/read/write.
3. Install in user/project/local scope intentionally.
4. Inspect generated `.claude/settings.json` or `.mcp.json`.
5. Run against a disposable repo or staging environment.
6. Verify logs do not contain health data or credentials.
7. Remove the integration after the phase if it is no longer needed.

The official Claude Code plugin documentation warns that plugins and marketplaces can execute arbitrary code; treat them like dependencies with privileges.
