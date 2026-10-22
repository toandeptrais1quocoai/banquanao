-- Kho + giá vốn + lưu giá vốn trên dòng đơn
IF COL_LENGTH('dbo.Products', 'CostPrice') IS NULL
BEGIN
    ALTER TABLE dbo.Products ADD CostPrice INT NOT NULL CONSTRAINT DF_Products_CostPrice DEFAULT 0;
END
GO

IF COL_LENGTH('dbo.Products', 'ImportQty') IS NULL
BEGIN
    ALTER TABLE dbo.Products ADD ImportQty INT NOT NULL CONSTRAINT DF_Products_ImportQty DEFAULT 0;
END
GO

IF COL_LENGTH('dbo.Products', 'StockQty') IS NULL
BEGIN
    ALTER TABLE dbo.Products ADD StockQty INT NOT NULL CONSTRAINT DF_Products_StockQty DEFAULT 0;
END
GO

IF COL_LENGTH('dbo.OrderItems', 'UnitCost') IS NULL
BEGIN
    ALTER TABLE dbo.OrderItems ADD UnitCost INT NOT NULL CONSTRAINT DF_OrderItems_UnitCost DEFAULT 0;
END
GO

-- Gán mặc định cho hàng cũ: giá vốn ~65% giá bán, nhập/tồn 40
UPDATE dbo.Products
SET
  CostPrice = CASE WHEN CostPrice = 0 THEN CAST(ROUND(Price * 0.65, 0) AS INT) ELSE CostPrice END,
  ImportQty = CASE WHEN ImportQty = 0 THEN 40 ELSE ImportQty END,
  StockQty = CASE WHEN StockQty = 0 THEN 40 ELSE StockQty END
WHERE CostPrice = 0 OR ImportQty = 0 OR StockQty = 0;
GO

UPDATE oi
SET oi.UnitCost = p.CostPrice
FROM dbo.OrderItems oi
JOIN dbo.Products p ON p.Id = oi.ProductId
WHERE oi.UnitCost = 0 AND oi.ProductId IS NOT NULL;
GO
