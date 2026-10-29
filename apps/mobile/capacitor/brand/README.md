# EDS Strength brand

Matches the EDS Conditioning rebrand (Apps PR #21). Icon option A (cyan barbell) approved by Dan.

- `eds_conditioning_icon_1024.png` – source EDS Conditioning AppIcon-1024 (ring + EDS unchanged)
- `make_brand.py` – builds `app_icon_1024.png`, Android launcher mipmaps, plain-navy splash plates,
  `apps/athlete/assets/eds-strength-logo.png` and `eds-mark-96.png` (embedded in the Engine page).
  Needs Pillow and the Inter variable font (path at the top of the script).
- `render_splash.py` – the EDS Conditioning splash motion, rendered from `app_icon_1024.png` into
  `android/app/src/main/assets/eds_splash.mp4` (Constrained Baseline, faststart):
  `python3 render_splash.py --mp4 ../android/app/src/main/assets/eds_splash.mp4`
- Launch: the Android 12+ / Capacitor splash is plain navy `#0a1020`, then `EdsSplashOverlay`
  plays the MP4 once on cold start and hands off. It never blocks the web view.

Unchanged on purpose: bundle id `com.hybrid.strength`, Capgo channel `strength-live`, internal code names and storage keys.
