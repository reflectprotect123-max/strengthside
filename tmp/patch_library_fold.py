#!/usr/bin/env python3
from pathlib import Path

path = Path("/workspace/apps/mobile/prototype/hybrid-app/index.html")
html = path.read_text()


def must_replace(old: str, new: str, label: str) -> None:
    global html
    if old not in html:
        raise SystemExit(f"MISSING: {label}\n---\n{old[:400]}")
    c = html.count(old)
    if c != 1:
        raise SystemExit(f"COUNT {c} for {label}")
    html = html.replace(old, new, 1)
    print("OK", label)


must_replace(
    'data-tab="programs" onclick="go(\'programs\')"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg><span>Programs</span></button>',
    'data-tab="programs" onclick="go(\'programs\')"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg><span>Library</span></button>',
    "nav Library",
)

css_anchor = ".mph-sticky .btn:focus-visible{\n  outline:2px solid var(--copper2);\n  outline-offset:2px;\n}"
must_replace(
    css_anchor,
    css_anchor
    + """
.hs-sticky{
  position:sticky; bottom:0; z-index:25;
  display:grid; grid-template-columns:1fr 1fr; gap:8px;
  margin:18px -4px 0; padding:12px 4px calc(12px + env(safe-area-inset-bottom));
  background:linear-gradient(180deg, transparent, #0c0c0cf2 28%);
  backdrop-filter:blur(12px);
}
.hs-sticky .btn{min-height:48px}
""",
    "hs-sticky css",
)

must_replace(
    """function setLibraryTab(tab){
  const allowed=['hub','programs','templates','exercises','mobility'];
  libraryActiveTab=allowed.includes(tab)?tab:'hub';
  if(libraryActiveTab==='programs'){S.tab='programs';save('nav-programs');return render()}
  if(!coachUnlocked)return requireCoachTools(libraryActiveTab);
  S.tab='tools';
  save('nav-coach-tools');
  render();
}""",
    """function setLibraryTab(tab){
  const allowed=['hub','programs','templates','exercises','mobility'];
  libraryActiveTab=allowed.includes(tab)?tab:'hub';
  if(libraryActiveTab==='programs'||libraryActiveTab==='templates'){
    S.tab='programs';
    save('nav-library');
    return render();
  }
  if(!coachUnlocked)return requireCoachTools(libraryActiveTab);
  S.tab='tools';
  save('nav-coach-tools');
  render();
}""",
    "setLibraryTab",
)

must_replace(
    """<button class=btn onclick="go('programs')">Programs</button>""",
    """<button class=btn onclick="openAthleteStrengthLibrary()">Library</button>""",
    "home Library btn",
)

must_replace(
    """function loadStarter(){let t=(S.templates||[]).find(x=>x&&x.name==='Full Body A')||(S.templates||[]).find(x=>x&&/Full Body [ABC]/i.test(x.name||''));if(!t){return openAthleteStrengthBuilder()}scheduleSheet(t.id)}
function openAthleteStrengthBuilder(){coachUnlocked=true;libraryActiveTab='templates';newTemplate('','strength')}
function openAthleteStrengthLibrary(){coachUnlocked=true;setLibraryTab('templates')}""",
    """function loadStarter(name='Full Body A'){let want=String(name||'Full Body A');let t=(S.templates||[]).find(x=>x&&x.name===want)||(S.templates||[]).find(x=>x&&/Full Body [ABC]/i.test(x.name||''));if(!t){return openAthleteStrengthBuilder()}scheduleSheet(t.id)}
function openAthleteStrengthBuilder(){libraryActiveTab='templates';newTemplate('','strength')}
function openAthleteStrengthLibrary(){libraryActiveTab='templates';S.tab='programs';save('nav-library');render()}
function goLibrary(){openAthleteStrengthLibrary()}""",
    "athlete entry points",
)

