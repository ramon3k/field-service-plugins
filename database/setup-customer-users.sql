-- Customer Portal Users Setup
-- This script adds customer users to your existing users table

USE FieldServiceDB; -- Replace with your actual database name
GO

-- Add customer users to the existing users table
-- These users have Role containing 'Customer' to identify them as customer portal users

-- Password for demo users is 'password123'
-- In production, you should hash these passwords properly

-- Check if we need to add a Customer column to users table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'Customer')
BEGIN
    ALTER TABLE users ADD Customer NVARCHAR(255);
    PRINT 'Added Customer column to users table';
END
GO

-- Check if we need to add a CustomerID column to users table  
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'CustomerID')
BEGIN
    ALTER TABLE users ADD CustomerID NVARCHAR(50);
    PRINT 'Added CustomerID column to users table';
END
GO

-- Sample customer users (replace with actual data)
-- Customer user for ACME Corp
IF NOT EXISTS (SELECT * FROM users WHERE Username = 'acme.portal')
BEGIN
    INSERT INTO users (Username, Password, Email, FullName, Role, IsActive, Customer, CustomerID)
    VALUES ('acme.portal', 'password123', 'support@acmecorp.com', 'ACME Portal User', 'Customer', 1, 'ACME Corp', 'ACME');
    PRINT 'Created customer user: acme.portal';
END

-- Customer user for TechFlow Solutions  
IF NOT EXISTS (SELECT * FROM users WHERE Username = 'techflow.portal')
BEGIN
    INSERT INTO users (Username, Password, Email, FullName, Role, IsActive, Customer, CustomerID)
    VALUES ('techflow.portal', 'password123', 'it@techflow.com', 'TechFlow Portal User', 'Customer', 1, 'TechFlow Solutions', 'TECHFLOW');
    PRINT 'Created customer user: techflow.portal';
END

-- Customer user for Global Manufacturing
IF NOT EXISTS (SELECT * FROM users WHERE Username = 'global.portal')
BEGIN
    INSERT INTO users (Username, Password, Email, FullName, Role, IsActive, Customer, CustomerID)
    VALUES ('global.portal', 'password123', 'facilities@globalmfg.com', 'Global Mfg Portal User', 'Customer', 1, 'Global Manufacturing', 'GLOBAL');
    PRINT 'Created customer user: global.portal';
END

-- Demo customer user for your demo tenant
IF NOT EXISTS (SELECT * FROM users WHERE Username = 'demo.customer')
BEGIN
    INSERT INTO users (Username, Password, Email, FullName, Role, IsActive, Customer, CustomerID)
    VALUES ('demo.customer', 'password123', 'customer@demo.com', 'Demo Customer User', 'Customer', 1, 'Demo Corporation', 'DEMO');
    PRINT 'Created customer user: demo.customer';
END

GO

-- Create index for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Customer')
BEGIN
    CREATE INDEX IX_Users_Customer ON users (Customer);
    PRINT 'Created index on users.Customer';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Role')
BEGIN
    CREATE INDEX IX_Users_Role ON users (Role);
    PRINT 'Created index on users.Role';
END

GO

-- View to show customer portal users
CREATE OR ALTER VIEW vw_customer_portal_users AS
SELECT 
    u.Username,
    u.Email,
    u.FullName,
    u.Customer,
    u.CustomerID,
    u.IsActive,
    COUNT(DISTINCT s.Site) as SiteCount,
    COUNT(DISTINCT t.TicketID) as TicketCount
FROM users u
    LEFT JOIN sites s ON u.Customer = s.Customer
    LEFT JOIN tickets t ON u.Customer = t.Customer
WHERE u.Role LIKE '%Customer%'
GROUP BY 
    u.Username, u.Email, u.FullName, u.Customer, u.CustomerID, u.IsActive;

GO

PRINT 'Customer portal users setup completed successfully!';
PRINT '';
PRINT 'Sample customer login credentials for testing:';
PRINT 'Username: acme.portal, Password: password123 (ACME Corp sites)';
PRINT 'Username: techflow.portal, Password: password123 (TechFlow sites)'; 
PRINT 'Username: global.portal, Password: password123 (Global Mfg sites)';
PRINT 'Username: demo.customer, Password: password123 (Demo Corporation sites)';
PRINT '';
PRINT 'IMPORTANT: Change these passwords in production!';
PRINT 'You can view customer portal users with: SELECT * FROM vw_customer_portal_users;';
PRINT '';
PRINT 'These users will log into your tenant/company code (e.g., "demo")';
PRINT 'and will see only the sites belonging to their customer company.';