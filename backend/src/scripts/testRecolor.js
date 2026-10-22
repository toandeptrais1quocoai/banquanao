import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../frontend/public/images');
const src = path.join(root, 'khoac-da.jpg');
const out = path.join(root, 'products', '_test-den.jpg');

function parseHex(hex) {
  const raw = String(hex).replace('#', '');
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  };
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}
function hueDiff(a, b) { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
function isSkin(r, g, b) {
  const hsl = rgbToHsl(r, g, b);
  return hsl.h >= 5 && hsl.h <= 45 && hsl.s >= 0.15 && hsl.s <= 0.7 && hsl.l >= 0.25 && hsl.l <= 0.85 && r > g && g > b * 0.7;
}

const from = parseHex('c6a36a');
const to = parseHex('1a1a1a');
const fromHsl = rgbToHsl(from.r, from.g, from.b);
const toHsl = rgbToHsl(to.r, to.g, to.b);

const resized = await sharp(src).resize(800, 1000, { fit: 'cover' }).jpeg().toBuffer();
console.log('removing bg…');
const cutBlob = await removeBackground(resized);
const cutBuf = Buffer.from(await cutBlob.arrayBuffer());

const base = await sharp(resized).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const cut = await sharp(cutBuf).resize(base.info.width, base.info.height).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const outPx = Buffer.from(base.data);
for (let i = 0; i < outPx.length; i += 4) {
  const a = cut.data[i + 3];
  if (a < 40) continue; // nền gốc
  const r = base.data[i]; const g = base.data[i + 1]; const b = base.data[i + 2];
  if (isSkin(r, g, b)) continue;
  const hsl = rgbToHsl(r, g, b);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const warm = hsl.h >= 8 && hsl.h <= 62 && hsl.s > 0.1 && lum > 0.18;
  const near = Math.hypot(r - from.r, g - from.g, b - from.b) < 160;
  if (!(warm || near) || lum < 0.15) continue;
  const t = Math.max(0, Math.min(1, (hsl.l - 0.15) / 0.7));
  const outL = 0.05 + t * 0.18;
  const painted = hslToRgb(toHsl.h, 0.12, outL);
  outPx[i] = Math.round(painted.r * 0.9 + r * 0.1);
  outPx[i + 1] = Math.round(painted.g * 0.9 + g * 0.1);
  outPx[i + 2] = Math.round(painted.b * 0.9 + b * 0.1);
}

await sharp(outPx, { raw: { width: base.info.width, height: base.info.height, channels: 4 } })
  .jpeg({ quality: 90 })
  .toFile(out);
console.log('wrote', out);
