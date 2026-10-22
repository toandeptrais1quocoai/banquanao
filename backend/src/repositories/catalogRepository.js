import { getPool, sql } from '../config/db.js';

function parseColors(row) {
  const fallback = [{
    name: row.ColorName,
    hex: row.ColorHex?.trim() || '#cccccc',
    imageUrl: row.ImageUrl,
  }];

  if (!row.ColorOptions) return fallback;
  try {
    const parsed = JSON.parse(row.ColorOptions);
    if (!Array.isArray(parsed) || !parsed.length) return fallback;
    return parsed
      .map((item) => ({
        name: String(item.name || '').trim(),
        hex: String(item.hex || '#cccccc').trim(),
        imageUrl: String(item.imageUrl || row.ImageUrl || '').trim(),
      }))
      .filter((item) => item.name);
  } catch {
    return fallback;
  }
}

function mapProduct(row) {
  const price = row.Price;
  const originalPrice = row.OriginalPrice && row.OriginalPrice > price
    ? row.OriginalPrice
    : null;
  const discountPercent = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const colors = parseColors(row);
  const sizes = String(row.Sizes || '')
    .split(',')
    .map((size) => size.trim())
    .filter(Boolean);

  return {
    id: row.Id,
    categoryId: row.CategoryId,
    name: row.Name,
    slug: row.Slug,
    description: row.Description,
    price,
    originalPrice,
    costPrice: Number(row.CostPrice) || 0,
    importQty: Number(row.ImportQty) || 0,
    soldQty: Number(row.SoldQty) || 0,
    stockQty: Math.max(0, Number(row.StockQty) || 0),
    discountPercent,
    imageUrl: row.ImageUrl,
    colorName: row.ColorName,
    colorHex: row.ColorHex?.trim(),
    colors,
    sizes,
    material: row.Material,
    isFeatured: Boolean(row.IsFeatured),
    categoryName: row.CategoryName,
    categorySlug: row.CategorySlug,
  };
}

const SOLD_SUBQUERY = `
  ISNULL((
    SELECT SUM(oi.Quantity)
    FROM dbo.OrderItems oi
    INNER JOIN dbo.Orders o ON o.Id = oi.OrderId
    WHERE oi.ProductId = p.Id AND o.Status <> N'cancelled'
  ), 0)
`;

const PRODUCT_SELECT = `
  p.Id, p.CategoryId, p.Name, p.Slug, p.Description, p.Price, p.OriginalPrice, p.CostPrice,
  p.ImportQty,
  ${SOLD_SUBQUERY} AS SoldQty,
  (p.ImportQty - ${SOLD_SUBQUERY}) AS StockQty,
  p.ImageUrl,
  p.ColorName, p.ColorHex, p.ColorOptions, p.Sizes, p.Material, p.IsFeatured,
  c.Name AS CategoryName, c.Slug AS CategorySlug
`;

export async function listCategories() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT c.Id, c.Name, c.Slug, COUNT(p.Id) AS ProductCount
    FROM dbo.Categories c
    LEFT JOIN dbo.Products p ON p.CategoryId = c.Id
    GROUP BY c.Id, c.Name, c.Slug
    ORDER BY c.Id
  `);
  return result.recordset.map((row) => ({
    id: row.Id,
    name: row.Name,
    slug: row.Slug,
    productCount: row.ProductCount,
  }));
}

export async function listProducts(categorySlug, search = '') {
  const pool = await getPool();
  const q = search ? `%${search}%` : null;
  const result = await pool
    .request()
    .input('category', sql.NVarChar(80), categorySlug || null)
    .input('q', sql.NVarChar(120), q)
    .query(`
      SELECT ${PRODUCT_SELECT}
      FROM dbo.Products p
      JOIN dbo.Categories c ON c.Id = p.CategoryId
      WHERE (@category IS NULL OR c.Slug = @category)
        AND (
          @q IS NULL
          OR p.Name LIKE @q
          OR p.Description LIKE @q
          OR c.Name LIKE @q
        )
      ORDER BY p.Id
    `);
  return result.recordset.map(mapProduct);
}

export async function findProductBySlug(slug) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('slug', sql.NVarChar(180), slug)
    .query(`
      SELECT ${PRODUCT_SELECT}
      FROM dbo.Products p
      JOIN dbo.Categories c ON c.Id = p.CategoryId
      WHERE p.Slug = @slug
    `);
  return result.recordset[0] ? mapProduct(result.recordset[0]) : null;
}

export async function findProductById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT ${PRODUCT_SELECT}
      FROM dbo.Products p
      JOIN dbo.Categories c ON c.Id = p.CategoryId
      WHERE p.Id = @id
    `);
  return result.recordset[0] ? mapProduct(result.recordset[0]) : null;
}

export async function findProductsByIds(ids) {
  const unique = [...new Set(ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  if (!unique.length) return [];
  const pool = await getPool();
  const request = pool.request();
  const placeholders = unique.map((id, index) => {
    const name = `id${index}`;
    request.input(name, sql.Int, id);
    return `@${name}`;
  });
  const result = await request.query(`
    SELECT ${PRODUCT_SELECT}
    FROM dbo.Products p
    JOIN dbo.Categories c ON c.Id = p.CategoryId
    WHERE p.Id IN (${placeholders.join(', ')})
  `);
  return result.recordset.map(mapProduct);
}
