-- ====================================
-- Add Vendor Compliance Tracking Fields
-- ====================================
-- Description: Adds fields to track vendor state licenses and COI expiration
-- Date: 2025-10-20

USE FieldServiceManagement;
GO

-- Add State License tracking fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Licenses') AND name = 'StateLicenseNumber')
BEGIN
    ALTER TABLE Licenses ADD StateLicenseNumber NVARCHAR(100) NULL;
    PRINT 'Added StateLicenseNumber column to Licenses table';
END
ELSE
BEGIN
    PRINT 'StateLicenseNumber column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Licenses') AND name = 'StateLicenseExpiration')
BEGIN
    ALTER TABLE Licenses ADD StateLicenseExpiration DATE NULL;
    PRINT 'Added StateLicenseExpiration column to Licenses table';
END
ELSE
BEGIN
    PRINT 'StateLicenseExpiration column already exists';
END
GO

-- Add COI (Certificate of Insurance) tracking fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Licenses') AND name = 'COIExpiration')
BEGIN
    ALTER TABLE Licenses ADD COIExpiration DATE NULL;
    PRINT 'Added COIExpiration column to Licenses table';
END
ELSE
BEGIN
    PRINT 'COIExpiration column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Licenses') AND name = 'COIProvider')
BEGIN
    ALTER TABLE Licenses ADD COIProvider NVARCHAR(200) NULL;
    PRINT 'Added COIProvider column to Licenses table';
END
ELSE
BEGIN
    PRINT 'COIProvider column already exists';
END
GO

-- Verify the new columns were added
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID(N'dbo.Licenses')
    AND c.name IN ('StateLicenseNumber', 'StateLicenseExpiration', 'COIExpiration', 'COIProvider')
ORDER BY c.column_id;
GO

PRINT '';
PRINT '✅ Vendor compliance tracking fields added successfully!';
PRINT '';
PRINT 'New fields:';
PRINT '  - StateLicenseNumber: Track vendor state license number';
PRINT '  - StateLicenseExpiration: Alert before state license expires';
PRINT '  - COIExpiration: Track Certificate of Insurance expiration';
PRINT '  - COIProvider: Insurance provider name';
GO
