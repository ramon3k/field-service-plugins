-- Fix Database Schema to Match api-minimal.js
-- This script corrects the schema mismatches between create-database-complete.sql and api-minimal.js

USE [FieldServiceDB];
GO

PRINT 'Starting schema fixes...';
GO

-- ============================================
-- FIX 1: Sites Table - Rename 'Site' column to 'Name'
-- ============================================
PRINT 'Fixing Sites table...';

-- Check if 'Site' column exists and 'Name' doesn't
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Sites' AND COLUMN_NAME = 'Site')
   AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Sites' AND COLUMN_NAME = 'Name')
BEGIN
    EXEC sp_rename 'Sites.Site', 'Name', 'COLUMN';
    PRINT '  ✓ Renamed Sites.Site to Sites.Name';
END
ELSE
BEGIN
    PRINT '  ℹ Sites.Name already exists or Sites.Site doesn't exist';
END
GO

-- ============================================
-- FIX 2: CoordinatorNotes Table - Rename columns
-- ============================================
PRINT 'Fixing CoordinatorNotes table...';

-- Rename CoordinatorName to CreatedBy
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CoordinatorNotes' AND COLUMN_NAME = 'CoordinatorName')
   AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CoordinatorNotes' AND COLUMN_NAME = 'CreatedBy')
BEGIN
    EXEC sp_rename 'CoordinatorNotes.CoordinatorName', 'CreatedBy', 'COLUMN';
    PRINT '  ✓ Renamed CoordinatorNotes.CoordinatorName to CoordinatorNotes.CreatedBy';
END
ELSE
BEGIN
    PRINT '  ℹ CoordinatorNotes.CreatedBy already exists or CoordinatorNotes.CoordinatorName doesn''t exist';
END
GO

-- Rename Timestamp to CreatedAt
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CoordinatorNotes' AND COLUMN_NAME = 'Timestamp')
   AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CoordinatorNotes' AND COLUMN_NAME = 'CreatedAt')
BEGIN
    EXEC sp_rename 'CoordinatorNotes.Timestamp', 'CreatedAt', 'COLUMN';
    PRINT '  ✓ Renamed CoordinatorNotes.Timestamp to CoordinatorNotes.CreatedAt';
END
ELSE
BEGIN
    PRINT '  ℹ CoordinatorNotes.CreatedAt already exists or CoordinatorNotes.Timestamp doesn''t exist';
END
GO

-- ============================================
-- FIX 3: Drop and Recreate Licenses Table
-- ============================================
PRINT 'Fixing Licenses table...';

-- Drop existing Licenses table if it exists
IF OBJECT_ID('Licenses', 'U') IS NOT NULL
BEGIN
    DROP TABLE Licenses;
    PRINT '  ✓ Dropped old Licenses table';
END
GO

-- Create new Licenses table with correct schema
CREATE TABLE Licenses (
    LicenseID NVARCHAR(50) PRIMARY KEY,
    Customer NVARCHAR(200) NOT NULL,
    Site NVARCHAR(200) NOT NULL,
    SoftwareName NVARCHAR(200) NOT NULL,
    SoftwareVersion NVARCHAR(100),
    LicenseType NVARCHAR(50) DEFAULT 'Subscription',
    LicenseKey NVARCHAR(500),
    LicenseCount INT DEFAULT 1,
    UsedCount INT DEFAULT 0,
    ExpirationDate DATE,
    ServicePlan NVARCHAR(100),
    ServicePlanExpiration DATE,
    Vendor NVARCHAR(200),
    PurchaseDate DATE,
    PurchasePrice DECIMAL(10,2) DEFAULT 0,
    RenewalDate DATE,
    RenewalPrice DECIMAL(10,2) DEFAULT 0,
    ContactEmail NVARCHAR(100),
    Status NVARCHAR(50) DEFAULT 'Active',
    InstallationPath NVARCHAR(500),
    LastUpdated DATETIME2 DEFAULT GETUTCDATE(),
    ComplianceNotes NVARCHAR(MAX),
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CompanyCode VARCHAR(8) NOT NULL DEFAULT 'DEFAULT'
);
PRINT '  ✓ Created new Licenses table with correct schema';
GO

-- Create index on CompanyCode
CREATE INDEX IX_Licenses_CompanyCode ON Licenses(CompanyCode);
PRINT '  ✓ Created index on Licenses.CompanyCode';
GO

-- ============================================
-- VERIFICATION
-- ============================================
PRINT '';
PRINT 'Verifying schema changes...';

-- Check Sites.Name
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Sites' AND COLUMN_NAME = 'Name')
    PRINT '  ✓ Sites.Name column exists';
ELSE
    PRINT '  ✗ ERROR: Sites.Name column missing!';

-- Check CoordinatorNotes.CreatedBy
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CoordinatorNotes' AND COLUMN_NAME = 'CreatedBy')
    PRINT '  ✓ CoordinatorNotes.CreatedBy column exists';
ELSE
    PRINT '  ✗ ERROR: CoordinatorNotes.CreatedBy column missing!';

-- Check CoordinatorNotes.CreatedAt
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CoordinatorNotes' AND COLUMN_NAME = 'CreatedAt')
    PRINT '  ✓ CoordinatorNotes.CreatedAt column exists';
ELSE
    PRINT '  ✗ ERROR: CoordinatorNotes.CreatedAt column missing!';

-- Check Licenses.Customer
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Licenses' AND COLUMN_NAME = 'Customer')
    PRINT '  ✓ Licenses.Customer column exists';
ELSE
    PRINT '  ✗ ERROR: Licenses.Customer column missing!';

-- Check Licenses.SoftwareName
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Licenses' AND COLUMN_NAME = 'SoftwareName')
    PRINT '  ✓ Licenses.SoftwareName column exists';
ELSE
    PRINT '  ✗ ERROR: Licenses.SoftwareName column missing!';

PRINT '';
PRINT '========================================';
PRINT 'Schema fix complete!';
PRINT 'Database is now compatible with api-minimal.js';
PRINT '========================================';
GO