must_replace(
    "function programs(){libraryActiveTab='programs';shell('Programs','Training path',libraryProgramsTab())}",
    "function programs(){libraryActiveTab='templates';shell('Library','Hybrid Strength',libraryProgramsTab())}",
    "programs()",
)

i = html.find("function libraryProgramsTab(){")
j = html.find("function toolHub()", i)
if i < 0 or j < 0:
    raise SystemExit("libraryProgramsTab bounds")
new_lpt = """function libraryProgramsTab(){
  let visible=visibleTemplates();
  let isProgramTemplate=t=>String(t.source||'').includes('THE-program')||!!t.programId||['Full Body A','Full Body B','Full Body C','Aerobic Conditioning'].includes(t.name);
  let starters=visible.filter(t=>/^Full Body [ABC]$/.test(String(t.name||'')));
  let custom=visible.filter(t=>!isProgramTemplate(t)&&!legacyProgramRegex().test(t.name||''));
  let hidden=(S.hiddenTemplateIds||[]).length;
  let b=`<div class=stack><div class=streamhero><div class=eyebrow>Hybrid Strength</div><h2>Library</h2><p class=lead>Build your own workouts, or schedule Full Body A/B/C. The Engine conditioning still starts from Home.</p><div class=quickgrid><button class="btn primary" onclick="openAthleteStrengthBuilder()">Build strength</button><button class=btn onclick="loadStarter('Full Body A')">Full Body A</button><button class=btn onclick="loadStarter('Full Body B')">Full Body B</button><button class=btn onclick="loadStarter('Full Body C')">Full Body C</button></div></div>`;
  if(S.draft)b+=`<div class=card><div class=row><div><div class=title>Unfinished draft</div><div class=meta>${esc(S.draft.name||'Untitled workout')} · autosaved</div></div><span class=pill>draft</span></div><div class=btns><button class="btn small primary" onclick=resumeDraft()>Resume</button><button class="btn small danger" onclick=discardDraft()>Discard</button></div></div>`;
  b+=groupedTemplates('Full Body starters','program',starters,true);
  b+=groupedTemplates('Your workouts','other',custom,true);
  if(!starters.length&&!custom.length)b+=`<div class=empty><b>Library is empty</b>Build a Hybrid Strength workout to get started.<div class=btns style="justify-content:center"><button class="btn primary" onclick="openAthleteStrengthBuilder()">Build strength</button>${hidden?'<button class=btn onclick=restoreHiddenTemplates()>Restore hidden</button>':''}</div></div>`;
  if(hidden)b+=`<div class=card><div class=row><div><div class=title>Hidden templates</div><div class=meta>${hidden} hidden</div></div><button class="btn small" onclick=restoreHiddenTemplates()>Restore all</button></div>`;
  return b+`</div>`;
}
"""
html = html[:i] + new_lpt + html[j:]
print("OK libraryProgramsTab")

must_replace(
    """<button class="btn primary block" onclick="setLibraryTab('templates')">Open Builder</button>""",
    """<button class="btn primary block" onclick="openAthleteStrengthLibrary()">Open Library</button>""",
    "toolHub Open Library",
)
must_replace(
    """<button class="btn small" onclick="go('programs')">Back to Programs</button>""",
    """<button class="btn small" onclick="openAthleteStrengthLibrary()">Back to Library</button>""",
    "toolHub Back Library",
)

must_replace(
    "function tools(){if(!coachUnlocked)return coachLockScreen();let title='Coach Tools',sub='Builder · exercises · mobility',content=toolHub();let back=`<div class=btns style=\"margin-bottom:12px\"><button class=\"btn small\" onclick=\"goTools()\">← Coach Tools</button><button class=\"btn small danger\" onclick=lockCoachTools()>Lock</button></div>`;if(libraryActiveTab==='templates'){title='Builder';sub='Template tools';content=back+libraryTemplatesTab()}",
    "function tools(){if(!coachUnlocked)return coachLockScreen();if(libraryActiveTab==='templates')return programs();let title='Coach Tools',sub='Exercises · mobility · maintenance',content=toolHub();let back=`<div class=btns style=\"margin-bottom:12px\"><button class=\"btn small\" onclick=\"goTools()\">← Coach Tools</button><button class=\"btn small danger\" onclick=lockCoachTools()>Lock</button></div>`;",
    "tools() fold",
)

