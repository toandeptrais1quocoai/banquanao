import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAKE_MASK = path.resolve(__dirname, '../scripts/makeMask.js');

function parseHex(hex) {
  const raw = String(hex || '').replace('#', '').trim();
  const full = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw.padEnd(6, '0').slice(0, 6);
  return {
    r: Number.parseInt(full.slice(0, 2), 16) || 0,
    g: Number.parseInt(full.slice(2, 4), 16) || 0,
    b: Number.parseInt(full.slice(4, 6), 16) || 0,
  };
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
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
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function hueDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function luminance(r, g, b) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function clamp(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function distRgb(r, g, b, c) {
  return Math.hypot(r - c.r, g - c.g, b - c.b);
}

function isSkin(r, g, b) {
  const hsl = rgbToHsl(r, g, b);
  return (
    hsl.h >= 10
    && hsl.h <= 38
    && hsl.s >= 0.22
    && hsl.s <= 0.5
    && hsl.l >= 0.35
    && hsl.l <= 0.72
    && r > g + 4
    && g > b + 4
    && (r - b) > 35
    && (r - g) < 40
  );
}

function runMaskWorker(input, output) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [MAKE_MASK, input, output], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let err = '';
    child.stderr.on('data', (chunk) => {
      err += chunk.toString();
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(err || `makeMask exit ${code}`));
    });
  });
}

async function ensureForeground(rawFile) {
  const maskPath = `${rawFile}.mask.png`;
  try {
    await fs.access(maskPath);
  } catch {
    await runMaskWorker(rawFile, maskPath);
  }
  return maskPath;
}

function matchGarment(r, g, b, from, fromHsl, fromLum, lightSource, warmSource) {
  if (isSkin(r, g, b)) return false;
  const hsl = rgbToHsl(r, g, b);
  const lum = luminance(r, g, b);
  const d = distRgb(r, g, b, from);
  const grayish = Math.abs(r - g) < 12 && Math.abs(g - b) < 12;

  if (lum < 0.12 && fromLum > 0.28) return false;

  if (lightSource) {
    if (grayish && hsl.s < 0.06) return false;
    return lum >= 0.4 && hsl.s <= 0.42 && d < 160;
  }
  if (warmSource) {
    if (grayish && hsl.s < 0.07) return false;
    if (lum < 0.16 || lum > 0.92) return false;
    return (hsl.h >= 3 && hsl.h <= 68 && hsl.s >= 0.06) || d < 155;
  }
  const hueOk = fromHsl.s < 0.12
    ? hsl.s < 0.4
    : hueDiff(hsl.h, fromHsl.h) < 45;
  return hueOk && lum > 0.09 && lum < 0.94 && d < 165;
}

function paintColor(r, g, b, toHsl, darkTarget, toLum, fromHsl) {
  const hsl = rgbToHsl(r, g, b);
  let outL;
  let outS;
  if (darkTarget) {
    outL = clamp01(0.05 + hsl.l * 0.22);
    outS = 0.05;
  } else if (toLum > 0.75) {
    outL = clamp01(0.55 + hsl.l * 0.38);
    outS = Math.min(0.28, toHsl.s * 0.4);
  } else {
    outL = clamp01(hsl.l + (toHsl.l - fromHsl.l) * 0.5);
    outS = Math.min(0.75, toHsl.s * 0.7 + hsl.s * 0.2);
  }
  const painted = hslToRgb(toHsl.h, outS, outL);
  const keep = 0.3;
  return {
    r: clamp(painted.r * (1 - keep) + r * keep),
    g: clamp(painted.g * (1 - keep) + g * keep),
    b: clamp(painted.b * (1 - keep) + b * keep),
  };
}

function erodeAlpha(alpha, width, height, radius) {
  const out = new Uint8Array(alpha.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let min = 255;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (dx * dx + dy * dy > radius * radius) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            min = 0;
            continue;
          }
          min = Math.min(min, alpha[ny * width + nx]);
        }
      }
      out[y * width + x] = min;
    }
  }
  return out;
}

function dilateBinary(bin, width, height, radius) {
  const out = new Uint8Array(bin.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let on = 0;
      outer: for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (dx * dx + dy * dy > radius * radius) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (bin[ny * width + nx]) {
            on = 1;
            break outer;
          }
        }
      }
      out[y * width + x] = on;
    }
  }
  return out;
}

