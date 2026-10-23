import { getPool, sql } from '../config/db.js';

function mapItem(row) {
  const price = row.Price;
  const originalPrice =
    row.OriginalPrice && row.OriginalPrice > price ? row.OriginalPrice : null;
  return {
    id: row.Id,
    productId: row.ProductId,
    size: row.Size,
    color: row.Color,
    quantity: row.Quantity,
    name: row.Name,
    slug: row.Slug,
    price,
    originalPrice,
    imageUrl: row.ImageUrl,
    colorName: row.Color || row.ColorName,
    colorHex: row.ColorHex?.trim(),
    lineTotal: row.Quantity * price,
  };
}

export async function listByUser(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT
        ci.Id, ci.ProductId, ci.Size, ci.Color, ci.Quantity,
        p.Name, p.Slug, p.Price, p.OriginalPrice, p.ImageUrl, p.ColorName, p.ColorHex
      FROM dbo.CartItems ci
      JOIN dbo.Products p ON p.Id = ci.ProductId
      WHERE ci.UserId = @userId
      ORDER BY ci.UpdatedAt DESC, ci.Id DESC
    `);
  return result.recordset.map(mapItem);
}

export async function findByIdForUser(id, userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .input('userId', sql.Int, userId)
    .query(`
      SELECT
        ci.Id, ci.ProductId, ci.Size, ci.Color, ci.Quantity,
        p.Name, p.Slug, p.Price, p.OriginalPrice, p.ImageUrl, p.ColorName, p.ColorHex
      FROM dbo.CartItems ci
      JOIN dbo.Products p ON p.Id = ci.ProductId
      WHERE ci.Id = @id AND ci.UserId = @userId
    `);
  return result.recordset[0] ? mapItem(result.recordset[0]) : null;
}

export async function findLine(userId, productId, size, color) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .input('productId', sql.Int, productId)
    .input('size', sql.NVarChar(20), size)
    .input('color', sql.NVarChar(40), color)
    .query(`
      SELECT Id, Quantity
      FROM dbo.CartItems
      WHERE UserId = @userId AND ProductId = @productId AND Size = @size AND Color = @color
    `);
  return result.recordset[0] || null;
}

export async function insertItem(userId, productId, size, color, quantity) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .input('productId', sql.Int, productId)
    .input('size', sql.NVarChar(20), size)
    .input('color', sql.NVarChar(40), color)
    .input('quantity', sql.Int, quantity)
    .query(`
      INSERT INTO dbo.CartItems (UserId, ProductId, Size, Color, Quantity)
      OUTPUT INSERTED.Id
      VALUES (@userId, @productId, @size, @color, @quantity)
    `);
  return result.recordset[0].Id;
}

export async function updateQuantity(id, userId, quantity) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .input('userId', sql.Int, userId)
    .input('quantity', sql.Int, quantity)
    .query(`
      UPDATE dbo.CartItems
      SET Quantity = @quantity, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id AND UserId = @userId
    `);
  return result.rowsAffected[0] > 0;
}

export async function removeItem(id, userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .input('userId', sql.Int, userId)
    .query('DELETE FROM dbo.CartItems WHERE Id = @id AND UserId = @userId');
  return result.rowsAffected[0] > 0;
}

export async function clearByUser(userId) {
  const pool = await getPool();
  await pool
    .request()
    .input('userId', sql.Int, userId)
    .query('DELETE FROM dbo.CartItems WHERE UserId = @userId');
}
