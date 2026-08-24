#!/usr/bin/env python3
"""v33 twin-instrument polish: tokens, ath-sticky, Library/Strength copper dial."""
from pathlib import Path

path = Path("/workspace/apps/mobile/prototype/hybrid-app/index.html")
html = path.read_text()


def must_replace(old: str, new: str, label: str) -> None:
    global html
    if old not in html:
        raise SystemExit(f"MISSING: {label}\n{old[:200]}")
    if html.count(old) != 1:
        raise SystemExit(f"COUNT {html.count(old)}: {label}")
    html = html.replace(old, new, 1)
    print("OK", label)


# 1) First :root → Track Dawn (single source); kill Inter
must_replace(
    ":root{--bg:#090909;--panel:#121212;--panel2:#191919;--panel3:#0e0e0e;--line:#2a2927;--line2:#3a3732;--text:#f1ede5;--muted:#aaa399;--dim:#8a847a;--gold:#b68a50;--gold2:#dab57f;--ok:#9cb48b;--warn:#d4a35b;--bad:#cb8174;--blue:#82a8e9;--r:18px;--shadow:0 10px 30px #0007}",
    """:root{
  --bg:#0a0c0e;--bg-deep:#07090b;
  --panel:#12161a;--panel2:#181d22;--panel3:#0e1216;
  --line:rgba(255,255,255,.08);--line2:rgba(255,255,255,.12);
  --text:#eef2f4;--muted:#9aa3ab;--dim:#6f7881;
  --copper:#d4a574;--copper2:#e8c49a;--copper-dim:rgba(212,165,116,.14);
  --zone:#5ec4b4;--zone-dim:rgba(94,196,180,.14);
  --gold:var(--copper);--gold2:var(--copper2);
  --ok:#7dba9a;--warn:#d4a35b;--bad:#d0897d;--blue:#7aafd4;
  --r:16px;--r-lg:22px;--shadow:0 18px 40px rgba(0,0,0,.28);
  --ease:cubic-bezier(.22,.7,.28,1);
  --font-body:"Space Grotesk",ui-sans-serif,system-ui,sans-serif;
  --font-display:"Barlow Condensed",ui-sans-serif,system-ui,sans-serif;
  --nav-h:72px;--tap-min:44px;
  --focus:0 0 0 2px var(--bg),0 0 0 4px rgba(212,165,116,.7);
}""",
    "root tokens Track Dawn",
)

must_replace(
    'font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    "font-family:var(--font-body)",
    "kill Inter",
)

must_replace(
    'content="#090909"',
    'content="#07090b"',
    "theme-color",
)

# App bottom padding for nav + sticky
must_replace(
    ".app{max-width:760px;margin:auto;min-height:100vh;padding-bottom:84px}",
    ".app{max-width:760px;margin:auto;min-height:100svh;padding-bottom:calc(84px + env(safe-area-inset-bottom))}",
    "app safe padding",
)

# Primary btn min height
must_replace(
    ".btn{padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--panel2);color:var(--text);font-weight:760}",
    ".btn{padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--panel2);color:var(--text);font-weight:760;min-height:var(--tap-min)}",
    "btn tap min",
)

must_replace(
    ".btn.small{padding:7px 9px;font-size:12px}",
    ".btn.small{padding:7px 9px;font-size:12px;min-height:var(--tap-min)}",
    "btn.small tap",
)

# Nav tap targets
must_replace(
    ".nav button{display:grid;place-items:center;gap:3px;border:0;background:transparent;color:var(--dim);font-size:10px;letter-spacing:.07em;text-transform:uppercase}",
    ".nav button{display:grid;place-items:center;gap:3px;border:0;background:transparent;color:var(--dim);font-size:10px;letter-spacing:.07em;text-transform:uppercase;min-height:var(--tap-min)}",
    "nav tap",
)

