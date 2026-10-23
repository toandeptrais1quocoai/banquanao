-- Ma voucher + cot giam gia tren Orders
USE BanQuanAo;
GO

IF OBJECT_ID(N'dbo.Vouchers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Vouchers (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Vouchers PRIMARY KEY,
        Code NVARCHAR(40) NOT NULL,
        Type NVARCHAR(20) NOT NULL,
        Value INT NOT NULL,
        MinOrderTotal INT NOT NULL CONSTRAINT DF_Vouchers_MinOrderTotal DEFAULT 0,
        MaxDiscount INT NULL,
        MaxUses INT NULL,
        UsedCount INT NOT NULL CONSTRAINT DF_Vouchers_UsedCount DEFAULT 0,
        Active BIT NOT NULL CONSTRAINT DF_Vouchers_Active DEFAULT 1,
        Note NVARCHAR(200) NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Vouchers_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Vouchers_Code UNIQUE (Code),
        CONSTRAINT CK_Vouchers_Type CHECK (Type IN (N'percent', N'fixed')),
        CONSTRAINT CK_Vouchers_Value CHECK (Value > 0),
        CONSTRAINT CK_Vouchers_MinOrderTotal CHECK (MinOrderTotal >= 0),
        CONSTRAINT CK_Vouchers_UsedCount CHECK (UsedCount >= 0)
    );
END
GO

IF COL_LENGTH('dbo.Orders', 'Subtotal') IS NULL
BEGIN
    ALTER TABLE dbo.Orders ADD Subtotal INT NULL;
END
GO

IF COL_LENGTH('dbo.Orders', 'DiscountAmount') IS NULL
BEGIN
    ALTER TABLE dbo.Orders ADD DiscountAmount INT NOT NULL CONSTRAINT DF_Orders_DiscountAmount DEFAULT 0;
END
GO

IF COL_LENGTH('dbo.Orders', 'VoucherCode') IS NULL
BEGIN
    ALTER TABLE dbo.Orders ADD VoucherCode NVARCHAR(40) NULL;
END
GO

UPDATE dbo.Orders SET Subtotal = Total WHERE Subtotal IS NULL;
GO

-- Cho phep don giam 100% (Total = 0)
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'CK_Orders_Total' AND parent_object_id = OBJECT_ID(N'dbo.Orders')
)
BEGIN
    ALTER TABLE dbo.Orders DROP CONSTRAINT CK_Orders_Total;
END
GO

ALTER TABLE dbo.Orders WITH NOCHECK
ADD CONSTRAINT CK_Orders_Total CHECK (Total >= 0);
GO
