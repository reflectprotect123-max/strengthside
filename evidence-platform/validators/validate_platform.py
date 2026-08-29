from __future__ import annotations
import csv, hashlib, json, os, re, sqlite3, sys
from pathlib import Path

BASE=Path(__file__).resolve().parents[1]
# jsonschema/pyyaml are optional here (schema meta-validation is skipped with
# a warning, not a crash, when they are absent - see the ImportError handling
# below): `pip install jsonschema pyyaml` for full meta-validation. A vendored
# copy used to be shadowed onto sys.path here, but it was pip-installed for
# win_amd64 (a compiled `.pyd`/native `rpds` extension that cannot load on
# Linux) so it always silently downgraded this check to a warning, on every
# platform this project actually runs on. Deleted; use a real interpreter-
# matched install instead (this is what CI does).
LONG_BASE=Path('\\\\?\\'+str(BASE)) if os.name=='nt' else BASE
errors=[]; warnings=[]
checked={"json":0,"json_schema":0,"yaml":0,"csv":0,"markdown_indexes":0,"source_files":0,"generated_files":0}

def all_files():
    for dp,_,names in os.walk(str(LONG_BASE)):
        for name in names: yield Path(dp)/name
def rel(p:Path)->str: return p.relative_to(LONG_BASE).as_posix()
def is_source(r:str)->bool: return r.startswith('sources/original-archive/')

files=list(all_files())
for p in files:
    checked["source_files" if is_source(rel(p)) else "generated_files"]+=1

for p in (x for x in files if x.suffix.lower()=='.json'):
    r=rel(p)
    try:
        obj=json.loads(p.read_text(encoding='utf-8-sig')); checked["json"]+=1
        if r.startswith('schemas/') and r.endswith('.schema.json'):
            try:
                import jsonschema
                jsonschema.Draft202012Validator.check_schema(obj); checked["json_schema"]+=1
            except ImportError: warnings.append('jsonschema unavailable; schema meta-validation skipped')
            except Exception as e: errors.append(f'JSON Schema {r}: {e}')
    except Exception as e: (warnings if is_source(r) else errors).append(f'JSON {r}: {e}')

try: import yaml
except Exception: yaml=None
for p in (x for x in files if x.suffix.lower() in {'.yaml','.yml'}):
    r=rel(p)
    if yaml:
        try: yaml.safe_load(p.read_text(encoding='utf-8-sig')); checked["yaml"]+=1
        except Exception as e: (warnings if is_source(r) else errors).append(f'YAML {r}: {e}')
    else: warnings.append('YAML parser unavailable; YAML files were counted but not parsed')

for p in (x for x in files if x.suffix.lower() in {'.csv','.tsv'}):
    r=rel(p); delimiter='\t' if p.suffix.lower()=='.tsv' else ','
    try:
        with p.open(newline='',encoding='utf-8-sig') as f: rows=list(csv.reader(f,delimiter=delimiter))
        if not rows: raise ValueError('empty')
        if any(len(row)!=len(rows[0]) for row in rows[1:]): raise ValueError('row width mismatch')
        checked["csv"]+=1
    except Exception as e: (warnings if is_source(r) else errors).append(f'CSV {r}: {e}')

index_name=re.compile(r'(?i)(^|[-_])(readme|index|file[-_]?tree|manifest)([-_.]|$)|master_readme')
for p in (x for x in files if x.suffix.lower()=='.md' and index_name.search(x.name)):
    r=rel(p)
    try:
        text=p.read_text(encoding='utf-8-sig')
        if text.count('```')%2: (warnings if is_source(r) else errors).append(f'Markdown {r}: unbalanced fenced code blocks')
        for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)',text):
            target=target.strip().split()[0].strip('<>')
            if not target or target.startswith(('http://','https://','mailto:','#')): continue
            target=target.split('#',1)[0].replace('%20',' ')
            if target and not (p.parent/target).exists(): warnings.append(f'Markdown index {r}: unresolved relative link {target}')
        checked["markdown_indexes"]+=1
    except Exception as e: (warnings if is_source(r) else errors).append(f'Markdown index {r}: {e}')

src_zip=BASE/'sources'/'THE-Hybrid-System-EVERYTHING-MASTER-ARCHIVE-2026-08-28.zip'
if not src_zip.exists(): errors.append('Preserved source ZIP missing')
elif hashlib.sha256(src_zip.read_bytes()).hexdigest().upper()!='DB4BA09A0E352BB400F50BFF40CA3E06BAF72611CDA0E99C5494470425BBC03E': errors.append('Preserved ZIP hash mismatch')

