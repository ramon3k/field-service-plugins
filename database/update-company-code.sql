-- Update all tables to use DCPSP instead of KIT as the company code
-- This aligns with the multi-tenant single-database approach

USE FieldServiceDB;
GO

-- Update Users table
UPDATE Users
SET CompanyCode = 'DCPSP'
WHERE CompanyCode = 'KIT';

-- Update Customers table
UPDATE Customers
SET CompanyCode = 'DCPSP'
WHERE CompanyCode = 'KIT';

-- Update Sites table
UPDATE Sites
SET CompanyCode = 'DCPSP'
WHERE CompanyCode = 'KIT';

-- Update Tickets table
UPDATE Tickets
SET CompanyCode = 'DCPSP'
WHERE CompanyCode = 'KIT';

-- Update ServiceRequests table
UPDATE ServiceRequests
SET CompanyCode = 'DCPSP'
WHERE CompanyCode = 'KIT';

-- Update ActivityLog table
UPDATE ActivityLog
SET CompanyCode = 'DCPSP'
WHERE CompanyCode = 'KIT';

-- Update Licenses table
UPDATE Licenses
SET CompanyCode = 'DCPSP'
WHERE CompanyCode = 'KIT';

-- Update Vendors table (if it has CompanyCode column)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Vendors' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    UPDATE Vendors
    SET CompanyCode = 'DCPSP'
    WHERE CompanyCode = 'KIT';
END

-- Verify the changes
SELECT 'Users' AS TableName, COUNT(*) AS DCPSPCount FROM Users WHERE CompanyCode = 'DCPSP'
UNION ALL
SELECT 'Customers', COUNT(*) FROM Customers WHERE CompanyCode = 'DCPSP'
UNION ALL
SELECT 'Sites', COUNT(*) FROM Sites WHERE CompanyCode = 'DCPSP'
UNION ALL
SELECT 'Tickets', COUNT(*) FROM Tickets WHERE CompanyCode = 'DCPSP'
UNION ALL
SELECT 'ServiceRequests', COUNT(*) FROM ServiceRequests WHERE CompanyCode = 'DCPSP'
UNION ALL
SELECT 'ActivityLog', COUNT(*) FROM ActivityLog WHERE CompanyCode = 'DCPSP'
UNION ALL
SELECT 'Licenses', COUNT(*) FROM Licenses WHERE CompanyCode = 'DCPSP';

PRINT 'Company code updated from KIT to DCPSP successfully!';
