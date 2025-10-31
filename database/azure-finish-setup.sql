-- Finish Azure SQL Database Setup
-- Companies table and SystemAdmin user

USE FieldServiceDB;
GO

-- ============================================================================
-- Create Companies table
-- ============================================================================
PRINT 'Creating Companies table...';

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
    
    PRINT '✓ Companies table created';
END
ELSE
BEGIN
    PRINT '- Companies table already exists';
END
GO

-- ============================================================================
-- Insert DCPSP company
-- ============================================================================
PRINT 'Creating DCPSP company...';

IF NOT EXISTS (SELECT 1 FROM Companies WHERE CompanyCode = 'DCPSP')
BEGIN
    INSERT INTO Companies (CompanyCode, CompanyName, DisplayName, ContactEmail, IsActive, AllowServiceRequests)
    VALUES ('DCPSP', 'DCPSP Field Services', 'DCPSP Field Services', 'support@dcpsp.com', 1, 1);
    PRINT '✓ DCPSP company created';
END
ELSE
BEGIN
    PRINT '- DCPSP company already exists';
END
GO

-- ============================================================================
-- Update Role constraint to include SystemAdmin
-- ============================================================================
PRINT 'Updating Role constraint...';

-- Drop existing constraint
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('Users') 
  AND definition LIKE '%Role%';

IF @ConstraintName IS NOT NULL
BEGIN
    DECLARE @SQL NVARCHAR(500) = 'ALTER TABLE Users DROP CONSTRAINT ' + @ConstraintName;
    EXEC sp_executesql @SQL;
    PRINT '✓ Dropped old Role constraint';
END

-- Add new constraint with SystemAdmin
ALTER TABLE Users
ADD CONSTRAINT CK_Users_Role 
CHECK (Role IN ('SystemAdmin', 'Admin', 'Coordinator', 'Technician'));
PRINT '✓ Role constraint updated with SystemAdmin';
GO

-- ============================================================================
-- Create SystemAdmin user for DCPSP
-- ============================================================================
PRINT 'Creating SystemAdmin user...';

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
        '$2a$10$rIc5Y0dZYvnJQKXvT3qFuOxKGKJVJ5kGQXvZQQYJZYvnJQKXvT3qF',
        'DCPSP',
        1,
        GETDATE(),
        NULL
    );
    PRINT '✓ SystemAdmin user created';
END
ELSE
BEGIN
    -- Update existing user to SystemAdmin
    UPDATE Users 
    SET Role = 'SystemAdmin'
    WHERE Username = 'admin' AND CompanyCode = 'DCPSP';
    PRINT '✓ Existing admin updated to SystemAdmin';
END
GO

-- ============================================================================
-- Verify setup
-- ============================================================================
PRINT '';
PRINT '========================================';
PRINT 'Setup Complete!';
PRINT '========================================';

SELECT 
    CompanyCode,
    CompanyName,
    DisplayName,
    IsActive
FROM Companies
WHERE CompanyCode = 'DCPSP';

SELECT 
    Username,
    FullName,
    Role,
    CompanyCode,
    Email,
    IsActive
FROM Users
WHERE Username = 'admin' AND CompanyCode = 'DCPSP';

PRINT '';
PRINT 'Login credentials:';
PRINT '  Tenant Code: DCPSP';
PRINT '  Username: admin';
PRINT '  Password: admin123';
PRINT '========================================';
