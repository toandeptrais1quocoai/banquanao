-- Schema đầy đủ cho Azure SQL (database đã được tạo sẵn trên portal).
-- Chạy trong Query Editor của Azure SQL hoặc SSMS kết nối server *.database.windows.net

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
        FullName NVARCHAR(80) NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Users_Email UNIQUE (Email)
    );
END
GO

IF OBJECT_ID(N'dbo.PasswordResets', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PasswordResets (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PasswordResets PRIMARY KEY,
        UserId INT NOT NULL,
        CodeHash NVARCHAR(255) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        UsedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_PasswordResets_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_PasswordResets_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_PasswordResets_UserId ON dbo.PasswordResets(UserId);
END
GO

IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Categories PRIMARY KEY,
        Name NVARCHAR(80) NOT NULL,
        Slug NVARCHAR(80) NOT NULL,
        CONSTRAINT UQ_Categories_Slug UNIQUE (Slug)
    );
END
GO

IF OBJECT_ID(N'dbo.Products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Products PRIMARY KEY,
        CategoryId INT NOT NULL,
        Name NVARCHAR(160) NOT NULL,
        Slug NVARCHAR(180) NOT NULL,
        Description NVARCHAR(800) NOT NULL,
        Price INT NOT NULL,
        OriginalPrice INT NULL,
        ImageUrl NVARCHAR(300) NOT NULL,
        ColorName NVARCHAR(40) NOT NULL,
        ColorHex CHAR(7) NOT NULL,
        ColorOptions NVARCHAR(2000) NULL,
        Sizes NVARCHAR(80) NOT NULL,
        Material NVARCHAR(80) NOT NULL,
        IsFeatured BIT NOT NULL CONSTRAINT DF_Products_IsFeatured DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Products_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Products_Slug UNIQUE (Slug),
        CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id),
        CONSTRAINT CK_Products_Price CHECK (Price > 0)
    );
    CREATE INDEX IX_Products_CategoryId ON dbo.Products(CategoryId);
END
GO

IF OBJECT_ID(N'dbo.CartItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CartItems (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CartItems PRIMARY KEY,
        UserId INT NOT NULL,
        ProductId INT NOT NULL,
        Size NVARCHAR(20) NOT NULL,
        Color NVARCHAR(40) NOT NULL CONSTRAINT DF_CartItems_Color DEFAULT N'',
        Quantity INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CartItems_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CartItems_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CartItems_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
        CONSTRAINT FK_CartItems_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_CartItems_User_Product_Size_Color UNIQUE (UserId, ProductId, Size, Color),
        CONSTRAINT CK_CartItems_Quantity CHECK (Quantity >= 1 AND Quantity <= 20)
    );
    CREATE INDEX IX_CartItems_UserId ON dbo.CartItems(UserId);
END
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
        Color NVARCHAR(40) NOT NULL CONSTRAINT DF_OrderItems_Color DEFAULT N'',
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
