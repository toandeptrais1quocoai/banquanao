import './config/env.js';
import { getPool, sql } from './config/db.js';

const EXTRA = {
  ao: [
    { name: 'Đen', hex: '#1f1f1f', imageUrl: '/images/ao-thun.jpg' },
    { name: 'Xanh navy', hex: '#1e3a5f', imageUrl: '/images/so-mi.jpg' },
  ],
  quan: [
    { name: 'Đen', hex: '#222222', imageUrl: '/images/quan-jogger.jpg' },
    { name: 'Xanh jean', hex: '#4a6fa5', imageUrl: '/images/quan-short.jpg' },
  ],
  vay: [
    { name: 'Đen', hex: '#111111', imageUrl: '/images/dam-do.jpg' },
    { name: 'Hồng', hex: '#e8a0b0', imageUrl: '/images/dam-hoa.jpg' },
  ],
  'ao-khoac': [
    { name: 'Đen', hex: '#1a1a1a', imageUrl: '/images/bomber.jpg' },
    { name: 'Xám', hex: '#7a7a7a', imageUrl: '/images/khoac-da.jpg' },
  ],
  'phu-kien': [
    { name: 'Đen', hex: '#222222', imageUrl: '/images/tui.jpg' },
    { name: 'Nâu', hex: '#8a6a52', imageUrl: '/images/khan.jpg' },
  ],
  giay: [
    { name: 'Đen', hex: '#1a1a1a', imageUrl: '/images/giay-the-thao.jpg' },
    { name: 'Xám', hex: '#9aa0a6', imageUrl: '/images/giay-sneaker.jpg' },
  ],
  dep: [
    { name: 'Đen', hex: '#222222', imageUrl: '/images/dep-le.jpg' },
    { name: 'Be', hex: '#d9c7a8', imageUrl: '/images/sandal.jpg' },
  ],
};

const pool = await getPool();
const products = await pool.request().query(`
  SELECT p.Id, p.Name, p.ColorName, p.ColorHex, p.ImageUrl, c.Slug AS CategorySlug
  FROM dbo.Products p
  JOIN dbo.Categories c ON c.Id = p.CategoryId
`);

for (const row of products.recordset) {
  const base = {
    name: row.ColorName,
    hex: String(row.ColorHex || '').trim() || '#cccccc',
    imageUrl: row.ImageUrl,
  };
  const extras = (EXTRA[row.CategorySlug] || []).filter(
    (item) => item.name.toLowerCase() !== base.name.toLowerCase(),
  );
  const colors = [base, ...extras].slice(0, 3);
  await pool
    .request()
    .input('id', sql.Int, row.Id)
    .input('options', sql.NVarChar(2000), JSON.stringify(colors))
    .query('UPDATE dbo.Products SET ColorOptions = @options WHERE Id = @id');
  console.log(`${row.Name}: ${colors.map((c) => c.name).join(', ')}`);
}

await pool.close();
console.log('Đã gán nhiều màu cho sản phẩm.');