# Unify sticky → .ath-sticky (both dials)
must_replace(
    """.mph-chip:focus-visible,.mph-step:focus-visible,.mph-back:focus-visible,
.mph-sticky .btn:focus-visible{
  outline:2px solid var(--copper2);
  outline-offset:2px;
}
.hs-sticky{
  position:sticky; bottom:0; z-index:25;
  display:grid; grid-template-columns:1fr 1fr; gap:8px;
  margin:18px -4px 0; padding:12px 4px calc(12px + env(safe-area-inset-bottom));
  background:linear-gradient(180deg, transparent, #0c0c0cf2 28%);
  backdrop-filter:blur(12px);
}
.hs-sticky .btn{min-height:48px}""",
    """.mph-chip:focus-visible,.mph-step:focus-visible,.mph-back:focus-visible,
.ath-sticky .btn:focus-visible{
  outline:2px solid var(--copper2);
  outline-offset:2px;
}
.ath-sticky{
  position:sticky; bottom:0; z-index:25;
  display:grid; gap:8px;
  margin:16px -4px 0; padding:12px 4px calc(12px + env(safe-area-inset-bottom));
  border-top:1px solid var(--line);
  background:rgba(7,9,11,.94);
  backdrop-filter:blur(12px);
}
.ath-sticky.dual{grid-template-columns:1fr 1fr}
.ath-sticky .btn{min-height:48px}""",
    "ath-sticky CSS",
)

must_replace(
    """.mph-sticky{
  position:sticky; bottom:0; z-index:15;
  margin:16px -16px 0; padding:12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top:1px solid var(--line);
  background:#090909f2; backdrop-filter:blur(12px);
}""",
    """/* Engine dial uses shared .ath-sticky */""",
    "remove old mph-sticky block",
)

# JS class names
must_replace(
    'class=mph-sticky><button class="btn primary block" onclick="startCondFromBuilder',
    'class="ath-sticky"><button class="btn primary block" onclick="startCondFromBuilder',
    "Engine sticky class",
)

# Might be multiple mph-sticky in templates - replace_all carefully
if html.count("class=mph-sticky") or html.count('class="mph-sticky"'):
    html = html.replace("class=mph-sticky", 'class="ath-sticky"')
    html = html.replace('class="mph-sticky"', 'class="ath-sticky"')
    print("OK mph-sticky → ath-sticky remaining")

must_replace(
    'athleteStrength?`<div class=hs-sticky><button class=btn onclick="addLiftToDraft()">Add lift</button><button class="btn primary" onclick=reviewSaveTemplate()>Review & save</button></div>`:\'\'}',
    'athleteStrength?`<div class="ath-sticky dual"><button class=btn onclick="addLiftToDraft()">Add lift</button><button class="btn primary" onclick=reviewSaveTemplate()>Save workout</button></div>`:\'\'}',
    "Strength ath-sticky + Save workout",
)

# Library hero — copper dial, no marketing fluff
old_lib = '''  let b=`<div class=stack><div class=streamhero><div class=eyebrow>Hybrid Strength</div><h2>Library</h2><p class=lead>Build your own workouts, or schedule Full Body A/B/C. The Engine conditioning still starts from Home.</p><div class=quickgrid><button class="btn primary" onclick="openAthleteStrengthBuilder()">Build strength</button><button class=btn onclick="loadStarter('Full Body A')">Full Body A</button><button class=btn onclick="loadStarter('Full Body B')">Full Body B</button><button class=btn onclick="loadStarter('Full Body C')">Full Body C</button></div></div>`;'''
new_lib = '''  let b=`<div class=stack><div class=streamhero dial-strength><div class=eyebrow>Hybrid Strength · dial</div><h2>Library</h2><p class=lead>Build or schedule. Conditioning is the other dial — Home.</p><div class=quickgrid><button class="btn primary" onclick="openAthleteStrengthBuilder()">Build strength</button><button class=btn onclick="loadStarter('Full Body A')">Full Body A</button><button class=btn onclick="loadStarter('Full Body B')">Full Body B</button><button class=btn onclick="loadStarter('Full Body C')">Full Body C</button></div></div>`;'''
must_replace(old_lib, new_lib, "Library dial hero")

