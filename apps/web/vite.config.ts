import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deliberately minimal. The hybrid repo's web config carries a PWA manifest,
// a three-way product switch and a pile of CSP-driven build settings; none of
// that is earned yet by a bench with one screen on it. Add a setting here when
// something needs it, with the reason, rather than porting a config whose
// comments describe problems this app does not have.
export default defineConfig({
  resolve: { dedupe: ['react', 'react-dom'] },
  plugins: [react()],
  build: { target: 'es2022' },
});