function erodeBinary(bin, width, height, radius) {
  const out = new Uint8Array(bin.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let on = 1;
      outer: for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (dx * dx + dy * dy > radius * radius) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height || !bin[ny * width + nx]) {
            on = 0;
            break outer;
          }
        }
      }
      out[y * width + x] = on;
    }
  }
  return out;
}

/**
 * Nhuộm trên lớp người (foreground), ghép lại nền gốc → mép sạch, không loang nền.
 */
export async function recolorClothesFile(rawFile, fromHex, toHex, outFile) {
  const fgPath = await ensureForeground(rawFile);

  const base = await sharp(rawFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = base.info;

  const fg = await sharp(fgPath)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const from = parseHex(fromHex);
  const to = parseHex(toHex);
  const fromHsl = rgbToHsl(from.r, from.g, from.b);
  const toHsl = rgbToHsl(to.r, to.g, to.b);
  const fromLum = luminance(from.r, from.g, from.b);
  const toLum = luminance(to.r, to.g, to.b);
  const lightSource = fromLum > 0.68 || (fromHsl.s < 0.22 && fromLum > 0.55);
  const warmSource = fromHsl.h >= 12 && fromHsl.h <= 55 && fromHsl.s >= 0.12;
  const darkTarget = toLum < 0.28;

  // Alpha người, co vào 2px
  let alpha = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < fg.data.length; i += 4, p += 1) {
    alpha[p] = fg.data[i + 3];
  }
  alpha = erodeAlpha(alpha, width, height, 2);

  let hard = new Uint8Array(width * height);
  let count = 0;
  for (let p = 0, i = 0; p < hard.length; p += 1, i += 4) {
    if (alpha[p] < 140) continue;
    // Dùng màu từ ảnh gốc (cùng tọa độ) để khớp vải
    const r = base.data[i];
    const g = base.data[i + 1];
    const b = base.data[i + 2];
    if (!matchGarment(r, g, b, from, fromHsl, fromLum, lightSource, warmSource)) continue;
    hard[p] = 1;
    count += 1;
  }

  if (count < 400) {
    // Fallback: nhuộm rộng hơn trong vùng người (trừ da + đen sẵn)
    hard = new Uint8Array(width * height);
    count = 0;
    for (let p = 0, i = 0; p < hard.length; p += 1, i += 4) {
      if (alpha[p] < 140) continue;
      const r = base.data[i];
      const g = base.data[i + 1];
      const b = base.data[i + 2];
      if (isSkin(r, g, b)) continue;
      const lum = luminance(r, g, b);
      if (lum < 0.12 && fromLum > 0.28) continue;
      if (lum < 0.08 || lum > 0.96) continue;
      hard[p] = 1;
      count += 1;
    }
  }

  if (count < 200) {
    // Không nhuộm được — giữ ảnh gốc cho biến thể này
    await fs.copyFile(rawFile, outFile);
    return 0;
  }

  // Lấp lỗ trong áo, rồi co 1px — phủ đặc, mép không răng cưa
  hard = dilateBinary(hard, width, height, 2);
  hard = erodeBinary(hard, width, height, 2);
  hard = erodeBinary(hard, width, height, 1);

  const out = Buffer.from(base.data);
  let hit = 0;
  for (let p = 0, i = 0; p < hard.length; p += 1, i += 4) {
    if (!hard[p]) continue;
    // Chỉ tô khi vẫn nằm trong người
    if (alpha[p] < 100) continue;
    const r = base.data[i];
    const g = base.data[i + 1];
    const b = base.data[i + 2];
    const painted = paintColor(r, g, b, toHsl, darkTarget, toLum, fromHsl);
    // Alpha cứng trong lõi
    const a = alpha[p] / 255;
    const w = a > 0.75 ? 1 : a;
    out[i] = clamp(painted.r * w + r * (1 - w));
    out[i + 1] = clamp(painted.g * w + g * (1 - w));
    out[i + 2] = clamp(painted.b * w + b * (1 - w));
    hit += 1;
  }

  await sharp(out, {
    raw: { width, height, channels: 4 },
  })
    .jpeg({ quality: 94 })
    .toFile(outFile);

  return hit;
}

export async function clearMaskCache() {}
