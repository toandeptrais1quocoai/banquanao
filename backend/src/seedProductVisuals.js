/**
 * Ảnh riêng từng món + biến thể màu quần áo.
 * Chạy: npm run seed:images --prefix backend
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import './config/env.js';
import { getPool, sql } from './config/db.js';
import { clearMaskCache, recolorClothesFile } from './lib/recolorClothes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../../frontend/public/images/products');
const SRC_DIR = path.resolve(__dirname, '../../frontend/public/images');

const STYLE_BASE = {
  'ao-khoac-da-be': 'khoac-da.jpg',
  'ao-khoac-blazer': 'khoac-da.jpg',
  'ao-khoac-bomber': 'bomber.jpg',
  'ao-khoac-gio': 'bomber.jpg',
  'ao-cardigan-dai': 'ao-len.jpg',
  'ao-len-co-lo': 'ao-len.jpg',
  'ao-hoodie-ni': 'ao-len.jpg',
  'ao-thun-cotton-co-tron': 'ao-thun.jpg',
  'ao-polo-basic': 'ao-thun.jpg',
  'ao-so-mi-trang': 'so-mi.jpg',
  'ao-so-mi-ke': 'so-mi.jpg',
  'ao-so-mi-theu-hoa': 'so-mi-theu.jpg',
  'ao-croptop-tay-dai': 'so-mi-theu.jpg',
  'quan-kaki-ong-con': 'quan-kaki.jpg',
  'quan-tay-cong-so': 'quan-kaki.jpg',
  'quan-short-kaki': 'quan-kaki.jpg',
  'quan-short-jean': 'quan-short.jpg',
  'quan-jean-ong-rong': 'quan-short.jpg',
  'quan-jogger-tui-hop': 'quan-jogger.jpg',
  'quan-ong-suong-linen': 'quan-jogger.jpg',
  'dam-do-hoa-nhi': 'dam-do.jpg',
  'set-vay-hai-day': 'dam-do.jpg',
  'dam-trang-tre-vai': 'dam-trang.jpg',
  'chan-vay-chu-a': 'dam-trang.jpg',
  'dam-suong-cong-so': 'dam-trang.jpg',
  'dam-hoa-quan': 'dam-hoa.jpg',
  'dam-maxi-hoa': 'dam-hoa.jpg',
  'giay-sneaker-trang': 'giay-sneaker.jpg',
  'giay-loafer-da': 'giay-sneaker.jpg',
  'giay-bup-be': 'giay-sneaker.jpg',
  'giay-the-thao-den': 'giay-the-thao.jpg',
  'giay-chay-bo-xam': 'giay-the-thao.jpg',
  'dep-le-nau': 'dep-le.jpg',
  'dep-quai-ngang': 'dep-le.jpg',
  'sandal-quai-cheo': 'sandal.jpg',
  'sandal-the-thao': 'sandal.jpg',
  'guoc-de-xuong': 'sandal.jpg',
  'khan-choang-ke': 'khan.jpg',
  'mu-bucket': 'khan.jpg',
  'tat-co-ngan-3-doi': 'khan.jpg',
  'tui-vai-deo-vai': 'tui.jpg',
  'that-lung-da': 'tui.jpg',
  'tui-deo-cheo-mini': 'tui.jpg',
};

const SLUG_TWEAK = {
  'ao-khoac-blazer': { hue: 6, brightness: 1.04, saturation: 0.92 },
  'ao-khoac-gio': { hue: -14, brightness: 0.94, saturation: 1.05 },
  'ao-cardigan-dai': { hue: 10, brightness: 1.06, saturation: 0.8 },
  'ao-hoodie-ni': { hue: -20, brightness: 0.9, saturation: 0.65 },
  'ao-polo-basic': { hue: 28, brightness: 1.04, saturation: 0.7 },
  'ao-so-mi-ke': { hue: -32, brightness: 0.96, saturation: 1.1 },
  'ao-croptop-tay-dai': { hue: 16, brightness: 1.08, saturation: 0.8 },
  'quan-tay-cong-so': { hue: -8, brightness: 0.82, saturation: 0.45 },
  'quan-short-kaki': { hue: 12, brightness: 1.08, saturation: 0.95 },
  'quan-jean-ong-rong': { hue: -24, brightness: 0.78, saturation: 0.95 },
  'quan-ong-suong-linen': { hue: 6, brightness: 1.1, saturation: 0.55 },
  'set-vay-hai-day': { hue: -6, brightness: 0.9, saturation: 1.02 },
  'chan-vay-chu-a': { hue: 0, brightness: 0.72, saturation: 0.35 },
  'dam-suong-cong-so': { hue: -40, brightness: 0.78, saturation: 0.75 },
  'dam-maxi-hoa': { hue: 18, brightness: 1.04, saturation: 1.12 },
  'giay-loafer-da': { hue: 16, brightness: 0.86, saturation: 1.05 },
  'giay-bup-be': { hue: -4, brightness: 0.7, saturation: 0.35 },
  'giay-chay-bo-xam': { hue: 0, brightness: 1.06, saturation: 0.5 },
  'dep-quai-ngang': { hue: -12, brightness: 0.78, saturation: 0.4 },
  'sandal-the-thao': { hue: -16, brightness: 0.92, saturation: 0.55 },
  'guoc-de-xuong': { hue: 14, brightness: 1.06, saturation: 0.9 },
  'mu-bucket': { hue: 8, brightness: 1.06, saturation: 0.85 },
  'tat-co-ngan-3-doi': { hue: 0, brightness: 1.15, saturation: 0.25 },
  'that-lung-da': { hue: 12, brightness: 0.82, saturation: 1.02 },
  'tui-deo-cheo-mini': { hue: -6, brightness: 0.68, saturation: 0.4 },
};

const VARIANT_POOL = [
  { name: 'Đen', hex: '#1a1a1a' },
  { name: 'Be', hex: '#c6a36a' },
  { name: 'Xám', hex: '#7a7a7a' },
  { name: 'Nâu', hex: '#6b4a2f' },
  { name: 'Xanh navy', hex: '#1e3a5f' },
];

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

function colorSlug(name) {
  return String(name || 'mau')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'mau';
}

function rgbDist(a, b) {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

async function buildRaw(srcFile, tweak, outFile) {
  let pipeline = sharp(srcFile).resize(800, 1000, { fit: 'cover' });
  if (tweak) {
    pipeline = pipeline.modulate({
      hue: tweak.hue || 0,
      brightness: tweak.brightness ?? 1,
      saturation: tweak.saturation ?? 1,
    });
  }
  await pipeline.jpeg({ quality: 90 }).toFile(outFile);
}

function pickVariants(baseName, baseHex) {
  const used = new Set([baseName.toLowerCase()]);
  const extras = [];
  for (const item of VARIANT_POOL) {
    if (used.has(item.name.toLowerCase())) continue;
    if (rgbDist(parseHex(baseHex), parseHex(item.hex)) < 45) continue;
    extras.push(item);
    used.add(item.name.toLowerCase());
    if (extras.length >= 2) break;
  }
  if (!extras.length) extras.push({ name: 'Đen', hex: '#1a1a1a' });
  return extras;
}

await fs.mkdir(OUT_DIR, { recursive: true });

const pool = await getPool();
const result = await pool.request().query(`
  SELECT p.Id, p.Name, p.Slug, p.ColorName, p.ColorHex, p.ImageUrl
  FROM dbo.Products p
  ORDER BY p.Id
`);

let updated = 0;
for (const row of result.recordset) {
  const slug = row.Slug;
  const styleFile = STYLE_BASE[slug] || path.basename(String(row.ImageUrl || 'ao-thun.jpg'));
  const srcPath = path.join(SRC_DIR, styleFile);
  try {
    await fs.access(srcPath);
  } catch {
    console.warn(`Bỏ qua ${slug}: thiếu ${styleFile}`);
    continue;
  }

  const rawPath = path.join(OUT_DIR, `_raw-${slug}.jpg`);
  const mainPath = path.join(OUT_DIR, `${slug}.jpg`);
  await buildRaw(srcPath, SLUG_TWEAK[slug] || null, rawPath);

  const baseColor = {
    name: row.ColorName || 'Mặc định',
    hex: String(row.ColorHex || '').trim() || '#cccccc',
  };
  const variants = pickVariants(baseColor.name, baseColor.hex);

  const colors = [];
  const mainColorFile = `${slug}-${colorSlug(baseColor.name)}.jpg`;
  await fs.copyFile(rawPath, path.join(OUT_DIR, mainColorFile));
  await fs.copyFile(rawPath, mainPath);
  colors.push({
    name: baseColor.name,
    hex: baseColor.hex,
    imageUrl: `/images/products/${mainColorFile}`,
  });

  for (const extra of variants) {
    const file = `${slug}-${colorSlug(extra.name)}.jpg`;
    process.stdout.write(`  ${row.Name} → ${extra.name}… `);
    try {
      const hit = await recolorClothesFile(
        rawPath,
        baseColor.hex,
        extra.hex,
        path.join(OUT_DIR, file),
      );
      console.log(hit ? 'ok' : 'ok (giữ gốc)');
    } catch (err) {
      await fs.copyFile(rawPath, path.join(OUT_DIR, file));
      console.log(`skip (${err.message})`);
    }
    colors.push({
      name: extra.name,
      hex: extra.hex,
      imageUrl: `/images/products/${file}`,
    });
  }

  clearMaskCache();
  await fs.unlink(rawPath).catch(() => {});
  await fs.unlink(`${rawPath}.mask.png`).catch(() => {});

  await pool
    .request()
    .input('id', sql.Int, row.Id)
    .input('imageUrl', sql.NVarChar(300), `/images/products/${slug}.jpg`)
    .input('options', sql.NVarChar(2000), JSON.stringify(colors))
    .query(`
      UPDATE dbo.Products
      SET ImageUrl = @imageUrl, ColorOptions = @options
      WHERE Id = @id
    `);

  updated += 1;
  console.log(`${row.Name}: ${colors.map((c) => c.name).join(' · ')}`);
}

await pool.close();
console.log(`Xong — ${updated} món: đổi màu áo khi chọn màu.`);