registry_specs=[('sources/source-registry.csv','source_id'),('claims/claim-registry.csv','claim_id'),('structured/metric-dictionary.csv','metric_id'),('structured/formula-registry.csv','formula_id'),('contradictions/contradiction-registry.csv','contradiction_id'),('policies/policy-registry.csv','policy_id'),('rules/rule-registry.csv','rule_id')]
registry_rows={}
for fname,key in registry_specs:
    with (BASE/fname).open(newline='',encoding='utf-8-sig') as f: rows=list(csv.DictReader(f))
    vals=[row[key] for row in rows]
    if len(vals)!=len(set(vals)): errors.append(f'Duplicate IDs in {fname}:{key}')
    registry_rows[fname]=rows

source_ids={r['source_id'] for r in registry_rows['sources/source-registry.csv']}
metric_ids={r['metric_id'] for r in registry_rows['structured/metric-dictionary.csv']}
for r in registry_rows['claims/claim-registry.csv']:
    if r['source_id'] not in source_ids: errors.append(f"Claim {r['claim_id']} has missing source_id")
for r in registry_rows['structured/formula-registry.csv']:
    if r['source_id'] not in source_ids: errors.append(f"Formula {r['formula_id']} has missing source_id")
with (BASE/'structured'/'observations.csv').open(newline='',encoding='utf-8-sig') as f: observations=list(csv.DictReader(f))
for r in observations:
    if r['source_id'] not in source_ids: errors.append(f"Observation {r['observation_id']} has missing source_id")
    if r['metric_id'] not in metric_ids: errors.append(f"Observation {r['observation_id']} has missing metric_id")

models=json.loads((BASE/'models'/'model-registry.json').read_text(encoding='utf-8'))
if any(m.get('status')=='active' for m in models.get('models',[])): errors.append('Active model exists in foundation release')

runtime_db=BASE/'runtime'/'evidence.db'
if runtime_db.exists():
    db=sqlite3.connect(runtime_db)
    if db.execute("SELECT COUNT(*) FROM runtime_artifacts WHERE status='active'").fetchone()[0]: errors.append('Active runtime artifact exists in pre-research release')
    # Bumped 30 August 2026 after wiring 2,814 acquired source records
    # (sources/acquired/) into the corpus via a real ingest run - a
    # deliberate, documented corpus growth, not drift. Previous baseline:
    # records=526, sources_typed=328, document_chunks=2625,
    # citation_occurrences=3063. See docs/research-acquisition-strategy.md
    # and docs/research-plan-five-engines.md for what changed and why.
    # claims_typed/formulas_typed/external_citations are unchanged - this
    # pass added source records only, no new claims or formulas.
    expected={"records":3340,"sources_typed":3142,"claims_typed":86,"formulas_typed":33,"document_chunks":5439,"external_citations":1101,"citation_occurrences":3080}
    for table,count in expected.items():
        actual=db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        if actual!=count: errors.append(f'Runtime database {table}: expected {count}, got {actual}')
    db.close()

import subprocess
# "tests_passing" used to be a hand-typed literal (49) that went stale the
# moment a test was added or removed. Run the real suite so this number is
# measured, not claimed - the same standard this report holds everything else to.
try:
    test_run=subprocess.run([sys.executable,'-m','pytest',str(BASE/'tests'),'-q'],capture_output=True,text=True,cwd=str(BASE))
    tests_passing=int(re.search(r'(\d+) passed',test_run.stdout).group(1)) if test_run.returncode==0 and re.search(r'(\d+) passed',test_run.stdout) else 0
    if test_run.returncode!=0: errors.append('Test suite is not fully green: '+test_run.stdout.strip().splitlines()[-1] if test_run.stdout.strip() else 'pytest failed')
except FileNotFoundError:
    tests_passing=None; warnings.append('pytest unavailable; tests_passing could not be measured')

report={"status":"PASS_PRE_RESEARCH_ONLY" if not errors else "FAIL","checked":checked,"errors":sorted(set(errors)),"warnings":sorted(set(warnings)),"tests_passing":tests_passing,"note":"This validates the engineering package, not scientific truth. Source-file syntax/link defects are warnings because originals are immutable; generated-artifact defects are errors."}
out=BASE/'releases'/'validation-report.json'; out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2)); sys.exit(1 if errors else 0)
