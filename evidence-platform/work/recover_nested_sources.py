from __future__ import annotations
import csv,hashlib,json,zipfile
from datetime import datetime,timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'sources'/'original-archive'/'THE-Hybrid-System-Master-Evidence-Archive-2026-08-28'
DEST=ROOT/'sources'/'recovered-nested'

rows=list(csv.DictReader((ROOT/'sources'/'source-registry.csv').open(encoding='utf-8-sig',newline='')))
missing=[r for r in rows if not (BASE/r['relative_path']).is_file()]
zips=sorted(BASE.rglob('*.zip'))
recovered=[]; unresolved=[]
for row in missing:
    matches=[]
    for archive in zips:
        try:
            with zipfile.ZipFile(archive) as z:
                for info in z.infolist():
                    if info.is_dir(): continue
                    if not (info.filename.endswith(row['relative_path']) or info.filename.endswith('/'+Path(row['relative_path']).name) or info.filename==Path(row['relative_path']).name): continue
                    data=z.read(info)
                    if hashlib.sha256(data).hexdigest().upper()==row['sha256'].upper(): matches.append((archive,info.filename,data))
        except zipfile.BadZipFile: continue
    if not matches:
        unresolved.append(row['relative_path']); continue
    archive,member,data=sorted(matches,key=lambda x:(str(x[0]),x[1]))[0]
    target=DEST/row['relative_path']; target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(data)
    recovered.append({'relative_path':row['relative_path'],'sha256':row['sha256'],'bytes':len(data),'archive':archive.relative_to(BASE).as_posix(),'member':member})
manifest={'generated_at':datetime.now(timezone.utc).isoformat(),'method':'exact SHA-256 match from preserved nested ZIP; originals unchanged','recovered_count':len(recovered),'unresolved_count':len(unresolved),'recovered':recovered,'unresolved':unresolved}
DEST.mkdir(parents=True,exist_ok=True); (DEST/'recovery-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'recovered':len(recovered),'unresolved':len(unresolved)},indent=2))
