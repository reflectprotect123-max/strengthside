import * as esbuild from 'esbuild';

await esbuild.build({
  absWorkingDir: new URL('..', import.meta.url).pathname,
  entryPoints: ['packages/brain/src/index.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'HybridBrain',
  outfile: 'apps/brain-app/brain-bundle.js',
  platform: 'browser',
  target: 'es2022',
});
