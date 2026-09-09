# The Brain repo rename

`THE-HYBRID-ENGINE1` is becoming **The Brain repo** — the backend owner site for WHOOP/Concept2 OAuth, OpenRouter coach, and shared Supabase schema migrations that this athlete repo does not own.

## Names

| Layer | Old | New | Live until cutover |
| --- | --- | --- | --- |
| GitHub repo | `reflectprotect123-max/THE-HYBRID-ENGINE1` | `reflectprotect123-max/the-brain` | Rename in GitHub Settings → General |
| Netlify site slug | `thehybridengine1` | (unchanged for now) | `https://thehybridengine1.netlify.app` |
| Code alias | `hybrid1` | **Brain owner site** | Constants in `scripts/brain-owner-site.mjs` |

**Do not rename the Netlify site** until WHOOP/Concept2 OAuth redirect URIs are updated — they must stay on `thehybridengine1.netlify.app` until coordinated.

## Manual GitHub rename (org admin)

```bash
gh repo rename the-brain --repo reflectprotect123-max/THE-HYBRID-ENGINE1
gh repo edit reflectprotect123-max/the-brain \
  --description "The Brain — backend owner site (WHOOP/Concept2 OAuth, OpenRouter coach, shared Supabase schema stub)."
```

GitHub redirects the old URL automatically after rename.

## This repo (strengthside)

- Athlete app: `thehybridsystem.netlify.app` — proxies to Brain owner for tokens + coach
- Owner functions bundle: `scripts/brain-owner-coach/`
- Site constants: `scripts/brain-owner-site.mjs`
- CI: `.github/workflows/copy-netlify-env-from-brain-owner.yml`

Legacy GitHub secret `HYBRID1_NETLIFY_SITE_ID` still works; prefer `BRAIN_OWNER_NETLIFY_SITE_ID` when adding new secrets.
