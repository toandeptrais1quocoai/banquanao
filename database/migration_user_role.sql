-- Vai trò tài khoản: customer | admin
IF COL_LENGTH('dbo.Users', 'Role') IS NULL
BEGIN
    ALTER TABLE dbo.Users
    ADD Role NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Users_Role DEFAULT N'customer';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.Users')
      AND name = N'CK_Users_Role'
)
BEGIN
    ALTER TABLE dbo.Users
    ADD CONSTRAINT CK_Users_Role CHECK (Role IN (N'customer', N'admin'));
END
GO
