import { getPool, sql } from '../config/db.js';
import { findProductById } from './catalogRepository.js';

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function mapCustomer(row) {
  if (!row) return null;
  return {
    id: row.Id,
    fullName: row.FullName,
    email: row.Email,
    phone: row.Phone || '',
    role: row.Role || 'customer',
    createdAt: row.CreatedAt,
    orderCount: Number(row.OrderCount) || 0,
    spent: Number(row.Spent) || 0,
  };
}

export async function getStats() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.Products) AS ProductCount,
      (SELECT COUNT(*) FROM dbo.Categories) AS CategoryCount,
      (SELECT COUNT(*) FROM dbo.Orders) AS OrderCount,
      (SELECT COUNT(*) FROM dbo.Users WHERE Role = N'customer') AS CustomerCount,
      (SELECT ISNULL(SUM(Total), 0) FROM dbo.Orders WHERE Status <> N'cancelled') AS Revenue,
      (SELECT COUNT(*) FROM dbo.Orders WHERE Status = N'pending') AS PendingOrders,
      (SELECT COUNT(*) FROM dbo.Orders WHERE CAST(CreatedAt AS DATE) = CAST(SYSUTCDATETIME() AS DATE)) AS OrdersToday,
      (
        SELECT ISNULL(SUM(x.StockQty), 0)
        FROM (
          SELECT
            p.ImportQty - ISNULL((
              SELECT SUM(oi.Quantity)
              FROM dbo.OrderItems oi
              INNER JOIN dbo.Orders o ON o.Id = oi.OrderId
              WHERE oi.ProductId = p.Id AND o.Status <> N'cancelled'
            ), 0) AS StockQty
          FROM dbo.Products p
        ) x
      ) AS StockTotal,
      (SELECT ISNULL(SUM(ImportQty), 0) FROM dbo.Products) AS ImportTotal,
      (
        SELECT ISNULL(SUM(CAST(x.StockQty AS BIGINT) * CAST(x.CostPrice AS BIGINT)), 0)
        FROM (
          SELECT
            p.CostPrice,
            p.ImportQty - ISNULL((
              SELECT SUM(oi.Quantity)
              FROM dbo.OrderItems oi
              INNER JOIN dbo.Orders o ON o.Id = oi.OrderId
              WHERE oi.ProductId = p.Id AND o.Status <> N'cancelled'
            ), 0) AS StockQty
          FROM dbo.Products p
        ) x
      ) AS InventoryValue,
      (
        SELECT ISNULL(SUM(CAST(oi.Quantity AS BIGINT) * (oi.UnitPrice - oi.UnitCost)), 0)
        FROM dbo.OrderItems oi
        JOIN dbo.Orders o ON o.Id = oi.OrderId
        WHERE o.Status <> N'cancelled'
      ) AS Profit,
      (
        SELECT ISNULL(SUM(CAST(oi.Quantity AS BIGINT) * oi.UnitCost), 0)
        FROM dbo.OrderItems oi
        JOIN dbo.Orders o ON o.Id = oi.OrderId
        WHERE o.Status <> N'cancelled'
      ) AS CostOfGoods,
      (
        SELECT ISNULL(SUM(oi.Quantity), 0)
        FROM dbo.OrderItems oi
        JOIN dbo.Orders o ON o.Id = oi.OrderId
        WHERE o.Status <> N'cancelled'
      ) AS SoldTotal
  `);
  const row = result.recordset[0];

  const recent = await pool.request().query(`
    SELECT TOP 8 Id, FullName, Phone, Total, Status, CreatedAt
    FROM dbo.Orders
    ORDER BY Id DESC
  `);

  const topProducts = await pool.request().query(`
    SELECT TOP 5
      oi.ProductName,
      SUM(oi.Quantity) AS Sold,
      SUM(oi.UnitPrice * oi.Quantity) AS Revenue,
      SUM((oi.UnitPrice - oi.UnitCost) * oi.Quantity) AS Profit
    FROM dbo.OrderItems oi
    JOIN dbo.Orders o ON o.Id = oi.OrderId
    WHERE o.Status <> N'cancelled'
    GROUP BY oi.ProductName
    ORDER BY Sold DESC
  `);

  const lowStock = await pool.request().query(`
    SELECT TOP 8
      p.Id,
      p.Name,
      p.ImportQty,
      p.CostPrice,
      p.Price,
      p.ImportQty - ISNULL((
        SELECT SUM(oi.Quantity)
        FROM dbo.OrderItems oi
        INNER JOIN dbo.Orders o ON o.Id = oi.OrderId
        WHERE oi.ProductId = p.Id AND o.Status <> N'cancelled'
      ), 0) AS StockQty
    FROM dbo.Products p
    WHERE p.ImportQty - ISNULL((
      SELECT SUM(oi.Quantity)
      FROM dbo.OrderItems oi
      INNER JOIN dbo.Orders o ON o.Id = oi.OrderId
      WHERE oi.ProductId = p.Id AND o.Status <> N'cancelled'
    ), 0) <= 5
    ORDER BY StockQty ASC, p.Id ASC
  `);

  return {
    productCount: row.ProductCount,
    categoryCount: row.CategoryCount,
    orderCount: row.OrderCount,
    customerCount: row.CustomerCount,
    revenue: Number(row.Revenue) || 0,
    profit: Number(row.Profit) || 0,
    costOfGoods: Number(row.CostOfGoods) || 0,
    inventoryValue: Number(row.InventoryValue) || 0,
    stockTotal: Number(row.StockTotal) || 0,
    importTotal: Number(row.ImportTotal) || 0,
    soldTotal: Number(row.SoldTotal) || 0,
    pendingOrders: row.PendingOrders,
    ordersToday: row.OrdersToday,
    recentOrders: recent.recordset.map((item) => ({
      id: item.Id,
      fullName: item.FullName,
      phone: item.Phone,
      total: item.Total,
      status: item.Status,
      createdAt: item.CreatedAt,
    })),
    topProducts: topProducts.recordset.map((item) => ({
      name: item.ProductName,
      sold: item.Sold,
      revenue: item.Revenue,
      profit: item.Profit,
    })),
    lowStock: lowStock.recordset.map((item) => ({
      id: item.Id,
      name: item.Name,
      stockQty: item.StockQty,
      importQty: item.ImportQty,
      costPrice: item.CostPrice,
      price: item.Price,
    })),
  };
}

export async function listOrders() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT o.Id, o.FullName, o.Phone, o.Address, o.PaymentMethod, o.Status, o.Total, o.CreatedAt,
           u.Email AS UserEmail
    FROM dbo.Orders o
    LEFT JOIN dbo.Users u ON u.Id = o.UserId
    ORDER BY o.Id DESC
  `);
  return result.recordset.map((row) => ({
    id: row.Id,
    fullName: row.FullName,
    phone: row.Phone,
    address: row.Address,
    paymentMethod: row.PaymentMethod,
    status: row.Status,
    total: row.Total,
    createdAt: row.CreatedAt,
    userEmail: row.UserEmail || null,
  }));
}

