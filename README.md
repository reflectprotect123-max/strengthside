# TheStrengthEngine

The strength side of THE Hybrid System — prescription, logging, working-max and
PR tracking, and progression. Split out of
[`THE-HYBRID-ENGINE1`](https://github.com/reflectprotect123-max/THE-HYBRID-ENGINE1)
on 19 August 2026, pointing at the same Supabase project.

**Read `handoff.md` first** — it is the authoritative checkpoint. `CLAUDE.md`
holds the operating rules, including the shared-Supabase contract that keeps two
repositories writing to one database from becoming a disaster.

```bash
pnpm install
pnpm run verify     # typecheck + test + migrations + build
```

| | |
|---|---|
| `packages/strength-engine` | Pure functions and types. Zero I/O, zero React. |
| `apps/web` | Coach bench. Phase B builds here. |
| `apps/mobile` | Athlete logger. Phase C builds here. |
| `supabase/migrations` | The twelve tables this repo owns, and nothing else. |
| `supabase/functions` | `embed-coaching-note` edge function. |
| `checks/` | Migrations applied against a real throwaway Postgres. |
