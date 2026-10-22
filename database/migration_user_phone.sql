-- So dien thoai tai khoan khach. Chay: sqlcmd -S localhost -E -i database\migration_user_phone.sql
USE BanQuanAo;
GO

IF COL_LENGTH('dbo.Users', 'Phone') IS NULL
BEGIN
    ALTER TABLE dbo.Users
    ADD Phone NVARCHAR(20) NULL;
END
GO

CREATE OR ALTER VIEW dbo.vw_TaiKhoan AS
SELECT
    Id,
    FullName AS HoTen,
    Email,
    Phone AS DienThoai,
    CreatedAt AS NgayTao
FROM dbo.Users;
GO
