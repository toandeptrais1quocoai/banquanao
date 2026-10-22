-- Them gio hang. Chay: sqlcmd -S localhost -E -i database\migration_cart.sql
USE BanQuanAo;
GO

IF OBJECT_ID(N'dbo.CartItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CartItems (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CartItems PRIMARY KEY,
        UserId INT NOT NULL,
        ProductId INT NOT NULL,
        Size NVARCHAR(20) NOT NULL,
        Quantity INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CartItems_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CartItems_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CartItems_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
        CONSTRAINT FK_CartItems_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_CartItems_User_Product_Size UNIQUE (UserId, ProductId, Size),
        CONSTRAINT CK_CartItems_Quantity CHECK (Quantity >= 1 AND Quantity <= 20)
    );
    CREATE INDEX IX_CartItems_UserId ON dbo.CartItems(UserId);
END
GO

CREATE OR ALTER VIEW dbo.vw_GioHang AS
SELECT
    ci.Id,
    u.Email,
    u.FullName AS HoTen,
    p.Name AS Ten,
    ci.Size,
    ci.Quantity AS SoLuong,
    p.Price AS Gia,
    ci.Quantity * p.Price AS ThanhTien,
    ci.UpdatedAt AS CapNhat
FROM dbo.CartItems ci
JOIN dbo.Users u ON u.Id = ci.UserId
JOIN dbo.Products p ON p.Id = ci.ProductId;
GO
