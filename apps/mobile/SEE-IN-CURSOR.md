# See the app in Cursor (easiest)

No git download dance. The agent updates `THE-Hybrid-App.html`; you just refresh.

## One-time setup in Cursor

1. **Terminal → Run Task…** → **Hybrid App: serve preview**  
   (or open Ports and confirm **4173** is forwarded)
2. **Command Palette** (`Cmd/Ctrl+Shift+P`) → **Simple Browser: Show**
3. Paste: `http://127.0.0.1:4173/THE-Hybrid-App.html`

Keep that Simple Browser tab open.

## After each change I make

In Simple Browser: **refresh** (or hard refresh).  
You should see the new UI. No pull, no Save As.

## If Simple Browser is blank

- Run Task **Hybrid App: serve preview** again  
- Or open the **Ports** panel → port **4173** → Open in Browser

## Files that update

- `apps/mobile/THE-Hybrid-App.html` ← the app (source of truth for preview)
- `apps/mobile/prototype/hybrid-app/index.html` ← kept in sync
