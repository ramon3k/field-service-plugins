-- Complete Azure SQL Database Setup
-- This script creates the full multi-tenant schema with SystemAdmin support

USE FieldServiceDB;
GO

PRINT '========================================';
PRINT 'Setting up Field Service Database';
PRINT '========================================';
PRINT '';

-- ============================================================================
-- STEP 1: Add CompanyCode to Users table (if not exists)
-- ============================================================================
PRINT 'Step 1: Adding CompanyCode to Users table...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Users ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    CREATE INDEX IX_Users_CompanyCode ON Users(CompanyCode);
    PRINT '  ✓ CompanyCode column added to Users';
END
ELSE
BEGIN
    PRINT '  - CompanyCode already exists in Users';
END
PRINT '';

-- ============================================================================
-- STEP 2: Add CompanyCode to other tables
-- ============================================================================
PRINT 'Step 2: Adding CompanyCode to Tickets table...';
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Tickets' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Tickets ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    CREATE INDEX IX_Tickets_CompanyCode ON Tickets(CompanyCode);
    PRINT '  ✓ CompanyCode added to Tickets';
END
PRINT '';

PRINT 'Step 3: Adding CompanyCode to Customers table...';
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Customers ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    CREATE INDEX IX_Customers_CompanyCode ON Customers(CompanyCode);
    PRINT '  ✓ CompanyCode added to Customers';
END
PRINT '';

PRINT 'Step 4: Adding CompanyCode to Sites table...';
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Sites' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Sites ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    CREATE INDEX IX_Sites_CompanyCode ON Sites(CompanyCode);
    PRINT '  ✓ CompanyCode added to Sites';
END
PRINT '';

PRINT 'Step 5: Adding CompanyCode to Assets table...';
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Assets ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    CREATE INDEX IX_Assets_CompanyCode ON Assets(CompanyCode);
    PRINT '  ✓ CompanyCode added to Assets';
END
PRINT '';

PRINT 'Step 6: Adding CompanyCode to Vendors table...';
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Vendors' AND COLUMN_NAME = 'CompanyCode')
BEGIN
    ALTER TABLE Vendors ADD CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT';
    CREATE INDEX IX_Vendors_CompanyCode ON Vendors(CompanyCode);
    PRINT '  ✓ CompanyCode added to Vendors';
END
PRINT '';

-- ============================================================================
-- STEP 7: Create Companies table
-- ============================================================================
PRINT 'Step 7: Creating Companies table...';

IF OBJECT_ID('Companies', 'U') IS NULL
BEGIN
    CREATE TABLE Companies (
        CompanyID INT IDENTITY(1,1) PRIMARY KEY,
        CompanyCode NVARCHAR(50) UNIQUE NOT NULL,
        CompanyName NVARCHAR(255) NOT NULL,
        DisplayName NVARCHAR(255) NULL,
        ContactEmail NVARCHAR(255) NULL,
        ContactPhone NVARCHAR(50) NULL,
        Address NVARCHAR(500) NULL,
        IsActive BIT DEFAULT 1,
        AllowServiceRequests BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_Companies_CompanyCode ON Companies(CompanyCode);
    CREATE INDEX IX_Companies_IsActive ON Companies(IsActive);
    
    PRINT '  ✓ Companies table created';
END
ELSE
BEGIN
    PRINT '  - Companies table already exists';
END
PRINT '';

-- ============================================================================
-- STEP 8: Insert DCPSP company
-- ============================================================================
PRINT 'Step 8: Creating DCPSP company...';

IF NOT EXISTS (SELECT 1 FROM Companies WHERE CompanyCode = 'DCPSP')
BEGIN
    INSERT INTO Companies (CompanyCode, CompanyName, DisplayName, ContactEmail, IsActive, AllowServiceRequests)
    VALUES ('DCPSP', 'DCPSP Field Services', 'DCPSP Field Services', 'support@dcpsp.com', 1, 1);
    PRINT '  ✓ DCPSP company created';
END
ELSE
BEGIN
    PRINT '  - DCPSP company already exists';
END
PRINT '';

-- ============================================================================
-- STEP 9: Update Role constraint to include SystemAdmin
-- ============================================================================
PRINT 'Step 9: Updating Role constraint to include SystemAdmin...';

-- Drop existing constraint (if exists)
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('Users') 
  AND definition LIKE '%Role%';

IF @ConstraintName IS NOT NULL
BEGIN
    DECLARE @SQL NVARCHAR(500) = 'ALTER TABLE Users DROP CONSTRAINT ' + @ConstraintName;
    EXEC sp_executesql @SQL;
    PRINT '  ✓ Dropped old Role constraint';
END

-- Add new constraint with SystemAdmin
ALTER TABLE Users
ADD CONSTRAINT CK_Users_Role 
CHECK (Role IN ('SystemAdmin', 'Admin', 'Coordinator', 'Technician'));
PRINT '  ✓ Added new Role constraint with SystemAdmin';
PRINT '';

-- ============================================================================
-- STEP 10: Create SystemAdmin user for DCPSP
-- ============================================================================
PRINT 'Step 10: Creating SystemAdmin user...';

-- Check if admin user exists
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin' AND CompanyCode = 'DCPSP')
BEGIN
    -- Create new admin user
    -- Password: admin123 (hashed with bcrypt)
    INSERT INTO Users (ID, Username, Email, FullName, Role, PasswordHash, CompanyCode, IsActive, CreatedAt, Permissions)
    VALUES (
        NEWID(),
        'admin',
        'admin@dcpsp.com',
        'System Administrator',
        'SystemAdmin',
        '$2a$10$rIc5Y0dZYvnJQKXvT3qFuOxKGKJVJ5kGQXvZQQYJZYvnJQKXvT3qF', -- admin123
        'DCPSP',
        1,
        GETDATE(),
        NULL
    );
    PRINT '  ✓ SystemAdmin user created';
    PRINT '  Username: admin';
    PRINT '  Password: admin123';
    PRINT '  Company: DCPSP';
END
ELSE
BEGIN
    -- Update existing user to SystemAdmin
    UPDATE Users 
    SET Role = 'SystemAdmin'
    WHERE Username = 'admin' AND CompanyCode = 'DCPSP';
    PRINT '  ✓ Existing admin user updated to SystemAdmin';
END
PRINT '';

-- ============================================================================
-- STEP 11: Verify setup
-- ============================================================================
PRINT 'Step 11: Verifying setup...';
PRINT '';

SELECT 
    'Company' AS Item,
    CompanyCode,
    CompanyName,
    DisplayName
FROM Companies
WHERE CompanyCode = 'DCPSP';

SELECT 
    'User' AS Item,
    Username,
    FullName,
    Role,
    CompanyCode,
    IsActive
FROM Users
WHERE Username = 'admin' AND CompanyCode = 'DCPSP';

PRINT '';
PRINT '========================================';
PRINT '✅ Setup Complete!';
PRINT '========================================';
PRINT 'You can now login with:';
PRINT '  Tenant Code: DCPSP';
PRINT '  Username: admin';
PRINT '  Password: admin123';
PRINT '';
PRINT 'The SystemAdmin role has access to:';
PRINT '  - Companies tab (manage tenants)';
PRINT '  - All other features';
PRINT '========================================';
