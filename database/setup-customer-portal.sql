-- Customer Portal Database Schema
-- Run this script to create the customer_users table for customer portal access

USE FieldServiceDB; -- Replace with your actual database name
GO

-- Create customer_users table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customer_users' AND xtype='U')
BEGIN
    CREATE TABLE customer_users (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        CustomerID NVARCHAR(50) NOT NULL,
        Username NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL, -- bcrypt hash
        Email NVARCHAR(255),
        FullName NVARCHAR(200),
        IsActive BIT DEFAULT 1,
        CanSubmitRequests BIT DEFAULT 1,
        LastLogin DATETIME,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        
        -- Foreign key constraint (adjust based on your customers table structure)
        CONSTRAINT FK_CustomerUsers_Customer 
        FOREIGN KEY (CustomerID) REFERENCES customers(CustomerID)
    );
    
    PRINT 'Created customer_users table';
END
ELSE
BEGIN
    PRINT 'customer_users table already exists';
END
GO

-- Add additional columns to tickets table for customer portal features
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tickets') AND name = 'ContactName')
BEGIN
    ALTER TABLE tickets ADD ContactName NVARCHAR(200);
    PRINT 'Added ContactName column to tickets table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tickets') AND name = 'ContactPhone')
BEGIN
    ALTER TABLE tickets ADD ContactPhone NVARCHAR(50);
    PRINT 'Added ContactPhone column to tickets table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tickets') AND name = 'ContactEmail')
BEGIN
    ALTER TABLE tickets ADD ContactEmail NVARCHAR(255);
    PRINT 'Added ContactEmail column to tickets table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tickets') AND name = 'PreferredDate')
BEGIN
    ALTER TABLE tickets ADD PreferredDate NVARCHAR(50);
    PRINT 'Added PreferredDate column to tickets table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tickets') AND name = 'PreferredTime')
BEGIN
    ALTER TABLE tickets ADD PreferredTime NVARCHAR(100);
    PRINT 'Added PreferredTime column to tickets table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tickets') AND name = 'Urgency')
BEGIN
    ALTER TABLE tickets ADD Urgency NVARCHAR(100);
    PRINT 'Added Urgency column to tickets table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tickets') AND name = 'RequestedBy')
BEGIN
    ALTER TABLE tickets ADD RequestedBy NVARCHAR(100);
    PRINT 'Added RequestedBy column to tickets table';
END

GO

-- Create sample customer users (replace with actual data)
-- Password for demo users is 'password123' (hashed with bcrypt)
-- In production, you should create these through a secure registration process

DECLARE @bcryptHash NVARCHAR(255) = '$2b$10$rOJWEKMPLZVcbNTVpOgGdeCz.8/HUFqZOGxYfgCGDj6MhUu8mPjK2'; -- 'password123'

-- Sample customer user for ACME Corp
IF NOT EXISTS (SELECT * FROM customer_users WHERE Username = 'acme.portal')
BEGIN
    INSERT INTO customer_users (CustomerID, Username, PasswordHash, Email, FullName, IsActive, CanSubmitRequests)
    VALUES ('ACME', 'acme.portal', @bcryptHash, 'support@acmecorp.com', 'ACME Portal User', 1, 1);
    PRINT 'Created sample customer user: acme.portal';
END

-- Sample customer user for TechFlow Solutions
IF NOT EXISTS (SELECT * FROM customer_users WHERE Username = 'techflow.portal')
BEGIN
    INSERT INTO customer_users (CustomerID, Username, PasswordHash, Email, FullName, IsActive, CanSubmitRequests) 
    VALUES ('TECHFLOW', 'techflow.portal', @bcryptHash, 'it@techflow.com', 'TechFlow Portal User', 1, 1);
    PRINT 'Created sample customer user: techflow.portal';
END

-- Sample customer user for Global Manufacturing
IF NOT EXISTS (SELECT * FROM customer_users WHERE Username = 'global.portal')
BEGIN
    INSERT INTO customer_users (CustomerID, Username, PasswordHash, Email, FullName, IsActive, CanSubmitRequests)
    VALUES ('GLOBAL', 'global.portal', @bcryptHash, 'facilities@globalmfg.com', 'Global Mfg Portal User', 1, 1);
    PRINT 'Created sample customer user: global.portal';
END

GO

-- Create index for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CustomerUsers_Username')
BEGIN
    CREATE INDEX IX_CustomerUsers_Username ON customer_users (Username);
    PRINT 'Created index on customer_users.Username';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CustomerUsers_CustomerID')
BEGIN
    CREATE INDEX IX_CustomerUsers_CustomerID ON customer_users (CustomerID);
    PRINT 'Created index on customer_users.CustomerID';
END

GO

-- View to show customer portal access summary
CREATE OR ALTER VIEW vw_customer_portal_access AS
SELECT 
    cu.Username,
    cu.Email,
    cu.FullName,
    c.Name as CustomerName,
    cu.IsActive,
    cu.CanSubmitRequests,
    cu.LastLogin,
    COUNT(DISTINCT s.Site) as SiteCount,
    COUNT(DISTINCT t.TicketID) as TicketCount
FROM customer_users cu
    INNER JOIN customers c ON cu.CustomerID = c.CustomerID
    LEFT JOIN sites s ON c.Name = s.Customer
    LEFT JOIN tickets t ON c.Name = t.Customer AND t.RequestedBy = cu.Username
GROUP BY 
    cu.Username, cu.Email, cu.FullName, c.Name, 
    cu.IsActive, cu.CanSubmitRequests, cu.LastLogin;

GO

PRINT 'Customer portal database setup completed successfully!';
PRINT '';
PRINT 'Sample login credentials for testing:';
PRINT 'Username: acme.portal, Password: password123';
PRINT 'Username: techflow.portal, Password: password123'; 
PRINT 'Username: global.portal, Password: password123';
PRINT '';
PRINT 'IMPORTANT: Change these passwords in production!';
PRINT 'You can view customer portal access with: SELECT * FROM vw_customer_portal_access;';