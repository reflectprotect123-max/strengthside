from __future__ import annotations
import hashlib, json, os, zipfile
from pathlib import Path

BASE=Path(__file__).resolve().parents[1]
RELEASE=BASE/'releases'/'THE-Hybrid-System-pre-research-operational-platform-v0.2-2026-08-28.zip'
MANIFEST=BASE/'releases'/'manifest.sha256'
ZIP_HASH=BASE/'releases'/'release-zip.sha256'
EXCLUDE_FILES={RELEASE.resolve(),MANIFEST.resolve(),ZIP_HASH.resolve()}
EXCLUDE_PARTS={'qa-dossiers','qa-docx','__pycache__'}

def sha(path:Path)->str:
    h=hashlib.sha256()
    readable=Path('\\\\?\\'+str(path.resolve())) if os.name=='nt' else path
    with readable.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest().upper()

def candidates():
    out=[]
    for dp,dirs,names in os.walk(BASE):
        dirs[:]=[d for d in dirs if d not in EXCLUDE_PARTS]
        for name in names:
            p=Path(dp)/name
            if p.resolve() in EXCLUDE_FILES or any(part in EXCLUDE_PARTS for part in p.parts): continue
            out.append(p)
    return sorted(out,key=lambda p:p.relative_to(BASE).as_posix().lower())

files=candidates()
MANIFEST.write_text('\n'.join(f'{sha(p)}  {p.relative_to(BASE).as_posix()}' for p in files)+'\n',encoding='utf-8')
files=candidates()+[MANIFEST]
with zipfile.ZipFile(RELEASE,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9,allowZip64=True) as z:
    for p in files:
        readable=Path('\\\\?\\'+str(p.resolve())) if os.name=='nt' else p
        z.write(readable,Path('evidence-platform')/p.relative_to(BASE))
with zipfile.ZipFile(RELEASE) as z:
    bad=z.testzip()
    if bad: raise RuntimeError(f'ZIP CRC failure: {bad}')
    names=z.namelist()
zip_digest=sha(RELEASE)
ZIP_HASH.write_text(f'{zip_digest}  {RELEASE.name}\n',encoding='utf-8')
print(json.dumps({'zip':str(RELEASE),'sha256':zip_digest,'bytes':RELEASE.stat().st_size,'entries':len(names),'crc_test':'PASS'},indent=2))
