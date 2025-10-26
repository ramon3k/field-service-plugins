-- Test Customer Portal Setup
-- Run this to verify your customer portal is set up correctly

USE FieldServiceDB; -- Replace with your actual database name
GO

PRINT '🔍 Testing Customer Portal Setup...';
PRINT '';

-- Check if customer users exist
PRINT '1. Checking Customer Users:';
SELECT 
    Username, 
    Customer, 
    Role, 
    IsActive,
    CASE WHEN Email IS NOT NULL THEN 'Yes' ELSE 'No' END as HasEmail
FROM users 
WHERE Role LIKE '%Customer%' OR Username LIKE '%.portal' OR Username = 'demo.customer';

IF @@ROWCOUNT = 0
BEGIN
    PRINT '❌ No customer users found. Run setup-customer-users.sql first.';
END
ELSE
BEGIN
    PRINT '✅ Customer users found.';
END

PRINT '';

-- Check if customers have sites
PRINT '2. Checking Customer Sites:';
SELECT 
    c.Name as CustomerName,
    COUNT(s.Site) as SiteCount,
    STRING_AGG(s.Site, ', ') as Sites
FROM customers c
    LEFT JOIN sites s ON c.Name = s.Customer
WHERE c.Name IN (
    SELECT DISTINCT Customer 
    FROM users 
    WHERE Role LIKE '%Customer%' AND Customer IS NOT NULL
)
GROUP BY c.Name;

IF @@ROWCOUNT = 0
BEGIN
    PRINT '❌ No sites found for customer companies.';
    PRINT '   Make sure your customers table matches the sites table.';
END
ELSE
BEGIN
    PRINT '✅ Customer sites found.';
END

PRINT '';

-- Check tickets table structure for customer portal compatibility
PRINT '3. Checking Tickets Table:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'tickets'
AND COLUMN_NAME IN ('TicketID', 'Customer', 'Site', 'Status', 'Priority', 'Category', 'Description', 'CreatedAt')
ORDER BY ORDINAL_POSITION;

IF @@ROWCOUNT < 8
BEGIN
    PRINT '⚠️  Some required ticket columns may be missing.';
END
ELSE
BEGIN
    PRINT '✅ Tickets table has required columns.';
END

PRINT '';

-- Show sample login test
PRINT '4. Customer Portal Login Test:';
PRINT 'You can test customer portal login with these credentials:';
PRINT '';

SELECT 
    'Company Code: DEMO' as LoginInfo
UNION ALL
SELECT 'Username: ' + Username + ', Password: password123' 
FROM users 
WHERE Role LIKE '%Customer%' AND IsActive = 1
UNION ALL
SELECT '➡️ URL: http://localhost:5173/customer-portal.html';

PRINT '';
PRINT '🚀 Customer Portal Setup Test Complete!';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Start your server: npm run dev';
PRINT '2. Visit: http://localhost:5173/customer-portal.html';
PRINT '3. Test login with the credentials above';
PRINT '4. Submit a test service request';