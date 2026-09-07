import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Two build targets from one codebase:
//
//   npm run build       → Android/Capacitor bundle in dist/ (relative asset
//                         paths, served from the device bundle).
//   npm run build:pwa   → iPhone/installable PWA, written straight into the Next
//                         app's public/app/ folder so it's served at
//                         quotation.championsecuritysystem.com/app (same origin
//                         as the API — no CORS). Sets base '/app/' and injects
//                         the web-app manifest + Apple home-screen meta tags.
//
// The PWA target is gated on PWA_BUILD so the Android bundle stays clean (no
// manifest link, which a WebView would only 404 on).
const isPWA = process.env.PWA_BUILD === '1';

// Injected into <head> only for the PWA build — makes iOS treat the page as an
// installable, standalone app with the company shield as its home-screen icon.
function pwaHeadTags() {
  return {
    name: 'pwa-head-tags',
    transformIndexHtml(html) {
      if (!isPWA) return html;
      const tags = `
    <link rel="manifest" href="/app/manifest.webmanifest" />
    <meta name="theme-color" content="#0f172a" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="CSS" />
    <link rel="apple-touch-icon" href="/app/icons/apple-touch-icon.png" />
    <link rel="icon" type="image/png" href="/app/icons/favicon-64.png" />
  `;
      return html.replace('</head>', `${tags}</head>`);
    },
  };
}

export default defineConfig({
  base: isPWA ? '/app/' : './',
  plugins: [react(), pwaHeadTags()],
  build: isPWA
    ? { outDir: '../public/app', emptyOutDir: true }
    : { outDir: 'dist' },
});
