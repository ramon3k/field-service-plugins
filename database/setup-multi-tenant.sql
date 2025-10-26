-- Multi-Tenant Setup Script
-- This creates a tenant registry and demo database

-- Step 1: Create Tenant Registry Database (run this first)
-- This database tracks all tenant configurations
CREATE DATABASE TenantRegistry;
GO

USE TenantRegistry;
GO

-- Tenant configuration table
CREATE TABLE Tenants (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    CompanyCode NVARCHAR(50) NOT NULL UNIQUE,
    CompanyName NVARCHAR(255) NOT NULL,
    DatabaseName NVARCHAR(128) NOT NULL,
    DatabaseServer NVARCHAR(255) NOT NULL DEFAULT 'customer-portal-sql-server.database.windows.net',
    IsActive BIT NOT NULL DEFAULT 1,
    IsDemo BIT NOT NULL DEFAULT 0,
    MaxUsers INT DEFAULT 50,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ExpiresAt DATETIME2 NULL,
    Notes NVARCHAR(MAX) NULL
);

-- Index for fast company code lookups
CREATE INDEX IX_Tenants_CompanyCode ON Tenants(CompanyCode);
CREATE INDEX IX_Tenants_IsActive ON Tenants(IsActive);

-- Insert production tenant (your current database)
INSERT INTO Tenants (CompanyCode, CompanyName, DatabaseName, IsDemo, Notes)
VALUES ('DCPSP', 'DCPSP Production', 'FieldServiceDB', 0, 'Production database');

-- Insert demo tenant
INSERT INTO Tenants (CompanyCode, CompanyName, DatabaseName, IsDemo, Notes)
VALUES ('DEMO', 'Demo Company', 'FieldServiceDB_Demo', 1, 'Demo database with sample data for potential clients');

-- Optional: Add more demo tenants for different scenarios
INSERT INTO Tenants (CompanyCode, CompanyName, DatabaseName, IsDemo, Notes)
VALUES ('DEMO-HVAC', 'ACME HVAC Demo', 'FieldServiceDB_Demo_HVAC', 1, 'Demo focused on HVAC service scenarios');

INSERT INTO Tenants (CompanyCode, CompanyName, DatabaseName, IsDemo, Notes)
VALUES ('DEMO-SECURITY', 'SecureTech Demo', 'FieldServiceDB_Demo_Security', 1, 'Demo focused on security system scenarios');

GO

-- View to get active tenants
CREATE VIEW ActiveTenants AS
SELECT 
    ID,
    CompanyCode,
    CompanyName,
    DatabaseName,
    DatabaseServer,
    IsDemo,
    MaxUsers,
    CreatedAt
FROM Tenants
WHERE IsActive = 1 
  AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE());
GO

-- Stored procedure to get tenant by company code
CREATE PROCEDURE GetTenantByCode
    @CompanyCode NVARCHAR(50)
AS
BEGIN
    SELECT 
        ID,
        CompanyCode,
        CompanyName,
        DatabaseName,
        DatabaseServer,
        IsDemo,
        MaxUsers,
        CreatedAt
    FROM ActiveTenants
    WHERE CompanyCode = @CompanyCode;
END;
GO

PRINT '✅ Tenant Registry database created successfully';
PRINT '📋 Next steps:';
PRINT '   1. Run setup-demo-database.sql to create the demo database';
PRINT '   2. Run populate-demo-data.sql to fill it with sample data';
PRINT '   3. Update your .env file with TENANT_REGISTRY settings';
