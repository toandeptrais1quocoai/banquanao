IF COL_LENGTH('dbo.Products', 'OriginalPrice') IS NULL
BEGIN
    ALTER TABLE dbo.Products ADD OriginalPrice INT NULL;
END
GO

UPDATE dbo.Products
SET OriginalPrice = CASE
    WHEN OriginalPrice IS NULL OR OriginalPrice <= Price
        THEN CAST(ROUND(Price * 1.18, 0) AS INT)
    ELSE OriginalPrice
END;
GO
