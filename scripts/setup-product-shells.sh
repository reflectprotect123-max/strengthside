#!/usr/bin/env bash
# Fork the mixed Capacitor Android shell into Hybrid Strength / Hybrid Engine
# with unique applicationIds and OAuth URL schemes. Does not touch
# apps/mobile/capacitor (live mixed APK / Capgo).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/apps/mobile/capacitor"

fork_one() {
  local key="$1"
  python3 - "$ROOT" "$SRC" "$key" <<'PY'
import json, pathlib, shutil, sys
root, src, key = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3]
meta = json.loads((root / "scripts/hybrid-products.json").read_text())[key]
dest = root / meta["dir"] / "capacitor"
app_id, app_name = meta["appId"], meta["appName"]
pkg_path = "/".join(app_id.split("."))

if dest.exists():
    shutil.rmtree(dest)

skip_dir_names = {"node_modules", ".gradle", ".idea"}
skip_file_names = {"local.properties"}

def ignored(path: pathlib.Path) -> bool:
    rel = path.relative_to(src).as_posix()
    parts = pathlib.Path(rel).parts
    if any(p in skip_dir_names for p in parts):
        return True
    if path.name in skip_file_names:
        return True
    if path.suffix in {".apk", ".aab", ".iml"}:
        return True
    if rel.startswith("android/app/src/main/assets/public"):
        return True
    # generated gradle output dirs named build/
    if "build" in parts and parts[-1] != "build.gradle" and not rel.endswith("capacitor.build.gradle"):
        # keep source files; drop .../build/** artifacts
        i = parts.index("build")
        if i < len(parts) - 1 or path.is_dir():
            if path.is_file() and parts[i] == "build" and not path.name.endswith(".gradle"):
                return True
            if path.is_dir():
                return True
    return False

for p in src.rglob("*"):
    if p.is_dir():
        continue
    if ignored(p):
        continue
    out = dest / p.relative_to(src)
    out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(p, out)

cfg = dest / "capacitor.config.json"
data = json.loads(cfg.read_text())
data["appId"] = app_id
data["appName"] = app_name
data["webDir"] = ".."
data.setdefault("plugins", {}).setdefault("CapacitorUpdater", {})
data["plugins"]["CapacitorUpdater"]["appId"] = app_id
cfg.write_text(json.dumps(data, indent=2) + "\n")

pkg = json.loads((dest / "package.json").read_text())
pkg["name"] = f"@hybrid/{key}-capacitor"
pkg["description"] = f"Capacitor Android shell for {app_name}."
(dest / "package.json").write_text(json.dumps(pkg, indent=2) + "\n")

gradle = dest / "android/app/build.gradle"
text = gradle.read_text()
text = text.replace('namespace = "com.hybrid.athlete"', f'namespace = "{app_id}"')
text = text.replace('applicationId "com.hybrid.athlete"', f'applicationId "{app_id}"')
gradle.write_text(text)

strings = dest / "android/app/src/main/res/values/strings.xml"
st = strings.read_text()
st = st.replace(">THE Hybrid<", f">{app_name}<")
st = st.replace(">com.hybrid.athlete<", f">{app_id}<")
strings.write_text(st)

manifest = dest / "android/app/src/main/AndroidManifest.xml"
manifest.write_text(manifest.read_text().replace("com.hybrid.athlete://whoop|concept2", f"{app_id}://whoop|concept2"))

old_java = dest / "android/app/src/main/java/com/hybrid/athlete/MainActivity.java"
new_dir = dest / "android/app/src/main/java" / pkg_path
new_dir.mkdir(parents=True, exist_ok=True)
(new_dir / "MainActivity.java").write_text(old_java.read_text().replace("package com.hybrid.athlete;", f"package {app_id};"))
shutil.rmtree(dest / "android/app/src/main/java/com/hybrid/athlete", ignore_errors=True)

(dest / "README.md").write_text(
    f"# {app_name} Capacitor shell\n\n"
    f"- applicationId / Capgo app: `{app_id}`\n"
    f"- OAuth return scheme: `{app_id}://`\n"
    f"- webDir: parent HTML tree (`..`)\n"
    f"- WHOOP/Concept2 stay proxy-only to thehybridengine1\n\n"
    f"Build APK: `PRODUCT={key} bash scripts/build-product-apk.sh`\n"
    f"Ship Capgo: `PRODUCT={key} CAPGO_BUNDLE_VERSION=1.0.0 bash scripts/ship-product-capgo.sh`\n"
)
print(f"forked Capacitor → {dest} ({app_id})")
PY
}

fork_one strength
fork_one engine
echo "Product Capacitor shells ready."
