/**
 * Rasteriza public/icons/icon.svg a los PNG que exige la PWA.
 * Uso: npm run generate-icons
 */
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(here, '../public/icons');
const svg = await readFile(resolve(iconsDir, 'icon.svg'));

const targets = [
  { name: 'pwa-192.png', size: 192 },
  { name: 'pwa-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180, flatten: true },
  { name: 'maskable-512.png', size: 512, maskable: true },
];

for (const t of targets) {
  let img = sharp(svg, { density: 300 });
  if (t.maskable) {
    // zona segura: el icono ocupa el 80% centrado sobre fondo sólido
    const inner = await sharp(svg, { density: 300 })
      .resize(Math.round(t.size * 0.8))
      .png()
      .toBuffer();
    img = sharp({
      create: { width: t.size, height: t.size, channels: 4, background: '#fffdf7' },
    }).composite([{ input: inner, gravity: 'centre' }]);
  } else {
    img = img.resize(t.size, t.size);
  }
  if (t.flatten) img = img.flatten({ background: '#fffdf7' });
  await img.png().toFile(resolve(iconsDir, t.name));
  console.log(`✓ ${t.name}`);
}
