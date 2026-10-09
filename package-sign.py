from pathlib import Path
import zipfile,subprocess,json,hashlib
r=Path('/workspace/strength-capgo-build');web=r/'apps/mobile/capacitor/web'
src=r/'native-artifact/android/app/build/outputs/apk/release/app-release-unsigned.apk'
unsigned=r/'Hybrid-Strength-1.2.4-unsigned.apk'
with zipfile.ZipFile(src) as original,zipfile.ZipFile(unsigned,'w') as target:
 config=json.loads(original.read('assets/capacitor.config.json'))
 assert config['appId']=='com.hybrid.strength'
 assert config['plugins']['CapacitorUpdater']['defaultChannel']=='strength-live'
 plugins=json.loads(original.read('assets/capacitor.plugins.json'))
 assert any(x['pkg']=='@capgo/capacitor-updater' for x in plugins)
 for info in original.infolist():
  if info.filename.startswith('assets/public/'):continue
  target.writestr(info,original.read(info.filename))
 for p in web.rglob('*'):
  if p.is_file():target.write(p,'assets/public/'+str(p.relative_to(web)),compress_type=zipfile.ZIP_DEFLATED)
tools=Path('/workspace/android-sdk/build-tools/36.0.0');aligned=r/'Hybrid-Strength-1.2.4-aligned.apk';out=Path('/workspace/Hybrid-Strength-1.2.4.apk')
subprocess.run([str(tools/'zipalign'),'-f','-P','16','4',str(unsigned),str(aligned)],check=True)
private=Path('/workspace/strength-apk-build/signing')
subprocess.run([str(tools/'apksigner'),'sign','--ks',str(private/'hybrid-strength.jks'),'--ks-key-alias','hybrid-strength','--ks-pass','file:'+str(private/'keystore-password.txt'),'--out',str(out),str(aligned)],check=True)
verification=subprocess.run([str(tools/'apksigner'),'verify','--verbose','--print-certs',str(out)],check=True,capture_output=True,text=True).stdout
(r/'signature-verification.txt').write_text(verification)
subprocess.run([str(tools/'zipalign'),'-c','-P','16','4',str(out)],check=True)
with zipfile.ZipFile(out) as result:
 assert result.read('assets/public/capgo-updates.js')==(web/'capgo-updates.js').read_bytes()
 with zipfile.ZipFile('/workspace/Hybrid-Strength-1.2.3.apk') as previous:
  assert result.read('assets/public/logger.js')==previous.read('assets/public/logger.js')
  assert result.read('assets/public/timer.js')==previous.read('assets/public/timer.js')
checksum=hashlib.sha256(out.read_bytes()).hexdigest()
(r/'SHA256SUMS.txt').write_text(checksum+'  '+out.name+'\n')
print(out,checksum);print(verification)
