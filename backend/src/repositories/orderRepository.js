import { getPool, sql } from '../config/db.js';

export async function createOrder(order, items) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const orderResult = await new sql.Request(transaction)
      .input('userId', sql.Int, order.userId)
      .input('fullName', sql.NVarChar(80), order.fullName)
      .input('phone', sql.NVarChar(20), order.phone)
      .input('address', sql.NVarChar(300), order.address)
      .input('note', sql.NVarChar(400), order.note)
      .input('paymentMethod', sql.NVarChar(30), order.paymentMethod)
      .input('total', sql.Int, order.total)
      .query(`
        INSERT INTO dbo.Orders (UserId, FullName, Phone, Address, Note, PaymentMethod, Total)
        OUTPUT INSERTED.Id, INSERTED.Status, INSERTED.CreatedAt, INSERTED.Total
        VALUES (@userId, @fullName, @phone, @address, @note, @paymentMethod, @total)
      `);

    const created = orderResult.recordset[0];

    for (const item of items) {
      await new sql.Request(transaction)
        .input('orderId', sql.Int, created.Id)
        .input('productId', sql.Int, item.productId)
        .input('productName', sql.NVarChar(160), item.productName)
        .input('size', sql.NVarChar(20), item.size)
        .input('color', sql.NVarChar(40), item.color || '')
        .input('unitPrice', sql.Int, item.unitPrice)
        .input('quantity', sql.Int, item.quantity)
        .query(`
          INSERT INTO dbo.OrderItems (OrderId, ProductId, ProductName, Size, Color, UnitPrice, Quantity)
          VALUES (@orderId, @productId, @productName, @size, @color, @unitPrice, @quantity)
        `);
    }

    if (order.userId) {
      const cartIds = Array.isArray(order.cartItemIds)
        ? order.cartItemIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)
        : [];
      if (cartIds.length) {
        const request = new sql.Request(transaction).input('userId', sql.Int, order.userId);
        const placeholders = cartIds.map((id, index) => {
          const name = `cid${index}`;
          request.input(name, sql.Int, id);
          return `@${name}`;
        });
        await request.query(`
          DELETE FROM dbo.CartItems
          WHERE UserId = @userId AND Id IN (${placeholders.join(', ')})
        `);
      } else {
        await new sql.Request(transaction)
          .input('userId', sql.Int, order.userId)
          .query('DELETE FROM dbo.CartItems WHERE UserId = @userId');
      }
    }

    await transaction.commit();
    return {
      id: created.Id,
      status: created.Status,
      total: created.Total,
      createdAt: created.CreatedAt,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function findById(id) {
  const pool = await getPool();
  const orderResult = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT Id, UserId, FullName, Phone, Address, Note, PaymentMethod, Status, Total, CreatedAt
      FROM dbo.Orders
      WHERE Id = @id
    `);
  const order = orderResult.recordset[0];
  if (!order) return null;

  const itemsResult = await pool
    .request()
    .input('orderId', sql.Int, id)
    .query(`
      SELECT Id, ProductId, ProductName, Size, Color, UnitPrice, Quantity
      FROM dbo.OrderItems
      WHERE OrderId = @orderId
      ORDER BY Id
    `);

  return {
    id: order.Id,
    userId: order.UserId,
    fullName: order.FullName,
    phone: order.Phone,
    address: order.Address,
    note: order.Note,
    paymentMethod: order.PaymentMethod,
    status: order.Status,
    total: order.Total,
    createdAt: order.CreatedAt,
    items: itemsResult.recordset.map((row) => ({
      id: row.Id,
      productId: row.ProductId,
      productName: row.ProductName,
      size: row.Size,
      color: row.Color,
      unitPrice: row.UnitPrice,
      quantity: row.Quantity,
      lineTotal: row.UnitPrice * row.Quantity,
    })),
  };
}
