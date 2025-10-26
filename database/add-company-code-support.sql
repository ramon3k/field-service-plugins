-- ============================================================================
-- Add CompanyCode Support for Multi-Tenant Data Isolation
-- ============================================================================
-- This script adds CompanyCode columns to all data tables to enable
-- multiple vendors to use the same database with complete data separation
-- ============================================================================

USE FieldServiceDB;
GO

PRINT '========================================';
PRINT 'Adding CompanyCode Support';
PRINT '========================================';
PRINT '';

-- ============================================================================
-- STEP 1: Add CompanyCode column to Users table
-- ============================================================================
PRINT 'Step 1: Adding CompanyCode to Users table...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Users ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    PRINT '  ✓ CompanyCode column added to Users';
END
ELSE
BEGIN
    PRINT '  - CompanyCode already exists in Users';
END

-- Create index for faster queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_CompanyCode')
BEGIN
    CREATE INDEX IX_Users_CompanyCode ON Users(CompanyCode);
    PRINT '  ✓ Created index on Users.CompanyCode';
END

PRINT '';

-- ============================================================================
-- STEP 2: Add CompanyCode to Tickets table
-- ============================================================================
PRINT 'Step 2: Adding CompanyCode to Tickets table...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Tickets' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Tickets ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    PRINT '  ✓ CompanyCode column added to Tickets';
END
ELSE
BEGIN
    PRINT '  - CompanyCode already exists in Tickets';
END

-- Create index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tickets_CompanyCode')
BEGIN
    CREATE INDEX IX_Tickets_CompanyCode ON Tickets(CompanyCode);
    PRINT '  ✓ Created index on Tickets.CompanyCode';
END

PRINT '';

-- ============================================================================
-- STEP 3: Add CompanyCode to Customers table
-- ============================================================================
PRINT 'Step 3: Adding CompanyCode to Customers table...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Customers ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    PRINT '  ✓ CompanyCode column added to Customers';
END
ELSE
BEGIN
    PRINT '  - CompanyCode already exists in Customers';
END

-- Create index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_CompanyCode')
BEGIN
    CREATE INDEX IX_Customers_CompanyCode ON Customers(CompanyCode);
    PRINT '  ✓ Created index on Customers.CompanyCode';
END

PRINT '';

-- ============================================================================
-- STEP 4: Add CompanyCode to Sites table
-- ============================================================================
PRINT 'Step 4: Adding CompanyCode to Sites table...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Sites' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Sites ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    PRINT '  ✓ CompanyCode column added to Sites';
END
ELSE
BEGIN
    PRINT '  - CompanyCode already exists in Sites';
END

-- Create index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sites_CompanyCode')
BEGIN
    CREATE INDEX IX_Sites_CompanyCode ON Sites(CompanyCode);
    PRINT '  ✓ Created index on Sites.CompanyCode';
END

PRINT '';

-- ============================================================================
-- STEP 5: Add CompanyCode to ServiceRequests table
-- ============================================================================
PRINT 'Step 5: Adding CompanyCode to ServiceRequests table...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'ServiceRequests' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE ServiceRequests ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    PRINT '  ✓ CompanyCode column added to ServiceRequests';
END
ELSE
BEGIN
    PRINT '  - CompanyCode already exists in ServiceRequests';
END

-- Create index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ServiceRequests_CompanyCode')
BEGIN
    CREATE INDEX IX_ServiceRequests_CompanyCode ON ServiceRequests(CompanyCode);
    PRINT '  ✓ Created index on ServiceRequests.CompanyCode';
END

PRINT '';

-- ============================================================================
-- STEP 6: Add CompanyCode to Assets table
-- ============================================================================
PRINT 'Step 6: Adding CompanyCode to Assets table...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Assets ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    PRINT '  ✓ CompanyCode column added to Assets';
END
ELSE
BEGIN
    PRINT '  - CompanyCode already exists in Assets';
END

-- Create index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Assets_CompanyCode')
BEGIN
    CREATE INDEX IX_Assets_CompanyCode ON Assets(CompanyCode);
    PRINT '  ✓ Created index on Assets.CompanyCode';
END

PRINT '';

