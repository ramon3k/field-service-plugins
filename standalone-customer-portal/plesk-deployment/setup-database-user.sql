-- SQL Script to create database user for Customer Portal
-- Run this on your SQL Server BEFORE deploying to Plesk

-- 1. Create SQL login with password
CREATE LOGIN portal_user WITH PASSWORD = 'CHANGE_THIS_TO_STRONG_PASSWORD';
GO

-- 2. Switch to your database
USE FieldServiceDB;
GO

-- 3. Create database user
CREATE USER portal_user FOR LOGIN portal_user;
GO

-- 4. Grant minimal permissions (INSERT only for security)
GRANT INSERT ON dbo.ServiceRequests TO portal_user;
GRANT INSERT ON dbo.ActivityLog TO portal_user;
GRANT SELECT ON dbo.Users TO portal_user;  -- Needed to log system user
GO

-- 5. Verify permissions
SELECT 
    USER_NAME(grantee_principal_id) AS [User],
    OBJECT_NAME(major_id) AS [Table],
    permission_name AS [Permission]
FROM sys.database_permissions
WHERE USER_NAME(grantee_principal_id) = 'portal_user'
ORDER BY [Table], [Permission];
GO

PRINT '✅ Database user "portal_user" created successfully';
PRINT '';
PRINT '⚠️  IMPORTANT NEXT STEPS:';
PRINT '   1. Change the password to a strong password';
PRINT '   2. Enable SQL Server Authentication mode';
PRINT '   3. Enable TCP/IP protocol in SQL Server Configuration Manager';
PRINT '   4. Configure SQL Server to listen on port 1433';
PRINT '   5. Add firewall rule to allow port 1433';
PRINT '   6. Update .env file with the password you set';
