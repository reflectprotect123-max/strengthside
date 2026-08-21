# Hybrid native PWA + athlete Home drop-in

Base: uploaded Hybrid Logger/Builder `index.html` (~305KB).  
Home now opens with our Expo modules: **Sleep rings**, **Conditioning zones**,
**Nutrition**, then the existing readiness coach card + session starters.

## Design system

Canonical tokens + rules: `design-system/the-hybrid-system/MASTER.md`  
Home overrides: `design-system/the-hybrid-system/pages/home.md`

Full-app chrome pass (focus rings, 44px targets, safe areas, Barlow Condensed
display type, sheet dialog a11y) lives in `index.html` CSS block
`FULL-APP chrome`.

## Run

```bash
cd apps/mobile/prototype/hybrid-app
python3 -m http.server 4173
# http://localhost:4173
```

Tap Sleep / Conditioning for overlays (uses the app’s sheet modal).

## See without running HTML

PNG reference shots still live under `../shots/` and `../README.md`.

## Notes

- Metrics prefer Daily Check-in `whoopRecovery` / HRV / RHR / sleep when set;
  otherwise fixtures (71 / 62 / 88, nutrition 2529 kcal).
- Check-in only under Sleep → Check-in tab.
- Logger, Programs, Calendar, Settings unchanged in behavior; chrome polished globally.
- Manifest + icons included for PWA install on localhost/HTTPS.
