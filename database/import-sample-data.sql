-- Import data from JSON to SQL Server
USE FieldServiceDB;
GO

-- Get the company code from the first company in the database
DECLARE @CompanyCode NVARCHAR(50);
SELECT TOP 1 @CompanyCode = CompanyCode FROM Companies ORDER BY CompanyCode;

-- Insert sample users (NOT admin or system - those are created by create-admin-user.sql)
-- These users are for demonstration/testing purposes
INSERT INTO Users (ID, Username, Email, FullName, Role, PasswordHash, IsActive, CreatedAt, Permissions, CompanyCode)
VALUES 
('coord_001', 'coordinator', 'coordinator@fieldservice.com', 'Operations Coordinator', 'Coordinator', 'Y29vcmRzYWx0MTIz', 1, '2024-01-05T00:00:00', '["ticket.create", "ticket.update", "ticket.assign", "user.view"]', @CompanyCode),
('tech_001', 'technician', 'tech@fieldservice.com', 'Field Technician', 'Technician', 'dGVjaHNhbHQxMjM=', 1, '2024-01-10T00:00:00', '["ticket.view", "ticket.update"]', @CompanyCode);

-- Insert a sample customer
INSERT INTO Customers (CustomerID, Name, Contact, Phone, Email, Address, CreatedAt)
VALUES ('CUST-001', 'Harris County Sheriff''s Office', 'Security Department', '(713) 555-0100', 'security@hcso.org', '1200 Baker St, Houston, TX 77002', GETDATE());

-- Insert a sample site
INSERT INTO Sites (SiteID, CustomerID, Name, Address, Contact, Phone, GeoLocation, CreatedAt)
VALUES ('SITE-001', 'CUST-001', 'Main Detention Center', '1200 Baker St, Houston, TX 77002', 'Security Desk', '(713) 555-0100', '29.7604,-95.3698', GETDATE());

-- Insert sample ticket (the one assigned to technician)
INSERT INTO Tickets (
    TicketID, Title, Status, Priority, Customer, Site, AssetIDs, Category, Description,
    ScheduledStart, ScheduledEnd, AssignedTo, SLA_Due, Resolution, ClosedBy, ClosedDate,
    GeoLocation, Tags, CreatedAt, UpdatedAt
)
VALUES (
    'TKT-2024-001',
    'Access control system offline - main entrance',
    'In-Progress',
    'Critical',
    'Harris County Sheriff''s Office',
    'Main Detention Center',
    'AC-HC-001',
    'Access Control',
    'Main entrance card readers not responding. Security breach risk. Staff unable to control inmate movement through main checkpoint.',
    '2024-09-28T08:00:00',
    '2024-09-28T12:00:00',
    'Field Technician',
    '2024-09-28T12:00:00',
    '',
    '',
    NULL,
    '29.7604,-95.3698',
    'emergency,security-breach,main-entrance',
    '2024-09-28T08:00:00',
    '2024-09-28T08:00:00'
);

PRINT 'Sample data imported successfully!';
PRINT 'You can now test with:';
PRINT '- Admin: admin / admin123';
PRINT '- Coordinator: coordinator / coordinator123';
PRINT '- Technician: technician / technician123';