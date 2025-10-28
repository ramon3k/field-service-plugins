@echo off
setlocal EnableDelayedExpansion

REM Import Sample Data Script
REM Loads sample customers, sites, and tickets for demonstration

echo.
echo ==========================================
echo Importing Sample Data
echo ==========================================
echo.

set "DB_NAME=FieldServiceDB"
set "SQL_INSTANCE=.\SQLEXPRESS"
set "INSTALL_DIR=%~dp0.."

echo Database: !DB_NAME!
echo Instance: !SQL_INSTANCE!
echo.

REM Check if sample data file exists
if exist "!INSTALL_DIR!\database\import-sample-data.sql" (
    echo Found sample data file, importing...
    sqlcmd -S "!SQL_INSTANCE!" -d "!DB_NAME!" -i "!INSTALL_DIR!\database\import-sample-data.sql"
    if !errorLevel! equ 0 (
        echo [OK] Sample data imported successfully
    ) else (
        echo WARNING: Sample data import had issues
    )
) else (
    echo Creating basic sample data...
    
    REM Create sample data inline
    sqlcmd -S "!SQL_INSTANCE!" -d "!DB_NAME!" -Q "
    -- Insert sample customers
    IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerID = 'CUST_001')
    BEGIN
        INSERT INTO Customers (CustomerID, Name, Contact, Phone, Email, Address, Notes, CreatedAt)
        VALUES 
            ('CUST_001', 'Demo Corporation', 'John Smith', '555-0101', 'john@democorp.com', '123 Business Ave, Suite 100, Business City, BC 12345', 'Sample customer for demonstration', GETDATE()),
            ('CUST_002', 'Sample Industries', 'Jane Doe', '555-0102', 'jane@sample.com', '456 Industrial Blvd, Industrial City, IC 67890', 'Another sample customer', GETDATE()),
            ('CUST_003', 'Example Services LLC', 'Bob Johnson', '555-0103', 'bob@example.com', '789 Service Road, Service Town, ST 54321', 'Third sample customer', GETDATE())
        
        PRINT 'Sample customers created'
    END
    
    -- Insert sample sites
    IF NOT EXISTS (SELECT 1 FROM Sites WHERE SiteID = 'SITE_001')
    BEGIN
        INSERT INTO Sites (SiteID, CustomerID, Name, Address, Contact, Phone, GeoLocation, Notes, CreatedAt)
        VALUES 
            ('SITE_001', 'CUST_001', 'Main Office', '123 Business Ave, Business City, BC 12345', 'John Smith', '555-0101', '40.7128,-74.0060', 'Main office location', GETDATE()),
            ('SITE_002', 'CUST_001', 'Warehouse', '200 Storage St, Business City, BC 12346', 'Mike Wilson', '555-0104', '40.7589,-73.9851', 'Primary warehouse', GETDATE()),
            ('SITE_003', 'CUST_002', 'Factory Floor', '456 Industrial Blvd, Industrial City, IC 67890', 'Jane Doe', '555-0102', '34.0522,-118.2437', 'Manufacturing facility', GETDATE()),
            ('SITE_004', 'CUST_003', 'Service Center', '789 Service Road, Service Town, ST 54321', 'Bob Johnson', '555-0103', '41.8781,-87.6298', 'Customer service center', GETDATE())
        
        PRINT 'Sample sites created'
    END
    
    -- Insert sample tickets
    IF NOT EXISTS (SELECT 1 FROM Tickets WHERE TicketID = 'TICKET_001')
    BEGIN
        INSERT INTO Tickets (TicketID, CustomerID, SiteID, Title, Description, Priority, Status, AssignedTo, CreatedBy, CreatedAt, ScheduledDate, Category, EstimatedHours)
        VALUES 
            ('TICKET_001', 'CUST_001', 'SITE_001', 'Network Connectivity Issue', 'Intermittent network connectivity in the main office. Users report slow internet and occasional disconnections.', 'High', 'Open', 'TECH_001', 'admin_001', GETDATE(), DATEADD(day, 1, GETDATE()), 'IT Support', 2.0),
            ('TICKET_002', 'CUST_001', 'SITE_002', 'HVAC Maintenance', 'Quarterly HVAC system maintenance and filter replacement in the warehouse.', 'Medium', 'Assigned', 'TECH_002', 'admin_001', GETDATE(), DATEADD(day, 3, GETDATE()), 'Maintenance', 4.0),
            ('TICKET_003', 'CUST_002', 'SITE_003', 'Equipment Calibration', 'Annual calibration of manufacturing equipment on the factory floor.', 'Medium', 'Scheduled', 'TECH_003', 'COORD_001', GETDATE(), DATEADD(day, 7, GETDATE()), 'Calibration', 6.0),
            ('TICKET_004', 'CUST_003', 'SITE_004', 'Software Update', 'Update customer service software to latest version and train staff.', 'Low', 'Open', null, 'COORD_001', GETDATE(), DATEADD(day, 14, GETDATE()), 'Software', 3.0)
        
        PRINT 'Sample tickets created'
    END
    
    -- Insert sample technicians
    IF NOT EXISTS (SELECT 1 FROM Users WHERE ID = 'TECH_001')
    BEGIN
        INSERT INTO Users (ID, Username, Email, FullName, Role, PasswordHash, IsActive, CreatedAt, Vendor)
        VALUES 
            ('TECH_001', 'tech1', 'tech1@company.com', 'Mike Rodriguez', 'Technician', '$2b$10$rKnFD8o5.5C7Z5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 1, GETDATE(), 'TechCorps Solutions'),
            ('TECH_002', 'tech2', 'tech2@company.com', 'Sarah Johnson', 'Technician', '$2b$10$rKnFD8o5.5C7Z5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 1, GETDATE(), 'ProTech Services'),
            ('TECH_003', 'tech3', 'tech3@company.com', 'David Chen', 'Technician', '$2b$10$rKnFD8o5.5C7Z5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 1, GETDATE(), 'Elite Technical'),
            ('COORD_001', 'coordinator', 'coord@company.com', 'Lisa Thompson', 'Coordinator', '$2b$10$rKnFD8o5.5C7Z5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 1, GETDATE(), null)
        
        PRINT 'Sample users created'
    END
    
    -- Insert sample assets
    IF NOT EXISTS (SELECT 1 FROM Assets WHERE AssetID = 'ASSET_001')
    BEGIN
        INSERT INTO Assets (AssetID, SiteID, Name, Type, Model, SerialNumber, InstallDate, WarrantyExpiration, Status, Notes, CreatedAt)
        VALUES 
            ('ASSET_001', 'SITE_001', 'Main Server', 'Server', 'Dell PowerEdge R740', 'SN12345678', '2023-01-15', '2026-01-15', 'Active', 'Primary application server', GETDATE()),
            ('ASSET_002', 'SITE_001', 'Network Switch', 'Network Equipment', 'Cisco Catalyst 2960', 'SN87654321', '2023-02-01', '2026-02-01', 'Active', 'Main network switch', GETDATE()),
            ('ASSET_003', 'SITE_002', 'HVAC Unit A', 'HVAC', 'Carrier 30HXC', 'HVAC001234', '2022-06-01', '2025-06-01', 'Active', 'Primary cooling unit', GETDATE()),
            ('ASSET_004', 'SITE_003', 'CNC Machine #1', 'Manufacturing', 'Haas VF-2', 'CNC567890', '2021-03-15', '2024-03-15', 'Active', 'Primary CNC machine', GETDATE())
        
        PRINT 'Sample assets created'
    END
    "
    
    if !errorLevel! equ 0 (
        echo [OK] Basic sample data created successfully
    ) else (
        echo WARNING: Could not create sample data
        exit /b 1
    )
)

REM Verify data import
echo.
echo Verifying sample data...
sqlcmd -S "!SQL_INSTANCE!" -d "!DB_NAME!" -Q "
SELECT 
    'Customers' as TableName, COUNT(*) as RecordCount FROM Customers
UNION ALL
SELECT 
    'Sites' as TableName, COUNT(*) as RecordCount FROM Sites  
UNION ALL
SELECT 
    'Tickets' as TableName, COUNT(*) as RecordCount FROM Tickets
UNION ALL
SELECT 
    'Users' as TableName, COUNT(*) as RecordCount FROM Users
UNION ALL
SELECT 
    'Assets' as TableName, COUNT(*) as RecordCount FROM Assets
"

echo.
echo ==========================================
echo Sample Data Import Complete!
echo ==========================================
echo.
echo The system now includes:
echo - Sample customers and sites
echo - Demo service tickets
echo - Test user accounts
echo - Sample assets
echo.
echo You can modify or delete this sample data
echo after setting up your real customers.

exit /b 0