must_replace(
    "function library(){if(libraryActiveTab==='programs')return programs();return tools()}",
    "function library(){if(libraryActiveTab==='programs'||libraryActiveTab==='templates')return programs();return tools()}",
    "library()",
)

must_replace(
    "function newTemplate(programId='',kind=''){if(!requireCoachTools('templates'))return;programId=programId||activeProgramId();",
    "function newTemplate(programId='',kind=''){if(kind==='strength'&&!programId)programId='';else programId=programId||activeProgramId()||'';",
    "newTemplate no coach",
)

must_replace(
    "function discardDraft(){if(confirm('Discard this draft?')){S.draft=null;save();goTools()}}",
    "function discardDraft(){if(confirm('Discard this draft?')){S.draft=null;save();openAthleteStrengthLibrary()}}",
    "discardDraft",
)
must_replace(
    "function editTemplate(i){if(!requireCoachTools('templates'))return;draft=clone(tpl(i));builderOpen=-1;persistDraft();builder()}",
    "function editTemplate(i){draft=clone(tpl(i));builderOpen=-1;persistDraft();builder()}",
    "editTemplate",
)
must_replace(
    "function deleteTemplate(i){if(!requireCoachTools('templates'))return;if(confirm('Delete this custom workout template?')){S.templates=S.templates.filter(x=>x.id!==i);save();goTools()}}",
    "function deleteTemplate(i){if(confirm('Delete this custom workout template?')){S.templates=S.templates.filter(x=>x.id!==i);save();openAthleteStrengthLibrary()}}",
    "deleteTemplate",
)
must_replace(
    "function hideTemplate(i){if(!requireCoachTools('templates'))return;let t=tpl(i);if(!t)return;if(confirm(`Hide ${t.name} from the Library?`)){S.hiddenTemplateIds=S.hiddenTemplateIds||[];if(!S.hiddenTemplateIds.includes(i))S.hiddenTemplateIds.push(i);save();library()}}",
    "function hideTemplate(i){let t=tpl(i);if(!t)return;if(confirm(`Hide ${t.name} from the Library?`)){S.hiddenTemplateIds=S.hiddenTemplateIds||[];if(!S.hiddenTemplateIds.includes(i))S.hiddenTemplateIds.push(i);save();openAthleteStrengthLibrary()}}",
    "hideTemplate",
)
must_replace(
    "function restoreHiddenTemplates(){if(!requireCoachTools('templates'))return;S.hiddenTemplateIds=[];S=purgeStrengthTemplates(upgradeAlpha2(S));save();library()}",
    "function restoreHiddenTemplates(){S.hiddenTemplateIds=[];S=purgeStrengthTemplates(upgradeAlpha2(S));save();openAthleteStrengthLibrary()}",
    "restoreHiddenTemplates",
)

# groupedTemplates: strip Open Programs action using live slice
g0 = html.find("let action=key===")
if g0 < 0:
    raise SystemExit("groupedTemplates action missing")
g1 = html.find("return`<div class=weekbox>", g0)
if g1 < 0:
    raise SystemExit("groupedTemplates return missing")
html = html[:g0] + "let action='';" + html[g1:]
print("OK groupedTemplates action")

# Builder head: replace by index markers
b0 = html.find("function builder(){")
if b0 < 0:
    raise SystemExit("builder missing")
# from start through coach instructions helper closing
marker_end = '<div class=helper>Use this for session-level guidance. Example: Run the plan, leave 2–3 RIR, no grinders.</div></div>'
b1 = html.find(marker_end, b0)
if b1 < 0:
    # try ascii hyphen variant
    marker_end = '<div class=helper>Use this for session-level guidance. Example: Run the plan, leave 2-3 RIR, no grinders.</div></div>'
    b1 = html.find(marker_end, b0)
