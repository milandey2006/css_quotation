import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Capacitor wraps the static build in dist/, so we use relative asset paths
// (base: './') — the WebView serves files from the app bundle, not a web root.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
