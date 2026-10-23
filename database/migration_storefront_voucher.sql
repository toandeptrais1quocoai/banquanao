-- Voucher toan shop (hien gia giam tren trang chu khach)
USE BanQuanAo;
GO

IF OBJECT_ID(N'dbo.ShopSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ShopSettings (
        Id INT NOT NULL CONSTRAINT PK_ShopSettings PRIMARY KEY,
        StorefrontVoucherActive BIT NOT NULL CONSTRAINT DF_ShopSettings_Active DEFAULT 0,
        StorefrontVoucherCode NVARCHAR(40) NULL,
        StorefrontVoucherPercent INT NULL,
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_ShopSettings_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_ShopSettings_Id CHECK (Id = 1),
        CONSTRAINT CK_ShopSettings_Percent CHECK (
            StorefrontVoucherPercent IS NULL
            OR (StorefrontVoucherPercent >= 1 AND StorefrontVoucherPercent <= 99)
        )
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.ShopSettings WHERE Id = 1)
BEGIN
    INSERT INTO dbo.ShopSettings (Id, StorefrontVoucherActive, StorefrontVoucherCode, StorefrontVoucherPercent)
    VALUES (1, 0, NULL, NULL);
END
GO