# streamhero strength accent — quieter copper edge, no gold radial slop
must_replace(
    ".streamhero{padding:18px;border:1px solid #b68a5068;border-radius:22px;background:linear-gradient(180deg,#17110b,#101010);box-shadow:var(--shadow)}",
    """.streamhero{padding:18px;border:1px solid var(--line2);border-radius:var(--r-lg);background:var(--panel);box-shadow:none}
.streamhero.dial-strength{border-color:rgba(212,165,116,.35);border-left:3px solid var(--copper)}
.streamhero .eyebrow{font-family:var(--font-display);letter-spacing:.14em}
.streamhero h2{font-family:var(--font-display);font-weight:700}""",
    "streamhero instrument",
)

# Builder eyebrow already Hybrid Strength · build — tighten Save copy in review
must_replace(
    "sheet(`<h2>Review & save</h2><p class=lead>Check the workout, then save it to your Library.</p>",
    "sheet(`<h2>Save workout</h2><p class=lead>Check it, then save to Library.</p>",
    "review save copy",
)

# reviewSaveTemplate button text if any "Save template"
if "Save to Library" in html or "Save template" in html:
    # find review sheet save button
    i = html.find("function reviewSaveTemplate")
    chunk = html[i : i + 900]
    print("reviewSave snippet:", chunk[chunk.find("btns") : chunk.find("btns") + 200] if "btns" in chunk else chunk[-200:])

# Athlete strength: collapse text blocks by default — set builderOpen to strength block index on newTemplate
must_replace(
    "if(kind==='strength'){draft.blocks=[{id:id(),type:'text',heading:'Warm-up',notes:''},{id:id(),type:'strength',heading:'Strength',exercises:[]},{id:id(),type:'text',heading:'Cool-down',notes:''}];draft.templateKind='strength'}",
    "if(kind==='strength'){draft.blocks=[{id:id(),type:'text',heading:'Warm-up',notes:''},{id:id(),type:'strength',heading:'Strength',exercises:[]},{id:id(),type:'text',heading:'Cool-down',notes:''}];draft.templateKind='strength';builderOpen=1}",
    "open Strength block by default",
)

# programs shell subtitle
must_replace(
    "function programs(){libraryActiveTab='templates';shell('Library','Hybrid Strength',libraryProgramsTab())}",
    "function programs(){libraryActiveTab='templates';shell('Library','Lifts dial',libraryProgramsTab())}",
    "Library shell subtitle",
)

# h1 on builder use display font via CSS already for h1? add
must_replace(
    "h1{font-size:29px;line-height:1.05;letter-spacing:-.045em}",
    "h1{font-family:var(--font-display);font-size:30px;line-height:1.05;letter-spacing:.01em;font-weight:700}",
    "h1 display face",
)

# Bump versions
must_replace(
    "const LOCAL_BUILD='the-hybrid-athlete-engine-v32'",
    "const LOCAL_BUILD='the-hybrid-athlete-engine-v33'",
    "LOCAL_BUILD v33",
)
must_replace(
    "const ATHLETE_SHELL_VERSION='athlete-hybrid-strength-v3-2026-08-23'",
    "const ATHLETE_SHELL_VERSION='athlete-hybrid-strength-v4-2026-08-23'",
    "shell v4",
)

# Deduplicate second :root — leave it (overrides same values) but ensure no Inter creep
# Soften proofcard for rare coach path — leave

# Day cells tap
must_replace(
    ".day{padding:8px 2px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--muted);text-align:center}",
    ".day{padding:8px 2px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--muted);text-align:center;min-height:var(--tap-min)}",
    "day tap",
)

path.write_text(html)

sw = Path("/workspace/apps/mobile/prototype/hybrid-app/service-worker.js")
sw.write_text(sw.read_text().replace("the-hybrid-athlete-engine-v32", "the-hybrid-athlete-engine-v33", 1))
print("OK service-worker v33")

# Slop grep
bad = []
for term in ["Idiot", "Morpheus", "Inter,", "hs-sticky", "class=mph-sticky", "#F97316", "delight"]:
    if term in html:
        bad.append(term)
print("slop leftovers:", bad or "none")
print("ath-sticky count", html.count("ath-sticky"))
print("LOCAL_BUILD", "engine-v33" in html)
