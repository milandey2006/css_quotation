import sharp from 'sharp';

// The company logo (Champion Security shield), copied from the web app's favicon.
// Regenerate icons after changing this: `node make-icons.mjs && npx @capacitor/assets generate --android`
const SRC = 'assets/logo-source.png';
const SIZE = 1024;

const white = { r: 255, g: 255, b: 255, alpha: 1 };
const clear = { r: 0, g: 0, b: 0, alpha: 0 };

async function centered(scale, background) {
  const target = Math.round(SIZE * scale);
  const logo = await sharp(SRC)
    .resize(target, target, { fit: 'contain', background: clear })
    .png()
    .toBuffer();
  return sharp({ create: { width: SIZE, height: SIZE, channels: 4, background } })
    .composite([{ input: logo, gravity: 'center' }])
    .png();
}

// Adaptive foreground: keep the logo inside the ~66% safe zone (Android crops the
// edges to circles/squircles). Transparent padding around it.
(await centered(0.58, clear)).toFile('assets/icon-foreground.png');
// Adaptive background: solid white.
await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: white } }).png().toFile('assets/icon-background.png');
// Legacy square icon: logo a bit larger on white.
(await centered(0.76, white)).toFile('assets/icon.png');

console.log('composed assets/icon.png, icon-foreground.png, icon-background.png');
