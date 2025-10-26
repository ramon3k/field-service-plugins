-- Export Database Schema and Data for Azure SQL Migration
-- Run this against your local SQL Server Express database

USE FieldServiceDB;
GO

PRINT '========================================';
PRINT 'DATABASE MIGRATION SCRIPT';
PRINT 'Field Service Multi-Tenant Application';
PRINT '========================================';
PRINT '';

-- Show current companies
PRINT 'Current Companies in Database:';
SELECT CompanyCode, CompanyName, DisplayName, IsActive, CreatedAt 
FROM Companies 
ORDER BY CompanyCode;
PRINT '';

-- Show admin users
PRINT 'Admin Users:';
SELECT u.Username, u.FullName, u.Email, u.Role, u.CompanyCode, u.IsActive
FROM Users u
WHERE u.Role IN ('SystemAdmin', 'Admin')
ORDER BY u.CompanyCode, u.Username;
PRINT '';

-- Count records by company
PRINT 'Record counts by company:';
SELECT 
    'Tickets' as TableName,
    CompanyCode,
    COUNT(*) as RecordCount
FROM Tickets
GROUP BY CompanyCode
UNION ALL
SELECT 
    'Customers' as TableName,
    CompanyCode,
    COUNT(*) as RecordCount
FROM Customers
GROUP BY CompanyCode
UNION ALL
SELECT 
    'Sites' as TableName,
    CompanyCode,
    COUNT(*) as RecordCount
FROM Sites
GROUP BY CompanyCode
ORDER BY TableName, CompanyCode;
GO

PRINT '';
PRINT '========================================';
PRINT 'NEXT STEPS FOR AZURE SQL MIGRATION:';
PRINT '========================================';
PRINT '';
PRINT '1. Use SQL Server Management Studio (SSMS) to connect to Azure SQL';
PRINT '   - Right-click database > Tasks > Generate Scripts';
PRINT '   - Include schema and data';
PRINT '   - Save to .sql file';
PRINT '';
PRINT '2. Or use Azure Data Studio:';
PRINT '   - Install Azure Data Studio';
PRINT '   - Connect to local database';
PRINT '   - Right-click > Schema Compare > Azure SQL';
PRINT '';
PRINT '3. Or use BACPAC export/import:';
PRINT '   - Export local DB as BACPAC file';
PRINT '   - Import BACPAC into Azure SQL';
PRINT '';
PRINT '4. After migration, verify:';
PRINT '   - All tables exist';
PRINT '   - Companies records (DCPSP, JBI)';
PRINT '   - Admin users can login';
PRINT '   - Data isolation working';
PRINT '';