export async function getOrderStatus(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query('SELECT Id, Status FROM dbo.Orders WHERE Id = @id');
  return result.recordset[0]
    ? { id: result.recordset[0].Id, status: result.recordset[0].Status }
    : null;
}

export async function updateOrderStatus(id, status) {
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

export async function getSoldQty(productId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('productId', sql.Int, productId)
    .query(`
      SELECT ISNULL(SUM(oi.Quantity), 0) AS SoldQty
      FROM dbo.OrderItems oi
      INNER JOIN dbo.Orders o ON o.Id = oi.OrderId
      WHERE oi.ProductId = @productId AND o.Status <> N'cancelled'
    `);
  return Number(result.recordset[0]?.SoldQty) || 0;
}

export async function createProduct(input) {
  const pool = await getPool();
  const slug = input.slug || slugify(input.name);
  const colorOptions = input.colorOptions
    ? JSON.stringify(input.colorOptions)
    : null;
  const result = await pool
    .request()
    .input('categoryId', sql.Int, input.categoryId)
    .input('name', sql.NVarChar(160), input.name)
    .input('slug', sql.NVarChar(180), slug)
    .input('description', sql.NVarChar(800), input.description)
    .input('price', sql.Int, input.price)
    .input('originalPrice', sql.Int, input.originalPrice || null)
    .input('costPrice', sql.Int, input.costPrice)
    .input('importQty', sql.Int, input.importQty)
    .input('stockQty', sql.Int, input.importQty)
    .input('imageUrl', sql.NVarChar(300), input.imageUrl)
    .input('colorName', sql.NVarChar(40), input.colorName)
    .input('colorHex', sql.Char(7), input.colorHex)
    .input('colorOptions', sql.NVarChar(2000), colorOptions)
    .input('sizes', sql.NVarChar(80), input.sizes)
    .input('material', sql.NVarChar(80), input.material)
    .input('isFeatured', sql.Bit, input.isFeatured ? 1 : 0)
    .query(`
      INSERT INTO dbo.Products (
        CategoryId, Name, Slug, Description, Price, OriginalPrice, CostPrice, ImportQty, StockQty, ImageUrl,
        ColorName, ColorHex, ColorOptions, Sizes, Material, IsFeatured
      )
      OUTPUT INSERTED.Id
      VALUES (
        @categoryId, @name, @slug, @description, @price, @originalPrice, @costPrice, @importQty, @stockQty, @imageUrl,
        @colorName, @colorHex, @colorOptions, @sizes, @material, @isFeatured
      )
    `);
  return findProductById(result.recordset[0].Id);
}

export async function updateProduct(id, input) {
  const pool = await getPool();
  const slug = input.slug || slugify(input.name);
  const colorOptions = input.colorOptions
    ? JSON.stringify(input.colorOptions)
    : null;
  const soldQty = await getSoldQty(id);
  const stockQty = Math.max(0, input.importQty - soldQty);
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .input('categoryId', sql.Int, input.categoryId)
    .input('name', sql.NVarChar(160), input.name)
    .input('slug', sql.NVarChar(180), slug)
    .input('description', sql.NVarChar(800), input.description)
    .input('price', sql.Int, input.price)
    .input('originalPrice', sql.Int, input.originalPrice || null)
    .input('costPrice', sql.Int, input.costPrice)
    .input('importQty', sql.Int, input.importQty)
    .input('stockQty', sql.Int, stockQty)
    .input('imageUrl', sql.NVarChar(300), input.imageUrl)
    .input('colorName', sql.NVarChar(40), input.colorName)
    .input('colorHex', sql.Char(7), input.colorHex)
    .input('colorOptions', sql.NVarChar(2000), colorOptions)
    .input('sizes', sql.NVarChar(80), input.sizes)
    .input('material', sql.NVarChar(80), input.material)
    .input('isFeatured', sql.Bit, input.isFeatured ? 1 : 0)
    .query(`
      UPDATE dbo.Products
      SET CategoryId = @categoryId,
          Name = @name,
          Slug = @slug,
          Description = @description,
          Price = @price,
          OriginalPrice = @originalPrice,
          CostPrice = @costPrice,
          ImportQty = @importQty,
          StockQty = @stockQty,
          ImageUrl = @imageUrl,
          ColorName = @colorName,
          ColorHex = @colorHex,
          ColorOptions = @colorOptions,
          Sizes = @sizes,
          Material = @material,
          IsFeatured = @isFeatured
      WHERE Id = @id
    `);
  if (!result.rowsAffected?.[0]) return null;
  return findProductById(id);
}

export async function deleteProduct(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query('DELETE FROM dbo.Products WHERE Id = @id');
  return Boolean(result.rowsAffected?.[0]);
}

export async function listCustomers() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT u.Id, u.FullName, u.Email, u.Phone, u.Role, u.CreatedAt,
           COUNT(o.Id) AS OrderCount,
           ISNULL(SUM(CASE WHEN o.Status <> N'cancelled' THEN o.Total ELSE 0 END), 0) AS Spent
    FROM dbo.Users u
    LEFT JOIN dbo.Orders o ON o.UserId = u.Id
    WHERE u.Role = N'customer'
    GROUP BY u.Id, u.FullName, u.Email, u.Phone, u.Role, u.CreatedAt
    ORDER BY u.Id DESC
  `);
  return result.recordset.map(mapCustomer);
}

export async function findCustomerById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT u.Id, u.FullName, u.Email, u.Phone, u.Role, u.CreatedAt,
             COUNT(o.Id) AS OrderCount,
             ISNULL(SUM(CASE WHEN o.Status <> N'cancelled' THEN o.Total ELSE 0 END), 0) AS Spent
      FROM dbo.Users u
      LEFT JOIN dbo.Orders o ON o.UserId = u.Id
      WHERE u.Id = @id AND u.Role = N'customer'
      GROUP BY u.Id, u.FullName, u.Email, u.Phone, u.Role, u.CreatedAt
    `);
  return mapCustomer(result.recordset[0]);
}

