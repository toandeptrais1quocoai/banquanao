-- Nhiều màu / sản phẩm + lưu màu trên giỏ và đơn
IF COL_LENGTH('dbo.Products', 'ColorOptions') IS NULL
BEGIN
    ALTER TABLE dbo.Products ADD ColorOptions NVARCHAR(2000) NULL;
END
GO

IF COL_LENGTH('dbo.CartItems', 'Color') IS NULL
BEGIN
    ALTER TABLE dbo.CartItems ADD Color NVARCHAR(40) NOT NULL CONSTRAINT DF_CartItems_Color DEFAULT N'';
END
GO

IF COL_LENGTH('dbo.OrderItems', 'Color') IS NULL
BEGIN
    ALTER TABLE dbo.OrderItems ADD Color NVARCHAR(40) NOT NULL CONSTRAINT DF_OrderItems_Color DEFAULT N'';
END
GO

-- Đổi unique giỏ: cùng món + size + màu
IF EXISTS (
    SELECT 1 FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.CartItems')
      AND name = N'UQ_CartItems_User_Product_Size'
)
BEGIN
    ALTER TABLE dbo.CartItems DROP CONSTRAINT UQ_CartItems_User_Product_Size;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.CartItems')
      AND name = N'UQ_CartItems_User_Product_Size_Color'
)
BEGIN
    ALTER TABLE dbo.CartItems
    ADD CONSTRAINT UQ_CartItems_User_Product_Size_Color UNIQUE (UserId, ProductId, Size, Color);
END
GO

-- Gán Color mặc định từ Products cho dòng giỏ / đơn cũ
UPDATE ci
SET ci.Color = LEFT(p.ColorName, 40)
FROM dbo.CartItems ci
JOIN dbo.Products p ON p.Id = ci.ProductId
WHERE ci.Color = N'' OR ci.Color IS NULL;
GO

UPDATE oi
SET oi.Color = LEFT(p.ColorName, 40)
FROM dbo.OrderItems oi
JOIN dbo.Products p ON p.Id = oi.ProductId
WHERE oi.Color = N'' OR oi.Color IS NULL;
GO
