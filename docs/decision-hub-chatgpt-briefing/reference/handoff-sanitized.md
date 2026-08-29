# Handoff excerpt (sanitized — no secrets)

From TheStrengthEngine `handoff.md` — §0 tip, §1 shipped summary, §3 rules only.

## Product

Hybrid HTML athlete app + Capgo/dogfood + Netlify. Coach = prototype only.

**Five engines wired on main:** Strength · Conditioning · Nutrition · Recovery · Coordinator (silent only).

**Parked until owner says:** Decision Hub / AI automation · Coordinator rename · pain/illness stop consumer · Expo · Play Store.

## Shipped

- Nav: Home · Library · Calendar · Settings  
- Silent progression, recovery debt/repay, WHOOP + Concept2, Capgo OTA  
- Strength cloud sync v3 (web ↔ phone)  
- `pnpm run verify` green  

## Rules (do not silently reverse)

### Naming

| Engine | Athlete name | Visible? |
| --- | --- | --- |
| Strength | Hybrid Strength | Yes |
| Conditioning | The Engine | Yes |
| Nutrition | Nutrition | Yes |
| Recovery | — | Debt row on Home only |
| Coordinator | — | Invisible (no weekly peek) |

### Product locks

- Silent apply — no accept/decline UI  
- Training never blocked  
- Pain Yes → holds strength bumps only  
- Illness = record-only (no auto-stop)  
- No HRV as pain/injury/illness gate  
- `@hybrid/strength-engine` stays pure (zero I/O)  
- Pain/illness flags raised; nothing stops training  

### Traps

- Coordinator weekly peek stays **gone**  
- Recovery debt row is the only Recovery dial  
- Do not re-run "finish five-systems" — already wired  

## Open work (separate from Decision Hub)

- Phone dogfood proof (Capgo, debt row)  
- Hybrid week in Library + Calendar  
- Logger friction pass  
