-- Check what columns exist in the plugin tables
USE FieldServiceDB;
GO

-- Check GlobalPlugins table structure
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'GlobalPlugins')
BEGIN
    PRINT 'GlobalPlugins columns:';
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'GlobalPlugins'
    ORDER BY ORDINAL_POSITION;
END
ELSE
    PRINT 'Table GlobalPlugins does not exist!';
GO

PRINT '';
GO

-- Check TenantPluginInstallations table structure  
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'TenantPluginInstallations')
BEGIN
    PRINT 'TenantPluginInstallations columns:';
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'TenantPluginInstallations'
    ORDER BY ORDINAL_POSITION;
END
ELSE
    PRINT 'Table TenantPluginInstallations does not exist!';
GO
