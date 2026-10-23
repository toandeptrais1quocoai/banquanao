import { getPool, sql } from '../config/db.js';

function mapVoucher(row) {
  if (!row) return null;
  return {
    id: row.Id,
    code: row.Code,
    type: row.Type,
    value: row.Value,
    minOrderTotal: row.MinOrderTotal || 0,
    maxDiscount: row.MaxDiscount == null ? null : row.MaxDiscount,
    maxUses: row.MaxUses == null ? null : row.MaxUses,
    usedCount: row.UsedCount || 0,
    active: Boolean(row.Active),
    note: row.Note || '',
    createdAt: row.CreatedAt,
  };
}

export function calcDiscount(subtotal, voucher) {
  const base = Math.max(0, Number(subtotal) || 0);
  if (!voucher || base <= 0) return 0;
  if (base < (voucher.minOrderTotal || 0)) return 0;

  let discount = 0;
  if (voucher.type === 'percent') {
    discount = Math.floor((base * Number(voucher.value)) / 100);
    if (voucher.maxDiscount != null) {
      discount = Math.min(discount, Number(voucher.maxDiscount));
    }
  } else {
    discount = Math.min(Number(voucher.value) || 0, base);
  }
  return Math.max(0, Math.min(discount, base));
}

export async function listVouchers() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT Id, Code, Type, Value, MinOrderTotal, MaxDiscount, MaxUses, UsedCount, Active, Note, CreatedAt
    FROM dbo.Vouchers
    ORDER BY Id DESC
  `);
  return result.recordset.map(mapVoucher);
}

export async function findById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT Id, Code, Type, Value, MinOrderTotal, MaxDiscount, MaxUses, UsedCount, Active, Note, CreatedAt
      FROM dbo.Vouchers
      WHERE Id = @id
    `);
  return mapVoucher(result.recordset[0]);
}

export async function findByCode(code) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('code', sql.NVarChar(40), code)
    .query(`
      SELECT Id, Code, Type, Value, MinOrderTotal, MaxDiscount, MaxUses, UsedCount, Active, Note, CreatedAt
      FROM dbo.Vouchers
      WHERE Code = @code
    `);
  return mapVoucher(result.recordset[0]);
}

export async function createVoucher(input) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('code', sql.NVarChar(40), input.code)
    .input('type', sql.NVarChar(20), input.type)
    .input('value', sql.Int, input.value)
    .input('minOrderTotal', sql.Int, input.minOrderTotal || 0)
    .input('maxDiscount', sql.Int, input.maxDiscount)
    .input('maxUses', sql.Int, input.maxUses)
    .input('active', sql.Bit, input.active ? 1 : 0)
    .input('note', sql.NVarChar(200), input.note || null)
    .query(`
      INSERT INTO dbo.Vouchers (Code, Type, Value, MinOrderTotal, MaxDiscount, MaxUses, Active, Note)
      OUTPUT INSERTED.Id
      VALUES (@code, @type, @value, @minOrderTotal, @maxDiscount, @maxUses, @active, @note)
    `);
  return findById(result.recordset[0].Id);
}

export async function updateVoucher(id, input) {
  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('code', sql.NVarChar(40), input.code)
    .input('type', sql.NVarChar(20), input.type)
    .input('value', sql.Int, input.value)
    .input('minOrderTotal', sql.Int, input.minOrderTotal || 0)
    .input('maxDiscount', sql.Int, input.maxDiscount)
    .input('maxUses', sql.Int, input.maxUses)
    .input('active', sql.Bit, input.active ? 1 : 0)
    .input('note', sql.NVarChar(200), input.note || null)
    .query(`
      UPDATE dbo.Vouchers
      SET Code = @code,
          Type = @type,
          Value = @value,
          MinOrderTotal = @minOrderTotal,
          MaxDiscount = @maxDiscount,
          MaxUses = @maxUses,
          Active = @active,
          Note = @note
      WHERE Id = @id
    `);
  return findById(id);
}

export async function removeVoucher(id) {
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id).query('DELETE FROM dbo.Vouchers WHERE Id = @id');
}

export async function bumpUsedCount(id, by = 1) {
  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('by', sql.Int, by)
    .query('UPDATE dbo.Vouchers SET UsedCount = UsedCount + @by WHERE Id = @id');
}

export async function applyToOrder(orderId, { subtotal, discountAmount, voucherCode, total }) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, orderId)
    .input('subtotal', sql.Int, subtotal)
    .input('discountAmount', sql.Int, discountAmount)
    .input('voucherCode', sql.NVarChar(40), voucherCode)
    .input('total', sql.Int, total)
    .query(`
      UPDATE dbo.Orders
      SET Subtotal = @subtotal,
          DiscountAmount = @discountAmount,
          VoucherCode = @voucherCode,
          Total = @total
      OUTPUT INSERTED.Id, INSERTED.Subtotal, INSERTED.DiscountAmount, INSERTED.VoucherCode, INSERTED.Total
      WHERE Id = @id
    `);
  const row = result.recordset[0];
  return row
    ? {
        id: row.Id,
        subtotal: row.Subtotal,
        discountAmount: row.DiscountAmount,
        voucherCode: row.VoucherCode,
        total: row.Total,
      }
    : null;
}

export async function listEligibleOrderIds() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT Id
    FROM dbo.Orders
    WHERE Status <> N'cancelled'
      AND (VoucherCode IS NULL OR VoucherCode = N'')
    ORDER BY Id DESC
  `);
  return result.recordset.map((row) => row.Id);
}
