-- Create Companies table for multi-tenant management
USE FieldServiceDB;
GO

-- Drop table if it exists
IF OBJECT_ID('Companies', 'U') IS NOT NULL
    DROP TABLE Companies;
GO

-- Create Companies table
CREATE TABLE Companies (
    CompanyID INT IDENTITY(1,1) PRIMARY KEY,
    CompanyCode NVARCHAR(50) UNIQUE NOT NULL,
    CompanyName NVARCHAR(255) NOT NULL,
    DisplayName NVARCHAR(255) NULL, -- Public-facing name for service request form
    ContactEmail NVARCHAR(255) NULL,
    ContactPhone NVARCHAR(50) NULL,
    Address NVARCHAR(500) NULL,
    IsActive BIT DEFAULT 1,
    AllowServiceRequests BIT DEFAULT 1, -- Show in public service request dropdown
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Insert existing DCPSP company
INSERT INTO Companies (CompanyCode, CompanyName, DisplayName, ContactEmail, IsActive, AllowServiceRequests)
VALUES ('DCPSP', 'DCPSP Field Services', 'DCPSP Field Services', 'support@dcpsp.com', 1, 1);
GO

-- Create index for faster lookups
CREATE INDEX IX_Companies_CompanyCode ON Companies(CompanyCode);
CREATE INDEX IX_Companies_IsActive ON Companies(IsActive);
GO

SELECT * FROM Companies;
GO