export async function createCustomer({ fullName, email, phone, passwordHash }) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('fullName', sql.NVarChar(80), fullName)
    .input('email', sql.NVarChar(255), email)
    .input('phone', sql.NVarChar(20), phone || null)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .query(`
      INSERT INTO dbo.Users (FullName, Email, Phone, PasswordHash, Role)
      OUTPUT INSERTED.Id
      VALUES (@fullName, @email, @phone, @passwordHash, N'customer')
    `);
  return findCustomerById(result.recordset[0].Id);
}

export async function updateCustomer(id, { fullName, email, phone, passwordHash }) {
  const pool = await getPool();
  const request = pool
    .request()
    .input('id', sql.Int, id)
    .input('fullName', sql.NVarChar(80), fullName)
    .input('email', sql.NVarChar(255), email)
    .input('phone', sql.NVarChar(20), phone || null);

  let query = `
    UPDATE dbo.Users
    SET FullName = @fullName, Email = @email, Phone = @phone
  `;
  if (passwordHash) {
    request.input('passwordHash', sql.NVarChar(255), passwordHash);
    query += `, PasswordHash = @passwordHash`;
  }
  query += ` WHERE Id = @id AND Role = N'customer'`;

  const result = await request.query(query);
  if (!result.rowsAffected?.[0]) return null;
  return findCustomerById(id);
}

export async function deleteCustomer(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`DELETE FROM dbo.Users WHERE Id = @id AND Role = N'customer'`);
  return Boolean(result.rowsAffected?.[0]);
}

export { slugify };
