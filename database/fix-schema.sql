-- Fix Database Schema to Match api-minimal.js
USE [FieldServiceDB];
GO

PRINT 'Starting schema fixes...';
GO

-- FIX 1: Sites Table - Rename Site column to Name
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Sites' AND COLUMN_NAME = 'Site')
BEGIN
    EXEC sp_rename 'Sites.Site', 'Name', 'COLUMN';
    PRINT 'Renamed Sites.Site to Sites.Name';
END
GO

-- FIX 2: CoordinatorNotes - Rename CoordinatorName to CreatedBy
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CoordinatorNotes' AND COLUMN_NAME = 'CoordinatorName')
BEGIN
    EXEC sp_rename 'CoordinatorNotes.CoordinatorName', 'CreatedBy', 'COLUMN';
    PRINT 'Renamed CoordinatorNotes.CoordinatorName to CreatedBy';
END
GO

-- FIX 3: CoordinatorNotes - Rename Timestamp to CreatedAt  
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CoordinatorNotes' AND COLUMN_NAME = 'Timestamp')
BEGIN
    EXEC sp_rename 'CoordinatorNotes.Timestamp', 'CreatedAt', 'COLUMN';
    PRINT 'Renamed CoordinatorNotes.Timestamp to CreatedAt';
END
GO

-- FIX 4: Drop and Recreate Licenses Table
IF OBJECT_ID('Licenses', 'U') IS NOT NULL
BEGIN
    DROP TABLE Licenses;
    PRINT 'Dropped old Licenses table';
END
GO

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
PRINT 'Created new Licenses table';
GO

CREATE INDEX IX_Licenses_CompanyCode ON Licenses(CompanyCode);
PRINT 'Created index on Licenses.CompanyCode';
GO

PRINT 'Schema fix complete!';
GO
