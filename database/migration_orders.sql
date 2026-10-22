-- Don hang. Chay: sqlcmd -S localhost -E -i database\migration_orders.sql
USE BanQuanAo;
GO

IF OBJECT_ID(N'dbo.Orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Orders (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Orders PRIMARY KEY,
        UserId INT NULL,
        FullName NVARCHAR(80) NOT NULL,
        Phone NVARCHAR(20) NOT NULL,
        Address NVARCHAR(300) NOT NULL,
        Note NVARCHAR(400) NULL,
        PaymentMethod NVARCHAR(30) NOT NULL CONSTRAINT DF_Orders_PaymentMethod DEFAULT N'COD',
        Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT N'pending',
        Total INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Orders_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE SET NULL,
        CONSTRAINT CK_Orders_Total CHECK (Total > 0)
    );
    CREATE INDEX IX_Orders_UserId ON dbo.Orders(UserId);
    CREATE INDEX IX_Orders_CreatedAt ON dbo.Orders(CreatedAt DESC);
END
GO

IF OBJECT_ID(N'dbo.OrderItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderItems (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_OrderItems PRIMARY KEY,
        OrderId INT NOT NULL,
        ProductId INT NULL,
        ProductName NVARCHAR(160) NOT NULL,
        Size NVARCHAR(20) NOT NULL,
        UnitPrice INT NOT NULL,
        Quantity INT NOT NULL,
        CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id) ON DELETE SET NULL,
        CONSTRAINT CK_OrderItems_Quantity CHECK (Quantity >= 1),
        CONSTRAINT CK_OrderItems_UnitPrice CHECK (UnitPrice > 0)
    );
    CREATE INDEX IX_OrderItems_OrderId ON dbo.OrderItems(OrderId);
END
GO

CREATE OR ALTER VIEW dbo.vw_DonHang AS
SELECT
    o.Id,
    o.FullName AS HoTen,
    o.Phone AS SoDienThoai,
    o.Address AS DiaChi,
    o.PaymentMethod AS ThanhToan,
    o.Status AS TrangThai,
    o.Total AS TongTien,
    o.CreatedAt AS NgayTao,
    u.Email
FROM dbo.Orders o
LEFT JOIN dbo.Users u ON u.Id = o.UserId;
GO
