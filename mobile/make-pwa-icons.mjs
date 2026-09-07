import sharp from 'sharp';
import { mkdirSync } from 'fs';

// Generates the PWA home-screen icons (iPhone "Add to Home Screen" + Android
// installable) from the company shield logo. Regenerate after changing the logo:
//   node make-pwa-icons.mjs
// Output lands in public/ so Vite copies it into the built PWA (public/app/).

const SRC = 'assets/logo-source.png';
const OUT = 'public/icons';
mkdirSync(OUT, { recursive: true });

const white = { r: 255, g: 255, b: 255, alpha: 1 };
const navy = { r: 15, g: 23, b: 42, alpha: 1 }; // #0f172a — matches the app theme
const clear = { r: 0, g: 0, b: 0, alpha: 0 };

// Logo, scaled to `scale` of the canvas, centred on `background`.
async function icon(size, scale, background) {
  const target = Math.round(size * scale);
  const logo = await sharp(SRC)
    .resize(target, target, { fit: 'contain', background: clear })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: logo, gravity: 'center' }])
    .png();
}

// Standard "any" icons: logo comfortably filling a white tile.
await (await icon(192, 0.78, white)).toFile(`${OUT}/pwa-192.png`);
await (await icon(512, 0.78, white)).toFile(`${OUT}/pwa-512.png`);

// Maskable: keep the logo inside the ~60% safe zone so launchers can crop the
// edges (circle/squircle) without clipping the shield. Navy bleed matches theme.
await (await icon(512, 0.6, navy)).toFile(`${OUT}/pwa-maskable-512.png`);

// Apple touch icon: iOS rounds the corners itself, so a full white tile is best.
await (await icon(180, 0.8, white)).toFile(`${OUT}/apple-touch-icon.png`);

// Favicon for the browser tab (before install).
await (await icon(64, 0.82, white)).toFile(`${OUT}/favicon-64.png`);

console.log('Generated PWA icons in', OUT);
