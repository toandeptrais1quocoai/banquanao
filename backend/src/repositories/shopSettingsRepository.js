import { getPool, sql } from '../config/db.js';

function mapStorefront(row) {
  if (!row) {
    return { active: false, code: null, percent: null };
  }
  return {
    active: Boolean(row.StorefrontVoucherActive) && Number(row.StorefrontVoucherPercent) >= 1,
    code: row.StorefrontVoucherCode || null,
    percent: row.StorefrontVoucherPercent != null ? Number(row.StorefrontVoucherPercent) : null,
    updatedAt: row.UpdatedAt || null,
  };
}

export async function getStorefrontVoucher() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 1 Id, StorefrontVoucherActive, StorefrontVoucherCode, StorefrontVoucherPercent, UpdatedAt
    FROM dbo.ShopSettings
    WHERE Id = 1
  `);
  return mapStorefront(result.recordset[0]);
}

export async function setStorefrontVoucher({ active, code, percent }) {
  const pool = await getPool();
  await pool
    .request()
    .input('active', sql.Bit, active ? 1 : 0)
    .input('code', sql.NVarChar(40), code || null)
    .input('percent', sql.Int, percent)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.ShopSettings WHERE Id = 1)
      BEGIN
        INSERT INTO dbo.ShopSettings (Id, StorefrontVoucherActive, StorefrontVoucherCode, StorefrontVoucherPercent)
        VALUES (1, @active, @code, @percent);
      END
      ELSE
      BEGIN
        UPDATE dbo.ShopSettings
        SET StorefrontVoucherActive = @active,
            StorefrontVoucherCode = @code,
            StorefrontVoucherPercent = @percent,
            UpdatedAt = SYSUTCDATETIME()
        WHERE Id = 1;
      END
    `);
  return getStorefrontVoucher();
}
