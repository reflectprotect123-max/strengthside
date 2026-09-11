import * as esbuild from 'esbuild';
import { copyFileSync } from 'node:fs';

await esbuild.build({
  absWorkingDir: new URL('..', import.meta.url).pathname,
  entryPoints: ['packages/brain/src/index.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'HybridBrain',
  outfile: 'apps/athlete/brain-bundle.js',
  platform: 'browser',
  target: 'es2022',
});
copyFileSync(
  new URL('../apps/athlete/brain-bundle.js', import.meta.url),
  new URL('../apps/engine/brain-bundle.js', import.meta.url),
);
