# Athlete Home → Hybrid PWA shell

Drop of the Expo Home draft (Sleep / Conditioning / Nutrition) into the
**Native Logger + Builder PWA packaging shape** from the Hybrid handoff
(manifest, Netlify publish root, service worker).

## What this is

- **Home UI** from `apps/mobile` fixtures, as a static installable PWA.
- Same chrome contract as the Hybrid pack: dark theme, portrait, icons,
  `netlify.toml` publish = `.`
- **Not** the full Logger/Builder yet — that lives in the ~150KB `app/index.html`
  from the Hybrid ZIP. Uploads only had README/handoff/manifest metadata.

## Preview

```bash
cd apps/mobile/prototype/pwa
python3 -m http.server 4173
# http://localhost:4173
```

Install/offline needs localhost or HTTPS (not `file://`).

## Deploy (Netlify)

Publish this folder as the site root (Git / CLI / API). Static upload works for
UI; Netlify functions (WHOOP) need a full Hybrid app tree under
`netlify/functions` — not included here.

## Merge into full Hybrid PWA (when you have the ZIP)

1. Drop the real `app/index.html` (Logger + Builder) into the repo.
2. Replace that app’s **Home** route with this phone mock (or port modules
   one-by-one: Sleep rings → WHOOP sync, Conditioning zones, Nutrition).
3. Keep Training / Chat / Library / Me wired to existing PWA routes.
4. Leave strength prescription/logging on Supabase (`assigned_session`,
   `performed_*`) when you leave local-first behind — don’t dual-write blindly.

Source of truth for product RN UI: `../../src/HomeScreen.tsx`.
