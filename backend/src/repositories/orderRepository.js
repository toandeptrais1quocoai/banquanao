import { getPool, sql } from '../config/db.js';

export async function createOrder(order, items) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const initialStatus = order.status || 'pending';
    const subtotal = order.subtotal != null ? order.subtotal : order.total;
    const discountAmount = order.discountAmount || 0;
    const voucherCode = order.voucherCode || null;
    const orderResult = await new sql.Request(transaction)
      .input('userId', sql.Int, order.userId)
      .input('fullName', sql.NVarChar(80), order.fullName)
      .input('phone', sql.NVarChar(20), order.phone)
      .input('address', sql.NVarChar(300), order.address)
      .input('note', sql.NVarChar(400), order.note)
      .input('paymentMethod', sql.NVarChar(30), order.paymentMethod)
      .input('status', sql.NVarChar(30), initialStatus)
      .input('subtotal', sql.Int, subtotal)
      .input('discountAmount', sql.Int, discountAmount)
      .input('voucherCode', sql.NVarChar(40), voucherCode)
      .input('total', sql.Int, order.total)
      .query(`
        INSERT INTO dbo.Orders (
          UserId, FullName, Phone, Address, Note, PaymentMethod, Status,
          Subtotal, DiscountAmount, VoucherCode, Total
        )
        OUTPUT INSERTED.Id, INSERTED.Status, INSERTED.CreatedAt, INSERTED.Total,
               INSERTED.Subtotal, INSERTED.DiscountAmount, INSERTED.VoucherCode
        VALUES (
          @userId, @fullName, @phone, @address, @note, @paymentMethod, @status,
          @subtotal, @discountAmount, @voucherCode, @total
        )
      `);

    const created = orderResult.recordset[0];

    for (const item of items) {
      const stockCheck = await new sql.Request(transaction)
        .input('productId', sql.Int, item.productId)
        .query(`
          SELECT
            p.Id,
            p.Name,
            p.ImportQty - ISNULL((
              SELECT SUM(oi.Quantity)
              FROM dbo.OrderItems oi
              INNER JOIN dbo.Orders o ON o.Id = oi.OrderId
              WHERE oi.ProductId = p.Id AND o.Status <> N'cancelled'
            ), 0) AS StockQty
          FROM dbo.Products p WITH (UPDLOCK, ROWLOCK)
          WHERE p.Id = @productId
        `);
      const product = stockCheck.recordset[0];
      if (!product) {
        const error = new Error('Có món trong đơn không còn bán.');
        error.status = 400;
        throw error;
      }
      if (product.StockQty < item.quantity) {
        const error = new Error(`“${product.Name}” chỉ còn ${product.StockQty} sản phẩm.`);
        error.status = 400;
        throw error;
      }

      await new sql.Request(transaction)
        .input('orderId', sql.Int, created.Id)
        .input('productId', sql.Int, item.productId)
        .input('productName', sql.NVarChar(160), item.productName)
        .input('size', sql.NVarChar(20), item.size)
        .input('color', sql.NVarChar(40), item.color || '')
        .input('unitPrice', sql.Int, item.unitPrice)
        .input('unitCost', sql.Int, item.unitCost || 0)
        .input('quantity', sql.Int, item.quantity)
        .query(`
          INSERT INTO dbo.OrderItems (OrderId, ProductId, ProductName, Size, Color, UnitPrice, UnitCost, Quantity)
          VALUES (@orderId, @productId, @productName, @size, @color, @unitPrice, @unitCost, @quantity)
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
      subtotal: created.Subtotal != null ? created.Subtotal : created.Total,
      discountAmount: created.DiscountAmount || 0,
      voucherCode: created.VoucherCode || null,
      createdAt: created.CreatedAt,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateStatus(id, status) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .input('status', sql.NVarChar(30), status)
    .query(`
      UPDATE dbo.Orders
      SET Status = @status
      OUTPUT INSERTED.Id, INSERTED.Status
      WHERE Id = @id
    `);
  return result.recordset[0]
    ? { id: result.recordset[0].Id, status: result.recordset[0].Status }
    : null;
}

export async function listByUser(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT Id, FullName, Phone, Address, Note, PaymentMethod, Status,
             Total, Subtotal, DiscountAmount, VoucherCode, CreatedAt
      FROM dbo.Orders
      WHERE UserId = @userId
      ORDER BY Id DESC
    `);
  return result.recordset.map((row) => ({
    id: row.Id,
    fullName: row.FullName,
    phone: row.Phone,
    address: row.Address,
    note: row.Note,
    paymentMethod: row.PaymentMethod,
    status: row.Status,
    total: row.Total,
    subtotal: row.Subtotal != null ? row.Subtotal : row.Total,
    discountAmount: row.DiscountAmount || 0,
    voucherCode: row.VoucherCode || null,
    createdAt: row.CreatedAt,
  }));
}

export async function findById(id) {
  const pool = await getPool();
  const orderResult = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT Id, UserId, FullName, Phone, Address, Note, PaymentMethod, Status,
             Total, Subtotal, DiscountAmount, VoucherCode, CreatedAt
      FROM dbo.Orders
      WHERE Id = @id
    `);
  const order = orderResult.recordset[0];
  if (!order) return null;

  const itemsResult = await pool
    .request()
    .input('orderId', sql.Int, id)
    .query(`
      SELECT Id, ProductId, ProductName, Size, Color, UnitPrice, UnitCost, Quantity
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
    subtotal: order.Subtotal != null ? order.Subtotal : order.Total,
    discountAmount: order.DiscountAmount || 0,
    voucherCode: order.VoucherCode || null,
    createdAt: order.CreatedAt,
    items: itemsResult.recordset.map((row) => ({
      id: row.Id,
      productId: row.ProductId,
      productName: row.ProductName,
      size: row.Size,
      color: row.Color,
      unitPrice: row.UnitPrice,
      unitCost: row.UnitCost || 0,
      quantity: row.Quantity,
      lineTotal: row.UnitPrice * row.Quantity,
      lineProfit: (row.UnitPrice - (row.UnitCost || 0)) * row.Quantity,
    })),
  };
}
