import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(import.meta.url),{build}=require(path.join(root,'node_modules/esbuild'));
const out=path.join(root,'apps/athlete/conditioning');
await build({entryPoints:[path.join(root,'apps/mobile/capacitor/engine-native-entry.js')],bundle:true,format:'iife',platform:'browser',target:'es2020',outfile:path.join(out,'native-plugins.js')});
let html=fs.readFileSync(path.join(out,'source.html'),'utf8');
html=html.replace('<title>StrengthSide Engine — standalone</title>','<title>The Hybrid Engine</title>').replace('Standalone copy · saved on this browser','The Hybrid Engine');
html=html.replace('WHOOP cloud recovery sync is not included.','Connect WHOOP from Settings for account sync.');
html=html.replace('Automatic WHOOP account sync is not connected in this local copy. Bluetooth supplies live HR only.','Account sync is available below. Bluetooth supplies live HR only.');
// Keep the NEW HTML as the source. Only add native/auth/storage integration.
const files=['apps/athlete/engine/engine-config.js','apps/athlete/vendor/supabase.min.js','apps/athlete/connectors/whoop.js','apps/athlete/engine/plan-sync.js','scripts/conditioning/updates.js','scripts/conditioning/runtime.js'];
const scripts=files.map(f=>'<script>'+fs.readFileSync(path.join(root,f),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>').join('');
// Make the observed-data selector available to the source HTML's Home renderer.
const homeData=fs.readFileSync(path.join(root,'scripts/conditioning/home-data.js'),'utf8');
html=html.replace('<script>','<script>'+homeData+'</script><script>');
html=html.replace('</body>','<script src="native-plugins.js"></script>'+scripts+'</body>');
fs.writeFileSync(path.join(out,'index.html'),html);
console.log('Built new HTML + native adapters:',path.relative(root,out));