-- ============================================================================
-- STEP 7: Add CompanyCode to Vendors table
-- ============================================================================
PRINT 'Step 7: Adding CompanyCode to Vendors table...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Vendors' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Vendors ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    PRINT '  ✓ CompanyCode column added to Vendors';
END
ELSE
BEGIN
    PRINT '  - CompanyCode already exists in Vendors';
END

-- Create index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Vendors_CompanyCode')
BEGIN
    CREATE INDEX IX_Vendors_CompanyCode ON Vendors(CompanyCode);
    PRINT '  ✓ Created index on Vendors.CompanyCode';
END

PRINT '';

-- ============================================================================
-- STEP 8: Add CompanyCode to Attachments table
-- ============================================================================
PRINT 'Step 8: Adding CompanyCode to Attachments table...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Attachments' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Attachments ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    PRINT '  ✓ CompanyCode column added to Attachments';
END
ELSE
BEGIN
    PRINT '  - CompanyCode already exists in Attachments';
END

-- Create index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Attachments_CompanyCode')
BEGIN
    CREATE INDEX IX_Attachments_CompanyCode ON Attachments(CompanyCode);
    PRINT '  ✓ Created index on Attachments.CompanyCode';
END

PRINT '';

-- ============================================================================
-- STEP 9: Add CompanyCode to ActivityLog table
-- ============================================================================
PRINT 'Step 9: Adding CompanyCode to ActivityLog table...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'ActivityLog' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE ActivityLog ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    PRINT '  ✓ CompanyCode column added to ActivityLog';
END
ELSE
BEGIN
    PRINT '  - CompanyCode already exists in ActivityLog';
END

-- Create index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLog_CompanyCode')
BEGIN
    CREATE INDEX IX_ActivityLog_CompanyCode ON ActivityLog(CompanyCode);
    PRINT '  ✓ Created index on ActivityLog.CompanyCode';
END

PRINT '';

-- ============================================================================
-- STEP 10: Add CompanyCode to Licenses table
-- ============================================================================
PRINT 'Step 10: Adding CompanyCode to Licenses table...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Licenses' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Licenses ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    PRINT '  ✓ CompanyCode column added to Licenses';
END
ELSE
BEGIN
    PRINT '  - CompanyCode already exists in Licenses';
END

-- Create index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Licenses_CompanyCode')
BEGIN
    CREATE INDEX IX_Licenses_CompanyCode ON Licenses(CompanyCode);
    PRINT '  ✓ Created index on Licenses.CompanyCode';
END

PRINT '';

-- ============================================================================
-- STEP 11: Verification
-- ============================================================================
PRINT 'Step 11: Verification...';
PRINT '';

DECLARE @TableName VARCHAR(100);
DECLARE @CompanyCodeExists BIT;
DECLARE @AllTablesOK BIT = 1;

-- Check all tables
DECLARE table_cursor CURSOR FOR
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME NOT IN ('AuditTrail', 'CoordinatorNotes')
ORDER BY TABLE_NAME;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @TableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = @TableName AND COLUMN_NAME = 'CompanyCode')
    BEGIN
        PRINT '  ✓ ' + @TableName + ' has CompanyCode column';
    END
    ELSE
    BEGIN
        PRINT '  ✗ ' + @TableName + ' is MISSING CompanyCode column';
        SET @AllTablesOK = 0;
    END
    
    FETCH NEXT FROM table_cursor INTO @TableName;
END

CLOSE table_cursor;
DEALLOCATE table_cursor;

PRINT '';

IF @AllTablesOK = 1
BEGIN
    PRINT '========================================';
    PRINT 'SUCCESS: CompanyCode support added!';
    PRINT '========================================';
    PRINT '';
    PRINT 'IMPORTANT NEXT STEPS:';
    PRINT '1. Update config.json with your CompanyCode';
    PRINT '2. Run update-existing-data-company-code.bat';
    PRINT '3. Update API server to filter by CompanyCode';
    PRINT '4. Test multi-tenant isolation';
END
ELSE
BEGIN
    PRINT '========================================';
    PRINT 'WARNING: Some tables missing CompanyCode';
    PRINT '========================================';
    PRINT 'Please review the output above';
END

PRINT '';
GO