if b1 < 0:
    raise SystemExit("builder head end missing")
b1 = b1 + len(marker_end)

new_builder_head = (
    "function builder(){nav(false);clock(false);if(draft)repairDraftConditioningText();persistDraft();"
    "let blockCount=draft.blocks.length,exCount=draft.blocks.reduce((n,b)=>n+(b.exercises||[]).length,0),"
    "athleteStrength=draft&&draft.templateKind==='strength';"
    "let b=`<div class=row><div><div class=eyebrow>${athleteStrength?'Hybrid Strength · build':'Template builder'}</div>"
    "<h1>${esc(draft.name||'New workout')}</h1></div>"
    "<button class=\"btn small ghost\" onclick=\"persistDraft();openAthleteStrengthLibrary()\">Exit</button></div>"
    "${athleteStrength?'':`<div class=\"card proofcard\"><div class=title>Builder</div>"
    "<div class=meta style=\"margin-top:6px\">Build the template. Advanced controls stay hidden until you turn them on.</div></div>`}"
    "<div class=field><label>Workout name</label>"
    "<input value=\"${esc(draft.name)}\" placeholder=\"Full Body A\" oninput=\"draft.name=this.value;persistDraft()\">"
    "<div class=helper>Shown in Library and Calendar.</div></div>"
    "<div class=field><label>${athleteStrength?'Session note':'Coach instructions'}</label>"
    "<textarea class=\"openbox tall\" placeholder=\"Optional note shown before training\" "
    "oninput=\"draft.coachInstructions=this.value;persistDraft();autoGrow(this)\">${esc(draft.coachInstructions||'')}</textarea>"
    "<div class=helper>${athleteStrength?'Optional. Example: Leave 2-3 reps in reserve.':'Session-level guidance for the athlete.'}</div></div>"
)
html = html[:b0] + new_builder_head + html[b1:]
print("OK builder head")

# Builder foot via markers
f0 = html.find('<button class="btn primary" onclick=reviewSaveTemplate()>Review & save template</button></div>')
if f0 < 0:
    raise SystemExit("builder foot marker missing")
f_start = html.rfind("<div class=builderbottom>", 0, f0)
f_end = html.find("growTextAreas()}", f0)
if f_start < 0 or f_end < 0:
    raise SystemExit(f"builder foot bounds {f_start} {f_end}")
f_end = f_end + len("growTextAreas()}")
new_foot = (
    "<div class=builderbottom>"
    '<div class=btns><button class=btn onclick=addBlockSheet()>Add block</button>'
    "<button class=btn onclick=draftPreview()>Preview</button>"
    "${athleteStrength?'':`<button class=\"btn primary\" onclick=reviewSaveTemplate()>Review & save template</button>`}</div>"
    '<div class=meta style="margin-top:7px">Draft autosaves · ${blockCount} block${blockCount===1?\'\':\'s\'} · ${exCount} exercise${exCount===1?\'\':\'s\'}</div>'
    "${athleteStrength?`<div class=hs-sticky><button class=btn onclick=\"addLiftToDraft()\">Add lift</button>"
    '<button class="btn primary" onclick=reviewSaveTemplate()>Review & save</button></div>`:\'\'}'
    "</div>`;$('appScreen').innerHTML=b;growTextAreas()}"
)
html = html[:f_start] + new_foot + html[f_end:]
print("OK builder foot")

must_replace(
    "function addStrength(h,superset=false){draft.blocks.push({id:id(),type:'strength',heading:h,superset,exercises:[]});builderOpen=draft.blocks.length-1;persistDraft();closeSheet();builder()}",
    "function addLiftToDraft(){let i=(draft.blocks||[]).findIndex(x=>x&&x.type==='strength');if(i<0){addStrength('Strength');i=(draft.blocks||[]).findIndex(x=>x&&x.type==='strength')}if(i>=0)exerciseSheet(i)}\n"
    "function addStrength(h,superset=false){draft.blocks.push({id:id(),type:'strength',heading:h,superset,exercises:[]});builderOpen=draft.blocks.length-1;persistDraft();closeSheet();builder()}",
    "addLiftToDraft",
)

