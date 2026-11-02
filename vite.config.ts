import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative Basis: JS-, CSS- und Asset-URLs funktionieren unter jedem Pfad,
// auch unter https://<user>.github.io/<repository>/ (GitHub Pages Projektseite).
export default defineConfig({
  base: './',
  plugins: [react()],
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 1700 },
});
