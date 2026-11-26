import sharp from 'sharp';
import { mkdirSync } from 'fs';

// Android status-bar notification icons must be a single-colour (white) shape on
// transparency — a full-colour launcher icon renders as a grey blob. This turns
// the shield logo into a white silhouette at every density.
//   node make-notification-icon.mjs
const SRC = 'assets/logo-source.png';
const RES = 'android/app/src/main/res';
const SIZES = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 };

const alpha = await sharp(SRC).ensureAlpha().extractChannel('alpha').toBuffer();
const { width, height } = await sharp(SRC).metadata();
const white = await sharp({ create: { width, height, channels: 3, background: '#ffffff' } })
  .joinChannel(alpha, { raw: undefined })
  .png()
  .toBuffer()
  .catch(async () =>
    // fallback: rebuild from raw alpha
    sharp({ create: { width, height, channels: 3, background: '#ffffff' } })
      .joinChannel(await sharp(SRC).ensureAlpha().extractChannel('alpha').png().toBuffer())
      .png()
      .toBuffer()
  );

for (const [dpi, px] of Object.entries(SIZES)) {
  const dir = `${RES}/drawable-${dpi}`;
  mkdirSync(dir, { recursive: true });
  const inner = Math.round(px * 0.9);
  const shape = await sharp(white).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: px, height: px, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: shape, gravity: 'center' }])
    .png()
    .toFile(`${dir}/ic_stat_notify.png`);
}
console.log('wrote ic_stat_notify.png for', Object.keys(SIZES).join(', '));