must_replace(
    "function saveTemplate(){let er=validate();if(er)return alert(er);if(isRetiredStrengthTemplate(draft)){alert('This seed program template stays retired. Save as your own Hybrid Strength workout instead.');return}if(draft.programId){draft.source='THE-program-user';draft.templateKind=draft.templateKind||'custom'}let i=S.templates.findIndex(x=>x.id===draft.id);if(i<0)S.templates.push(clone(draft));else S.templates[i]=clone(draft);S.draft=null;save();let backProgram=draft.programId||'';draft=null;closeSheet();if(backProgram)openProgram(backProgram);else go('library')}",
    "function saveTemplate(){let er=validate();if(er)return alert(er);if(isRetiredStrengthTemplate(draft)){alert('This seed program template stays retired. Save as your own Hybrid Strength workout instead.');return}if(draft.programId){draft.source='THE-program-user';draft.templateKind=draft.templateKind||'custom'}if(!draft.templateKind&&(draft.blocks||[]).some(b=>b&&b.type==='strength'))draft.templateKind='strength';let i=S.templates.findIndex(x=>x.id===draft.id);if(i<0)S.templates.push(clone(draft));else S.templates[i]=clone(draft);S.draft=null;save();draft=null;closeSheet();openAthleteStrengthLibrary()}",
    "saveTemplate",
)

must_replace(
    "sheet(`<h2>Review template</h2><p class=lead>Quick safety check before this goes into your Library.</p>",
    "sheet(`<h2>Review & save</h2><p class=lead>Check the workout, then save it to your Library.</p>",
    "review copy",
)

must_replace(
    "function exerciseSheet(i,j=-1){let y=j>=0?draft.blocks[i].exercises[j]:{name:'',category:'',sets:3,reps:8,restSec:90,coachNote:'',guidelines:{}},existing=findLibraryExercise(S,y.name),pct=!!existing?.percentCalc,g=y.guidelines||{};sheet(`<h2>${j>=0?'Edit':'Add'} exercise</h2><p class=lead>Only fill in what the athlete needs during the session. The app will hide advanced details behind the Guide button.</p>",
    "function exerciseSheet(i,j=-1){let y=j>=0?draft.blocks[i].exercises[j]:{name:'',category:'',sets:3,reps:'8',restSec:120,coachNote:'',guidelines:{}},existing=findLibraryExercise(S,y.name),pct=!!existing?.percentCalc,g=y.guidelines||{};sheet(`<h2>${j>=0?'Edit':'Add'} lift</h2><p class=lead>Pick a lift, set targets, then save. History and e1RM connect when you use the library name.</p>",
    "exerciseSheet defaults",
)

must_replace(
    "const LOCAL_BUILD='the-hybrid-athlete-engine-v30'",
    "const LOCAL_BUILD='the-hybrid-athlete-engine-v31'",
    "LOCAL_BUILD v31",
)
must_replace(
    "const ATHLETE_SHELL_VERSION='athlete-hybrid-strength-v1-2026-08-23'",
    "const ATHLETE_SHELL_VERSION='athlete-hybrid-strength-v2-2026-08-23'",
    "shell version v2",
)

# service worker cache in prototype
sw = Path("/workspace/apps/mobile/prototype/hybrid-app/service-worker.js")
sw_txt = sw.read_text()
if "the-hybrid-athlete-engine-v30" not in sw_txt:
    raise SystemExit("SW cache missing v30")
sw.write_text(sw_txt.replace("the-hybrid-athlete-engine-v30", "the-hybrid-athlete-engine-v31", 1))
print("OK service-worker")

path.write_text(html)
print("WROTE", path)
